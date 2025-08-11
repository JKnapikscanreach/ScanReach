import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

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
  const { user: currentUser, isAdmin } = useAuth();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Only allow admins to fetch users
      if (!currentUser || !isAdmin) {
        setUsers([]);
        setLoading(false);
        return;
      }
      
      // Fetch users with microsite counts and last login
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('*');

      if (usersError) throw usersError;

      // Get microsite counts for each user
      const { data: micrositesData, error: micrositesError } = await supabase
        .from('microsites')
        .select('user_id');

      if (micrositesError) throw micrositesError;

      // Count sticker orders from existing orders table
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('customer_id, id');

      if (ordersError) throw ordersError;

      // Get latest login for each user
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('user_sessions')
        .select('user_id, last_login')
        .order('last_login', { ascending: false });

      if (sessionsError) throw sessionsError;

      // Process and combine data
      const processedUsers = usersData?.map(user => {
        const stickerOrderCount = ordersData?.filter(order => 
          order.customer_id === user.id
        ).length || 0;

        const micrositeCount = micrositesData?.filter(m => m.user_id === user.id).length || 0;
        
        const userSession = sessionsData?.find(s => s.user_id === user.id);
        const lastLogin = userSession?.last_login;
        
        return {
          ...user,
          last_login: lastLogin,
          microsite_count: micrositeCount,
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
    if (currentUser && isAdmin) {
      fetchUsers();
    }
  }, [currentUser, isAdmin]);

  return {
    users,
    loading,
    error,
    refetch: fetchUsers,
    updateUser,
    deleteUser,
  };
}