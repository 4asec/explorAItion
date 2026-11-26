-- =============================================================================
-- Migration: 20261126000001_avatars_storage.sql
-- Description: Add avatar_url column to profiles, set up 'avatars' storage bucket,
--              and configure Row Level Security policies for user avatars.
-- =============================================================================

-- 1. Ensure avatar_url column exists on public.profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'avatar_url'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- 2. Create 'avatars' bucket in Supabase storage if not exists
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2 MB in bytes
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

-- 3. Storage Policies for 'avatars' bucket
-- Public access: anyone can view avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Public Access for Avatars'
  ) THEN
    CREATE POLICY "Public Access for Avatars"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'avatars');
  END IF;
END $$;

-- Upload access: authenticated users can upload avatars into their own folder (folder named as their user id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Users Can Upload Avatar'
  ) THEN
    CREATE POLICY "Authenticated Users Can Upload Avatar"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Update access: authenticated users can update their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Users Can Update Own Avatar'
  ) THEN
    CREATE POLICY "Authenticated Users Can Update Own Avatar"
      ON storage.objects FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;

-- Delete access: authenticated users can delete their own avatars
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated Users Can Delete Own Avatar'
  ) THEN
    CREATE POLICY "Authenticated Users Can Delete Own Avatar"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'avatars' AND
        (storage.foldername(name))[1] = auth.uid()::text
      );
  END IF;
END $$;
