import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Download, Printer, History, Upload } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import QRCode from 'qrcode';
import { StickerOrderModal } from './StickerOrderModal';
import { OrderHistoryModal } from './OrderHistoryModal';
import { ColorPicker } from '@/components/ui/color-picker';
import { toast } from 'sonner';

interface MicrositeQRSectionProps {
  micrositeId: string;
}

export const MicrositeQRSection: React.FC<MicrositeQRSectionProps> = ({ micrositeId }) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [qrColor, setQrColor] = useState('#000000');
  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [logoSize, setLogoSize] = useState(20);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Generate microsite URL
  const micrositeUrl = `https://example.com/m/${micrositeId}`;

  const onDrop = (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = e => {
        setLogoDataUrl(e.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Logo uploaded successfully!');
    }
  };

  const {
    getRootProps,
    getInputProps,
    isDragActive
  } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg']
    },
    maxFiles: 1
  });

  const generateQR = async () => {
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to 1024px (fixed)
      canvas.width = 1024;
      canvas.height = 1024;

      // Generate QR code with fixed settings
      await QRCode.toCanvas(canvas, micrositeUrl, {
        width: 1024,
        errorCorrectionLevel: 'H', // High (30%)
        color: {
          dark: qrColor,
          light: backgroundColor
        },
        margin: 2 // Fixed margin
      });

      // Add logo if present
      if (logoDataUrl) {
        const logo = new Image();
        logo.onload = () => {
          const logoSizePixels = 1024 * logoSize / 100;
          const x = (1024 - logoSizePixels) / 2;
          const y = (1024 - logoSizePixels) / 2;

          // Add white background for logo
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(x - 5, y - 5, logoSizePixels + 10, logoSizePixels + 10);
          ctx.drawImage(logo, x, y, logoSizePixels, logoSizePixels);

          // Update data URL
          setQrDataUrl(canvas.toDataURL('image/png'));
        };
        logo.src = logoDataUrl;
      } else {
        setQrDataUrl(canvas.toDataURL('image/png'));
      }
    } catch (error) {
      console.error('Failed to generate QR code:', error);
    }
  };

  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `microsite-${micrositeId}-qr.png`;
    link.href = qrDataUrl;
    link.click();
    toast.success('QR code downloaded!');
  };

  const orderStickers = () => {
    if (!qrDataUrl) {
      generateQR().then(() => {
        setIsOrderModalOpen(true);
      });
    } else {
      setIsOrderModalOpen(true);
    }
  };

  useEffect(() => {
    generateQR();
  }, [qrColor, backgroundColor, logoDataUrl, logoSize, micrositeId]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>QR Code</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left side - QR Preview and URL */}
          <div className="space-y-4">
            <div className="flex justify-center p-4 bg-muted/30 rounded-lg">
              {qrDataUrl ? (
                <img 
                  src={qrDataUrl} 
                  alt="QR Code Preview" 
                  className="max-w-full h-auto rounded-lg" 
                  style={{ maxWidth: '200px' }}
                />
              ) : (
                <div className="w-48 h-48 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                  <p className="text-muted-foreground text-sm">Generating QR...</p>
                </div>
              )}
            </div>
            
            <div>
              <Label className="text-sm font-medium">Microsite URL</Label>
              <Input 
                value={micrositeUrl} 
                readOnly 
                className="text-sm bg-muted/50"
              />
            </div>
          </div>

          {/* Right side - Controls */}
          <div className="space-y-4">
            <div className="space-y-4">
              <ColorPicker
                label="QR Code Color"
                value={qrColor}
                onChange={setQrColor}
              />

              <ColorPicker
                label="Background Color"
                value={backgroundColor}
                onChange={setBackgroundColor}
              />
            </div>

            {/* Logo Upload */}
            <div>
              <Label className="text-sm font-medium">Upload Logo</Label>
              <div 
                {...getRootProps()} 
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors text-sm ${
                  isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'
                }`}
              >
                <input {...getInputProps()} />
                {logoDataUrl ? (
                  <div className="space-y-2">
                    <img src={logoDataUrl} alt="Logo preview" className="w-8 h-8 mx-auto object-contain" />
                    <p className="text-xs text-muted-foreground">
                      {logoFile?.name} - Click to change
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="w-4 h-4 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">
                      {isDragActive ? 'Drop logo here' : 'Upload logo'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Logo Size */}
            <div>
              <Label className="text-sm font-medium">Logo Size: {logoSize}%</Label>
              <Slider 
                value={[logoSize]} 
                onValueChange={value => setLogoSize(value[0])}
                max={40} 
                min={5} 
                step={1} 
                className="mt-2" 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <Button 
            onClick={downloadQR} 
            disabled={!qrDataUrl} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
          
          <Button 
            onClick={orderStickers} 
            disabled={!qrDataUrl} 
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            Buy Stickers
          </Button>

          <Button 
            onClick={() => setIsOrderHistoryModalOpen(true)} 
            variant="outline" 
            size="sm"
            className="flex items-center gap-2"
          >
            <History className="w-4 h-4" />
            Orders
          </Button>
        </div>

        <canvas ref={canvasRef} className="hidden" />

        <StickerOrderModal 
          isOpen={isOrderModalOpen} 
          onClose={() => setIsOrderModalOpen(false)} 
          qrDataUrl={qrDataUrl} 
        />

        <OrderHistoryModal 
          isOpen={isOrderHistoryModalOpen} 
          onClose={() => setIsOrderHistoryModalOpen(false)} 
        />
      </CardContent>
    </Card>
  );
};