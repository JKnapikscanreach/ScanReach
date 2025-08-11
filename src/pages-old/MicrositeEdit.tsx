"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, Eye, Globe, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MicrositeEditor } from '@/components/MicrositeEditor';
import { DeleteMicrositeModal } from '@/components/DeleteMicrositeModal';
import { toast } from 'sonner';
import { nanoid } from 'nanoid';
import { createClient } from '@/utils/supabase/client';

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
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const isNewMicrosite = !id || id === 'new';
  
  const [microsite, setMicrosite] = useState<MicrositeData | null>(null);
  const [loading, setLoading] = useState(!isNewMicrosite);
  const [autoSaving, setAutoSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

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

      const supabase = createClient();

      const { error } = await supabase
        .from('microsites')
        .insert(newMicrosite);

      if (error) throw error;

      setMicrosite(newMicrosite);
      
      // Update URL to reflect the new microsite ID
      router.replace(`/microsites/${micrositeId}/edit`);
      
      toast.success('New microsite created');
    } catch (error) {
      console.error('Error creating microsite:', error);
      toast.error('Failed to create microsite');
      router.push('/microsites');
    }
  };

  const fetchMicrosite = async () => {
    if (!id) return;
    
    try {
      const supabase = createClient();
      setLoading(true);
      const { data, error } = await supabase
        .from('microsites')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setMicrosite({
        ...data,
        url: data.url ? `${window.location.origin}/m/${data.url}` : undefined,
      });
    } catch (error) {
      console.error('Error fetching microsite:', error);
      toast.error('Failed to load microsite');
      router.push('/microsites');
    } finally {
      setLoading(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!microsite) return;
    
    try {
      setIsPublishing(true);
      const newStatus = microsite.status === 'published' ? 'draft' : 'published';      
      const supabase = createClient();
      const { error } = await supabase
        .from('microsites')
        .update({ status: newStatus })
        .eq('id', microsite.id);

      if (error) throw error;

      setMicrosite(prev => prev ? { ...prev, status: newStatus } : null);
      
      toast.success(
        newStatus === 'published' 
          ? 'Microsite published successfully' 
          : 'Microsite unpublished'
      );
    } catch (error) {
      console.error('Error updating microsite status:', error);
      toast.error('Failed to update microsite status');
    } finally {
      setIsPublishing(false);
    }
  };

  const getPublicUrl = () => {
    if (!microsite?.url) {
      return '';
    }

    return microsite.url;
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
          <Button onClick={() => router.push('/microsites')}>
            Back to Microsites
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="container mx-auto px-4 py-4 max-w-7xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/microsites')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Microsites
            </Button>
            <div className="text-sm text-muted-foreground">
              {isNewMicrosite ? (
                'New microsite'
              ) : (
                <>
                  Created {new Date(microsite.created_at).toLocaleDateString()} • 
                  {microsite.scan_count} scans
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {autoSaving && (
              <Badge variant="secondary" className="text-xs">
                Auto-saving...
              </Badge>
            )}
            
            {/* Status Badge */}
            <Badge 
              variant={microsite.status === 'published' ? 'default' : 'secondary'}
              className="text-xs"
            >
              {microsite.status === 'published' ? 'Published' : 'Draft'}
            </Badge>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Placeholder for save functionality
                toast.success('Microsite saved');
              }}
            >
              <Save className="h-4 w-4 mr-2" />
              Save
            </Button>
            
            <Button 
              variant={microsite.status === 'published' ? 'secondary' : 'default'}
              size="sm"
              onClick={handlePublishToggle}
              disabled={isPublishing}
            >
              {microsite.status === 'published' ? (
                <>
                  <Globe className="h-4 w-4 mr-2" />
                  Un-Publish
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-2" />
                  Publish
                </>
              )}
            </Button>
            
            {microsite.status === 'published' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(getPublicUrl(), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Button>
            )}
            
            <DeleteMicrositeModal
              micrositeId={microsite.id}
              micrositeName={microsite.name}
              onDelete={() => router.push('/microsites')}
              trigger={
                <Button variant="outline" size="sm" className="text-destructive hover:text-destructive border-destructive/20">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              }
            />
          </div>
        </div>
        
        <Separator />
      </div>

      {/* Editor Container - Takes remaining height */}
      <div className="flex-1 min-h-0 px-4">
        <MicrositeEditor 
          micrositeId={microsite.id}
          onSave={() => toast.success('Microsite saved')}
          onPublish={() => toast.success('Microsite published')}
          onAutoSavingChange={setAutoSaving}
        />
      </div>
    </div>
  );
}