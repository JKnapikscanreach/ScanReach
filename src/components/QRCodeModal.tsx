import { useState } from 'react';
import { QrCode, Download, ExternalLink } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SimpleQRCode } from '@/components/SimpleQRCode';

interface QRCodeModalProps {
  micrositeUrl: string;
  micrositeName: string;
  trigger?: React.ReactNode;
}

export function QRCodeModal({ micrositeUrl, micrositeName, trigger }: QRCodeModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const handleQRGenerated = (dataUrl: string) => {
    setQrDataUrl(dataUrl);
  };

  const downloadQR = () => {
    if (qrDataUrl) {
      const link = document.createElement('a');
      link.href = qrDataUrl;
      link.download = `${micrositeName}-qr-code.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const openMicrosite = () => {
    if (micrositeUrl) {
      window.open(micrositeUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            <QrCode className="h-4 w-4 mr-2" />
            QR Code
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {micrositeName}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4">
          <div className="bg-white p-4 rounded-lg border">
            <SimpleQRCode 
              data={micrositeUrl || `https://example.com/microsites/${micrositeName}`}
              size={200}
              onGenerated={handleQRGenerated}
            />
          </div>
          
          <div className="flex space-x-2">
            <Button onClick={downloadQR} disabled={!qrDataUrl} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
            
            {micrositeUrl && (
              <Button onClick={openMicrosite} variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Site
              </Button>
            )}
          </div>
          
          <p className="text-sm text-muted-foreground text-center">
            Share this QR code to allow others to quickly access the microsite
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}