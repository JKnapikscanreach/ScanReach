'use client';

import { useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';

interface MicrositeTrackerProps {
  micrositeId: string;
}

export function MicrositeTracker({ micrositeId }: MicrositeTrackerProps) {
  useEffect(() => {
    const trackScan = async () => {
      try {
        const supabase = createClient();
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

    trackScan();
  }, [micrositeId]);

  // This component doesn't render anything visible
  return null;
}
