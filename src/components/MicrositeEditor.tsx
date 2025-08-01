import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useMicrositeContent, MicrositeCard } from '@/hooks/useMicrositeContent';
import { MicrositeCardEditor } from './MicrositeCardEditor';
import { MicrositePreview } from './MicrositePreview';
import { ThemeCustomizer } from './ThemeCustomizer';
import { HeaderImageUpload } from './HeaderImageUpload';
import { MicrositeQRSection } from './MicrositeQRSection';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface MicrositeEditorProps {
  micrositeId: string;
  onSave?: () => void;
  onPublish?: () => void;
  onAutoSavingChange?: (autoSaving: boolean) => void;
}

export const MicrositeEditor: React.FC<MicrositeEditorProps> = ({
  micrositeId,
  onSave,
  onPublish,
  onAutoSavingChange,
}) => {
  const {
    content,
    cards,
    loading,
    error,
    autoSaving,
    updateContent,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    addButton,
    updateButton,
    deleteButton,
    reorderButtons,
  } = useMicrositeContent(micrositeId);
  
  const { toast } = useToast();
  const [title, setTitle] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  
  // Debounced title update
  const debouncedTitle = useDebounce(title, 500);
  
  useEffect(() => {
    if (content?.title) {
      setTitle(content.title);
    }
  }, [content?.title]);
  
  useEffect(() => {
    if (debouncedTitle !== content?.title && content) {
      updateContent({ title: debouncedTitle });
    }
  }, [debouncedTitle, content?.title, updateContent]);

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.slice(0, 60); // Max 60 chars
    setTitle(value);
  }, []);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;

    const items = Array.from(cards);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const reorderedCards = items.map((card, index) => ({
      ...card,
      sort_order: index,
    }));

    reorderCards(reorderedCards);
  }, [cards, reorderCards]);

  const handleAddCard = useCallback(async () => {
    await addCard();
  }, [addCard]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId);
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, [deleteCard]);

  // Always expand all cards by default
  useEffect(() => {
    setExpandedCards(new Set(cards.map(card => card.id)));
  }, [cards]);

  // Pass auto-saving state to parent
  useEffect(() => {
    onAutoSavingChange?.(autoSaving);
  }, [autoSaving, onAutoSavingChange]);

  const handleSave = useCallback(() => {
    toast({
      title: "Saved",
      description: "Your microsite has been saved.",
    });
    onSave?.();
  }, [onSave, toast]);

  const handlePublish = useCallback(() => {
    if (!content?.title) {
      toast({
        title: "Cannot publish",
        description: "Please add a title to your microsite before publishing.",
        variant: "destructive",
      });
      return;
    }
    onPublish?.();
  }, [content?.title, onPublish, toast]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading editor...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-destructive">Error: {error}</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Editor Panel */}
      <div className="flex-1 border-r flex flex-col">
        <div className="p-4 space-y-4 flex-1 min-h-0 overflow-y-auto">

          {/* Combined Title and Header Image */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Microsite Title & Header Image</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Title Input */}
              <div className="space-y-2">
                <Label htmlFor="title">Title (max 60 characters)</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter your microsite title..."
                  maxLength={60}
                />
                <div className="text-xs text-muted-foreground text-right">
                  {title.length}/60 characters
                </div>
              </div>

              {/* Header Image Upload - Embedded */}
              {content && (
                <HeaderImageUpload
                  micrositeId={micrositeId}
                  currentImageUrl={content.header_image_url}
                  onImageUpdate={(url) => updateContent({ header_image_url: url })}
                />
              )}
            </CardContent>
          </Card>

          {/* Content Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Content Cards</h3>
              <Button onClick={handleAddCard} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Card
              </Button>
            </div>

            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="cards">
                {(provided) => (
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                    {cards.map((card, index) => (
                      <Draggable key={card.id} draggableId={card.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`bg-card border rounded-lg ${
                              snapshot.isDragging ? 'shadow-lg' : ''
                            }`}
                          >
                            {/* Card Header */}
                            <div className="flex items-center justify-between p-3 border-b">
                              <div className="flex items-center gap-2 flex-1">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground hover:text-foreground cursor-grab"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <Input
                                  placeholder={`Card ${index + 1} title...`}
                                  value={card.title || ''}
                                  onChange={(e) => updateCard(card.id, { title: e.target.value })}
                                  className="border-none px-2 py-1 focus-visible:ring-0 font-medium"
                                />
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteCard(card.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Card Content - Always Expanded */}
                            <div className="p-3">
                                <MicrositeCardEditor
                                  card={card}
                                  onUpdate={(updates) => updateCard(card.id, updates)}
                                  onAddButton={(button) => addButton(card.id, button)}
                                  onUpdateButton={updateButton}
                                  onDeleteButton={deleteButton}
                                  onReorderButtons={(buttons) => reorderButtons(card.id, buttons)}
                                />
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {cards.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="mb-3">No content cards yet</p>
                <Button onClick={handleAddCard} variant="outline" size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first card
                </Button>
              </div>
            )}
          </div>

          {/* Theme Customizer */}
          {content && (
            <ThemeCustomizer
              themeConfig={content.theme_config}
              onThemeUpdate={(theme) => updateContent({ theme_config: theme })}
            />
          )}
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-2/5 bg-muted/30">
        <div className="p-4 space-y-4 h-full overflow-y-auto">
          {/* QR Code Section */}
          <MicrositeQRSection micrositeId={micrositeId} />
          
          {/* Live Preview */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle>Live Microsite Preview</CardTitle>
              <p className="text-sm text-muted-foreground">
                See how your microsite will look to visitors
              </p>
            </CardHeader>
            <CardContent>
              {content && (
                <MicrositePreview
                  content={content}
                  cards={cards}
                  title={title}
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};