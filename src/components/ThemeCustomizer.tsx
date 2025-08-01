import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ColorPicker } from '@/components/ui/color-picker';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [selectedPreset, setSelectedPreset] = useState<string>('user-defined');

  const handleColorChange = (colorType: keyof ThemeConfig, color: string) => {
    const newTheme = { ...themeConfig, [colorType]: color };
    onThemeUpdate(newTheme);
    setSelectedPreset('user-defined');
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


  const presetThemes = [
    {
      id: 'classic',
      name: 'Classic',
      colors: { primary: '#1a1a1a', text: '#1a1a1a', background: '#ffffff' }
    },
    {
      id: 'ocean',
      name: 'Ocean',
      colors: { primary: '#0369a1', text: '#1e293b', background: '#f8fafc' }
    },
    {
      id: 'forest',
      name: 'Forest',
      colors: { primary: '#166534', text: '#1f2937', background: '#f9fafb' }
    },
    {
      id: 'sunset',
      name: 'Sunset',
      colors: { primary: '#dc2626', text: '#1f2937', background: '#fffbeb' }
    },
    {
      id: 'corporate',
      name: 'Corporate Blue',
      colors: { primary: '#1e40af', text: '#1f2937', background: '#f9fafb' }
    },
    {
      id: 'earth',
      name: 'Warm Earth',
      colors: { primary: '#a16207', text: '#1c1917', background: '#fefbf3' }
    },
    {
      id: 'mint',
      name: 'Cool Mint',
      colors: { primary: '#059669', text: '#1f2937', background: '#f0fdf4' }
    },
    {
      id: 'professional',
      name: 'Professional Gray',
      colors: { primary: '#374151', text: '#111827', background: '#f9fafb' }
    },
  ];

  const handlePresetChange = (presetId: string) => {
    if (presetId === 'user-defined') return;
    
    const preset = presetThemes.find(p => p.id === presetId);
    if (preset) {
      onThemeUpdate(preset.colors);
      setSelectedPreset(presetId);
    }
  };

  // Check if current colors match any preset
  useEffect(() => {
    const matchingPreset = presetThemes.find(preset => 
      preset.colors.primary === themeConfig.primary &&
      preset.colors.text === themeConfig.text &&
      preset.colors.background === themeConfig.background
    );
    
    setSelectedPreset(matchingPreset?.id || 'user-defined');
  }, [themeConfig]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Colors
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-4">
          {/* Preset Dropdown */}
          <div className="space-y-2">
            <Label>Preset Theme</Label>
            <Select value={selectedPreset} onValueChange={handlePresetChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select preset" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user-defined">User Defined</SelectItem>
                {presetThemes.map((preset) => (
                  <SelectItem key={preset.id} value={preset.id}>
                    <div className="flex items-center gap-2">
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
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Theme Colors in Single Row */}
          <div className="grid grid-cols-3 gap-3">
            <ColorPicker 
              label="Button Color" 
              value={themeConfig.primary}
              onChange={(color) => handleColorChange('primary', color)}
            />
            <ColorPicker 
              label="Text Color" 
              value={themeConfig.text}
              onChange={(color) => handleColorChange('text', color)}
            />
            <ColorPicker 
              label="Background Color" 
              value={themeConfig.background}
              onChange={(color) => handleColorChange('background', color)}
            />
          </div>
        </div>

        {/* Theme Preview */}
        <div className="space-y-2">
          <Label>Preview</Label>
          <div 
            className="p-3 rounded-lg border"
            style={{ 
              backgroundColor: themeConfig.background,
              color: themeConfig.text 
            }}
          >
            <p className="text-sm mb-2">Sample text content</p>
            <Button
              variant="ghost"
              size="sm"
              className="hover:opacity-90"
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