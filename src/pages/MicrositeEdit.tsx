import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MicrositeEditor } from '@/components/MicrositeEditor';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { nanoid } from 'nanoid';

interface MicrositeData {
  id: string;
  name: string;
  url?: string;
  status: string;
  scan_count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export default function MicrositeEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNewMicrosite = !id || id === 'new';
  
  const [microsite, setMicrosite] = useState<MicrositeData | null>(null);
  const [loading, setLoading] = useState(!isNewMicrosite);

  useEffect(() => {
    if (!isNewMicrosite && id) {
      fetchMicrosite();
    } else if (isNewMicrosite) {
      // Create a new microsite automatically when creating
      createNewMicrosite();
    }
  }, [id, isNewMicrosite]);

  const createNewMicrosite = async () => {
    try {
      const micrositeId = nanoid();
      const micrositeUrl = `microsite-${nanoid(8)}`;
      
      const newMicrosite = {
        id: micrositeId,
        name: `New Microsite ${Date.now()}`,
        url: micrositeUrl,
        status: 'draft' as const,
        user_id: 'system', // This should be replaced with actual user ID when auth is implemented
        scan_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('microsites')
        .insert(newMicrosite);

      if (error) throw error;

      setMicrosite(newMicrosite);
      
      // Update URL to reflect the new microsite ID
      navigate(`/microsites/${micrositeId}/edit`, { replace: true });
      
      toast.success('New microsite created');
    } catch (error) {
      console.error('Error creating microsite:', error);
      toast.error('Failed to create microsite');
      navigate('/microsites');
    }
  };

  const fetchMicrosite = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('microsites')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setMicrosite(data);
    } catch (error) {
      console.error('Error fetching microsite:', error);
      toast.error('Failed to load microsite');
      navigate('/microsites');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="h-64 bg-muted rounded"></div>
        </div>
      </div>
    );
  }

  if (!microsite) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Microsite Not Found</h1>
          <Button onClick={() => navigate('/microsites')}>
            Back to Microsites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/microsites')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Microsites
          </Button>
          <div>
            <h1 className="text-3xl font-bold">
              {isNewMicrosite ? 'Create Microsite' : 'Edit Microsite'}
            </h1>
            <p className="text-muted-foreground">
              {isNewMicrosite ? (
                'Design and publish your new microsite'
              ) : (
                <>
                  Created {new Date(microsite.created_at).toLocaleDateString()} • 
                  {microsite.scan_count} scans
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Enhanced Editor */}
      <MicrositeEditor micrositeId={microsite.id} />
    </div>
  );
}