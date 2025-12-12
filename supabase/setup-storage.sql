-- ============================================
-- Storage Setup for Lawyer Diary
-- ============================================
-- This file sets up storage policies for the case_files bucket
-- 
-- IMPORTANT: You must create the bucket first!
-- 
-- To create the bucket:
-- 1. Go to Supabase Dashboard → Storage → New bucket
-- 2. Name: case_files
-- 3. Public: No (Private)
-- 4. File size limit: 50MB
-- 5. Allowed MIME types: pdf, jpeg, png, jpg, doc, docx, xls, xlsx
--
-- OR use Supabase CLI:
--   supabase storage create case_files --public false
--
-- Then run this SQL file in Supabase SQL Editor
-- ============================================

-- Enable storage if not already enabled
-- (This is usually already enabled, but included for completeness)

-- Drop existing policies if they exist (for clean reinstall)
DROP POLICY IF EXISTS "Firm members can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Firm members can read files" ON storage.objects;
DROP POLICY IF EXISTS "Firm members can update files" ON storage.objects;
DROP POLICY IF EXISTS "Firm members can delete files" ON storage.objects;

-- Policy: Allow authenticated users to upload files to their firm's folder
CREATE POLICY "Firm members can upload files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid() AND firm_id IS NOT NULL
  )
);

-- Policy: Allow firm members to read files from their firm's folder
CREATE POLICY "Firm members can read files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid() AND firm_id IS NOT NULL
  )
);

-- Policy: Allow firm members to update files in their firm's folder
CREATE POLICY "Firm members can update files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid() AND firm_id IS NOT NULL
  )
)
WITH CHECK (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid() AND firm_id IS NOT NULL
  )
);

-- Policy: Allow firm members to delete files from their firm's folder
CREATE POLICY "Firm members can delete files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'case_files' AND
  (storage.foldername(name))[1] IN (
    SELECT firm_id::text
    FROM public.profiles
    WHERE id = auth.uid() AND firm_id IS NOT NULL
  )
);

-- Verify policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;

