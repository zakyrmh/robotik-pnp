-- ================================================
-- Migration: Sistem Kegiatan & Absensi Komdis
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Modul Komisi Disiplin — Kegiatan Resmi & Absensi QR
--
-- Flow:
--   1. Komdis buat kegiatan (Mubes, Rapat, dll)
--   2. Pada hari-H, anggota buka akun → generate QR dinamis (exp 5 menit)
--   3. Komdis scan QR lewat web scanner
--   4. Sistem validasi: token valid, belum di-scan, belum expired
--   5. Catat kehadiran + cek apakah telat (lewat start_time)
--   6. Jika telat → komdis beri sanksi (fisik langsung atau poin)
--   7. Realtime update kedua sisi
-- ================================================


-- =====================================================
-- ENUM: Status kegiatan
-- =====================================================

CREATE TYPE public.komdis_event_status AS ENUM (
  'draft',        -- Baru dibuat, belum dipublikasi
  'upcoming',     -- Sudah terpublikasi, belum mulai
  'ongoing',      -- Sedang berlangsung (absensi aktif)
  'completed'     -- Selesai
);


-- =====================================================
-- ENUM: Status kehadiran
-- =====================================================

CREATE TYPE public.komdis_attendance_status AS ENUM (
  'present',      -- Hadir tepat waktu
  'late',         -- Hadir terlambat
  'absent'        -- Tidak hadir (default di akhir acara)
);


-- =====================================================
-- ENUM: Tipe sanksi keterlambatan
-- =====================================================

CREATE TYPE public.komdis_sanction_type AS ENUM (
  'physical',     -- Sanksi fisik langsung (push-up, dll) → 0 poin
  'points'        -- Penambahan poin pelanggaran
);


-- =====================================================
-- TABEL 1: KOMDIS_EVENTS (Kegiatan resmi UKM)
-- =====================================================

CREATE TABLE public.komdis_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           VARCHAR(255) NOT NULL,
  description     TEXT NULL,
  location        VARCHAR(255) NULL,

  event_date      DATE NOT NULL,
  start_time      TIME NOT NULL,                     -- Jam mulai (penentu telat)
  end_time        TIME NULL,                         -- Jam selesai (opsional)

  status          public.komdis_event_status NOT NULL DEFAULT 'draft',
  late_tolerance  INT NOT NULL DEFAULT 0,            -- Toleransi telat (menit)
  points_per_late INT NOT NULL DEFAULT 1,            -- Poin default untuk keterlambatan

  created_by      UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.komdis_events                IS 'Kegiatan resmi UKM yang memerlukan absensi';
COMMENT ON COLUMN public.komdis_events.start_time     IS 'Jam mulai acara — penentu status telat';
COMMENT ON COLUMN public.komdis_events.late_tolerance  IS 'Toleransi keterlambatan dalam menit setelah start_time';
COMMENT ON COLUMN public.komdis_events.points_per_late IS 'Poin pelanggaran default jika telat dan memilih sanksi poin';

CREATE TRIGGER komdis_events_updated_at
  BEFORE UPDATE ON public.komdis_events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();


-- =====================================================
-- TABEL 2: KOMDIS_ATTENDANCE_TOKENS (QR token dinamis)
-- =====================================================
-- Token QR yang berubah setiap 5 menit.
-- Setiap user per event punya 1 token aktif pada satu waktu.
-- Token lama otomatis hangus saat yang baru dibuat (is_used atau expired).

