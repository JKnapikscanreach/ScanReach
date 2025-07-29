import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Order {
  id: string;
  status: string;
  total_cost: number;
  created_at: string;
  printful_order_id: string;
  shipping_address: any;
}

interface OrderWithItems extends Order {
  order_items: Array<{
    id: string;
    product_id: string;
    variant_id: string;
    quantity: number;
    size: string;
    material: string;
    unit_price: number;
  }>;
  customers: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useOrderHistory = (customerEmail?: string) => {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = async () => {
    if (!customerEmail) return;

    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*),
          customers (first_name, last_name, email)
        `)
        .eq('customers.email', customerEmail)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching orders:', queryError);
        setError(queryError.message);
        return;
      }

      setOrders(data || []);
    } catch (err) {
      console.error('Error in fetchOrders:', err);
      setError('Failed to fetch order history');
    } finally {
      setLoading(false);
    }
  };

  const getOrderStatus = async (orderId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('printful-order-status', {
        body: { orderId }
      });

      if (error) {
        console.error('Error fetching order status:', error);
        return null;
      }

      return data;
    } catch (err) {
      console.error('Error in getOrderStatus:', err);
      return null;
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customerEmail]);

  return {
    orders,
    loading,
    error,
    refetch: fetchOrders,
    getOrderStatus,
  };
};