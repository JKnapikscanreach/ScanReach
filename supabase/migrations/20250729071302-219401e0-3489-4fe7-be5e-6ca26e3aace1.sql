-- Create tables for Printful sticker orders
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  printful_order_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  total_cost DECIMAL(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  shipping_address JSONB NOT NULL,
  qr_data_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  size TEXT NOT NULL,
  material TEXT NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (since this is for guest orders)
CREATE POLICY "customers_select_policy" ON public.customers FOR SELECT USING (true);
CREATE POLICY "customers_insert_policy" ON public.customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_update_policy" ON public.customers FOR UPDATE USING (true);

CREATE POLICY "orders_select_policy" ON public.orders FOR SELECT USING (true);
CREATE POLICY "orders_insert_policy" ON public.orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_update_policy" ON public.orders FOR UPDATE USING (true);

CREATE POLICY "order_items_select_policy" ON public.order_items FOR SELECT USING (true);
CREATE POLICY "order_items_insert_policy" ON public.order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_update_policy" ON public.order_items FOR UPDATE USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();