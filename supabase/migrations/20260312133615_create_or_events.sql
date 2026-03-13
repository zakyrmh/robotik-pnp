-- ================================================
-- Migration: Modul Kegiatan & Absensi OR
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Mengelola kegiatan OR dan absensi caang.
--
-- Flow:
--   1. Admin OR membuat kegiatan (status: draft)
--   2. Admin publish kegiatan → caang bisa melihat
--   3. Hari-H → absensi dicatat (QR/manual)
--   4. Kegiatan selesai → status: completed
-- ================================================


-- =====================================================
-- ENUM: Jenis kegiatan
-- =====================================================

CREATE TYPE public.or_event_type AS ENUM (
  'demo',          -- Demo robot & perkenalan organisasi
  'pelatihan',     -- Sesi pelatihan
  'wawancara',     -- Wawancara (1 atau 2)
  'project',       -- Sesi project robot
  'pelantikan',    -- Pelantikan anggota muda
  'lainnya'        -- Kegiatan lainnya
);


-- =====================================================
-- ENUM: Mode pelaksanaan
-- =====================================================

CREATE TYPE public.or_event_mode AS ENUM (
  'offline',       -- Tatap muka di lokasi
  'online',        -- Daring via Zoom/Meet
  'hybrid'         -- Gabungan offline + online
);


-- =====================================================
-- ENUM: Status kegiatan
-- =====================================================

CREATE TYPE public.or_event_status AS ENUM (
  'draft',         -- Belum dipublish, hanya admin yang bisa lihat
  'published',     -- Sudah dipublish, caang bisa melihat
  'completed'      -- Kegiatan selesai
);


-- =====================================================
-- ENUM: Status absensi
-- =====================================================

CREATE TYPE public.or_attendance_status AS ENUM (
  'present',       -- Hadir
  'absent',        -- Tidak hadir
  'excused',       -- Izin
  'late'           -- Terlambat
);


-- =====================================================
-- TABEL: OR_EVENTS (Kegiatan OR)
-- =====================================================

CREATE TABLE public.or_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- ── Info Kegiatan ──
  title           VARCHAR(255) NOT NULL,
  description     TEXT NULL,
  event_type      public.or_event_type NOT NULL DEFAULT 'lainnya',

  -- ── Jadwal ──
  event_date      DATE NOT NULL,
  start_time      TIME NOT NULL,
  end_time        TIME NULL,

  -- ── Lokasi & Mode ──
  location        VARCHAR(255) NULL,
  execution_mode  public.or_event_mode NOT NULL DEFAULT 'offline',
  meeting_link    VARCHAR(500) NULL,        -- Link Zoom/Meet untuk online/hybrid

  -- ── Status ──
  status          public.or_event_status NOT NULL DEFAULT 'draft',

  -- ── Audit ──
  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.or_events IS 'Kegiatan Open Recruitment (demo, pelatihan, wawancara, dll)';
COMMENT ON COLUMN public.or_events.meeting_link IS 'Link Zoom/Google Meet untuk kegiatan online/hybrid';
COMMENT ON COLUMN public.or_events.execution_mode IS 'Mode pelaksanaan: offline, online, atau hybrid';

CREATE INDEX idx_or_events_date   ON public.or_events(event_date);
CREATE INDEX idx_or_events_status ON public.or_events(status);

CREATE TRIGGER or_events_updated_at
  BEFORE UPDATE ON public.or_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL: OR_EVENT_ATTENDANCES (Absensi Kegiatan)
-- =====================================================

CREATE TABLE public.or_event_attendances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.or_events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  -- ── Status Absensi ──
  status          public.or_attendance_status NOT NULL DEFAULT 'absent',
  checked_in_at   TIMESTAMPTZ NULL,         -- Kapan check-in (jika hadir)
  notes           TEXT NULL,                -- Catatan opsional (alasan izin, dll)

  -- ── Audit ──
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraint: satu absensi per user per event
  CONSTRAINT uq_or_attendance UNIQUE(event_id, user_id)
);

COMMENT ON TABLE public.or_event_attendances IS 'Rekap absensi caang per kegiatan OR';

CREATE INDEX idx_or_attendance_event ON public.or_event_attendances(event_id);
CREATE INDEX idx_or_attendance_user  ON public.or_event_attendances(user_id);

CREATE TRIGGER or_event_attendances_updated_at
  BEFORE UPDATE ON public.or_event_attendances
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.or_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.or_event_attendances ENABLE ROW LEVEL SECURITY;

-- Admin OR: full access ke events
CREATE POLICY "or_events_admin" ON public.or_events
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Caang: hanya bisa baca events yang sudah published
CREATE POLICY "or_events_caang_read" ON public.or_events
  FOR SELECT USING (
    status = 'published' OR status = 'completed'
  );

-- Admin OR: full access ke attendances
CREATE POLICY "or_attendance_admin" ON public.or_event_attendances
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'admin')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Caang: baca absensi milik sendiri
CREATE POLICY "or_attendance_self_read" ON public.or_event_attendances
  FOR SELECT USING (user_id = auth.uid());


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.or_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.or_event_attendances;
