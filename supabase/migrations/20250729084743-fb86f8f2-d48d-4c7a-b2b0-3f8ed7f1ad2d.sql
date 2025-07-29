-- Create storage bucket for QR codes
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'qr-codes',
  'qr-codes', 
  true,
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
);

-- Create storage policies for public access
CREATE POLICY "Allow public uploads to qr-codes bucket"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'qr-codes');

CREATE POLICY "Allow public read access to qr-codes bucket"
ON storage.objects
FOR SELECT
USING (bucket_id = 'qr-codes');

CREATE POLICY "Allow public updates to qr-codes bucket"
ON storage.objects
FOR UPDATE
USING (bucket_id = 'qr-codes');

CREATE POLICY "Allow public deletes to qr-codes bucket"
ON storage.objects
FOR DELETE
USING (bucket_id = 'qr-codes');