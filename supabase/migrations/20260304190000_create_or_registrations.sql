-- ================================================
-- Migration: Sistem Open Recruitment — Pendaftaran Caang
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Modul Open Recruitment — Data Pendaftaran
--
-- Flow Pendaftaran Caang:
--   1. Buat akun (auth.users → users → profiles → default role 'caang')
--   2. Isi biodata (or_registrations.step = 'biodata')
--   3. Upload dokumen (or_registrations.step = 'documents')
--   4. Upload bukti pembayaran (or_registrations.step = 'payment')
--   5. Minta verifikasi (or_registrations.step = 'submitted')
--   6. Admin OR review: accepted / rejected / revision
-- ================================================


-- =====================================================
-- ENUM: Status verifikasi pendaftaran
-- =====================================================

CREATE TYPE public.or_registration_status AS ENUM (
  'draft',         -- Masih mengisi data
  'submitted',     -- Sudah submit, menunggu review
  'revision',      -- Diminta revisi oleh admin OR
  'accepted',      -- Diterima sebagai caang resmi
  'rejected'       -- Ditolak
);


-- =====================================================
-- ENUM: Step pengisian pendaftaran (tracking progress)
-- =====================================================

CREATE TYPE public.or_registration_step AS ENUM (
  'biodata',       -- Mengisi data diri
  'documents',     -- Upload dokumen
  'payment',       -- Upload bukti bayar
  'completed'      -- Semua data lengkap, siap submit
);


-- =====================================================
-- TABEL: OR_REGISTRATIONS (Data Pendaftaran Caang)
-- =====================================================
-- Satu record per caang per periode.
-- Berisi biodata tambahan, dokumen, dan status verifikasi.

CREATE TABLE public.or_registrations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- ── Tracking ──
  status          public.or_registration_status NOT NULL DEFAULT 'draft',
  current_step    public.or_registration_step NOT NULL DEFAULT 'biodata',

  -- ── Biodata (tambahan dari profiles) ──
  motivation      TEXT NULL,                          -- Motivasi masuk robotik
  org_experience  TEXT NULL,                          -- Pengalaman organisasi (opsional)
  achievements    TEXT NULL,                          -- Prestasi (opsional)
  year_enrolled   INT NULL,                           -- Tahun masuk kuliah

  -- ── Dokumen pendukung (URL) ──
  photo_url       VARCHAR(500) NULL,                  -- Pas foto
  ktm_url         VARCHAR(500) NULL,                  -- KTM (opsional)
  ig_follow_url   VARCHAR(500) NULL,                  -- Bukti follow IG Robotik
  ig_mrc_url      VARCHAR(500) NULL,                  -- Bukti follow IG MRC
  yt_sub_url      VARCHAR(500) NULL,                  -- Bukti subscribe YT Robotik

  -- ── Pembayaran ──
  payment_url     VARCHAR(500) NULL,                  -- Bukti transfer / bayar offline
  payment_method  VARCHAR(50) NULL,                   -- 'transfer' | 'offline'
  payment_amount  INT NULL,                           -- Nominal

  -- ── Verifikasi ──
  submitted_at    TIMESTAMPTZ NULL,                   -- Kapan submit
  verified_by     UUID NULL REFERENCES public.users(id),
  verified_at     TIMESTAMPTZ NULL,
  verification_notes TEXT NULL,                       -- Catatan admin OR
  revision_fields TEXT[] NULL,                        -- Field yang perlu direvisi

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: satu pendaftaran per user
  CONSTRAINT uq_or_reg_user UNIQUE(user_id)
);

COMMENT ON TABLE  public.or_registrations               IS 'Data pendaftaran calon anggota (caang)';
COMMENT ON COLUMN public.or_registrations.revision_fields IS 'Array field yang harus direvisi, misal: {"photo_url","motivation"}';
COMMENT ON COLUMN public.or_registrations.payment_method IS 'transfer atau offline';
COMMENT ON COLUMN public.or_registrations.year_enrolled  IS 'Tahun masuk kuliah, misal 2025';

CREATE INDEX idx_or_reg_user   ON public.or_registrations(user_id);
CREATE INDEX idx_or_reg_status ON public.or_registrations(status);

CREATE TRIGGER or_registrations_updated_at
  BEFORE UPDATE ON public.or_registrations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.or_registrations ENABLE ROW LEVEL SECURITY;

-- Admin OR: full access
CREATE POLICY "or_reg_admin" ON public.or_registrations
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Caang: CRUD own registration
CREATE POLICY "or_reg_self" ON public.or_registrations
  FOR ALL USING (user_id = auth.uid());


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.or_registrations;
