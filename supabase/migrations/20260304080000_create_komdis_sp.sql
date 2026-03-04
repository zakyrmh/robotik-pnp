-- ================================================
-- Migration: Sistem Surat Peringatan (SP) Digital
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Modul Komisi Disiplin — Penerbitan & Riwayat SP
--
-- Flow:
--   1. Komdis terbitkan SP berdasarkan akumulasi poin/pelanggaran
--   2. SP bertingkat: SP-1, SP-2, SP-3 (eskalasi)
--   3. SP punya nomor surat resmi, tanggal efektif
--   4. Anggota bisa melihat SP yang ditujukan kepadanya
--   5. Riwayat SP seluruh anggota bisa dilihat oleh komdis
-- ================================================


-- =====================================================
-- ENUM: Level SP
-- =====================================================

CREATE TYPE public.komdis_sp_level AS ENUM (
  'sp1',    -- Surat Peringatan 1 (teguran ringan)
  'sp2',    -- Surat Peringatan 2 (teguran keras)
  'sp3'     -- Surat Peringatan 3 (skorsing / pemberhentian)
);


-- =====================================================
-- ENUM: Status SP
-- =====================================================

CREATE TYPE public.komdis_sp_status AS ENUM (
  'draft',        -- Belum diterbitkan
  'issued',       -- Telah diterbitkan
  'acknowledged', -- Telah dibaca/diakui oleh anggota
  'revoked'       -- Dicabut/dibatalkan
);


-- =====================================================
-- TABEL: KOMDIS_WARNING_LETTERS (Surat Peringatan)
-- =====================================================

CREATE TABLE public.komdis_warning_letters (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- Identitas surat
  letter_number   VARCHAR(100) NOT NULL,             -- Nomor surat: "SP-1/KOMDIS/III/2026"
  level           public.komdis_sp_level NOT NULL,
  status          public.komdis_sp_status NOT NULL DEFAULT 'draft',

  -- Konten surat
  subject         VARCHAR(255) NOT NULL,             -- Perihal SP
  reason          TEXT NOT NULL,                      -- Alasan/dasar penerbitan
  violations_summary TEXT NULL,                       -- Ringkasan pelanggaran terkait
  consequences    TEXT NULL,                          -- Konsekuensi / tindakan lanjutan

  -- Tanggal
  issued_date     DATE NULL,                          -- Tanggal diterbitkan
  effective_date  DATE NULL,                          -- Tanggal berlaku
  expiry_date     DATE NULL,                          -- Tanggal kedaluwarsa (opsional)

  -- Poin terkait (sebagai referensi)
  points_at_issue INT NOT NULL DEFAULT 0,            -- Total poin saat SP diterbitkan

  -- Acknowledgement
  acknowledged_at TIMESTAMPTZ NULL,                  -- Kapan anggota mengakui

  -- Audit
  issued_by       UUID NOT NULL REFERENCES public.users(id),
  revoked_by      UUID NULL REFERENCES public.users(id),
  revoked_at      TIMESTAMPTZ NULL,
  revoke_reason   TEXT NULL,

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.komdis_warning_letters                IS 'Surat Peringatan (SP) digital — SP1/SP2/SP3';
COMMENT ON COLUMN public.komdis_warning_letters.letter_number  IS 'Nomor surat resmi, format: SP-{level}/KOMDIS/{bulan_romawi}/{tahun}';
COMMENT ON COLUMN public.komdis_warning_letters.points_at_issue IS 'Snapshot total poin anggota saat SP diterbitkan';
COMMENT ON COLUMN public.komdis_warning_letters.consequences   IS 'Konsekuensi: skorsing, pemberhentian, dll';

CREATE INDEX idx_komdis_sp_user   ON public.komdis_warning_letters(user_id);
CREATE INDEX idx_komdis_sp_level  ON public.komdis_warning_letters(level);
CREATE INDEX idx_komdis_sp_status ON public.komdis_warning_letters(status);

CREATE TRIGGER komdis_warning_letters_updated_at
  BEFORE UPDATE ON public.komdis_warning_letters
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.komdis_warning_letters ENABLE ROW LEVEL SECURITY;

-- Pengurus: full access
CREATE POLICY "komdis_sp_pengurus" ON public.komdis_warning_letters
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Anggota: baca SP milik sendiri yang sudah diterbitkan
CREATE POLICY "komdis_sp_self_read" ON public.komdis_warning_letters
  FOR SELECT USING (
    user_id = auth.uid() AND status IN ('issued', 'acknowledged')
  );


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.komdis_warning_letters;
