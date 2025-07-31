import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface HeaderImageUploadProps {
  micrositeId: string;
  currentImageUrl: string | null;
  onImageUpdate: (url: string | null) => void;
}

export const HeaderImageUpload: React.FC<HeaderImageUploadProps> = ({
  micrositeId,
  currentImageUrl,
  onImageUpdate,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { toast } = useToast();

  const validateImage = (file: File): string | null => {
    // Check file type
    if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
      return 'Please upload a JPG or PNG image only.';
    }

    // Check file size (1MB = 1024 * 1024 bytes)
    if (file.size > 1024 * 1024) {
      return 'Image must be smaller than 1MB.';
    }

    return null;
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const validation = validateImage(file);
    if (validation) {
      setUploadError(validation);
      return null;
    }

    try {
      setUploading(true);
      setUploadError(null);

      // Generate unique filename
      const fileExtension = file.name.split('.').pop();
      const fileName = `header-${micrositeId}-${Date.now()}.${fileExtension}`;
      const filePath = `headers/${fileName}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('microsite-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('microsite-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      setUploadError(error instanceof Error ? error.message : 'Failed to upload image');
      return null;
    } finally {
      setUploading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const url = await uploadImage(file);
    
    if (url) {
      onImageUpdate(url);
      toast({
        title: "Success",
        description: "Header image uploaded successfully.",
      });
    }
  }, [micrositeId, onImageUpdate, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
    },
    multiple: false,
    disabled: uploading,
  });

  const handleRemoveImage = async () => {
    if (currentImageUrl) {
      try {
        // Extract file path from URL
        const url = new URL(currentImageUrl);
        const filePath = url.pathname.split('/storage/v1/object/public/microsite-assets/')[1];
        
        if (filePath) {
          await supabase.storage
            .from('microsite-assets')
            .remove([filePath]);
        }
      } catch (error) {
        console.warn('Failed to delete old image:', error);
      }
    }
    
    onImageUpdate(null);
    toast({
      title: "Removed",
      description: "Header image removed successfully.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="h-5 w-5" />
          Header Image
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Image */}
        {currentImageUrl && (
          <div className="space-y-2">
            <Label>Current Image</Label>
            <div className="relative group">
              <div className="aspect-[3/1] bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={currentImageUrl}
                  alt="Header"
                  className="w-full h-full object-cover"
                />
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={handleRemoveImage}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Upload Area */}
        <div className="space-y-2">
          <Label>Upload New Image</Label>
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
              ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
              ${uploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
            `}
          >
            <input {...getInputProps()} />
            <div className="space-y-2">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
              {uploading ? (
                <p className="text-sm text-muted-foreground">Uploading...</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground">
                    {isDragActive
                      ? 'Drop the image here...'
                      : 'Drag & drop an image here, or click to select'
                    }
                  </p>
                  <p className="text-xs text-muted-foreground">
                    JPG or PNG only, max 1MB • Recommended ratio 3:1
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Upload Error */}
        {uploadError && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {uploadError}
          </div>
        )}

        {/* Guidelines */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Image appears above the first content card</p>
          <p>• Recommended aspect ratio: 3:1 (wide)</p>
          <p>• Maximum file size: 1MB</p>
          <p>• Supported formats: JPG, PNG</p>
        </div>
      </CardContent>
    </Card>
  );
};