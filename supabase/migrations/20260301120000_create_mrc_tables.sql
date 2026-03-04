-- ================================================
-- Migration: Tabel Inti MRC (Minangkabau Robot Contest)
-- ================================================
-- Modul ini mengelola event lomba robot tahunan UKM Robotik PNP.
-- Migration ini membuat tabel dasar yang diperlukan oleh seluruh
-- sub-modul MRC: pendaftaran, kategori, dan pengaturan event.
--
-- Struktur:
-- 1. mrc_events       → Event/edisi MRC per tahun
-- 2. mrc_categories   → Kategori lomba dalam satu event
-- 3. Audit trigger    → Otomatis log perubahan


-- =====================================================
-- ENUM: Status event MRC
-- =====================================================

CREATE TYPE public.mrc_event_status AS ENUM (
  'draft',           -- Sedang disiapkan, belum dipublikasikan
  'registration',    -- Pendaftaran dibuka
  'closed',          -- Pendaftaran ditutup, persiapan hari-H
  'ongoing',         -- Lomba sedang berlangsung
  'completed',       -- Lomba selesai
  'cancelled'        -- Dibatalkan
);


-- =====================================================
-- TABEL 1: MRC_EVENTS (Edisi/Event lomba)
-- =====================================================
-- Setiap baris mewakili satu edisi pelaksanaan MRC.
-- Contoh: "MRC 2026", "MRC 2027"

CREATE TABLE public.mrc_events (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identitas event
  name              VARCHAR(255) NOT NULL,        -- "Minangkabau Robot Contest 2026"
  slug              VARCHAR(100) NOT NULL UNIQUE,  -- "mrc-2026" (untuk URL)
  description       TEXT NULL,                     -- Deskripsi singkat event

  -- Status dan jadwal pendaftaran
  status            public.mrc_event_status NOT NULL DEFAULT 'draft',
  registration_open TIMESTAMPTZ NULL,              -- Waktu buka pendaftaran
  registration_close TIMESTAMPTZ NULL,             -- Waktu tutup pendaftaran

  -- Jadwal event
  event_start       TIMESTAMPTZ NULL,              -- Tanggal mulai lomba
  event_end         TIMESTAMPTZ NULL,              -- Tanggal selesai lomba
  venue             VARCHAR(500) NULL,             -- Lokasi pelaksanaan

  -- Kontak & info tambahan
  contact_person    VARCHAR(255) NULL,             -- Nama kontak PIC
  contact_phone     VARCHAR(20) NULL,              -- No HP PIC
  contact_email     VARCHAR(255) NULL,             -- Email PIC

  -- Metadata
  created_by        UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.mrc_events                     IS 'Edisi event MRC per tahun';
COMMENT ON COLUMN public.mrc_events.status              IS 'Status event: draft → registration → closed → ongoing → completed';
COMMENT ON COLUMN public.mrc_events.registration_open   IS 'Waktu buka pendaftaran (null = belum diatur)';
COMMENT ON COLUMN public.mrc_events.registration_close  IS 'Waktu tutup pendaftaran (null = belum diatur)';
COMMENT ON COLUMN public.mrc_events.slug                IS 'Slug unik untuk URL publik';

CREATE INDEX idx_mrc_events_status ON public.mrc_events(status);
CREATE INDEX idx_mrc_events_slug   ON public.mrc_events(slug);


-- =====================================================
-- TABEL 2: MRC_CATEGORIES (Kategori lomba)
-- =====================================================
-- Setiap event bisa punya beberapa kategori lomba.
-- Contoh: "Line Follower", "Sumo Robot", "Transporter"

CREATE TABLE public.mrc_categories (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id       UUID NOT NULL REFERENCES public.mrc_events(id) ON DELETE CASCADE,

  -- Identitas kategori
  name           VARCHAR(255) NOT NULL,         -- "Line Follower"
  description    TEXT NULL,                     -- Penjelasan kategori
  rules_url      VARCHAR(500) NULL,             -- Link ke dokumen peraturan

  -- Konfigurasi peserta
  max_team_size  INT NOT NULL DEFAULT 3,        -- Max anggota per tim
  min_team_size  INT NOT NULL DEFAULT 1,        -- Min anggota per tim
  max_teams      INT NULL,                      -- Kuota max tim (null = unlimited)

  -- Biaya pendaftaran (dalam rupiah)
  registration_fee BIGINT NOT NULL DEFAULT 0,   -- Biaya pendaftaran per tim

  -- Status
  is_active      BOOLEAN NOT NULL DEFAULT true, -- Kategori aktif/tidak

  -- Metadata
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: nama kategori unik per event
  CONSTRAINT uq_mrc_category_name UNIQUE (event_id, name),
  -- Constraint: min <= max team size
  CONSTRAINT chk_team_size CHECK (min_team_size <= max_team_size)
);

COMMENT ON TABLE  public.mrc_categories                  IS 'Kategori lomba dalam event MRC';
COMMENT ON COLUMN public.mrc_categories.registration_fee IS 'Biaya pendaftaran per tim (Rupiah)';
COMMENT ON COLUMN public.mrc_categories.max_teams        IS 'Kuota maksimal tim (null = tidak terbatas)';

CREATE INDEX idx_mrc_categories_event ON public.mrc_categories(event_id);


-- =====================================================
-- FUNGSI: Auto-update updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.fn_mrc_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_mrc_events_updated
  BEFORE UPDATE ON public.mrc_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();

CREATE TRIGGER trg_mrc_categories_updated
  BEFORE UPDATE ON public.mrc_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_mrc_updated_at();


-- =====================================================
-- AUDIT TRIGGER: Log perubahan ke audit_logs
-- =====================================================
-- Menggunakan fn_audit_log yang sudah ada dari migration sebelumnya.

CREATE TRIGGER trg_audit_mrc_events
  AFTER INSERT OR UPDATE OR DELETE ON public.mrc_events
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

CREATE TRIGGER trg_audit_mrc_categories
  AFTER INSERT OR UPDATE OR DELETE ON public.mrc_categories
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();


-- =====================================================
-- RLS POLICY: MRC Events & Categories
-- =====================================================

ALTER TABLE public.mrc_events     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mrc_categories ENABLE ROW LEVEL SECURITY;

-- Semua user yang login bisa melihat event (publik read)
CREATE POLICY "mrc_events: authenticated read" ON public.mrc_events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Hanya admin MRC yang bisa mengelola event
CREATE POLICY "mrc_events: admin manage" ON public.mrc_events
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );

-- Semua user yang login bisa melihat kategori
CREATE POLICY "mrc_categories: authenticated read" ON public.mrc_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Hanya admin MRC yang bisa mengelola kategori
CREATE POLICY "mrc_categories: admin manage" ON public.mrc_categories
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'mrc:manage')
  );


-- =====================================================
-- SEED: Permission mrc:manage
-- =====================================================

INSERT INTO public.permissions (name, description)
VALUES ('mrc:manage', 'Mengelola event dan data MRC')
ON CONFLICT (name) DO NOTHING;

-- Assign ke super_admin dan pengurus
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name IN ('super_admin', 'pengurus')
  AND p.name = 'mrc:manage'
ON CONFLICT DO NOTHING;
