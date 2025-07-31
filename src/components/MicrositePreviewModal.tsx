import { Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface MicrositePreviewModalProps {
  micrositeUrl?: string;
  micrositeName: string;
  status: 'draft' | 'published';
  trigger?: React.ReactNode;
}

export function MicrositePreviewModal({ 
  micrositeUrl, 
  micrositeName, 
  status, 
  trigger 
}: MicrositePreviewModalProps) {
  
  const openInNewTab = () => {
    if (micrositeUrl) {
      window.open(micrositeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <Eye className="h-4 w-4 mr-2" />
            Preview
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-4xl h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Preview: {micrositeName}</span>
            {status === 'published' && micrositeUrl && (
              <Button onClick={openInNewTab} variant="outline" size="sm">
                Open in New Tab
              </Button>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 border rounded-lg overflow-hidden">
          {status === 'published' && micrositeUrl ? (
            <iframe
              src={micrositeUrl}
              className="w-full h-full"
              title={`Preview of ${micrositeName}`}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            />
          ) : (
            <div className="flex items-center justify-center h-full bg-muted/20">
              <div className="text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Preview Not Available</h3>
                <p className="text-muted-foreground">
                  {status === 'draft' 
                    ? 'This microsite is still in draft mode. Publish it to enable preview.'
                    : 'No URL has been set for this microsite yet.'
                  }
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}