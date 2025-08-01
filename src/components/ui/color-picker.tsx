import React, { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SketchPicker } from "react-color";
import { Pipette } from "lucide-react";

interface ColorPickerProps {
  label: string;
  value: string;
  onChange: (color: string) => void;
  showEyedropper?: boolean;
}

export function ColorPicker({ label, value, onChange, showEyedropper = true }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleEyedropper = async () => {
    if ('EyeDropper' in window) {
      try {
        // @ts-ignore - EyeDropper is not in TypeScript types yet
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        onChange(result.sRGBHex);
      } catch (err) {
        console.log('Eyedropper cancelled or failed');
      }
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-12 h-8 p-0 border-2"
              style={{ backgroundColor: value }}
            >
              <span className="sr-only">Open color picker</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-3" align="start">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs">Color Picker</Label>
                <SketchPicker
                  color={value}
                  onChange={(color) => onChange(color.hex)}
                  disableAlpha
                  width="200px"
                />
              </div>
            </div>
          </PopoverContent>
        </Popover>
        
        {showEyedropper && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEyedropper}
            className="h-8 w-8 p-0"
            title="Pick color from screen"
          >
            <Pipette className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}