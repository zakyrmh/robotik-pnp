-- ================================================
-- Migration: Sistem Pelanggaran & Poin Komdis
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Modul Komisi Disiplin — Pelanggaran & Poin
--
-- Flow Pelanggaran:
--   1. Komdis input pelanggaran anggota (umum / dari absensi)
--   2. Setiap pelanggaran punya kategori dan poin
--   3. Poin akumulatif per anggota
--   4. Komdis bisa edit / hapus record poin
--
-- Flow Pengurangan Poin:
--   1. Anggota ajukan pengurangan poin (misal: aktif kegiatan, dll)
--   2. Komdis review — approve / reject
--   3. Jika approved, total poin anggota berkurang
-- ================================================


-- =====================================================
-- ENUM: Kategori pelanggaran
-- =====================================================

CREATE TYPE public.komdis_violation_category AS ENUM (
  'attendance',     -- Dari absensi kegiatan (keterlambatan/absent)
  'discipline',     -- Indisipliner umum (tidak tertib, dll)
  'property',       -- Merusak properti UKM
  'ethics',         -- Pelanggaran etika
  'other'           -- Lainnya
);


-- =====================================================
-- ENUM: Status pengajuan pengurangan poin
-- =====================================================

CREATE TYPE public.komdis_reduction_status AS ENUM (
  'pending',        -- Menunggu review
  'approved',       -- Disetujui — poin berkurang
  'rejected'        -- Ditolak
);


-- =====================================================
-- TABEL 1: KOMDIS_VIOLATIONS (Catatan pelanggaran & poin)
-- =====================================================
-- Setiap record = 1 pelanggaran dengan poin tertentu.
-- Bisa berasal dari absensi (link ke attendance_id) atau standalone.

CREATE TABLE public.komdis_violations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  category        public.komdis_violation_category NOT NULL DEFAULT 'discipline',
  description     TEXT NOT NULL,
  points          INT NOT NULL DEFAULT 1 CHECK (points >= 0),

  -- Optional: link ke kegiatan / sanksi absensi
  event_id        UUID NULL REFERENCES public.komdis_events(id) ON DELETE SET NULL,
  sanction_id     UUID NULL REFERENCES public.komdis_sanctions(id) ON DELETE SET NULL,

  -- Siapa yang input
  given_by        UUID NOT NULL REFERENCES public.users(id),

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.komdis_violations             IS 'Catatan pelanggaran — setiap record punya poin';
COMMENT ON COLUMN public.komdis_violations.event_id    IS 'Link ke kegiatan (jika berasal dari absensi)';
COMMENT ON COLUMN public.komdis_violations.sanction_id IS 'Link ke sanksi absensi (jika berasal dari sanksi poin)';

CREATE INDEX idx_komdis_violations_user     ON public.komdis_violations(user_id);
CREATE INDEX idx_komdis_violations_category ON public.komdis_violations(category);
CREATE INDEX idx_komdis_violations_event    ON public.komdis_violations(event_id);

CREATE TRIGGER komdis_violations_updated_at
  BEFORE UPDATE ON public.komdis_violations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 2: KOMDIS_POINT_REDUCTIONS (Pengajuan pengurangan poin)
-- =====================================================
-- Anggota bisa ajukan pengurangan poin.
-- Komdis review dan approve/reject.

CREATE TABLE public.komdis_point_reductions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  points          INT NOT NULL CHECK (points > 0),    -- Jumlah poin yang diminta dikurangi
  reason          TEXT NOT NULL,                       -- Alasan pengurangan
  evidence_url    VARCHAR(500) NULL,                   -- Bukti pendukung (opsional)

  -- Review
  status          public.komdis_reduction_status NOT NULL DEFAULT 'pending',
  reviewed_by     UUID NULL REFERENCES public.users(id),
  reviewed_at     TIMESTAMPTZ NULL,
  review_notes    TEXT NULL,                           -- Catatan dari komdis
  approved_points INT NULL,                            -- Poin yang disetujui (bisa lebih kecil dari yang diminta)

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.komdis_point_reductions               IS 'Pengajuan pengurangan poin pelanggaran';
COMMENT ON COLUMN public.komdis_point_reductions.approved_points IS 'Poin yang benar-benar dikurangi (bisa lebih kecil dari yang diminta)';

CREATE INDEX idx_komdis_reductions_user   ON public.komdis_point_reductions(user_id);
CREATE INDEX idx_komdis_reductions_status ON public.komdis_point_reductions(status);

CREATE TRIGGER komdis_point_reductions_updated_at
  BEFORE UPDATE ON public.komdis_point_reductions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.komdis_violations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komdis_point_reductions ENABLE ROW LEVEL SECURITY;

-- Pengurus: full access
CREATE POLICY "komdis_violations_pengurus" ON public.komdis_violations
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "komdis_reductions_pengurus" ON public.komdis_point_reductions
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Anggota: baca pelanggaran sendiri, CRUD pengajuan sendiri
CREATE POLICY "komdis_violations_self_read" ON public.komdis_violations
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "komdis_reductions_self" ON public.komdis_point_reductions
  FOR ALL USING (user_id = auth.uid());


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.komdis_violations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.komdis_point_reductions;
