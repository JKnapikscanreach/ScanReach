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

    const { 
      customer, 
      orderItems, 
      fileId, 
      qrDataUrl, 
      shippingAddress 
    } = await req.json();

    console.log("Creating Printful order for:", customer.email);

    // Create customer in our database
    console.log("Creating/updating customer:", customer.email);
    const { data: customerData, error: customerError } = await supabase
      .from("customers")
      .upsert({
        email: customer.email,
        first_name: customer.firstName,
        last_name: customer.lastName,
        phone: customer.phone,
      }, { onConflict: 'email' })
      .select()
      .single();

    if (customerError) {
      console.error("Customer creation error:", customerError);
      throw new Error(`Customer creation failed: ${customerError.message}`);
    }

    console.log("Customer created/updated:", customerData.id);

    // Create Printful order
    const printfulOrder = {
      recipient: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone,
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || "",
        city: shippingAddress.city,
        state_code: shippingAddress.state,
        country_code: shippingAddress.country,
        zip: shippingAddress.zip,
      },
      items: orderItems.map((item: any) => ({
        sync_variant_id: item.variantId,
        quantity: item.quantity,
        files: [
          {
            type: "default",
            id: fileId,
          },
        ],
      })),
    };

    const printfulResponse = await fetch("https://api.printful.com/orders", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${printfulToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(printfulOrder),
    });

    if (!printfulResponse.ok) {
      const errorData = await printfulResponse.text();
      throw new Error(`Printful order creation failed: ${printfulResponse.status} - ${errorData}`);
    }

    const printfulData = await printfulResponse.json();
    console.log("Printful order created:", printfulData.result.id);

    // Calculate total cost
    const totalCost = orderItems.reduce((sum: number, item: any) => 
      sum + (item.unitPrice * item.quantity), 0
    );

    // Create order in our database
    console.log("Creating order in database with total cost:", totalCost);
    const { data: orderData, error: orderError } = await supabase
      .from("orders")
      .insert({
        customer_id: customerData.id,
        printful_order_id: printfulData.result.id.toString(),
        status: 'pending',
        total_cost: totalCost,
        shipping_address: shippingAddress,
        qr_data_url: qrDataUrl,
      })
      .select()
      .single();

    if (orderError) {
      console.error("Order creation error:", orderError);
      throw new Error(`Order creation failed: ${orderError.message}`);
    }

    console.log("Order created in database:", orderData.id);

    // Create order items
    const orderItemsData = orderItems.map((item: any) => ({
      order_id: orderData.id,
      product_id: item.productId,
      variant_id: item.variantId,
      quantity: item.quantity,
      size: item.size,
      material: item.material,
      unit_price: item.unitPrice,
    }));

    console.log("Creating order items:", orderItemsData.length);
    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItemsData);

    if (itemsError) {
      console.error("Order items creation error:", itemsError);
      throw new Error(`Order items creation failed: ${itemsError.message}`);
    }

    console.log("Order items created successfully");

    return new Response(JSON.stringify({ 
      orderId: orderData.id,
      printfulOrderId: printfulData.result.id,
      status: 'success' 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating Printful order:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});