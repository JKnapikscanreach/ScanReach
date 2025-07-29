-- Create sync products table
CREATE TABLE public.sync_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_product_id TEXT NOT NULL,
  printful_sync_product_id TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sync variants table  
CREATE TABLE public.sync_variants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_variant_id TEXT NOT NULL,
  printful_sync_variant_id TEXT NOT NULL,
  sync_product_id UUID NOT NULL REFERENCES public.sync_products(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  size TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create variant mappings table for quick lookups
CREATE TABLE public.variant_mappings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  catalog_variant_id TEXT NOT NULL UNIQUE,
  sync_variant_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.sync_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_variants ENABLE ROW LEVEL SECURITY; 
ALTER TABLE public.variant_mappings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (public read access for product data)
CREATE POLICY "Allow public read access to sync_products" ON public.sync_products FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sync_products" ON public.sync_products FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sync_products" ON public.sync_products FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to sync_variants" ON public.sync_variants FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to sync_variants" ON public.sync_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to sync_variants" ON public.sync_variants FOR UPDATE USING (true);

CREATE POLICY "Allow public read access to variant_mappings" ON public.variant_mappings FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to variant_mappings" ON public.variant_mappings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access to variant_mappings" ON public.variant_mappings FOR UPDATE USING (true);

-- Create indexes for performance
CREATE INDEX idx_sync_products_catalog_id ON public.sync_products(catalog_product_id);
CREATE INDEX idx_sync_variants_catalog_id ON public.sync_variants(catalog_variant_id);
CREATE INDEX idx_sync_variants_sync_product_id ON public.sync_variants(sync_product_id);
CREATE INDEX idx_variant_mappings_catalog_id ON public.variant_mappings(catalog_variant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_sync_products_updated_at
  BEFORE UPDATE ON public.sync_products
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sync_variants_updated_at
  BEFORE UPDATE ON public.sync_variants  
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();