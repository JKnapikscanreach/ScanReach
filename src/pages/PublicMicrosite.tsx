import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MicrositePreview } from '@/components/MicrositePreview';
import { useMicrositeContent } from '@/hooks/useMicrositeContent';

interface MicrositeData {
  id: string;
  name: string;
  url: string;
  status: string;
}

export default function PublicMicrosite() {
  const { micrositeUrl } = useParams<{ micrositeUrl: string }>();
  const [microsite, setMicrosite] = useState<MicrositeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { content, cards, loading: contentLoading } = useMicrositeContent(
    microsite?.id || ''
  );

  useEffect(() => {
    if (!micrositeUrl) return;
    
    fetchMicrosite();
  }, [micrositeUrl]);

  const fetchMicrosite = async () => {
    if (!micrositeUrl) return;
    
    try {
      setLoading(true);
      
      // Fetch microsite by URL
      const { data: micrositeData, error: micrositeError } = await supabase
        .from('microsites')
        .select('id, name, url, status')
        .eq('url', micrositeUrl)
        .eq('status', 'published') // Only show published microsites
        .single();

      if (micrositeError) {
        if (micrositeError.code === 'PGRST116') {
          setError('Microsite not found');
        } else {
          throw micrositeError;
        }
        return;
      }

      setMicrosite(micrositeData);
      
      // Track scan
      await trackScan(micrositeData.id);
      
    } catch (error) {
      console.error('Error fetching microsite:', error);
      setError('Failed to load microsite');
    } finally {
      setLoading(false);
    }
  };

  const trackScan = async (micrositeId: string) => {
    try {
      await supabase
        .from('microsite_scans')
        .insert({
          microsite_id: micrositeId,
          user_agent: navigator.userAgent,
          ip_address: null // IP will be handled server-side if needed
        });
    } catch (error) {
      console.error('Error tracking scan:', error);
      // Don't show error to user for tracking failures
    }
  };

  if (loading || contentLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (error || !microsite) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Microsite Not Found</h1>
          <p className="text-muted-foreground">
            This microsite doesn't exist or is not published.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MicrositePreview 
        content={content}
        cards={cards}
        title={microsite.name}
      />
    </div>
  );
}