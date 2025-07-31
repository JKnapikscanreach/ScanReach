-- Create microsite_content table for structured content
CREATE TABLE public.microsite_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL REFERENCES public.microsites(id) ON DELETE CASCADE,
  title TEXT,
  header_image_url TEXT,
  theme_config JSONB DEFAULT '{"primary": "#1a1a1a", "text": "#1a1a1a", "background": "#ffffff"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT title_length CHECK (char_length(title) <= 60),
  CONSTRAINT unique_content_per_microsite UNIQUE(microsite_id)
);

-- Create microsite_cards table for individual content cards
CREATE TABLE public.microsite_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL REFERENCES public.microsites(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  content TEXT,
  media_url TEXT,
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create microsite_buttons table for action buttons
CREATE TABLE public.microsite_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL REFERENCES public.microsite_cards(id) ON DELETE CASCADE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL CHECK (action_type IN ('tel', 'mailto', 'url')),
  action_value TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT label_length CHECK (char_length(label) <= 30),
  CONSTRAINT max_buttons_per_card CHECK (sort_order >= 0 AND sort_order <= 2)
);

-- Enable RLS on all new tables
ALTER TABLE public.microsite_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsite_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.microsite_buttons ENABLE ROW LEVEL SECURITY;

-- RLS policies for microsite_content
CREATE POLICY "Users can manage their microsite content" 
ON public.microsite_content 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.microsites 
    WHERE microsites.id = microsite_content.microsite_id
  )
);

-- RLS policies for microsite_cards
CREATE POLICY "Users can manage their microsite cards" 
ON public.microsite_cards 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.microsites 
    WHERE microsites.id = microsite_cards.microsite_id
  )
);

-- RLS policies for microsite_buttons
CREATE POLICY "Users can manage their microsite buttons" 
ON public.microsite_buttons 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.microsite_cards 
    JOIN public.microsites ON microsites.id = microsite_cards.microsite_id
    WHERE microsite_cards.id = microsite_buttons.card_id
  )
);

-- Create indexes for performance
CREATE INDEX idx_microsite_content_microsite_id ON public.microsite_content(microsite_id);
CREATE INDEX idx_microsite_cards_microsite_id ON public.microsite_cards(microsite_id);
CREATE INDEX idx_microsite_cards_sort_order ON public.microsite_cards(microsite_id, sort_order);
CREATE INDEX idx_microsite_buttons_card_id ON public.microsite_buttons(card_id);
CREATE INDEX idx_microsite_buttons_sort_order ON public.microsite_buttons(card_id, sort_order);

-- Create update triggers for updated_at columns
CREATE TRIGGER update_microsite_content_updated_at
  BEFORE UPDATE ON public.microsite_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_microsite_cards_updated_at
  BEFORE UPDATE ON public.microsite_cards
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_microsite_buttons_updated_at
  BEFORE UPDATE ON public.microsite_buttons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for microsite assets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('microsite-assets', 'microsite-assets', true);

-- Storage policies for microsite assets
CREATE POLICY "Anyone can view microsite assets" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'microsite-assets');

CREATE POLICY "Users can upload microsite assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'microsite-assets');

CREATE POLICY "Users can update their microsite assets" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'microsite-assets');

CREATE POLICY "Users can delete their microsite assets" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'microsite-assets');