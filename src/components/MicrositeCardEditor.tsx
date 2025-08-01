import React, { useState, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Phone, Mail, ExternalLink, GripVertical } from 'lucide-react';
import { MicrositeCard, MicrositeButton } from '@/hooks/useMicrositeContent';
import { useDebounce } from '@/hooks/useDebounce';
import { useEffect } from 'react';

interface MicrositeCardEditorProps {
  card: MicrositeCard;
  onUpdate: (updates: Partial<MicrositeCard>) => void;
  onAddButton: (button: Omit<MicrositeButton, 'id' | 'created_at' | 'updated_at'>) => void;
  onUpdateButton: (buttonId: string, updates: Partial<MicrositeButton>) => void;
  onDeleteButton: (buttonId: string) => void;
  onReorderButtons: (reorderedButtons: MicrositeButton[]) => void;
}

export const MicrositeCardEditor: React.FC<MicrositeCardEditorProps> = ({
  card,
  onUpdate,
  onAddButton,
  onUpdateButton,
  onDeleteButton,
  onReorderButtons,
}) => {
  const [content, setContent] = useState(card.content || '');
  const debouncedContent = useDebounce(content, 600);

  useEffect(() => {
    if (debouncedContent !== card.content) {
      onUpdate({ content: debouncedContent });
    }
  }, [debouncedContent, card.content, onUpdate]);

  const handleContentChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
  }, []);

  const handleButtonDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(card.buttons);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedButtons = items.map((button, index) => ({
      ...button,
      sort_order: index,
    }));

    onReorderButtons(reorderedButtons);
  }, [card.buttons, onReorderButtons]);

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
          **bold**, *italic*, <u>underline</u> supported
        </div>
      </div>

      <Separator />

      {/* Buttons Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Buttons ({card.buttons.length}/3)</Label>
          {card.buttons.length < 3 && (
            <Button onClick={handleAddButton} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add Button
            </Button>
          )}
        </div>

        <DragDropContext onDragEnd={handleButtonDragEnd}>
          <Droppable droppableId="buttons">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                {card.buttons.map((button, index) => (
                  <Draggable key={button.id} draggableId={button.id} index={index}>
                    {(provided, snapshot) => (
                      <Card 
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        key={button.id} 
                        className={`p-3 ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                      >
                        <div className="space-y-2">
                          {/* Enhanced Button Layout */}
                          <div className="flex items-center gap-2">
                            {/* Drag Handle */}
                            <div 
                              {...provided.dragHandleProps}
                              className="text-muted-foreground hover:text-foreground cursor-grab"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            
                            {/* Button Title - Wider */}
                            <Input
                              placeholder={`Button ${index + 1} label...`}
                              value={button.label}
                              onChange={(e) => handleButtonUpdate(button.id, 'label', e.target.value)}
                              className="flex-1 font-medium"
                              maxLength={30}
                            />
                            
                            {/* Action Type - Narrower (33% width) */}
                            <Select
                              value={button.action_type}
                              onValueChange={(value) => {
                                handleButtonUpdate(button.id, 'action_type', value);
                                handleButtonUpdate(button.id, 'action_value', '');
                              }}
                            >
                              <SelectTrigger className="w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="url">URL</SelectItem>
                                <SelectItem value="tel">Phone</SelectItem>
                                <SelectItem value="mailto">Email</SelectItem>
                              </SelectContent>
                            </Select>
                            
                            {/* Destination - Wider */}
                            <Input
                              placeholder={getActionValuePlaceholder(button.action_type)}
                              value={button.action_value}
                              onChange={(e) => handleButtonUpdate(button.id, 'action_value', e.target.value)}
                              className={`flex-1 ${!validateActionValue(button.action_type, button.action_value) ? 'border-destructive' : ''}`}
                            />
                            
                            {/* Trash Icon */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => onDeleteButton(button.id)}
                              className="text-destructive hover:text-destructive h-8 w-8 p-0"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          {!validateActionValue(button.action_type, button.action_value) && button.action_value && (
                            <p className="text-xs text-destructive ml-10">
                              Please enter a valid {button.action_type === 'tel' ? 'phone number' : 
                                                  button.action_type === 'mailto' ? 'email address' : 'URL'}
                            </p>
                          )}
                        </div>
                      </Card>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {card.buttons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <p className="mb-2">No buttons yet</p>
            <Button onClick={handleAddButton} size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Add your first button
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};