import React, { useCallback, useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Plus, GripVertical, Save, Eye, ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useMicrositeContent, MicrositeCard } from '@/hooks/useMicrositeContent';
import { MicrositeCardEditor } from './MicrositeCardEditor';
import { MicrositePreview } from './MicrositePreview';
import { ThemeCustomizer } from './ThemeCustomizer';
import { HeaderImageUpload } from './HeaderImageUpload';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

interface MicrositeEditorProps {
  micrositeId: string;
  onSave?: () => void;
  onPublish?: () => void;
}

export const MicrositeEditor: React.FC<MicrositeEditorProps> = ({
  micrositeId,
  onSave,
  onPublish,
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
    const newCard = await addCard();
    if (newCard) {
      setExpandedCards(prev => new Set([...prev, newCard.id]));
    }
  }, [addCard]);

  const handleDeleteCard = useCallback(async (cardId: string) => {
    await deleteCard(cardId);
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.delete(cardId);
      return next;
    });
  }, [deleteCard]);

  const toggleCardExpanded = useCallback((cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

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
      <div className="flex-1 overflow-auto border-r">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Edit Microsite</h1>
              <p className="text-muted-foreground">
                Create and customize your microsite content
              </p>
            </div>
            <div className="flex items-center gap-2">
              {autoSaving && (
                <Badge variant="secondary" className="text-xs">
                  Auto-saving...
                </Badge>
              )}
              <Button variant="outline" onClick={handleSave}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button onClick={handlePublish}>
                <Eye className="h-4 w-4 mr-2" />
                Publish
              </Button>
            </div>
          </div>

          {/* Title Input */}
          <Card>
            <CardHeader>
              <CardTitle>Microsite Title</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>

          {/* Header Image Upload */}
          {content && (
            <HeaderImageUpload
              micrositeId={micrositeId}
              currentImageUrl={content.header_image_url}
              onImageUpdate={(url) => updateContent({ header_image_url: url })}
            />
          )}

          {/* Theme Customizer */}
          {content && (
            <ThemeCustomizer
              themeConfig={content.theme_config}
              onThemeUpdate={(theme) => updateContent({ theme_config: theme })}
            />
          )}

          <Separator />

          {/* Content Cards */}
          <div className="space-y-4">
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
                  <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
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
                            <div className="flex items-center justify-between p-4 border-b">
                              <div className="flex items-center gap-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-muted-foreground hover:text-foreground cursor-grab"
                                >
                                  <GripVertical className="h-4 w-4" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => toggleCardExpanded(card.id)}
                                >
                                  {expandedCards.has(card.id) ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}
                                </Button>
                                <span className="font-medium">
                                  Card {index + 1}
                                </span>
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

                            {/* Card Content */}
                            {expandedCards.has(card.id) && (
                              <div className="p-4">
                                <MicrositeCardEditor
                                  card={card}
                                  onUpdate={(updates) => updateCard(card.id, updates)}
                                  onAddButton={(button) => addButton(card.id, button)}
                                  onUpdateButton={updateButton}
                                  onDeleteButton={deleteButton}
                                />
                              </div>
                            )}
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
              <div className="text-center py-12 text-muted-foreground">
                <p className="mb-4">No content cards yet</p>
                <Button onClick={handleAddCard} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add your first card
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Panel */}
      <div className="w-2/5 bg-muted/30">
        <div className="p-4 border-b bg-background">
          <h3 className="font-semibold">Live Preview</h3>
          <p className="text-sm text-muted-foreground">
            See how your microsite will look to visitors
          </p>
        </div>
        <div className="p-4">
          {content && (
            <MicrositePreview
              content={content}
              cards={cards}
              title={title}
            />
          )}
        </div>
      </div>
    </div>
  );
};