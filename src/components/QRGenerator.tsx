import { useState, useRef, useEffect } from 'react';
import QRCode from 'qrcode';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Download, Printer, Palette, Settings, History } from 'lucide-react';
import { toast } from 'sonner';
import { StickerOrderModal } from './StickerOrderModal';
import { OrderHistoryModal } from './OrderHistoryModal';
interface QRConfig {
  url: string;
  size: number;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
  foregroundColor: string;
  backgroundColor: string;
  logoSize: number;
  margin: number;
}
const QRGenerator = () => {
  const [config, setConfig] = useState<QRConfig>({
    url: '',
    size: 512,
    errorCorrectionLevel: 'M',
    foregroundColor: '#000000',
    backgroundColor: '#ffffff',
    logoSize: 20,
    margin: 4
  });
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderHistoryModalOpen, setIsOrderHistoryModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
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
    if (!config.url) {
      toast.error('Please enter a URL');
      return;
    }
    try {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      canvas.width = config.size;
      canvas.height = config.size;

      // Generate QR code
      await QRCode.toCanvas(canvas, config.url, {
        width: config.size,
        errorCorrectionLevel: config.errorCorrectionLevel,
        color: {
          dark: config.foregroundColor,
          light: config.backgroundColor
        },
        margin: config.margin
      });

      // Add logo if present
      if (logoDataUrl) {
        const logo = new Image();
        logo.onload = () => {
          const logoSizePixels = config.size * config.logoSize / 100;
          const x = (config.size - logoSizePixels) / 2;
          const y = (config.size - logoSizePixels) / 2;

          // Add white background for logo
          ctx.fillStyle = config.backgroundColor;
          ctx.fillRect(x - 5, y - 5, logoSizePixels + 10, logoSizePixels + 10);
          ctx.drawImage(logo, x, y, logoSizePixels, logoSizePixels);

          // Update data URL
          setQrDataUrl(canvas.toDataURL('image/png'));
        };
        logo.src = logoDataUrl;
      } else {
        setQrDataUrl(canvas.toDataURL('image/png'));
      }
      toast.success('QR code generated successfully!');
    } catch (error) {
      toast.error('Failed to generate QR code');
      console.error(error);
    }
  };
  const downloadQR = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = 'qr-code.png';
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
    if (config.url) {
      generateQR();
    }
  }, [config, logoDataUrl]);
  return <div className="min-h-screen p-6 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-4">
            QR Code Studio
          </h1>
          <p className="text-muted-foreground text-lg">
            Create custom QR codes with your logo and order premium stickers
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Basic Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="url">Website URL</Label>
                  <Input id="url" placeholder="https://example.com" value={config.url} onChange={e => setConfig(prev => ({
                  ...prev,
                  url: e.target.value
                }))} />
                </div>

                <div>
                  <Label>Size: {config.size}px</Label>
                  <Slider value={[config.size]} onValueChange={value => setConfig(prev => ({
                  ...prev,
                  size: value[0]
                }))} max={1024} min={256} step={32} className="mt-2" />
                </div>

                <div>
                  <Label>Error Correction</Label>
                  <Select value={config.errorCorrectionLevel} onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => setConfig(prev => ({
                  ...prev,
                  errorCorrectionLevel: value
                }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">Low (7%)</SelectItem>
                      <SelectItem value="M">Medium (15%)</SelectItem>
                      <SelectItem value="Q">Quartile (25%)</SelectItem>
                      <SelectItem value="H">High (30%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="w-5 h-5" />
                  Colors & Styling
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="foreground">Foreground</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="foreground" type="color" value={config.foregroundColor} onChange={e => setConfig(prev => ({
                      ...prev,
                      foregroundColor: e.target.value
                    }))} className="w-12 h-10 p-0 border-0" />
                      <Input value={config.foregroundColor} onChange={e => setConfig(prev => ({
                      ...prev,
                      foregroundColor: e.target.value
                    }))} placeholder="#000000" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="background">Background</Label>
                    <div className="flex gap-2 items-center">
                      <Input id="background" type="color" value={config.backgroundColor} onChange={e => setConfig(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))} className="w-12 h-10 p-0 border-0" />
                      <Input value={config.backgroundColor} onChange={e => setConfig(prev => ({
                      ...prev,
                      backgroundColor: e.target.value
                    }))} placeholder="#ffffff" />
                    </div>
                  </div>
                </div>

                <div>
                  <Label>Logo Size: {config.logoSize}%</Label>
                  <Slider value={[config.logoSize]} onValueChange={value => setConfig(prev => ({
                  ...prev,
                  logoSize: value[0]
                }))} max={40} min={5} step={1} className="mt-2" />
                </div>

                <div>
                  <Label>Margin: {config.margin}</Label>
                  <Slider value={[config.margin]} onValueChange={value => setConfig(prev => ({
                  ...prev,
                  margin: value[0]
                }))} max={8} min={0} step={1} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5" />
                  Upload Logo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div {...getRootProps()} className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}`}>
                  <input {...getInputProps()} />
                  {logoDataUrl ? <div className="space-y-2">
                      <img src={logoDataUrl} alt="Logo preview" className="w-16 h-16 mx-auto object-contain" />
                      <p className="text-sm text-muted-foreground">
                        {logoFile?.name} - Click to change
                      </p>
                    </div> : <div className="space-y-2">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        {isDragActive ? 'Drop your logo here' : 'Drag & drop or click to upload'}
                      </p>
                    </div>}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview & Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center p-8 bg-gradient-secondary rounded-lg">
                  {qrDataUrl ? <img src={qrDataUrl} alt="QR Code Preview" className="max-w-full h-auto shadow-glow-primary rounded-lg" style={{
                  maxWidth: '300px'
                }} /> : <div className="w-64 h-64 border-2 border-dashed border-muted-foreground/25 rounded-lg flex items-center justify-center">
                      <p className="text-muted-foreground">Enter URL to preview</p>
                    </div>}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </CardContent>
            </Card>

            <div className="grid grid-cols-3 gap-3">
              <Button onClick={downloadQR} disabled={!qrDataUrl} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Download
              </Button>
              
              <Button onClick={orderStickers} disabled={!qrDataUrl} variant="gradient" className="flex items-center gap-2">
                <Printer className="w-4 h-4" />
                Order Stickers
              </Button>

              <Button onClick={() => setIsOrderHistoryModalOpen(true)} variant="outline" className="flex items-center gap-2">
                <History className="w-4 h-4" />
                Order History
              </Button>
            </div>

            <Card className="bg-gradient-accent/10 border-accent/20">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-2">Premium Sticker Printing</h3>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Weather-resistant vinyl</li>
                  <li>• Custom sizes available</li>
                  <li>• Fast shipping worldwide</li>
                  <li>• Cost effective, no minimums</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <StickerOrderModal isOpen={isOrderModalOpen} onClose={() => setIsOrderModalOpen(false)} qrDataUrl={qrDataUrl} />

      <OrderHistoryModal isOpen={isOrderHistoryModalOpen} onClose={() => setIsOrderHistoryModalOpen(false)} />
    </div>;
};
export default QRGenerator;