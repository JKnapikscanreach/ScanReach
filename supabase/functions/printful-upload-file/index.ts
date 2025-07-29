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

    const { imageDataUrl, filename = "qr-code.png" } = await req.json();

    if (!imageDataUrl) {
      throw new Error("Image data URL is required");
    }

    // Convert data URL to blob
    const base64Data = imageDataUrl.split(',')[1];
    const mimeType = imageDataUrl.split(';')[0].split(':')[1];
    
    const binaryData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
    
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', new Blob([binaryData], { type: mimeType }), filename);
    formData.append('type', 'default');

    console.log(`Uploading file to Printful: ${filename}`);

    const response = await fetch("https://api.printful.com/files", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${printfulToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Printful file upload error: ${response.status} - ${errorData}`);
    }

    const data = await response.json();
    console.log("File uploaded successfully:", data.result.id);

    return new Response(JSON.stringify({ fileId: data.result.id, fileUrl: data.result.preview_url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error uploading file to Printful:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});