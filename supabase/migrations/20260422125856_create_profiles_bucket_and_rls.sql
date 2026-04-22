-- ================================================
-- Migration: Create 'profiles' bucket and its RLS policies
-- Bucket   : profiles
-- ================================================

-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profiles',
    'profiles',
    false, -- Not public, requires signed urls generally
    5242880, -- 5 MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  )
ON CONFLICT (id) DO UPDATE SET 
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. RLS Policies for the profiles bucket
-- By default, inserting or selecting objects requires authenticated users

-- Allow users to upload to their own folder within the profiles bucket
CREATE POLICY "profiles: users upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND (auth.uid()::text = (string_to_array(name, '/'))[1] OR name LIKE auth.uid()::text || '/%')
);

-- Allow users to view their own files, or admins to view all
CREATE POLICY "profiles: users read own, admin read all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (
    name LIKE auth.uid()::text || '/%'
    OR public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'pengurus')
  )
);

-- Allow admins to update or delete any file in profiles
CREATE POLICY "profiles: admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  )
);

CREATE POLICY "profiles: admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  )
);
