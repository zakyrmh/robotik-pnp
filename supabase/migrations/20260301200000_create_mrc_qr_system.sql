-- ================================================
-- Migration: Sistem QR & Check-in MRC
-- ================================================
-- Tabel untuk mengelola kokarde QR dan pencatatan
-- scan masuk/keluar/verifikasi di event MRC.
--
-- Alur operasional hari-H:
-- 1. Panitia generate QR code per anggota tim (termasuk pembimbing)
-- 2. QR dicetak sebagai kokarde
-- 3. Saat check-in, panitia scan QR → status checked_in
-- 4. Selama acara, setiap keluar masuk gedung → scan QR (entry/exit)
-- 5. Saat pertandingan, scan QR untuk verifikasi anggota tim (anti-joki)
--
-- Struktur:
-- 1. mrc_qr_codes  → QR token unik per anggota tim
-- 2. mrc_scan_logs → Catatan setiap scan QR


-- =====================================================
-- ENUM: Jenis scan
-- =====================================================

CREATE TYPE public.mrc_scan_type AS ENUM (
  'checkin',       -- Pendaftaran ulang hari-H
  'entry',         -- Masuk gedung
  'exit',          -- Keluar gedung
  'match_verify'   -- Verifikasi anggota tim saat pertandingan
);


-- =====================================================
-- TABEL 1: MRC_QR_CODES (QR untuk kokarde)
-- =====================================================

CREATE TABLE public.mrc_qr_codes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relasi
  team_id         UUID NOT NULL REFERENCES public.mrc_teams(id) ON DELETE CASCADE,
  member_id       UUID NULL REFERENCES public.mrc_team_members(id) ON DELETE CASCADE,

  -- Token QR — string unik yang di-encode ke QR code
  qr_token        VARCHAR(100) NOT NULL UNIQUE,

  -- Data person (denormalisasi untuk cetak kokarde)
  person_name     VARCHAR(255) NOT NULL,
  person_role     public.mrc_member_role NOT NULL DEFAULT 'member',

  -- Status check-in
  is_checked_in   BOOLEAN NOT NULL DEFAULT false,
  checked_in_at   TIMESTAMPTZ NULL,
  checked_in_by   UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  -- Status di dalam gedung (untuk tracking keluar-masuk)
  is_inside       BOOLEAN NOT NULL DEFAULT false,

  -- Metadata
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.mrc_qr_codes            IS 'QR code kokarde untuk setiap anggota tim MRC';
COMMENT ON COLUMN public.mrc_qr_codes.qr_token   IS 'Token unik yang di-encode ke QR code';
COMMENT ON COLUMN public.mrc_qr_codes.is_inside  IS 'Apakah orang ini sedang di dalam gedung';

CREATE INDEX idx_mrc_qr_team   ON public.mrc_qr_codes(team_id);
CREATE INDEX idx_mrc_qr_token  ON public.mrc_qr_codes(qr_token);


-- =====================================================
-- TABEL 2: MRC_SCAN_LOGS (Log setiap scan)
-- =====================================================

CREATE TABLE public.mrc_scan_logs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_code_id      UUID NOT NULL REFERENCES public.mrc_qr_codes(id) ON DELETE CASCADE,

  -- Jenis scan
  scan_type       public.mrc_scan_type NOT NULL,

  -- Siapa yang scan (panitia)
  scanned_by      UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  -- Hasil scan
  is_valid        BOOLEAN NOT NULL DEFAULT true,
  notes           TEXT NULL,

  -- Metadata
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.mrc_scan_logs IS 'Log setiap scan QR code di event MRC';

CREATE INDEX idx_mrc_scan_qr   ON public.mrc_scan_logs(qr_code_id);
CREATE INDEX idx_mrc_scan_type ON public.mrc_scan_logs(scan_type);


-- =====================================================
-- RLS POLICY
-- =====================================================

ALTER TABLE public.mrc_qr_codes  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_scan_logs ENABLE ROW LEVEL SECURITY;

-- QR codes: panitia bisa CRUD
CREATE POLICY "mrc_qr_codes: admin manage" ON public.mrc_qr_codes
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );

-- Scan logs: panitia bisa CRUD
CREATE POLICY "mrc_scan_logs: admin manage" ON public.mrc_scan_logs
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );
