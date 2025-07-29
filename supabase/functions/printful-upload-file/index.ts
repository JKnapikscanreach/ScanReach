import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const printfulToken = Deno.env.get("PRINTFUL_API_TOKEN");
    if (!printfulToken) {
      throw new Error("PRINTFUL_API_TOKEN not configured");
    }

    const requestData = await req.json();
    const { imageDataUrl, filename = "qr-code.png" } = requestData;

    console.log("Received upload request for:", filename);

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

    console.log(`Processing ${mimeType} image of ${base64Data.length} characters`);

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

    console.log(`File size: ${binaryData.length} bytes`);

    // Create form data for file upload - Printful expects 'files[]' not 'file[]'
    const formData = new FormData();
    const blob = new Blob([binaryData], { type: mimeType });
    formData.append('files[]', blob, filename);
    formData.append('type', 'default');

    console.log(`Uploading file to Printful: ${filename}, type: ${mimeType}`);

    // Retry mechanism with exponential backoff
    let lastError;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await fetch("https://api.printful.com/files", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${printfulToken}`,
          },
          body: formData,
        });

        console.log(`Upload attempt ${attempt + 1}, status: ${response.status}`);

        if (!response.ok) {
          const errorData = await response.text();
          console.error(`Printful API error (attempt ${attempt + 1}):`, errorData);
          
          if (response.status >= 500 && attempt < 2) {
            // Retry on server errors
            const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
            console.log(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          
          throw new Error(`Printful file upload error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        console.log("File uploaded successfully:", JSON.stringify({
          id: data.result?.id,
          filename: data.result?.filename,
          preview_url: data.result?.preview_url
        }));

        if (!data.result?.id) {
          throw new Error("Upload succeeded but no file ID returned");
        }

        return new Response(JSON.stringify({ 
          fileId: data.result.id, 
          fileUrl: data.result.preview_url,
          filename: data.result.filename
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });

      } catch (error) {
        lastError = error;
        console.error(`Upload attempt ${attempt + 1} failed:`, error.message);
        
        if (attempt === 2) {
          throw error;
        }
      }
    }

    throw lastError;

  } catch (error) {
    console.error("Error uploading file to Printful:", error.message);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        details: error.stack?.split('\n')[0] || error.message
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});