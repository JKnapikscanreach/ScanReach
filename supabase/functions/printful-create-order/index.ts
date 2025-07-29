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
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!printfulToken || !supabaseUrl || !supabaseServiceKey) {
      console.error("Missing environment variables:", {
        printfulToken: !!printfulToken,
        supabaseUrl: !!supabaseUrl,
        supabaseServiceKey: !!supabaseServiceKey
      });
      throw new Error("Missing required environment variables");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const requestData = await req.json();
    const { 
      customer, 
      orderItems, 
      fileId, 
      qrDataUrl, 
      shippingAddress 
    } = requestData;

    console.log("Creating order for customer:", customer?.email);
    console.log("Order items count:", orderItems?.length);
    console.log("File ID:", fileId);

    // Validate required fields
    if (!customer?.firstName || !customer?.lastName || !customer?.email) {
      throw new Error("Customer first name, last name, and email are required");
    }

    if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
      throw new Error("At least one order item is required");
    }

    if (!fileId) {
      throw new Error("File ID is required");
    }

    if (!shippingAddress) {
      throw new Error("Shipping address is required");
    }

    // Create or update customer with better error handling
    console.log("Creating/updating customer:", customer.email);
    
    let customerData;
    try {
      const { data: dbCustomer, error: customerError } = await supabase
        .from("customers")
        .upsert({
          email: customer.email.trim().toLowerCase(),
          first_name: customer.firstName.trim(),
          last_name: customer.lastName.trim(),
          phone: customer.phone?.trim() || "",
        }, { onConflict: 'email' })
        .select()
        .single();

      if (customerError) {
        console.error("Customer upsert error:", customerError);
        throw new Error(`Failed to create customer: ${customerError.message}`);
      }

      customerData = dbCustomer;
      console.log("Customer created/updated successfully:", customerData.id);
    } catch (error) {
      console.error("Database error during customer creation:", error);
      throw new Error(`Database error: ${error.message}`);
    }

    // Create order with Printful with enhanced validation and error handling
    const externalId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const printfulOrder = {
      external_id: externalId,
      recipient: {
        name: `${customer.firstName} ${customer.lastName}`,
        email: customer.email,
        phone: customer.phone || "",
        address1: shippingAddress.address1,
        address2: shippingAddress.address2 || "",
        city: shippingAddress.city,
        state_code: shippingAddress.state,
        country_code: shippingAddress.country,
        zip: shippingAddress.zip,
      },
      items: orderItems.map((item: any) => {
        if (!item.variantId || !item.quantity) {
          throw new Error(`Invalid order item: missing variantId or quantity`);
        }
        
        console.log(`Using catalog variant directly: ${item.variantId}`);
        
        return {
          variant_id: parseInt(item.variantId),
          quantity: parseInt(item.quantity),
          files: [{ type: "default", id: fileId }]
        };
      })
    };

    console.log("Creating order with Printful:");
    console.log("External ID:", externalId);
    console.log("Recipient:", printfulOrder.recipient);
    console.log("Items:", printfulOrder.items);

    let printfulData;
    try {
      const printfulResponse = await fetch("https://api.printful.com/orders", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${printfulToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(printfulOrder),
      });

      console.log("Printful response status:", printfulResponse.status);

      if (!printfulResponse.ok) {
        const errorData = await printfulResponse.text();
        console.error("Printful order creation failed:", errorData);
        
        // Try to parse error details
        try {
          const errorJson = JSON.parse(errorData);
          const errorMessage = errorJson.error?.message || errorJson.result || errorData;
          throw new Error(`Printful order creation failed: ${errorMessage}`);
        } catch {
          throw new Error(`Printful order creation failed: ${printfulResponse.status} - ${errorData}`);
        }
      }

      printfulData = await printfulResponse.json();
      console.log("Printful order created successfully:", {
        id: printfulData.result?.id,
        external_id: printfulData.result?.external_id,
        status: printfulData.result?.status
      });

      if (!printfulData.result?.id) {
        throw new Error("Printful order created but no ID returned");
      }

    } catch (error) {
      console.error("Error during Printful order creation:", error.message);
      throw new Error(`Failed to create order with Printful: ${error.message}`);
    }

    // Calculate total cost with validation
    const totalCost = orderItems.reduce((sum: number, item: any) => {
      const itemPrice = parseFloat(item.unitPrice) || 0;
      const itemQuantity = parseInt(item.quantity) || 0;
      return sum + (itemPrice * itemQuantity);
    }, 0);

    console.log("Calculated total cost:", totalCost);

    if (totalCost <= 0) {
      throw new Error("Invalid order total: must be greater than 0");
    }

    // Store order in database with transaction-like behavior
    let orderData;
    try {
      console.log("Storing order in database...");
      
      const { data: dbOrder, error: orderError } = await supabase
        .from("orders")
        .insert({
          customer_id: customerData.id,
          printful_order_id: printfulData.result.id.toString(),
          external_id: printfulData.result.external_id || externalId,
          status: printfulData.result.status || 'pending',
          total_cost: totalCost,
          shipping_address: shippingAddress,
          qr_data_url: qrDataUrl,
        })
        .select()
        .single();

      if (orderError) {
        console.error("Order storage error:", orderError);
        throw new Error(`Failed to store order: ${orderError.message}`);
      }

      orderData = dbOrder;
      console.log("Order stored successfully:", orderData.id);

    } catch (error) {
      console.error("Database error during order storage:", error);
      throw new Error(`Database error storing order: ${error.message}`);
    }

    // Store order items with validation
    try {
      console.log("Storing order items...");
      
      const orderItemsData = orderItems.map((item: any, index: number) => {
        if (!item.variantId || !item.quantity || !item.unitPrice) {
          throw new Error(`Invalid order item at index ${index}: missing required fields`);
        }
        
        return {
          order_id: orderData.id,
          product_id: item.productId?.toString() || '',
          variant_id: item.variantId.toString(),
          quantity: parseInt(item.quantity),
          size: item.size || '',
          material: item.material || '',
          unit_price: parseFloat(item.unitPrice),
        };
      });

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItemsData);

      if (itemsError) {
        console.error("Order items storage error:", itemsError);
        throw new Error(`Failed to store order items: ${itemsError.message}`);
      }

      console.log(`Stored ${orderItemsData.length} order items successfully`);

    } catch (error) {
      console.error("Error storing order items:", error);
      
      // Critical error: Printful order exists but we can't store items locally
      // Log this for manual cleanup and attempt to delete the local order record
      console.error("CRITICAL: Order items failed to store for Printful order:", printfulData.result.id);
      console.error("CRITICAL: Local order ID that needs cleanup:", orderData.id);
      
      // Attempt to clean up the local order since we can't store the items
      try {
        await supabase
          .from("orders")
          .delete()
          .eq("id", orderData.id);
        console.log("Cleaned up local order record due to order items failure");
      } catch (cleanupError) {
        console.error("Failed to cleanup local order record:", cleanupError);
      }
      
      throw new Error(`Failed to store order items: ${error.message}. Printful order ${printfulData.result.id} may need manual cleanup.`);
    }

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