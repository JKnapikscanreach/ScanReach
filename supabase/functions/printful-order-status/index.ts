import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    const { orderId } = await req.json();

    if (!orderId) {
      throw new Error("Order ID is required");
    }

    // Get order from our database
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (orderError || !orderData) {
      throw new Error("Order not found");
    }

    // Get order status from Printful
    const printfulResponse = await fetch(
      `https://api.printful.com/orders/${orderData.printful_order_id}`,
      {
        headers: {
          "Authorization": `Bearer ${printfulToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!printfulResponse.ok) {
      throw new Error(`Printful API error: ${printfulResponse.status}`);
    }

    const printfulData = await printfulResponse.json();
    const printfulOrder = printfulData.result;

    // Update order status in our database if it changed
    if (orderData.status !== printfulOrder.status) {
      await supabase
        .from("orders")
        .update({ status: printfulOrder.status })
        .eq("id", orderId);
    }

    console.log(`Order ${orderId} status: ${printfulOrder.status}`);

    return new Response(JSON.stringify({
      orderId: orderId,
      status: printfulOrder.status,
      tracking: printfulOrder.shipments || [],
      created: printfulOrder.created,
      updated: printfulOrder.updated,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error getting order status:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});