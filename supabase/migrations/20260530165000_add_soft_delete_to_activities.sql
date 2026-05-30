-- supabase/migrations/20260530165000_add_soft_delete_to_activities.sql

-- 1. Tambah kolom soft-delete ke tabel activities
ALTER TABLE public.activities ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. Index untuk soft-delete filter
CREATE INDEX IF NOT EXISTS idx_activities_deleted_at ON public.activities(deleted_at);

-- 3. Storage bucket untuk banner kegiatan (public)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'activity-banners',
  'activity-banners',
  true,
  5242880,  -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 4. Storage Policies untuk activity-banners
CREATE POLICY "Allow public to view activity banners" ON storage.objects
  FOR SELECT USING ( bucket_id = 'activity-banners' );

CREATE POLICY "Allow admins to upload activity banners" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'activity-banners' AND
    public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis')
  );

CREATE POLICY "Allow admins to update activity banners" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'activity-banners' AND
    public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis')
  );

CREATE POLICY "Allow admins to delete activity banners" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'activity-banners' AND
    public.get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis')
  );
