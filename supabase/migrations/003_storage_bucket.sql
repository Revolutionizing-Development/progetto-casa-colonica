-- Migration: 003_storage_bucket
-- Creates the Supabase Storage bucket for property photos.
-- This is idempotent — safe to run multiple times.
-- Run this in the Supabase SQL Editor or via the Supabase CLI.
--
-- Note: the bucket is set to public so photos can be served directly
-- via the public URL. Access is restricted at insert time in the
-- API route by verifying the authenticated user owns the property.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-photos',
  'property-photos',
  true,
  20971520,  -- 20 MB
  ARRAY[
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
-- Allow authenticated users to insert photos into their own folder.
-- Allow public read (bucket is public, so this is redundant but explicit).

CREATE POLICY "Users can upload their own property photos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-photos');

CREATE POLICY "Public read access to property photos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-photos');

CREATE POLICY "Users can delete their own property photos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'property-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
