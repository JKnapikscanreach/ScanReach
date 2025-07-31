import React, { useState } from 'react';
import { SketchPicker, ColorResult } from 'react-color';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Palette } from 'lucide-react';

interface ThemeConfig {
  primary: string;
  text: string;
  background: string;
}

interface ThemeCustomizerProps {
  themeConfig: ThemeConfig;
  onThemeUpdate: (theme: ThemeConfig) => void;
}

export const ThemeCustomizer: React.FC<ThemeCustomizerProps> = ({
  themeConfig,
  onThemeUpdate,
}) => {
  const [activeColorPicker, setActiveColorPicker] = useState<string | null>(null);

  const handleColorChange = (colorType: keyof ThemeConfig, color: ColorResult) => {
    onThemeUpdate({
      ...themeConfig,
      [colorType]: color.hex,
    });
  };

  const isDarkColor = (color: string): boolean => {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance < 0.5;
  };

  const isLightColor = (color: string): boolean => {
    return !isDarkColor(color);
  };

  const getColorValidation = (colorType: keyof ThemeConfig, color: string) => {
    switch (colorType) {
      case 'primary':
      case 'text':
        return isDarkColor(color) ? 'valid' : 'invalid';
      case 'background':
        return isLightColor(color) ? 'valid' : 'invalid';
      default:
        return 'valid';
    }
  };

  const getColorRequirement = (colorType: keyof ThemeConfig) => {
    switch (colorType) {
      case 'primary':
        return 'Choose a dark color for buttons';
      case 'text':
        return 'Choose a dark color for readable text';
      case 'background':
        return 'Choose a light color for background';
      default:
        return '';
    }
  };

  const ColorPicker: React.FC<{
    colorType: keyof ThemeConfig;
    label: string;
    color: string;
  }> = ({ colorType, label, color }) => {
    const validation = getColorValidation(colorType, color);
    const requirement = getColorRequirement(colorType);
    
    return (
      <div className="space-y-2">
        <Label>{label}</Label>
        <Popover 
          open={activeColorPicker === colorType}
          onOpenChange={(open) => setActiveColorPicker(open ? colorType : null)}
        >
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-start gap-2 ${
                validation === 'invalid' ? 'border-destructive' : ''
              }`}
            >
              <div
                className="w-6 h-6 rounded-md border"
                style={{ backgroundColor: color }}
              />
              <span>{color}</span>
              <Palette className="h-4 w-4 ml-auto" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <SketchPicker
              color={color}
              onChange={(color) => handleColorChange(colorType, color)}
              disableAlpha
            />
          </PopoverContent>
        </Popover>
        <div className="text-xs text-muted-foreground">
          {requirement}
        </div>
        {validation === 'invalid' && (
          <div className="text-xs text-destructive">
            {colorType === 'background' 
              ? 'Background color should be light for readability'
              : 'Color should be dark for better contrast and readability'
            }
          </div>
        )}
      </div>
    );
  };

  const presetThemes = [
    {
      name: 'Classic',
      colors: { primary: '#1a1a1a', text: '#1a1a1a', background: '#ffffff' }
    },
    {
      name: 'Ocean',
      colors: { primary: '#0369a1', text: '#1e293b', background: '#f8fafc' }
    },
    {
      name: 'Forest',
      colors: { primary: '#166534', text: '#1f2937', background: '#f9fafb' }
    },
    {
      name: 'Sunset',
      colors: { primary: '#dc2626', text: '#1f2937', background: '#fffbeb' }
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Colors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Color Pickers */}
        <div className="grid gap-4">
          <ColorPicker
            colorType="primary"
            label="Primary Color (Buttons)"
            color={themeConfig.primary}
          />
          <ColorPicker
            colorType="text"
            label="Text Color"
            color={themeConfig.text}
          />
          <ColorPicker
            colorType="background"
            label="Background Color"
            color={themeConfig.background}
          />
        </div>

        {/* Preset Themes */}
        <div className="space-y-3">
          <Label>Quick Presets</Label>
          <div className="grid grid-cols-2 gap-2">
            {presetThemes.map((preset) => (
              <Button
                key={preset.name}
                variant="outline"
                size="sm"
                onClick={() => onThemeUpdate(preset.colors)}
                className="justify-start gap-2"
              >
                <div className="flex gap-1">
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: preset.colors.primary }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: preset.colors.text }}
                  />
                  <div
                    className="w-3 h-3 rounded-full border"
                    style={{ backgroundColor: preset.colors.background }}
                  />
                </div>
                {preset.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Theme Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: themeConfig.background,
              color: themeConfig.text 
            }}
          >
            <p className="text-sm mb-2">Sample text content</p>
            <Button
              size="sm"
              style={{
                backgroundColor: themeConfig.primary,
                borderColor: themeConfig.primary,
                color: '#ffffff',
              }}
            >
              Sample Button
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};