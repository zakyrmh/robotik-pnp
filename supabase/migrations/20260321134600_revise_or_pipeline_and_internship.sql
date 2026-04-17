-- ================================================
-- Migration: Revisi OR Pipeline & Internship
-- ================================================
-- Revisi dari expand_or_pipeline_status:
-- 1. Update enum pipeline_status (tambah tahapan baru)
-- 2. Drop or_internships yang terlalu simpel
-- 3. Buat sistem kelompok (or_groups)
-- 4. Buat sistem magang rolling & tetap yang proper
-- ================================================


-- =====================================================
-- STEP 1: Update enum or_pipeline_status
-- =====================================================
-- Tambah nilai baru ke enum yang sudah ada

ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'interview_1_passed';
ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'interview_1_failed';
ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'interview_2_passed';
ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'interview_2_failed';
ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'internship_rolling';
ALTER TYPE public.or_pipeline_status ADD VALUE IF NOT EXISTS 'internship_fixed';

-- Rename intro_demo → tetap, training → tetap, dst
-- (nilai yang sudah ada di migration sebelumnya tidak perlu diubah)


-- =====================================================
-- STEP 2: Drop or_internships lama
-- =====================================================

DROP TABLE IF EXISTS public.or_internships CASCADE;


-- =====================================================
-- STEP 3: TABEL OR_GROUPS (Kelompok caang)
-- =====================================================
-- Dipakai untuk project dan magang rolling.
-- Kelompok project dan magang rolling bisa berbeda.

CREATE TYPE public.or_group_type AS ENUM (
  'project',          -- Kelompok untuk tahap project
  'internship_rolling' -- Kelompok untuk magang rolling
);

CREATE TABLE public.or_groups (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(100) NOT NULL,         -- "Kelompok A", "Tim 1", dll
  type        public.or_group_type NOT NULL,
  description TEXT NULL,

  created_by  UUID NOT NULL REFERENCES public.users(id),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.or_groups IS 'Kelompok caang — untuk project dan magang rolling';

CREATE TRIGGER or_groups_updated_at
  BEFORE UPDATE ON public.or_groups
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL OR_GROUP_MEMBERS (Anggota kelompok)
-- =====================================================

CREATE TABLE public.or_group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES public.or_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_or_group_member UNIQUE (group_id, user_id)
);

COMMENT ON TABLE public.or_group_members IS 'Anggota kelompok caang';

CREATE INDEX idx_or_group_members_group ON public.or_group_members(group_id);
CREATE INDEX idx_or_group_members_user  ON public.or_group_members(user_id);


-- =====================================================
-- STEP 4: TABEL OR_ROLLING_INTERNSHIPS (Magang Rolling)
-- =====================================================
-- Satu kelompok magang rolling di semua divisi secara bergiliran.
-- Setiap record = satu sesi magang (satu kelompok di satu divisi).

CREATE TABLE public.or_rolling_internships (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID NOT NULL REFERENCES public.or_groups(id) ON DELETE CASCADE,
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,

  -- Jadwal sesi
  session_date DATE NOT NULL,
  start_time   TIME NOT NULL,
  end_time     TIME NULL,
  location     VARCHAR(255) NULL,
  notes        TEXT NULL,

  -- Penilaian sesi (dari divisi)
  is_completed BOOLEAN NOT NULL DEFAULT false,
  assessment   TEXT NULL,           -- Catatan penilaian dari divisi

  created_by   UUID NOT NULL REFERENCES public.users(id),
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Satu kelompok hanya sekali per divisi
  CONSTRAINT uq_rolling_group_division UNIQUE (group_id, division_id)
);

COMMENT ON TABLE  public.or_rolling_internships             IS 'Jadwal magang rolling — satu kelompok per divisi';
COMMENT ON COLUMN public.or_rolling_internships.group_id    IS 'Kelompok yang magang (type: internship_rolling)';
COMMENT ON COLUMN public.or_rolling_internships.division_id IS 'Divisi tempat magang sesi ini';

CREATE INDEX idx_or_rolling_group    ON public.or_rolling_internships(group_id);
CREATE INDEX idx_or_rolling_division ON public.or_rolling_internships(division_id);

CREATE TRIGGER or_rolling_internships_updated_at
  BEFORE UPDATE ON public.or_rolling_internships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- STEP 5: TABEL OR_FIXED_INTERNSHIP_QUOTAS (Kuota magang tetap per divisi)
-- =====================================================

CREATE TABLE public.or_fixed_internship_quotas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  division_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE CASCADE,
  quota       INT NOT NULL DEFAULT 0 CHECK (quota >= 0),

  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_fixed_quota_division UNIQUE (division_id)
);

