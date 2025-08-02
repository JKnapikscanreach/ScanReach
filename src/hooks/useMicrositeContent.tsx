import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSmartAutoSave } from './useSmartAutoSave';

export interface MicrositeContent {
  id: string;
  microsite_id: string;
  title: string | null;
  header_image_url: string | null;
  theme_config: {
    primary: string;
    text: string;
    background: string;
  };
  created_at: string;
  updated_at: string;
}

export interface MicrositeCard {
  id: string;
  microsite_id: string;
  sort_order: number;
  content: string | null;
  media_url: string | null;
  is_collapsed: boolean;
  title: string | null;
  created_at: string;
  updated_at: string;
  buttons: MicrositeButton[];
}

export interface MicrositeButton {
  id: string;
  card_id: string;
  sort_order: number;
  label: string;
  action_type: 'tel' | 'mailto' | 'url';
  action_value: string;
  created_at: string;
  updated_at: string;
}

// Helper function to parse theme config
const parseThemeConfig = (themeConfig: any): { primary: string; text: string; background: string } => {
  if (typeof themeConfig === 'object' && themeConfig !== null) {
    return {
      primary: themeConfig.primary || '#1a1a1a',
      text: themeConfig.text || '#1a1a1a', 
      background: themeConfig.background || '#ffffff'
    };
  }
  return {
    primary: '#1a1a1a',
    text: '#1a1a1a',
    background: '#ffffff'
  };
};

