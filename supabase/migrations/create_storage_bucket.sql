-- Create storage bucket for case files
-- Note: Storage buckets are created via the Storage API, not SQL
-- This file contains SQL for storage policies only
-- You need to create the bucket first via Supabase Dashboard or API

-- Storage bucket name: case_files
-- To create the bucket, use one of these methods:
-- 1. Supabase Dashboard: Storage → New bucket → name: "case_files" → Private
-- 2. Supabase CLI: supabase storage create case_files --public false
-- 3. Run the setup script: npm run supabase:setup-storage

-- Storage Policies for case_files bucket
-- These policies control who can upload, read, and delete files

-- Policy: Allow authenticated users to upload files to their firm's folder
CREATE POLICY IF NOT EXISTS "Firm members can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Allow firm members to read files from their firm's folder
CREATE POLICY IF NOT EXISTS "Firm members can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Allow firm members to update files in their firm's folder
CREATE POLICY IF NOT EXISTS "Firm members can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
)
WITH CHECK (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

-- Policy: Allow firm members to delete files from their firm's folder
CREATE POLICY IF NOT EXISTS "Firm members can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid()
  )
);

