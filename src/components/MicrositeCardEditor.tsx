import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Phone, Mail, ExternalLink } from 'lucide-react';
import { MicrositeCard, MicrositeButton } from '@/hooks/useMicrositeContent';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

interface MicrositeCardEditorProps {
  card: MicrositeCard;
  onUpdate: (updates: Partial<MicrositeCard>) => void;
  onAddButton: (button: Omit<MicrositeButton, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateButton: (buttonId: string, updates: Partial<MicrositeButton>) => void;
  onDeleteButton: (buttonId: string) => void;
}

export const MicrositeCardEditor: React.FC<MicrositeCardEditorProps> = ({
  card,
  onUpdate,
  onAddButton,
  onUpdateButton,
  onDeleteButton,
}) => {
  const [content, setContent] = useState(card.content || '');
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    if (debouncedContent !== card.content) {
      onUpdate({ content: debouncedContent });
    }
  }, [debouncedContent, card.content, onUpdate]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleAddButton = useCallback(() => {
    if (card.buttons.length >= 3) return;

    const sortOrder = Math.max(...card.buttons.map(b => b.sort_order), -1) + 1;
    onAddButton({
      card_id: card.id,
      sort_order: sortOrder,
      label: `Button ${sortOrder + 1}`,
      action_type: 'url',
      action_value: 'https://example.com',
    });
  }, [card.buttons, card.id, onAddButton]);

  const handleButtonUpdate = useCallback((buttonId: string, field: keyof MicrositeButton, value: string) => {
    onUpdateButton(buttonId, { [field]: value });
  }, [onUpdateButton]);

  const getButtonIcon = (actionType: string) => {
    switch (actionType) {
      case 'tel':
        return <Phone className="h-4 w-4" />;
      case 'mailto':
        return <Mail className="h-4 w-4" />;
      case 'url':
        return <ExternalLink className="h-4 w-4" />;
      default:
        return <ExternalLink className="h-4 w-4" />;
    }
  };

  const getActionValuePlaceholder = (actionType: string) => {
    switch (actionType) {
      case 'tel':
        return '+1234567890';
      case 'mailto':
        return 'email@example.com';
      case 'url':
        return 'https://example.com';
      default:
        return '';
    }
  };

  const validateActionValue = (actionType: string, value: string): boolean => {
    switch (actionType) {
      case 'tel':
        return /^[\+]?[0-9\s\-\(\)]+$/.test(value);
      case 'mailto':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      case 'url':
        return /^https?:\/\/.+/.test(value);
      default:
        return true;
    }
  };

  return (
    <div className="space-y-6">
      {/* Content Editor */}
      <div className="space-y-2">
        <Label htmlFor={`content-${card.id}`}>Card Content</Label>
        <Textarea
          id={`content-${card.id}`}
          value={content}
          onChange={handleContentChange}
          placeholder="Write your card content here..."
          className="min-h-32 resize-none"
        />
        <div className="text-xs text-muted-foreground">
          Simple text formatting will be applied automatically
        </div>
      </div>

      <Separator />

      {/* Buttons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Action Buttons ({card.buttons.length}/3)</Label>
          {card.buttons.length < 3 && (
            <Button onClick={handleAddButton} size="sm" variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Add Button
            </Button>
          )}
        </div>

        {card.buttons.map((button) => (
          <Card key={button.id} className="p-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getButtonIcon(button.action_type)}
                  <span className="font-medium">Button {button.sort_order + 1}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteButton(button.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`button-label-${button.id}`}>Label (max 30 chars)</Label>
                  <Input
                    id={`button-label-${button.id}`}
                    value={button.label}
                    onChange={(e) => handleButtonUpdate(button.id, 'label', e.target.value.slice(0, 30))}
                    placeholder="Button label"
                    maxLength={30}
                  />
                  <div className="text-xs text-muted-foreground">
                    {button.label.length}/30 characters
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`button-type-${button.id}`}>Action Type</Label>
                  <Select
                    value={button.action_type}
                    onValueChange={(value) => {
                      handleButtonUpdate(button.id, 'action_type', value);
                      // Reset action value when type changes
                      handleButtonUpdate(button.id, 'action_value', '');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="url">
                        <div className="flex items-center gap-2">
                          <ExternalLink className="h-4 w-4" />
                          Website URL
                        </div>
                      </SelectItem>
                      <SelectItem value="tel">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Phone Number
                        </div>
                      </SelectItem>
                      <SelectItem value="mailto">
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email Address
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`button-value-${button.id}`}>
                  {button.action_type === 'tel' ? 'Phone Number' : 
                   button.action_type === 'mailto' ? 'Email Address' : 'Website URL'}
                </Label>
                <Input
                  id={`button-value-${button.id}`}
                  value={button.action_value}
                  onChange={(e) => handleButtonUpdate(button.id, 'action_value', e.target.value)}
                  placeholder={getActionValuePlaceholder(button.action_type)}
                  className={
                    button.action_value && !validateActionValue(button.action_type, button.action_value)
                      ? 'border-destructive'
                      : ''
                  }
                />
                {button.action_value && !validateActionValue(button.action_type, button.action_value) && (
                  <div className="text-xs text-destructive">
                    Please enter a valid {button.action_type === 'tel' ? 'phone number' : 
                                         button.action_type === 'mailto' ? 'email address' : 'URL'}
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}

        {card.buttons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="mb-2">No action buttons yet</p>
            <Button onClick={handleAddButton} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add your first button
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};