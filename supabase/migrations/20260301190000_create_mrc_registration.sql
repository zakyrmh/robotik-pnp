-- ================================================
-- Migration: Pendaftaran Peserta MRC
-- ================================================
-- Tabel untuk mengelola pendaftaran tim, anggota tim,
-- dan verifikasi pembayaran pada event MRC.
--
-- Alur pendaftaran peserta:
-- 1. Ketua tim mendaftar (data tim, anggota, pembimbing, institusi)
-- 2. Panitia verifikasi berkas & kelengkapan tim
-- 3. Peserta upload bukti pembayaran
-- 4. Panitia verifikasi pembayaran
-- 5. Tim terdaftar resmi → dapat akses grup WA
-- 6. Hari-H: pendaftaran ulang → diberikan kokarde + QR
--
-- Struktur:
-- 1. mrc_teams        → Data tim peserta
-- 2. mrc_team_members → Anggota tim (termasuk ketua & pembimbing)
-- 3. mrc_payments     → Bukti pembayaran & verifikasinya


-- =====================================================
-- ENUM: Status tim
-- =====================================================

CREATE TYPE public.mrc_team_status AS ENUM (
  'pending',              -- Menunggu verifikasi berkas
  'revision',             -- Berkas perlu direvisi
  'documents_verified',   -- Berkas terverifikasi, menunggu pembayaran
  'payment_verified',     -- Pembayaran terverifikasi, siap hari-H
  'checked_in',           -- Sudah daftar ulang hari-H (punya kokarde)
  'rejected'              -- Ditolak oleh panitia
);

-- =====================================================
-- ENUM: Status pembayaran
-- =====================================================

CREATE TYPE public.mrc_payment_status AS ENUM (
  'pending',     -- Bukti dikirim, menunggu verifikasi
  'verified',    -- Pembayaran valid
  'rejected'     -- Bukti ditolak (nominal salah, palsu, dll)
);

-- =====================================================
-- ENUM: Role anggota tim
-- =====================================================

CREATE TYPE public.mrc_member_role AS ENUM (
  'captain',     -- Ketua tim
  'member',      -- Anggota
  'advisor'      -- Guru / Dosen pembimbing
);


-- =====================================================
-- TABEL 1: MRC_TEAMS (Tim peserta)
-- =====================================================

CREATE TABLE public.mrc_teams (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relasi ke event & kategori
  event_id          UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,
  category_id       UUID NOT NULL REFERENCES public.mrc_categories(id) ON DELETE RESTRICT,

  -- Identitas tim
  team_name         VARCHAR(255) NOT NULL,
  institution       VARCHAR(500) NOT NULL,    -- Nama sekolah / universitas

  -- Kontak ketua tim (denormalisasi untuk akses cepat)
  captain_name      VARCHAR(255) NOT NULL,
  captain_email     VARCHAR(255) NOT NULL,
  captain_phone     VARCHAR(20) NOT NULL,

  -- Pembimbing (denormalisasi untuk akses cepat)
  advisor_name      VARCHAR(255) NOT NULL,
  advisor_phone     VARCHAR(20) NULL,

  -- Status verifikasi
  status            public.mrc_team_status NOT NULL DEFAULT 'pending',
  rejection_reason  TEXT NULL,                -- Alasan ditolak / revisi
  notes             TEXT NULL,                -- Catatan internal panitia

  -- Link grup WhatsApp (diberikan setelah payment_verified)
  whatsapp_group_url VARCHAR(500) NULL,

  -- User yang melakukan pendaftaran (opsional, jika punya akun)
  registered_by     UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: nama tim unik per event
  CONSTRAINT uq_mrc_team_name UNIQUE (event_id, team_name)
);

COMMENT ON TABLE  public.mrc_teams               IS 'Tim peserta lomba MRC';
COMMENT ON COLUMN public.mrc_teams.institution    IS 'Asal institusi (sekolah/kampus)';
COMMENT ON COLUMN public.mrc_teams.status         IS 'Status verifikasi: pending → documents_verified → payment_verified → checked_in';
COMMENT ON COLUMN public.mrc_teams.registered_by  IS 'User ID ketua tim (null jika belum punya akun)';

CREATE INDEX idx_mrc_teams_event    ON public.mrc_teams(event_id);
CREATE INDEX idx_mrc_teams_category ON public.mrc_teams(category_id);
CREATE INDEX idx_mrc_teams_status   ON public.mrc_teams(status);


-- =====================================================
-- TABEL 2: MRC_TEAM_MEMBERS (Anggota tim)
-- =====================================================

