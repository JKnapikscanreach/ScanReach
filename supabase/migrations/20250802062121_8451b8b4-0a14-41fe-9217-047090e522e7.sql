-- First, drop all microsite-related tables in correct order (foreign keys first)
DROP TABLE IF EXISTS microsite_buttons CASCADE;
DROP TABLE IF EXISTS microsite_cards CASCADE;
DROP TABLE IF EXISTS microsite_content CASCADE;
DROP TABLE IF EXISTS microsite_scans CASCADE;
DROP TABLE IF EXISTS microsites CASCADE;

-- Recreate microsites table
CREATE TABLE public.microsites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  status TEXT NOT NULL DEFAULT 'draft'::text,
  scan_count INTEGER NOT NULL DEFAULT 0,
  last_scan_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL
);

-- Enable RLS on microsites
ALTER TABLE public.microsites ENABLE ROW LEVEL SECURITY;

-- Recreate microsite_content table
CREATE TABLE public.microsite_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL,
  title TEXT,
  header_image_url TEXT,
  theme_config JSONB DEFAULT '{"text": "#1a1a1a", "primary": "#1a1a1a", "background": "#ffffff"}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on microsite_content
ALTER TABLE public.microsite_content ENABLE ROW LEVEL SECURITY;

-- Recreate microsite_cards table
CREATE TABLE public.microsite_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL,
  title TEXT,
  content TEXT,
  media_url TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on microsite_cards
ALTER TABLE public.microsite_cards ENABLE ROW LEVEL SECURITY;

-- Recreate microsite_buttons table
CREATE TABLE public.microsite_buttons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id UUID NOT NULL,
  label TEXT NOT NULL,
  action_type TEXT NOT NULL,
  action_value TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on microsite_buttons
ALTER TABLE public.microsite_buttons ENABLE ROW LEVEL SECURITY;

-- Recreate microsite_scans table
CREATE TABLE public.microsite_scans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id UUID NOT NULL,
  user_agent TEXT,
  ip_address TEXT,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on microsite_scans
ALTER TABLE public.microsite_scans ENABLE ROW LEVEL SECURITY;

-- Recreate RLS policies for microsites
CREATE POLICY "Users can view their own microsites" ON public.microsites
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own microsites" ON public.microsites
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own microsites" ON public.microsites
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own microsites" ON public.microsites
FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can view published microsites" ON public.microsites
FOR SELECT USING (status = 'published'::text);

CREATE POLICY "Admins can view all microsites" ON public.microsites
FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

CREATE POLICY "Admins can update all microsites" ON public.microsites
FOR UPDATE USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Recreate RLS policies for microsite_content
CREATE POLICY "Users can manage their microsite content" ON public.microsite_content
FOR ALL USING (EXISTS (SELECT 1 FROM microsites WHERE microsites.id = microsite_content.microsite_id AND microsites.user_id = auth.uid()));

CREATE POLICY "Public can view published microsite content" ON public.microsite_content
FOR SELECT USING (EXISTS (SELECT 1 FROM microsites WHERE microsites.id = microsite_content.microsite_id AND microsites.status = 'published'::text));

CREATE POLICY "Admins can manage all microsite content" ON public.microsite_content
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Recreate RLS policies for microsite_cards
CREATE POLICY "Users can manage their microsite cards" ON public.microsite_cards
FOR ALL USING (EXISTS (SELECT 1 FROM microsites WHERE microsites.id = microsite_cards.microsite_id AND microsites.user_id = auth.uid()));

CREATE POLICY "Public can view published microsite cards" ON public.microsite_cards
FOR SELECT USING (EXISTS (SELECT 1 FROM microsites WHERE microsites.id = microsite_cards.microsite_id AND microsites.status = 'published'::text));

CREATE POLICY "Admins can manage all microsite cards" ON public.microsite_cards
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Recreate RLS policies for microsite_buttons
CREATE POLICY "Users can manage their microsite buttons" ON public.microsite_buttons
FOR ALL USING (EXISTS (SELECT 1 FROM microsite_cards JOIN microsites ON microsites.id = microsite_cards.microsite_id WHERE microsite_cards.id = microsite_buttons.card_id AND microsites.user_id = auth.uid()));

CREATE POLICY "Public can view published microsite buttons" ON public.microsite_buttons
FOR SELECT USING (EXISTS (SELECT 1 FROM microsite_cards JOIN microsites ON microsites.id = microsite_cards.microsite_id WHERE microsite_cards.id = microsite_buttons.card_id AND microsites.status = 'published'::text));

CREATE POLICY "Admins can manage all microsite buttons" ON public.microsite_buttons
FOR ALL USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Recreate RLS policies for microsite_scans
CREATE POLICY "Users can view their microsite scans" ON public.microsite_scans
FOR SELECT USING (EXISTS (SELECT 1 FROM microsites WHERE microsites.id = microsite_scans.microsite_id AND microsites.user_id = auth.uid()));

CREATE POLICY "Public can insert microsite scans" ON public.microsite_scans
FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all microsite scans" ON public.microsite_scans
FOR SELECT USING (EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.is_admin = true));

-- Recreate the trigger function for updating scan counts
CREATE OR REPLACE FUNCTION public.update_microsite_scan_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.microsites 
    SET scan_count = scan_count + 1,
        last_scan_at = NEW.scanned_at
    WHERE id = NEW.microsite_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.microsites 
    SET scan_count = GREATEST(scan_count - 1, 0)
    WHERE id = OLD.microsite_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER microsite_scan_count_trigger
  AFTER INSERT OR DELETE ON public.microsite_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_microsite_scan_count();

-- Recreate updated_at triggers
CREATE TRIGGER update_microsites_updated_at
  BEFORE UPDATE ON public.microsites
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

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