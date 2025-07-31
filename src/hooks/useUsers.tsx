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

  const generateMockData = async () => {
    const mockUsers = Array.from({ length: 50 }, (_, i) => ({
      email: `user${i + 1}@example.com`,
      first_name: ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Emma', 'Chris', 'Lisa'][i % 8],
      last_name: ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Miller', 'Moore', 'Taylor'][i % 8],
      company_name: i % 3 === 0 ? null : ['Tech Corp', 'Marketing Solutions', 'Design Studio', 'Digital Agency'][i % 4],
      subscription_status: ['free', 'pro', 'enterprise'][i % 3],
      is_admin: i === 0, // First user is admin
    }));

    try {
      const { error } = await supabase
        .from('users')
        .insert(mockUsers);

      if (error) throw error;

      // Generate mock microsites and sessions
      const { data: userData } = await supabase
        .from('users')
        .select('id');

      if (userData) {
        const mockMicrosites = userData.flatMap(user => 
          Array.from({ length: Math.floor(Math.random() * 5) }, (_, i) => ({
            user_id: user.id,
            name: `Microsite ${i + 1}`,
            url: `https://microsite${i + 1}.example.com`,
          }))
        );

        const mockSessions = userData.map(user => ({
          user_id: user.id,
          last_login: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        }));

        await supabase.from('microsites').insert(mockMicrosites);
        await supabase.from('user_sessions').insert(mockSessions);
      }

      await fetchUsers();
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to generate mock data' 
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
    generateMockData,
  };
}