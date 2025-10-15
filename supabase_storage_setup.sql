-- Supabase Storage Bucket Setup for Return Images
-- Run this in your Supabase SQL Editor

-- Create the return-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'return-images',
  'return-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for return-images bucket

-- Policy: Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload return images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'return-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow public read access to return images
CREATE POLICY "Public read access to return images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'return-images');

-- Policy: Allow users to update their own images
CREATE POLICY "Users can update their own return images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'return-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'return-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Allow users to delete their own images
CREATE POLICY "Users can delete their own return images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'return-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Verify the bucket was created
SELECT * FROM storage.buckets WHERE id = 'return-images';
