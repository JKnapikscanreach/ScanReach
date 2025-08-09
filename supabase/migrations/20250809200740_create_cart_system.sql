-- Create cart system tables
CREATE TABLE public.carts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.cart_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id UUID NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  microsite_id UUID NOT NULL REFERENCES public.microsites(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT NOT NULL,
  material TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  qr_data_url TEXT NOT NULL,
  product_name TEXT NOT NULL,
  variant_name TEXT NOT NULL,
  product_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT cart_line_items_quantity_check CHECK (quantity > 0)
);

-- Enable Row Level Security
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_line_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for carts (users can only access their own carts)
CREATE POLICY "carts_select_policy" ON public.carts 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "carts_insert_policy" ON public.carts 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "carts_update_policy" ON public.carts 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "carts_delete_policy" ON public.carts 
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for cart_line_items (users can only access their own cart items)
CREATE POLICY "cart_line_items_select_policy" ON public.cart_line_items 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_line_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_line_items_insert_policy" ON public.cart_line_items 
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_line_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_line_items_update_policy" ON public.cart_line_items 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_line_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

CREATE POLICY "cart_line_items_delete_policy" ON public.cart_line_items 
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.carts 
      WHERE carts.id = cart_line_items.cart_id 
      AND carts.user_id = auth.uid()
    )
  );

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_carts_updated_at
  BEFORE UPDATE ON public.carts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_line_items_updated_at
  BEFORE UPDATE ON public.cart_line_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX idx_carts_user_id ON public.carts(user_id);
CREATE INDEX idx_cart_line_items_cart_id ON public.cart_line_items(cart_id);
CREATE INDEX idx_cart_line_items_microsite_id ON public.cart_line_items(microsite_id);

-- Create unique constraint to ensure one cart per user
CREATE UNIQUE INDEX idx_carts_user_id_unique ON public.carts(user_id);
