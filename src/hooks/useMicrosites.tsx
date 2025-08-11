import { useState, useEffect } from 'react';
import { supabase } from '@/utils/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Microsite {
  id: string;
  name: string;
  url?: string;
  status: string;
  scan_count: number;
  last_scan_at?: string;
  created_at: string;
  updated_at: string;
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
  const { user, isAdmin } = useAuth();

  const fetchMicrosites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      if (!user) {
        setMicrosites([]);
        setLoading(false);
        return;
      }
      
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