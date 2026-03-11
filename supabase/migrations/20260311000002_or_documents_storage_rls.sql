-- ================================================
-- Migration: RLS Policies untuk Supabase Storage
-- Bucket   : or-documents
-- Proyek   : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Bucket `or-documents` harus sudah dibuat manual via
-- Supabase Dashboard dengan setting:
--   - Visibility  : Private
--   - Max filesize : 5 MB
--   - MIME types   : image/jpeg, image/png, image/webp, image/heic
--
-- Struktur path di dalam bucket:
--   caang/{tahun}/{user_id}/{user_id}-{timestamp}-{filename}
--
-- Contoh:
--   caang/2026/abc-123/abc-123-1741234567890-pas_foto.jpg
-- ================================================

-- =====================================================
-- INSERT: Caang hanya bisa upload ke folder miliknya
-- =====================================================
-- Path format: caang/2026/{user_id}/...
-- Karakter ke-3 dari split '/' adalah user_id
CREATE POLICY "or_documents: caang upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'or-documents'
  AND name LIKE 'caang/2026/' || auth.uid()::text || '/%'
);

-- =====================================================
-- SELECT: Caang bisa lihat file miliknya sendiri,
--         Admin/pengurus bisa lihat semua file
-- =====================================================
CREATE POLICY "or_documents: caang read own, admin read all"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'or-documents'
  AND (
    -- Caang membaca file miliknya sendiri
    name LIKE 'caang/2026/' || auth.uid()::text || '/%'
    -- Admin & pengurus membaca semua file
    OR public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'pengurus')
  )
);

-- =====================================================
-- UPDATE: Hanya admin yang bisa update metadata file
-- =====================================================
CREATE POLICY "or_documents: admin update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'or-documents'
  AND (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  )
);

-- =====================================================
-- DELETE: Hanya admin/super_admin yang bisa hapus file
-- =====================================================
CREATE POLICY "or_documents: admin delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'or-documents'
  AND (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  )
);