CREATE TABLE public.mrc_team_members (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id           UUID NOT NULL REFERENCES public.mrc_teams(id) ON DELETE CASCADE,

  -- Data anggota
  full_name         VARCHAR(255) NOT NULL,
  role              public.mrc_member_role NOT NULL DEFAULT 'member',
  identity_number   VARCHAR(50) NULL,         -- NIM / NISN / No. KTP
  phone             VARCHAR(20) NULL,

  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.mrc_team_members             IS 'Anggota tim MRC (ketua, anggota, pembimbing)';
COMMENT ON COLUMN public.mrc_team_members.role         IS 'Role: captain, member, atau advisor';
COMMENT ON COLUMN public.mrc_team_members.identity_number IS 'Nomor identitas: NIM, NISN, atau KTP';

CREATE INDEX idx_mrc_members_team ON public.mrc_team_members(team_id);


-- =====================================================
-- TABEL 3: MRC_PAYMENTS (Bukti pembayaran)
-- =====================================================

CREATE TABLE public.mrc_payments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id           UUID NOT NULL REFERENCES public.mrc_teams(id) ON DELETE CASCADE,

  -- Detail pembayaran
  amount            BIGINT NOT NULL DEFAULT 0,          -- Nominal (Rupiah)
  payment_method    VARCHAR(100) NULL,                  -- Transfer bank, QRIS, dll
  proof_url         VARCHAR(500) NOT NULL,              -- URL file bukti pembayaran
  account_name      VARCHAR(255) NULL,                  -- Nama pengirim
  notes             TEXT NULL,                          -- Catatan peserta

  -- Verifikasi
  status            public.mrc_payment_status NOT NULL DEFAULT 'pending',
  verified_by       UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  verified_at       TIMESTAMPTZ NULL,
  rejection_reason  TEXT NULL,

  -- Metadata
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.mrc_payments              IS 'Bukti pembayaran pendaftaran tim MRC';
COMMENT ON COLUMN public.mrc_payments.proof_url    IS 'URL file bukti transfer/pembayaran';
COMMENT ON COLUMN public.mrc_payments.verified_by  IS 'Panitia yang memverifikasi';

CREATE INDEX idx_mrc_payments_team   ON public.mrc_payments(team_id);
CREATE INDEX idx_mrc_payments_status ON public.mrc_payments(status);


-- =====================================================
-- TRIGGER: Auto-update updated_at
-- =====================================================

CREATE TRIGGER trg_mrc_teams_updated
  BEFORE UPDATE ON public.mrc_teams
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();

CREATE TRIGGER trg_mrc_payments_updated
  BEFORE UPDATE ON public.mrc_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();


-- =====================================================
-- AUDIT TRIGGER
-- =====================================================

CREATE TRIGGER trg_audit_mrc_teams
  AFTER INSERT OR UPDATE OR DELETE ON public.mrc_teams
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_mrc_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.mrc_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();


-- =====================================================
-- RLS POLICY
-- =====================================================

ALTER TABLE public.mrc_teams        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_payments     ENABLE ROW LEVEL SECURITY;

-- Tim: panitia bisa baca & kelola semua
CREATE POLICY "mrc_teams: admin manage" ON public.mrc_teams
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );

-- Tim: peserta bisa baca tim sendiri
CREATE POLICY "mrc_teams: own read" ON public.mrc_teams
  FOR SELECT USING (registered_by = auth.uid());

-- Tim: peserta bisa insert tim baru
CREATE POLICY "mrc_teams: authenticated insert" ON public.mrc_teams
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Anggota: panitia bisa baca & kelola semua
CREATE POLICY "mrc_team_members: admin manage" ON public.mrc_team_members
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );

-- Anggota: peserta bisa baca anggota tim sendiri
CREATE POLICY "mrc_team_members: own read" ON public.mrc_team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mrc_teams
      WHERE mrc_teams.id = mrc_team_members.team_id
        AND mrc_teams.registered_by = auth.uid()
    )
  );

-- Anggota: peserta bisa insert ke tim sendiri
CREATE POLICY "mrc_team_members: own insert" ON public.mrc_team_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mrc_teams
      WHERE mrc_teams.id = mrc_team_members.team_id
        AND mrc_teams.registered_by = auth.uid()
    )
  );

-- Pembayaran: panitia bisa baca & kelola semua
CREATE POLICY "mrc_payments: admin manage" ON public.mrc_payments
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );

-- Pembayaran: peserta bisa baca pembayaran tim sendiri
CREATE POLICY "mrc_payments: own read" ON public.mrc_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.mrc_teams
      WHERE mrc_teams.id = mrc_payments.team_id
        AND mrc_teams.registered_by = auth.uid()
    )
  );

-- Pembayaran: peserta bisa upload bukti pembayaran tim sendiri
CREATE POLICY "mrc_payments: own insert" ON public.mrc_payments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.mrc_teams
      WHERE mrc_teams.id = mrc_payments.team_id
        AND mrc_teams.registered_by = auth.uid()
    )
  );