export const useMicrositeContent = (micrositeId: string) => {
  const [content, setContent] = useState<MicrositeContent | null>(null);
  const [cards, setCards] = useState<MicrositeCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Smart auto-save for content
  const { queueUpdate: queueContentUpdate, isSaving: isContentSaving } = useSmartAutoSave<MicrositeContent>(
    async (updates) => {
      if (!content) return;
      const { data, error } = await supabase
        .from('microsite_content')
        .update(updates)
        .eq('id', content.id)
        .select()
        .single();
      
      if (error) throw error;
      setContent({
        ...data,
        theme_config: parseThemeConfig(data.theme_config)
      });
    }
  );

  const fetchContent = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch microsite content
      const { data: contentData, error: contentError } = await supabase
        .from('microsite_content')
        .select('*')
        .eq('microsite_id', micrositeId)
        .single();

      if (contentError && contentError.code !== 'PGRST116') {
        throw contentError;
      }

      // Fetch cards with buttons separately
      const { data: cardsData, error: cardsError } = await supabase
        .from('microsite_cards')
        .select('*')
        .eq('microsite_id', micrositeId)
        .order('sort_order');

      if (cardsError) throw cardsError;

      // Fetch buttons separately
      const { data: buttonsData, error: buttonsError } = await supabase
        .from('microsite_buttons')
        .select('*')
        .in('card_id', (cardsData || []).map(card => card.id))
        .order('sort_order');

      if (buttonsError) throw buttonsError;

      // Create default content if none exists
      if (!contentData) {
        const { data: newContent, error: createError } = await supabase
          .from('microsite_content')
          .insert({
            microsite_id: micrositeId,
            title: null,
            header_image_url: null,
            theme_config: {
              primary: '#1a1a1a',
              text: '#1a1a1a',
              background: '#ffffff'
            }
          })
          .select()
          .single();

        if (createError) throw createError;
        setContent({
          ...newContent,
          theme_config: parseThemeConfig(newContent.theme_config)
        });
      } else {
        setContent({
          ...contentData,
          theme_config: parseThemeConfig(contentData.theme_config)
        });
      }

      // Process cards data with buttons
      const processedCards = (cardsData || []).map(card => {
        const cardButtons = (buttonsData || []).filter(btn => btn.card_id === card.id);
        return {
          ...card,
          title: (card as any).title || null,
          buttons: cardButtons.map(btn => ({
            ...btn,
            action_type: btn.action_type as 'tel' | 'mailto' | 'url'
          })).sort((a, b) => a.sort_order - b.sort_order)
        };
      });

      setCards(processedCards);
    } catch (error) {
      console.error('Error fetching microsite content:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const updateContent = async (updates: Partial<MicrositeContent>) => {
    if (!content) return;

    // Update local state immediately for responsive UI
    setContent(prev => prev ? { ...prev, ...updates } : null);
    
    // Queue the update for smart auto-save
    Object.entries(updates).forEach(([key, value]) => {
      queueContentUpdate(key, value);
    });
  };

  const addCard = async () => {
    try {
      const maxSortOrder = Math.max(...cards.map(c => c.sort_order), -1);
        const { data, error } = await supabase
          .from('microsite_cards')
          .insert({
            microsite_id: micrositeId,
            sort_order: maxSortOrder + 1,
            content: '',
            title: null,
            is_collapsed: false
          })
          .select()
          .single();

      if (error) throw error;
      setCards(prev => [...prev, { ...data, title: (data as any).title || null, buttons: [] }]);
      return data;
    } catch (error) {
      console.error('Error adding card:', error);
      setError(error instanceof Error ? error.message : 'Failed to add card');
    }
  };

  const updateCard = async (cardId: string, updates: Partial<MicrositeCard>) => {
    // Update local state immediately for responsive UI
    setCards(prev => prev.map(card => 
      card.id === cardId ? { ...card, ...updates } : card
    ));

    // Save to database with debounced batching
    try {
      const { data, error } = await supabase
        .from('microsite_cards')
        .update(updates)
        .eq('id', cardId)
        .select()
        .single();

      if (error) throw error;
    } catch (error) {
      console.error('Error updating card:', error);
      setError(error instanceof Error ? error.message : 'Failed to save card');
    }
  };

  const deleteCard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('microsite_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;
      setCards(prev => prev.filter(card => card.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete card');
    }
  };

  const reorderCards = async (reorderedCards: MicrositeCard[]) => {
    try {
      const updates = reorderedCards.map((card, index) => ({
        id: card.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('microsite_cards')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }

      setCards(reorderedCards);
    } catch (error) {
      console.error('Error reordering cards:', error);
      setError(error instanceof Error ? error.message : 'Failed to reorder cards');
    }
  };

  const addButton = async (cardId: string, button: Omit<MicrositeButton, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('microsite_buttons')
        .insert(button)
        .select()
        .single();

      if (error) throw error;

      setCards(prev => prev.map(card => 
        card.id === cardId 
          ? { ...card, buttons: [...card.buttons, { ...data, action_type: data.action_type as 'tel' | 'mailto' | 'url' }].sort((a, b) => a.sort_order - b.sort_order) }
          : card
      ));
    } catch (error) {
      console.error('Error adding button:', error);
      setError(error instanceof Error ? error.message : 'Failed to add button');
    }
  };

  const updateButton = async (buttonId: string, updates: Partial<MicrositeButton>) => {
    try {
      const { data, error } = await supabase
        .from('microsite_buttons')
        .update(updates)
        .eq('id', buttonId)
        .select()
        .single();

      if (error) throw error;

      setCards(prev => prev.map(card => ({
        ...card,
        buttons: card.buttons.map(btn => btn.id === buttonId ? { ...btn, ...data, action_type: data.action_type as 'tel' | 'mailto' | 'url' } : btn)
      })));
    } catch (error) {
      console.error('Error updating button:', error);
      setError(error instanceof Error ? error.message : 'Failed to update button');
    }
  };

  const deleteButton = async (buttonId: string) => {
    try {
      const { error } = await supabase
        .from('microsite_buttons')
        .delete()
        .eq('id', buttonId);

      if (error) throw error;

      setCards(prev => prev.map(card => ({
        ...card,
        buttons: card.buttons.filter(btn => btn.id !== buttonId)
      })));
    } catch (error) {
      console.error('Error deleting button:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete button');
    }
  };

  const reorderButtons = async (cardId: string, reorderedButtons: MicrositeButton[]) => {
    try {
      // Update local state immediately
      setCards(prev => prev.map(card => 
        card.id === cardId ? { ...card, buttons: reorderedButtons } : card
      ));

      // Update sort order in database
      const updates = reorderedButtons.map((button, index) => ({
        id: button.id,
        sort_order: index
      }));

      for (const update of updates) {
        await supabase
          .from('microsite_buttons')
          .update({ sort_order: update.sort_order })
          .eq('id', update.id);
      }
    } catch (error) {
      console.error('Error reordering buttons:', error);
      setError(error instanceof Error ? error.message : 'Failed to reorder buttons');
    }
  };

  useEffect(() => {
    if (micrositeId) {
      fetchContent();
    }
  }, [micrositeId]);

  return {
    content,
    cards,
    loading,
    error,
    autoSaving: isContentSaving,
    refetch: fetchContent,
    updateContent,
    addCard,
    updateCard,
    deleteCard,
    reorderCards,
    addButton,
    updateButton,
    deleteButton,
    reorderButtons,
  };
};