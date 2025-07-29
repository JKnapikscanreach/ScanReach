import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Debug logging helper
function debugLog(message: string, data?: any) {
  console.log(`[${new Date().toISOString()}] ${message}`, data ? JSON.stringify(data, null, 2) : '');
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  debugLog(`Starting upload request: ${requestId}`);

  try {
    const printfulToken = Deno.env.get("PRINTFUL_API_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!printfulToken) {
      throw new Error("PRINTFUL_API_TOKEN not configured");
    }
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase configuration missing");
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const requestData = await req.json();
    const { imageDataUrl, filename = "qr-code.png" } = requestData;

    debugLog("Received upload request", { requestId, filename, hasImageData: !!imageDataUrl });

    // Validate input data
    if (!imageDataUrl) {
      throw new Error("Image data URL is required");
    }

    if (!imageDataUrl.startsWith('data:image/')) {
      throw new Error("Invalid image data URL format");
    }

    // Parse and validate data URL
    const [header, base64Data] = imageDataUrl.split(',');
    if (!header || !base64Data) {
      throw new Error("Malformed data URL");
    }

    const mimeType = header.split(';')[0].split(':')[1];
    if (!mimeType || (!mimeType.includes('png') && !mimeType.includes('jpeg') && !mimeType.includes('jpg'))) {
      throw new Error("Unsupported image format. Only PNG and JPEG are supported.");
    }

    debugLog(`Processing image`, { mimeType, dataLength: base64Data.length, requestId });

    let binaryData;
    try {
      binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    } catch (decodeError) {
      console.error("Base64 decode error:", decodeError);
      throw new Error("Invalid base64 image data");
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (binaryData.length > maxSize) {
      throw new Error(`File too large: ${binaryData.length} bytes. Maximum allowed: ${maxSize} bytes`);
    }

    debugLog(`File validated`, { size: binaryData.length, requestId });

    // Step 1: Upload to Supabase Storage (permanent storage)
    const timestamp = Date.now();
    const storageFilename = `${timestamp}-${filename}`;
    const blob = new Blob([binaryData], { type: mimeType });
    
    debugLog(`Uploading to Supabase Storage`, { storageFilename, requestId });
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('qr-codes')
      .upload(storageFilename, blob, {
        contentType: mimeType,
        upsert: false
      });

    if (uploadError) {
      console.error("Supabase Storage upload error:", uploadError);
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    debugLog("Successfully uploaded to storage", { path: uploadData.path, requestId });

    // Step 2: Get public URL
    const { data: urlData } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(storageFilename);

    if (!urlData?.publicUrl) {
      throw new Error("Failed to get public URL for uploaded file");
    }

    debugLog("Generated public URL", { publicUrl: urlData.publicUrl, requestId });

    // Step 3: Send URL to Printful with enhanced metadata
    const printfulPayload = {
      url: urlData.publicUrl,
      filename: filename,
      type: "default",
      options: [
        {
          id: "stitch_color",
          value: "default"
        }
      ]
    };

    debugLog("Sending to Printful API", { payload: printfulPayload, requestId });

    try {
      const response = await fetch("https://api.printful.com/files", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${printfulToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(printfulPayload),
      });

      debugLog(`Printful API response`, { 
        status: response.status, 
        statusText: response.statusText,
        requestId 
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Printful API error:", errorData);
        throw new Error(`Printful file upload error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      debugLog("Printful upload successful", {
        fileId: data.result?.id,
        filename: data.result?.filename,
        previewUrl: data.result?.preview_url,
        requestId
      });

      if (!data.result?.id) {
        throw new Error("Upload succeeded but no file ID returned");
      }

      // Files are now kept permanently in storage for Printful preview generation
      debugLog("File upload completed successfully", { 
        fileId: data.result.id,
        storageFile: storageFilename,
        requestId 
      });

      return new Response(JSON.stringify({ 
        fileId: data.result.id, 
        fileUrl: data.result.preview_url,
        filename: data.result.filename,
        storageUrl: urlData.publicUrl,
        requestId: requestId
      }), {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Request-ID": requestId
        },
        status: 200,
      });

    } catch (printfulError) {
      debugLog("Printful API error", { error: printfulError.message, requestId });
      throw printfulError;
    }

  } catch (error) {
    console.error("Error uploading file to Printful:", error.message);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack?.split('\n')[0] || error.message,
        requestId: requestId
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "X-Request-ID": requestId
        },
        status: 500,
      }
    );
  }
});