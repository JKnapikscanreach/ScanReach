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
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeSecretKey || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables");
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { cartId, successUrl, cancelUrl } = await req.json();

    if (!cartId) {
      throw new Error("Cart ID is required");
    }

    // Fetch cart with all line items
    const { data: cart, error: cartError } = await supabase
      .from('carts')
      .select(`
        *,
        cart_line_items (
          *,
          microsites (
            id,
            name
          )
        )
      `)
      .eq('id', cartId)
      .single();

    if (cartError || !cart) {
      console.error("Error fetching cart:", cartError);
      throw new Error("Cart not found");
    }

    const cartLineItems = cart.cart_line_items as CartLineItem[];

    if (!cartLineItems || cartLineItems.length === 0) {
      throw new Error("Cart is empty");
    }

    // Create Stripe line items from cart
    const lineItems = cartLineItems.map(item => ({
      price_data: {
        currency: 'usd',
        product_data: {
          name: `${item.microsites.name} - QR Code Sticker`,
          description: `Size: ${item.size}, Material: ${item.material}`,
        },
        unit_amount: Math.round(item.unit_price * 100), // Convert to cents
      },
      quantity: item.quantity,
    }));

    // Calculate total amount
    const totalAmount = cartLineItems.reduce((sum, item) => sum + (item.unit_price * item.quantity), 0);

    console.log(`Creating checkout session for cart ${cartId} with ${cartLineItems.length} items, total: $${totalAmount.toFixed(2)}`);

    // Create Stripe checkout session
    const stripeResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "payment",
        "success_url": successUrl || `${req.headers.get("origin")}/checkout/success`,
        "cancel_url": cancelUrl || `${req.headers.get("origin")}/cart`,
        "line_items[0][price_data][currency]": "usd",
        "line_items[0][price_data][product_data][name]": "QR Code Stickers",
        "line_items[0][price_data][unit_amount]": Math.round(totalAmount * 100).toString(),
        "line_items[0][quantity]": "1",
        "metadata[cart_id]": cartId,
        "shipping_address_collection[allowed_countries][0]": "US",
        "shipping_address_collection[allowed_countries][1]": "CA",
        "phone_number_collection[enabled]": "true",
      }),
    });

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error("Stripe API error:", errorText);
      throw new Error(`Stripe API error: ${stripeResponse.status}`);
    }

    const session = await stripeResponse.json();

    console.log("Created Stripe checkout session:", session.id);

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );

  } catch (error) {
    console.error("Error creating checkout session:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
