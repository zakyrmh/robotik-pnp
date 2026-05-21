-- supabase/migrations/20260521154500_activities.sql

-- 2. Buat tipe data ENUM baru untuk target audiens kegiatan
DO $$ BEGIN
    CREATE TYPE public.activity_target AS ENUM ('caang', 'anggota');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. Pembuatan Tabel Activities
CREATE TABLE IF NOT EXISTS public.activities (
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT          NOT NULL,
  description     TEXT,
  start_date      TIMESTAMPTZ   NOT NULL,
  end_date        TIMESTAMPTZ   NOT NULL,
  location        TEXT,
  banner_url      TEXT,
  target_audience public.activity_target NOT NULL DEFAULT 'caang',
  created_by      UUID          REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  
  -- Constraint check agar end_date >= start_date
  CONSTRAINT chk_activity_dates CHECK (end_date >= start_date)
);

-- Indexing untuk meningkatkan performa query filter target dan waktu kegiatan
CREATE INDEX IF NOT EXISTS idx_activities_target ON public.activities(target_audience);
CREATE INDEX IF NOT EXISTS idx_activities_dates ON public.activities(start_date, end_date);

-- Trigger untuk handle_updated_at (fungsi ini sudah ada dari migration rbac)
DROP TRIGGER IF EXISTS activities_updated_at ON public.activities;
CREATE TRIGGER activities_updated_at
    BEFORE UPDATE ON public.activities
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Aktifkan Row Level Security (RLS)
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- Bersihkan policy lama jika ada
DO $$ BEGIN
    DROP POLICY IF EXISTS "allow_select_activities" ON public.activities;
    DROP POLICY IF EXISTS "allow_admin_write_activities" ON public.activities;
END $$;

-- Policy untuk read (SELECT):
-- - caang melihat kegiatan caang
-- - anggota/admin melihat kegiatan anggota
-- - admin (super-admin, admin-or, admin-komdis) melihat semua kegiatan untuk manajemen
CREATE POLICY "allow_select_activities" ON public.activities
  FOR SELECT
  USING (
    (get_my_role() = 'caang' AND target_audience = 'caang') OR
    (get_my_role() IN ('anggota', 'admin-or', 'super-admin', 'admin-komdis') AND target_audience = 'anggota') OR
    (get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'))
  );

-- Policy untuk write (insert, update, delete):
-- Hanya admin (super-admin, admin-or, admin-komdis) yang boleh mengelola kegiatan
CREATE POLICY "allow_admin_write_activities" ON public.activities
  FOR ALL
  USING (get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'))
  WITH CHECK (get_my_role() IN ('super-admin', 'admin-or', 'admin-komdis'));
