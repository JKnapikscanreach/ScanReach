import { notFound } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';
import { PublicMicrositeView } from '@/components/PublicMicrositeView';
import { MicrositeContent, MicrositeCard } from '@/hooks/useMicrositeContent';
import { MicrositeTracker } from '@/components/MicrositeTracker';

interface MicrositeData {
  id: string;
  name: string;
  url: string;
  status: string;
}

interface PageProps {
  params: Promise<{ micrositeUrl: string }>;
}

// Helper function to parse theme config
const parseThemeConfig = (themeConfig: unknown): { primary: string; text: string; background: string } => {
  if (typeof themeConfig === 'object' && themeConfig !== null) {
    const config = themeConfig as Record<string, unknown>;
    return {
      primary: (config.primary as string) || '#1a1a1a',
      text: (config.text as string) || '#1a1a1a', 
      background: (config.background as string) || '#ffffff'
    };
  }
  
  return {
    primary: '#1a1a1a',
    text: '#1a1a1a',
    background: '#ffffff'
  };
};

async function getMicrositeData(micrositeUrl: string): Promise<{
  microsite: MicrositeData;
  content: MicrositeContent;
  cards: MicrositeCard[];
} | null> {
  const supabase = await createClient();
  
  // Fetch microsite by URL
  const { data: micrositeData, error: micrositeError } = await supabase
    .from('microsites')
    .select('id, name, url, status')
    .eq('url', micrositeUrl)
    .eq('status', 'published') // Only show published microsites
    .single();

  if (micrositeError) {
    return null;
  }

  // Fetch microsite content
  const { data: contentData, error: contentError } = await supabase
    .from('microsite_content')
    .select('*')
    .eq('microsite_id', micrositeData.id)
    .single();

  if (contentError) {
    console.error('Error fetching content:', contentError);
    return null;
  }

  // Fetch microsite cards with buttons
  const { data: cardsData, error: cardsError } = await supabase
    .from('microsite_cards')
    .select(`
      *,
      buttons:microsite_buttons(
        id,
        card_id,
        sort_order,
        label,
        action_type,
        action_value,
        created_at,
        updated_at
      )
    `)
    .eq('microsite_id', micrositeData.id)
    .order('sort_order', { ascending: true });

  if (cardsError) {
    console.error('Error fetching cards:', cardsError);
    return null;
  }

  // Sort buttons within each card
  const cardsWithSortedButtons = (cardsData || []).map(card => ({
    ...card,
    buttons: (card.buttons || []).sort((a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order)
  }));

  // Parse theme config
  const parsedContent = {
    ...contentData,
    theme_config: parseThemeConfig(contentData.theme_config)
  };

  return {
    microsite: micrositeData,
    content: parsedContent,
    cards: cardsWithSortedButtons
  };
}

export default async function PublicMicrosite({ params }: PageProps) {
  const { micrositeUrl } = await params;
  
  const data = await getMicrositeData(micrositeUrl);
  
  if (!data) {
    notFound();
  }

  const { microsite, content, cards } = data;

  return (
    <>
      <MicrositeTracker micrositeId={microsite.id} />
      <PublicMicrositeView 
        content={content}
        cards={cards}
        title={content?.title || microsite.name}
      />
    </>
  );
}