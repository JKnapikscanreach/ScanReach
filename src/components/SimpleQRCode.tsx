import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';

interface SimpleQRCodeProps {
  data: string;
  size?: number;
  onGenerated?: (dataUrl: string) => void;
}

export function SimpleQRCode({ data, size = 200, onGenerated }: SimpleQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  useEffect(() => {
    const generateQR = async () => {
      if (!data || !canvasRef.current) return;

      try {
        const canvas = canvasRef.current;
        await QRCode.toCanvas(canvas, data, {
          width: size,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff'
          }
        });

        const dataUrl = canvas.toDataURL('image/png');
        setQrDataUrl(dataUrl);
        onGenerated?.(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateQR();
  }, [data, size, onGenerated]);

  return (
    <div className="flex justify-center">
      <canvas 
        ref={canvasRef}
        style={{ maxWidth: '100%', height: 'auto' }}
      />
    </div>
  );
}