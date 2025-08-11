import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CartLineItem {
  id: string;
  cart_id: string;
  microsite_id: string;
  product_id: number;
  variant_id: number;
  size: string;
  material: string;
  quantity: number;
  unit_price: number;
  printful_product_id: number;
  printful_variant_id: number;
  microsites: {
    id: string;
    name: string;
    qr_data_url: string;
  };
}

interface Cart {
  id: string;
  user_id: string;
  created_at: string;
  cart_line_items: CartLineItem[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const printfulToken = Deno.env.get("PRINTFUL_API_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const stripeWebhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!printfulToken || !supabaseUrl || !supabaseServiceKey || !stripeWebhookSecret) {
      console.error("Missing environment variables:", {
        printfulToken: !!printfulToken,
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey,
        stripeWebhookSecret: !!stripeWebhookSecret
      });
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    // Parse Stripe webhook payload
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      throw new Error("Missing Stripe signature");
    }

    const body = await req.text();
    
    // In a real implementation, you would verify the webhook signature here
    // For now, we'll parse the JSON directly
    const event = JSON.parse(body);

    console.log("Received Stripe webhook event:", event.type);

    // Only process successful payment events
    if (event.type !== "checkout.session.completed") {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const session = event.data.object;
    const cartId = session.metadata?.cart_id;
    const customerId = session.customer_details;

    if (!cartId) {
      throw new Error("Cart ID not found in Stripe session metadata");
    }

    console.log("Processing order for cart ID:", cartId);

    // Fetch cart with all line items and microsite info
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        cart_line_items (
          *,
          microsites (
            id,
            name,
            qr_data_url
          )
        )
      `)
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      console.error("Error fetching cart:", cartError);
      throw new Error("Cart not found");
    }

    const typedCart = cart as Cart;

    if (!typedCart.cart_line_items || typedCart.cart_line_items.length === 0) {
      throw new Error("Cart is empty");
    }

    console.log("Found cart with", typedCart.cart_line_items.length, "items");

    // Group items by microsite to create separate orders if needed
    const itemsByMicrosite = typedCart.cart_line_items.reduce((acc, item) => {
      const micrositeId = item.microsite_id;
      if (!acc[micrositeId]) {
        acc[micrositeId] = [];
      }
      acc[micrositeId].push(item);
      return acc;
    }, {} as Record<string, CartLineItem[]>);

    const orderResults: any[] = [];

    // Process each microsite's items as a separate order
    for (const [micrositeId, items] of Object.entries(itemsByMicrosite)) {
      try {
        console.log(`Processing order for microsite ${micrositeId} with ${items.length} items`);

        // Get the QR code data URL from the first item (all items in same microsite should have same QR)
        const qrDataUrl = items[0].microsites.qr_data_url;
        const micrositeName = items[0].microsites.name;

        // Upload QR code file to Printful first
        let fileId = null;
        if (qrDataUrl) {
          try {
            // Upload to Printful using the existing upload function
            const uploadResponse = await fetch("https://api.printful.com/files", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${printfulToken}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "default",
                filename: `qr-${micrositeId}-${Date.now()}.png`,
                url: qrDataUrl
              }),
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload QR code: ${uploadResponse.statusText}`);
            }

            const uploadData = await uploadResponse.json();
            fileId = uploadData.result?.id;
            console.log("Uploaded QR code file:", fileId);
          } catch (uploadError) {
            console.error("Error uploading QR code:", uploadError);
            // Continue without file if upload fails
          }
        }

        // Prepare order items for Printful
        const printfulItems = items.map(item => ({
          sync_variant_id: item.printful_variant_id,
          quantity: item.quantity,
          files: fileId ? [
            {
              id: fileId,
              type: "default"
            }
          ] : undefined
        }));

        // Create Printful order
        const orderPayload = {
          recipient: {
            name: customerId.name || "Customer",
            email: customerId.email,
            address1: session.shipping_details?.address?.line1 || "",
            city: session.shipping_details?.address?.city || "",
            state_code: session.shipping_details?.address?.state || "",
            country_code: session.shipping_details?.address?.country || "US",
            zip: session.shipping_details?.address?.postal_code || "",
            phone: session.shipping_details?.phone || "",
          },
          items: printfulItems,
          external_id: `stripe-${session.id}-${micrositeId}`,
        };

        console.log("Creating Printful order with payload:", JSON.stringify(orderPayload, null, 2));

        const printfulResponse = await fetch("https://api.printful.com/orders", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${printfulToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(orderPayload),
        });

        if (!printfulResponse.ok) {
          const errorText = await printfulResponse.text();
          console.error("Printful API error:", errorText);
          throw new Error(`Printful API error: ${printfulResponse.status} ${errorText}`);
        }

        const printfulOrder = await printfulResponse.json();
        console.log("Created Printful order:", printfulOrder.result?.id);

        // Store order in local database
        const { data: localOrder, error: orderError } = await supabase
          .from('orders')
          .insert({
            customer_id: typedCart.user_id,
            printful_order_id: printfulOrder.result?.id,
            status: 'pending',
            total_amount: items.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0),
            stripe_session_id: session.id,
            microsite_id: micrositeId
          })
          .select()
          .single();

        if (orderError) {
          console.error("Error storing order:", orderError);
          throw new Error("Failed to store order in database");
        }

        // Store order items
        const orderItems = items.map(item => ({
          order_id: localOrder.id,
          printful_variant_id: item.printful_variant_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          size: item.size,
          material: item.material
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error("Error storing order items:", itemsError);
          throw new Error("Failed to store order items");
        }

        orderResults.push({
          micrositeId,
          micrositeName,
          printfulOrderId: printfulOrder.result?.id,
          localOrderId: localOrder.id,
          itemCount: items.length
        });

      } catch (error) {
        console.error(`Error processing order for microsite ${micrositeId}:`, error);
        orderResults.push({
          micrositeId,
          error: error.message
        });
      }
    }

    // Clear the cart after successful processing
    const successfulOrders = orderResults.filter(result => !result.error);
    if (successfulOrders.length > 0) {
      console.log("Clearing cart after successful order processing");
      
      // Delete cart line items first
      const { error: deleteItemsError } = await supabase
        .from('cart_line_items')
        .delete()
        .eq('cart_id', cartId);

      if (deleteItemsError) {
        console.error("Error clearing cart items:", deleteItemsError);
      }

      // Delete cart
      const { error: deleteCartError } = await supabase
        .from('carts')
        .delete()
        .eq('id', cartId);

      if (deleteCartError) {
        console.error("Error clearing cart:", deleteCartError);
      }
    }

    console.log("Order processing complete:", orderResults);

    return new Response(
      JSON.stringify({ 
        success: true,
        orders: orderResults,
        cartCleared: successfulOrders.length > 0
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error in Stripe webhook:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
