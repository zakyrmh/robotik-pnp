-- ================================================
-- Migration: Update Modul Kegiatan untuk Absensi & Poin
-- ================================================

-- 1. Tambah status 'sick' ke enum or_attendance_status
-- Note: 'ALTER TYPE ... ADD VALUE' tidak bisa dijalankan dalam blok transaksi di Postgres < 12,
-- tapi Supabase migration biasanya mendukungnya jika tidak dalam blok eksplisit.
-- Jika gagal, mungkin perlu dijalankan terpisah.
ALTER TYPE public.or_attendance_status ADD VALUE IF NOT EXISTS 'sick';

-- 2. Update tabel or_events dengan kolom baru
ALTER TABLE public.or_events 
  ADD COLUMN IF NOT EXISTS allow_attendance BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS late_tolerance   INTEGER NOT NULL DEFAULT 15,
  ADD COLUMN IF NOT EXISTS points_present   INTEGER NOT NULL DEFAULT 10,
  ADD COLUMN IF NOT EXISTS points_late      INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS points_excused   INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS points_sick      INTEGER NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS points_absent    INTEGER NOT NULL DEFAULT 0;

-- 3. Update tabel or_event_attendances untuk menyimpan poin hasil absensi
ALTER TABLE public.or_event_attendances
  ADD COLUMN IF NOT EXISTS points INTEGER NOT NULL DEFAULT 0;

-- 4. Komentar Kolom
COMMENT ON COLUMN public.or_events.allow_attendance IS 'Apakah kegiatan ini mewajibkan absensi atau tidak';
COMMENT ON COLUMN public.or_events.late_tolerance   IS 'Toleransi keterlambatan dalam menit';
COMMENT ON COLUMN public.or_event_attendances.points IS 'Poin yang didapatkan dari absensi ini';
