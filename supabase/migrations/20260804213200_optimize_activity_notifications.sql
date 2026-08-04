-- =============================================================================
-- Migration: optimize_activity_notifications
-- Deskripsi: Otomatisasi pemicu pembuatan notifikasi in-app saat kegiatan baru dibuat
--            dan pembersihan notifikasi saat kegiatan dihapus / di-soft-delete.
-- =============================================================================

-- 1. Function untuk membuat notifikasi in-app otomatis saat ada kegiatan baru
CREATE OR REPLACE FUNCTION public.handle_new_activity_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hanya buat notifikasi untuk kegiatan non-caang (target_audience = 'anggota')
  IF NEW.target_audience = 'anggota' THEN
    INSERT INTO public.in_app_notifications (
      recipient_id,
      title,
      message,
      type,
      reference_id,
      reference_type
    )
    SELECT 
      p.id,
      'Kegiatan Baru: ' || NEW.title,
      'Kegiatan "' || NEW.title || '" telah dijadwalkan pada ' || to_char(NEW.start_date AT TIME ZONE 'Asia/Jakarta', 'FMDay, DD FMMonth YYYY') || ' di ' || COALESCE(NEW.location, 'Lokasi belum ditentukan') || '.',
      'activity',
      NEW.id,
      'activity'
    FROM public.profiles p
    WHERE p.role != 'caang'
      AND p.is_onboarded = true
      AND p.deleted_at IS NULL
      AND (NEW.created_by IS NULL OR p.id != NEW.created_by);
  END IF;

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_activity_notification() OWNER TO postgres;

-- 2. Pasang Trigger AFTER INSERT pada tabel activities
DROP TRIGGER IF EXISTS trg_handle_new_activity_notification ON public.activities;

CREATE TRIGGER trg_handle_new_activity_notification
AFTER INSERT ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_activity_notification();

-- 3. Function untuk pembersihan notifikasi saat kegiatan dihapus / soft delete
CREATE OR REPLACE FUNCTION public.handle_activity_deletion_cleanup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Hapus notifikasi jika row di-DELETE atau kolom deleted_at di-UPDATE (soft delete)
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    DELETE FROM public.in_app_notifications
    WHERE reference_id = OLD.id
      AND reference_type = 'activity';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

ALTER FUNCTION public.handle_activity_deletion_cleanup() OWNER TO postgres;

-- 4. Pasang Trigger AFTER DELETE OR UPDATE pada tabel activities
DROP TRIGGER IF EXISTS trg_handle_activity_deletion_cleanup ON public.activities;

CREATE TRIGGER trg_handle_activity_deletion_cleanup
AFTER DELETE OR UPDATE ON public.activities
FOR EACH ROW
EXECUTE FUNCTION public.handle_activity_deletion_cleanup();
