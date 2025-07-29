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

    // Get all products from Printful API
    const response = await fetch("https://api.printful.com/products", {
      headers: {
        "Authorization": `Bearer ${printfulToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Printful API error: ${response.status}`);
    }

    const data = await response.json();
    
    // Filter for sticker products
    const stickerProducts = data.result.filter((product: any) => 
      product.title.toLowerCase().includes('sticker') || 
      product.title.toLowerCase().includes('decal')
    );

    console.log(`Found ${stickerProducts.length} sticker products`);

    // Fetch detailed information for each sticker product including variants
    const detailedProducts = await Promise.all(
      stickerProducts.map(async (product: any) => {
        try {
          const productResponse = await fetch(`https://api.printful.com/products/${product.id}`, {
            headers: {
              "Authorization": `Bearer ${printfulToken}`,
              "Content-Type": "application/json",
            },
          });

          if (!productResponse.ok) {
            console.error(`Failed to fetch product ${product.id}: ${productResponse.status}`);
            return null;
          }

          const productData = await productResponse.json();
          return {
            id: product.id,
            title: product.title,
            description: product.description,
            image: product.image,
            variants: productData.result.variants || [],
            type: product.type,
            type_name: product.type_name
          };
        } catch (error) {
          console.error(`Error fetching product ${product.id}:`, error);
          return null;
        }
      })
    );

    // Filter out any failed requests
    const validProducts = detailedProducts.filter(product => product !== null);

    console.log(`Successfully fetched detailed data for ${validProducts.length} sticker products`);

    return new Response(JSON.stringify({ products: validProducts }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching Printful products:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});