COMMENT ON TABLE  public.or_fixed_internship_quotas         IS 'Kuota penerimaan magang tetap per divisi';
COMMENT ON COLUMN public.or_fixed_internship_quotas.quota   IS 'Jumlah maksimal caang yang bisa magang di divisi ini';

CREATE TRIGGER or_fixed_internship_quotas_updated_at
  BEFORE UPDATE ON public.or_fixed_internship_quotas
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Seed kuota awal (0 = belum ditentukan)
INSERT INTO public.or_fixed_internship_quotas (division_id, quota)
SELECT id, 0 FROM public.divisions;


-- =====================================================
-- STEP 6: TABEL OR_FIXED_INTERNSHIPS (Magang Tetap)
-- =====================================================
-- First-come first-served, ada kuota per divisi.
-- Caang pilih sendiri via web, admin OR bisa override.

CREATE TABLE public.or_fixed_internships (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Pilihan caang (first-come)
  chosen_division_id  UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  chosen_at           TIMESTAMPTZ NULL,

  -- Keputusan final admin OR (bisa sama atau berbeda dari pilihan caang)
  assigned_division_id UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  assigned_by          UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  assigned_at          TIMESTAMPTZ NULL,
  assignment_notes     TEXT NULL,

  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 data per caang
  CONSTRAINT uq_fixed_internship_user UNIQUE (user_id)
);

COMMENT ON TABLE  public.or_fixed_internships                  IS 'Magang tetap caang — pilihan sendiri + konfirmasi admin OR';
COMMENT ON COLUMN public.or_fixed_internships.chosen_division_id  IS 'Pilihan divisi dari caang (first-come)';
COMMENT ON COLUMN public.or_fixed_internships.assigned_division_id IS 'Divisi final yang ditetapkan admin OR';

CREATE INDEX idx_or_fixed_user     ON public.or_fixed_internships(user_id);
CREATE INDEX idx_or_fixed_chosen   ON public.or_fixed_internships(chosen_division_id);
CREATE INDEX idx_or_fixed_assigned ON public.or_fixed_internships(assigned_division_id);

CREATE TRIGGER or_fixed_internships_updated_at
  BEFORE UPDATE ON public.or_fixed_internships
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- STEP 7: FUNCTION — Cek kuota sebelum caang pilih divisi
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_fixed_internship_quota(
  p_division_id uuid
)
RETURNS TABLE (
  quota     int,
  filled    bigint,
  available bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    q.quota,
    COUNT(fi.id) AS filled,
    GREATEST(0, q.quota - COUNT(fi.id)) AS available
  FROM public.or_fixed_internship_quotas q
  LEFT JOIN public.or_fixed_internships fi
    ON fi.chosen_division_id = q.division_id
   AND fi.chosen_division_id IS NOT NULL
  WHERE q.division_id = p_division_id
  GROUP BY q.quota;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_fixed_internship_quota(uuid)
  TO authenticated;


-- =====================================================
-- RLS
-- =====================================================

ALTER TABLE public.or_groups                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_group_members            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_rolling_internships      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_fixed_internship_quotas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_fixed_internships        ENABLE ROW LEVEL SECURITY;

-- OR admin: full access semua tabel
CREATE POLICY "or_groups_admin" ON public.or_groups
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "or_group_members_admin" ON public.or_group_members
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "or_rolling_admin" ON public.or_rolling_internships
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "or_fixed_quotas_admin" ON public.or_fixed_internship_quotas
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "or_fixed_admin" ON public.or_fixed_internships
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

-- Caang: baca kelompok sendiri
CREATE POLICY "or_groups_caang_read" ON public.or_groups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.or_group_members gm
      WHERE gm.group_id = id
        AND gm.user_id  = auth.uid()
    )
  );

CREATE POLICY "or_group_members_caang_read" ON public.or_group_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "or_rolling_caang_read" ON public.or_rolling_internships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.or_group_members gm
      WHERE gm.group_id = group_id
        AND gm.user_id  = auth.uid()
    )
  );

-- Caang: baca kuota (perlu untuk first-come)
CREATE POLICY "or_fixed_quotas_caang_read" ON public.or_fixed_internship_quotas
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Caang: baca & pilih divisi magang tetap sendiri
CREATE POLICY "or_fixed_caang_self" ON public.or_fixed_internships
  FOR ALL USING (user_id = auth.uid());


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.or_groups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_group_members;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_rolling_internships;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_fixed_internship_quotas;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_fixed_internships;