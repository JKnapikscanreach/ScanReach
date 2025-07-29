import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface CatalogProduct {
  id: string;
  title: string;
  variants: CatalogVariant[];
}

interface CatalogVariant {
  id: string;
  name: string;
  size?: string;
  color?: string;
}

interface PrintfulSyncProduct {
  id: string;
  external_id: string;
  name: string;
}

interface PrintfulSyncVariant {
  id: string;
  external_id: string;
  sync_product_id: string;
  name: string;
  variant_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting sync management process');

    // Get environment variables
    const printfulApiToken = Deno.env.get('PRINTFUL_API_TOKEN');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!printfulApiToken || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required environment variables');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { variantId, productId } = await req.json();

    // Check if we already have a sync variant mapping
    if (variantId) {
      const { data: existingMapping } = await supabase
        .from('variant_mappings')
        .select('sync_variant_id')
        .eq('catalog_variant_id', variantId)
        .single();

      if (existingMapping) {
        console.log(`Found existing sync variant: ${existingMapping.sync_variant_id}`);
        return new Response(
          JSON.stringify({ 
            success: true, 
            syncVariantId: existingMapping.sync_variant_id,
            cached: true 
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Get catalog products to find the one we need to sync
    const catalogResponse = await fetch('https://api.printful.com/products', {
      headers: { 'Authorization': `Bearer ${printfulApiToken}` }
    });

    if (!catalogResponse.ok) {
      throw new Error(`Failed to fetch catalog products: ${catalogResponse.statusText}`);
    }

    const catalogData = await catalogResponse.json();
    const targetProduct = catalogData.result.find((p: any) => p.id.toString() === productId);

    if (!targetProduct) {
      throw new Error(`Catalog product ${productId} not found`);
    }

    // Get detailed product info including variants
    const detailResponse = await fetch(`https://api.printful.com/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${printfulApiToken}` }
    });

    if (!detailResponse.ok) {
      throw new Error(`Failed to fetch product details: ${detailResponse.statusText}`);
    }

    const detailData = await detailResponse.json();
    const productWithVariants = detailData.result;

    // Check if sync product exists
    let syncProduct: any;
    const { data: existingSyncProduct } = await supabase
      .from('sync_products')
      .select('*')
      .eq('catalog_product_id', productId)
      .single();

    if (existingSyncProduct) {
      syncProduct = existingSyncProduct;
      console.log(`Found existing sync product: ${syncProduct.printful_sync_product_id}`);
    } else {
      // Create sync product in Printful
      const syncProductPayload = {
        sync_product: {
          name: `${productWithVariants.title} - Custom QR Stickers`,
          thumbnail: productWithVariants.image
        }
      };

      const createSyncResponse = await fetch('https://api.printful.com/store/products', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${printfulApiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(syncProductPayload)
      });

      if (!createSyncResponse.ok) {
        const errorText = await createSyncResponse.text();
        throw new Error(`Failed to create sync product: ${createSyncResponse.statusText} - ${errorText}`);
      }

      const syncProductData = await createSyncResponse.json();
      const newSyncProduct = syncProductData.result;

      // Store sync product in database
      const { data: dbSyncProduct, error: syncProductError } = await supabase
        .from('sync_products')
        .insert({
          catalog_product_id: productId,
          printful_sync_product_id: newSyncProduct.id.toString(),
          name: newSyncProduct.name
        })
        .select()
        .single();

      if (syncProductError) {
        throw new Error(`Failed to store sync product: ${syncProductError.message}`);
      }

      syncProduct = dbSyncProduct;
      console.log(`Created new sync product: ${syncProduct.printful_sync_product_id}`);
    }

    // Now handle the specific variant
    if (variantId) {
      const targetVariant = productWithVariants.variants.find((v: any) => v.id.toString() === variantId);
      
      if (!targetVariant) {
        throw new Error(`Catalog variant ${variantId} not found`);
      }

      // Create sync variant in Printful
      const syncVariantPayload = {
        sync_variant: {
          external_id: `variant_${variantId}`,
          variant_id: parseInt(variantId),
          files: [
            {
              type: 'default',
              url: 'https://via.placeholder.com/300x300.png' // Placeholder - will be replaced with actual QR code
            }
          ]
        }
      };

      const createSyncVariantResponse = await fetch(
        `https://api.printful.com/store/products/${syncProduct.printful_sync_product_id}/variants`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${printfulApiToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(syncVariantPayload)
        }
      );

      if (!createSyncVariantResponse.ok) {
        const errorText = await createSyncVariantResponse.text();
        throw new Error(`Failed to create sync variant: ${createSyncVariantResponse.statusText} - ${errorText}`);
      }

      const syncVariantData = await createSyncVariantResponse.json();
      const newSyncVariant = syncVariantData.result;

      // Store sync variant in database
      const { error: syncVariantError } = await supabase
        .from('sync_variants')
        .insert({
          catalog_variant_id: variantId,
          printful_sync_variant_id: newSyncVariant.id.toString(),
          sync_product_id: syncProduct.id,
          name: targetVariant.name,
          size: targetVariant.size,
          color: targetVariant.color
        });

      if (syncVariantError) {
        throw new Error(`Failed to store sync variant: ${syncVariantError.message}`);
      }

      // Store mapping for quick lookup
      const { error: mappingError } = await supabase
        .from('variant_mappings')
        .insert({
          catalog_variant_id: variantId,
          sync_variant_id: newSyncVariant.id.toString()
        });

      if (mappingError) {
        throw new Error(`Failed to store variant mapping: ${mappingError.message}`);
      }

      console.log(`Created sync variant: ${newSyncVariant.id} for catalog variant: ${variantId}`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          syncVariantId: newSyncVariant.id.toString(),
          syncProductId: syncProduct.printful_sync_product_id,
          cached: false 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        syncProductId: syncProduct.printful_sync_product_id,
        message: 'Sync product ready, no specific variant requested'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Sync management error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});