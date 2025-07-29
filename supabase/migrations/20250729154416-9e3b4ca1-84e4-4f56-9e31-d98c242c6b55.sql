-- Add external_id column to orders table for Printful order tracking
ALTER TABLE public.orders 
ADD COLUMN external_id TEXT;

-- Add index for efficient lookups by external_id
CREATE INDEX IF NOT EXISTS idx_orders_external_id ON public.orders(external_id);

-- Add index for efficient lookups by printful_order_id as well
CREATE INDEX IF NOT EXISTS idx_orders_printful_order_id ON public.orders(printful_order_id);