CREATE TABLE public.komdis_attendance_tokens (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.komdis_events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  token           VARCHAR(64) NOT NULL UNIQUE,       -- Token unik (hex atau UUID)
  expires_at      TIMESTAMPTZ NOT NULL,              -- Waktu kadaluarsa (created + 5 menit)
  is_used         BOOLEAN NOT NULL DEFAULT false,    -- Sudah discan?
  used_at         TIMESTAMPTZ NULL,                  -- Kapan discan

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.komdis_attendance_tokens            IS 'QR token dinamis — berubah setiap 5 menit, 1 token aktif per user per event';
COMMENT ON COLUMN public.komdis_attendance_tokens.token      IS 'Token unik di-encode ke QR code — 64 char hex';
COMMENT ON COLUMN public.komdis_attendance_tokens.expires_at IS 'Waktu kadaluarsa — 5 menit setelah dibuat';

CREATE INDEX idx_komdis_token_event  ON public.komdis_attendance_tokens(event_id);
CREATE INDEX idx_komdis_token_user   ON public.komdis_attendance_tokens(user_id);
CREATE INDEX idx_komdis_token_token  ON public.komdis_attendance_tokens(token);
CREATE INDEX idx_komdis_token_active ON public.komdis_attendance_tokens(event_id, user_id, is_used, expires_at);


-- =====================================================
-- TABEL 3: KOMDIS_ATTENDANCES (Catatan kehadiran)
-- =====================================================

CREATE TABLE public.komdis_attendances (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.komdis_events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,

  status          public.komdis_attendance_status NOT NULL DEFAULT 'present',
  scanned_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_late         BOOLEAN NOT NULL DEFAULT false,
  late_minutes    INT NOT NULL DEFAULT 0,            -- Berapa menit telat

  scanned_by      UUID NULL REFERENCES public.users(id), -- Komdis yang scan

  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 kehadiran per user per event
  CONSTRAINT uq_komdis_attendance UNIQUE (event_id, user_id)
);

COMMENT ON TABLE  public.komdis_attendances               IS 'Catatan kehadiran per user per kegiatan';
COMMENT ON COLUMN public.komdis_attendances.late_minutes   IS 'Selisih menit dari start_time + tolerance';
COMMENT ON COLUMN public.komdis_attendances.scanned_by     IS 'Komdis yang melakukan scan';

CREATE INDEX idx_komdis_att_event ON public.komdis_attendances(event_id);
CREATE INDEX idx_komdis_att_user  ON public.komdis_attendances(user_id);


-- =====================================================
-- TABEL 4: KOMDIS_SANCTIONS (Sanksi keterlambatan)
-- =====================================================
-- Sanksi diberikan saat terlambat.
-- Tipe: physical (langsung, 0 poin) atau points (penambahan poin).

CREATE TABLE public.komdis_sanctions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID NOT NULL REFERENCES public.komdis_events(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  attendance_id   UUID NOT NULL REFERENCES public.komdis_attendances(id) ON DELETE CASCADE,

  sanction_type   public.komdis_sanction_type NOT NULL,
  points          INT NOT NULL DEFAULT 0,            -- 0 jika fisik, > 0 jika poin
  notes           TEXT NULL,                          -- Catatan: "push-up 20x", dll.

  given_by        UUID NOT NULL REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 sanksi per kehadiran
  CONSTRAINT uq_komdis_sanction UNIQUE (attendance_id)
);

COMMENT ON TABLE  public.komdis_sanctions                IS 'Sanksi untuk keterlambatan — fisik atau poin';
COMMENT ON COLUMN public.komdis_sanctions.points         IS '0 jika sanksi fisik, > 0 jika sanksi poin';

CREATE INDEX idx_komdis_sanction_event ON public.komdis_sanctions(event_id);
CREATE INDEX idx_komdis_sanction_user  ON public.komdis_sanctions(user_id);


-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.komdis_events            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komdis_attendance_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komdis_attendances       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.komdis_sanctions         ENABLE ROW LEVEL SECURITY;

-- Pengurus (komdis): full access ke semua tabel
CREATE POLICY "komdis_events_pengurus" ON public.komdis_events
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "komdis_tokens_pengurus" ON public.komdis_attendance_tokens
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "komdis_attendances_pengurus" ON public.komdis_attendances
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "komdis_sanctions_pengurus" ON public.komdis_sanctions
  FOR ALL USING (
    public.user_has_role(auth.uid(), 'pengurus')
    OR public.user_has_role(auth.uid(), 'super_admin')
  );

-- Anggota: baca event yang published, kelola token sendiri, baca kehadiran sendiri
CREATE POLICY "komdis_events_anggota_read" ON public.komdis_events
  FOR SELECT USING (status != 'draft');

CREATE POLICY "komdis_tokens_self" ON public.komdis_attendance_tokens
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "komdis_attendance_self_read" ON public.komdis_attendances
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "komdis_sanction_self_read" ON public.komdis_sanctions
  FOR SELECT USING (user_id = auth.uid());


-- =====================================================
-- REALTIME
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.komdis_attendance_tokens;
ALTER PUBLICATION supabase_realtime ADD TABLE public.komdis_attendances;
