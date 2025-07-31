-- Add new columns to microsites table
ALTER TABLE public.microsites 
ADD COLUMN status text NOT NULL DEFAULT 'draft',
ADD COLUMN scan_count integer NOT NULL DEFAULT 0,
ADD COLUMN last_scan_at timestamp with time zone;

-- Create microsite_scans table for tracking individual scan events
CREATE TABLE public.microsite_scans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  microsite_id uuid NOT NULL REFERENCES public.microsites(id) ON DELETE CASCADE,
  scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  user_agent text,
  ip_address text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on microsite_scans
ALTER TABLE public.microsite_scans ENABLE ROW LEVEL SECURITY;

-- Create policies for microsite_scans
CREATE POLICY "Users can view their microsite scans" 
ON public.microsite_scans 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.microsites 
    WHERE microsites.id = microsite_scans.microsite_id
  )
);

CREATE POLICY "Public can insert microsite scans" 
ON public.microsite_scans 
FOR INSERT 
WITH CHECK (true);

-- Create index for better performance
CREATE INDEX idx_microsite_scans_microsite_id ON public.microsite_scans(microsite_id);
CREATE INDEX idx_microsite_scans_scanned_at ON public.microsite_scans(scanned_at);

-- Create trigger to update scan_count when scans are added
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

CREATE TRIGGER update_microsite_scan_count_trigger
  AFTER INSERT OR DELETE ON public.microsite_scans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_microsite_scan_count();