-- ================================================
-- Migration: Expand OR Pipeline Status
-- Menambah kolom pipeline_status ke or_registrations
-- dan tabel or_internships untuk data magang
-- ================================================

-- =====================================================
-- ENUM: Pipeline status caang setelah lolos berkas
-- =====================================================

CREATE TYPE public.or_pipeline_status AS ENUM (
  'intro_demo',           -- Pengenalan ormawa & demo robot
  'interview_1_passed',   -- Lulus wawancara 1
  'interview_1_failed',   -- Tidak lulus wawancara 1
  'training',             -- Pelatihan
  'family_gathering',     -- Family gathering
  'project',              -- Project robot
  'interview_2_passed',   -- Lulus wawancara 2
  'interview_2_failed',   -- Tidak lulus wawancara 2
  'internship',           -- Magang
  'inducted',             -- Dilantik → upgrade ke anggota
  'blacklisted'           -- Diblokir di tahap manapun
);

COMMENT ON TYPE public.or_pipeline_status IS
  'Status pipeline caang setelah lolos verifikasi berkas (accepted)';

-- =====================================================
-- ALTER: Tambah pipeline_status ke or_registrations
-- =====================================================

ALTER TABLE public.or_registrations
  ADD COLUMN pipeline_status public.or_pipeline_status NULL;

COMMENT ON COLUMN public.or_registrations.pipeline_status IS
  'Status pipeline caang — diisi setelah status = accepted';

-- Index untuk query filter per pipeline status
CREATE INDEX idx_or_reg_pipeline_status
  ON public.or_registrations(pipeline_status)
  WHERE pipeline_status IS NOT NULL;

-- =====================================================
-- TABEL: OR_INTERNSHIPS (Data magang caang)
-- =====================================================

CREATE TABLE public.or_internships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Preferensi caang
  preference_1        UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  preference_2        UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  preference_notes    TEXT NULL,                    -- Alasan/catatan preferensi

  -- Keputusan admin OR
  assigned_division_id UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  assignment_notes    TEXT NULL,                    -- Catatan dari admin OR
  assigned_by         UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at         TIMESTAMPTZ NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 data magang per caang
  CONSTRAINT uq_or_internship_user UNIQUE (user_id)
);

COMMENT ON TABLE  public.or_internships                      IS 'Data magang caang — preferensi dan penugasan divisi';
COMMENT ON COLUMN public.or_internships.preference_1         IS 'Pilihan divisi pertama dari caang';
COMMENT ON COLUMN public.or_internships.preference_2         IS 'Pilihan divisi kedua dari caang';
COMMENT ON COLUMN public.or_internships.assigned_division_id IS 'Divisi yang ditetapkan admin OR (keputusan final)';

CREATE INDEX idx_or_internships_user     ON public.or_internships(user_id);
CREATE INDEX idx_or_internships_division ON public.or_internships(assigned_division_id);

CREATE TRIGGER or_internships_updated_at
  BEFORE UPDATE ON public.or_internships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS: or_internships
-- =====================================================

ALTER TABLE public.or_internships ENABLE ROW LEVEL SECURITY;

-- Admin OR + super_admin + admin: full access
CREATE POLICY "or_internships_admin" ON public.or_internships
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- Caang: baca & isi preferensi sendiri
CREATE POLICY "or_internships_self" ON public.or_internships
  FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- RLS: Fix or_registrations — tambah OR department
-- =====================================================

-- Hapus policy lama yang hanya izinkan admin/super_admin
DROP POLICY IF EXISTS "or_reg_admin" ON public.or_registrations;

-- Policy baru: OR department + admin + super_admin
CREATE POLICY "or_reg_admin" ON public.or_registrations
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- RLS: Fix or_settings — hapus role pengurus
-- =====================================================

DROP POLICY IF EXISTS "or_settings_admin_write" ON public.or_settings;

CREATE POLICY "or_settings_admin_write" ON public.or_settings
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  )
  WITH CHECK (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- =====================================================
-- FUNCTION: Auto-upgrade role saat caang dilantik
-- =====================================================
-- Dipanggil ketika admin OR set pipeline_status = 'inducted'
-- Otomatis ganti role caang → anggota

CREATE OR REPLACE FUNCTION public.handle_caang_inducted()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_anggota_id uuid;
  v_caang_id   uuid;
BEGIN
  -- Hanya jalankan saat pipeline_status berubah ke 'inducted'
  IF NEW.pipeline_status = 'inducted'
    AND (OLD.pipeline_status IS DISTINCT FROM 'inducted') THEN

    -- Ambil ID role anggota dan caang
    SELECT id INTO v_anggota_id FROM public.roles WHERE name = 'anggota' LIMIT 1;
    SELECT id INTO v_caang_id   FROM public.roles WHERE name = 'caang'   LIMIT 1;

    IF v_anggota_id IS NULL THEN
      RAISE EXCEPTION 'Role anggota tidak ditemukan';
    END IF;

    -- Hapus role caang
    DELETE FROM public.user_roles
    WHERE user_id = NEW.user_id
      AND role_id = v_caang_id;

    -- Tambah role anggota (ignore jika sudah ada)
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.user_id, v_anggota_id)
    ON CONFLICT DO NOTHING;

  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_caang_inducted
  AFTER UPDATE ON public.or_registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_caang_inducted();

-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.or_internships;