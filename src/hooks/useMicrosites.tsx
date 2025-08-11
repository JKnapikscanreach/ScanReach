import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';

interface Microsite {
  id: string;
  name: string;
  url?: string | null;
  status: string;
  scan_count: number;
  last_scan_at?: string | null;
  created_at: string;
  updated_at: string;
  user_id?: string;
  user: {
    first_name: string;
    last_name: string;
    email: string;
  };
}

export const useMicrosites = () => {
  const [microsites, setMicrosites] = useState<Microsite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  // Initialize Supabase client and get user
  useEffect(() => {
    const supabase = createClient();
    
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      // Check if user is admin (you may need to adjust this logic based on your user roles)
      if (user) {
        const isUserAdmin = user.user_metadata?.role === 'admin' || user.app_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        const isUserAdmin = session.user.user_metadata?.role === 'admin' || session.user.app_metadata?.role === 'admin';
        setIsAdmin(isUserAdmin);
      } else {
        setIsAdmin(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchMicrosites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setMicrosites([]);
        setLoading(false);
        return;
      }

      const supabase = createClient();
      
      // Fetch all microsites
      const { data: micrositesData, error: micrositesError } = await supabase
        .from('microsites')
        .select('*')
        .order('created_at', { ascending: false });

      if (micrositesError) throw micrositesError;

      // Fetch users data separately
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, first_name, last_name, email');

      if (usersError) throw usersError;

      // Combine the data
      const combinedData = (micrositesData || []).map(microsite => {
        const userData = usersData?.find(u => u.id === microsite.user_id);
        return {
          ...microsite,
          user: userData || { first_name: '', last_name: '', email: '' }
        };
      });

      // Filter by user if not admin
      let filteredData = combinedData;
      if (!isAdmin && user) {
        filteredData = combinedData.filter(m => m.user_id === user.id);
      }

      setMicrosites(filteredData);
    } catch (error) {
      console.error('Error fetching microsites:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateMicrosite = async (id: string, updates: Partial<Microsite>) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('microsites')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      await fetchMicrosites();
    } catch (error) {
      console.error('Error updating microsite:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const deleteMicrosite = async (id: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('microsites')
        .delete()
        .eq('id', id);

      if (error) throw error;
      await fetchMicrosites();
    } catch (error) {
      console.error('Error deleting microsite:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const trackScan = async (micrositeId: string, userAgent?: string, ipAddress?: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('microsite_scans')
        .insert({
          microsite_id: micrositeId,
          user_agent: userAgent,
          ip_address: ipAddress,
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error tracking scan:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchMicrosites();
    }
  }, [user, isAdmin]);

  return {
    microsites,
    loading,
    error,
    refetch: fetchMicrosites,
    updateMicrosite,
    deleteMicrosite,
    trackScan,
  };
};