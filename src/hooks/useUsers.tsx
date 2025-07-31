import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  company_name?: string;
  subscription_status: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  microsite_count?: number;
  sticker_order_count?: number;
}

export function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Fetch users with microsite counts and last login
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          microsites!inner(count),
          user_sessions(last_login)
        `);

      if (usersError) throw usersError;

      // Count sticker orders from existing orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, id');

      if (ordersError) throw ordersError;

      // Process and combine data
      const processedUsers = usersData?.map(user => {
        const stickerOrderCount = ordersData?.filter(order => 
          order.customer_id === user.id
        ).length || 0;

        const lastLogin = user.user_sessions?.[0]?.last_login;
        
        return {
          ...user,
          last_login: lastLogin,
          microsite_count: user.microsites?.length || 0,
          sticker_order_count: stickerOrderCount,
        };
      }) || [];

      setUsers(processedUsers);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId);

      if (error) throw error;
      
      await fetchUsers(); // Refresh data
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to update user' 
      };
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      await fetchUsers(); // Refresh data
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to delete user' 
      };
    }
  };


  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUser,
    deleteUser,
  };
}