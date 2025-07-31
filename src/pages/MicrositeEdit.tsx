import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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
  
  const [microsite, setMicrosite] = useState<MicrositeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    url: '',
    status: 'draft' as 'draft' | 'published'
  });

  useEffect(() => {
    if (id) {
      fetchMicrosite();
    }
  }, [id]);

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
      setFormData({
        name: data.name,
        url: data.url || '',
        status: data.status as 'draft' | 'published'
      });
    } catch (error) {
      console.error('Error fetching microsite:', error);
      toast.error('Failed to load microsite');
      navigate('/microsites');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!id || !formData.name.trim()) {
      toast.error('Microsite name is required');
      return;
    }

    try {
      setSaving(true);
      const { error } = await supabase
        .from('microsites')
        .update({
          name: formData.name.trim(),
          url: formData.url.trim() || null,
          status: formData.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Microsite updated successfully');
      navigate('/microsites');
    } catch (error) {
      console.error('Error updating microsite:', error);
      toast.error('Failed to update microsite');
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (formData.url) {
      window.open(formData.url, '_blank', 'noopener,noreferrer');
    } else {
      toast.error('No URL set for preview');
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
    <div className="container mx-auto px-4 py-8">
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
            <h1 className="text-3xl font-bold">Edit Microsite</h1>
            <p className="text-muted-foreground">
              Created {new Date(microsite.created_at).toLocaleDateString()} • 
              {microsite.scan_count} scans
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Badge variant={formData.status === 'published' ? 'default' : 'secondary'}>
            {formData.status}
          </Badge>
          
          {formData.url && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
            >
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
          )}
          
          <Button
            onClick={handleSave}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Microsite Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter microsite name"
                />
              </div>

              <div>
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  value={formData.url}
                  onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
                  placeholder="https://example.com"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  The URL where this microsite will be accessible
                </p>
              </div>

              <div>
                <Label htmlFor="status">Publication Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: 'draft' | 'published') => 
                    setFormData(prev => ({ ...prev, status: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground mt-1">
                  {formData.status === 'published' 
                    ? 'This microsite is live and accessible to visitors'
                    : 'This microsite is not yet public'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">{microsite.scan_count}</div>
                  <div className="text-sm text-muted-foreground">Total Scans</div>
                </div>
                <div className="text-center p-4 bg-muted/50 rounded-lg">
                  <div className="text-2xl font-bold">
                    {formData.status === 'published' ? 'Live' : 'Draft'}
                  </div>
                  <div className="text-sm text-muted-foreground">Status</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {formData.url && (
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={handlePreview}
                >
                  <Globe className="h-4 w-4 mr-2" />
                  Open Live Site
                </Button>
              )}
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/microsites')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}