-- ================================================
-- Migration: Trigger auto-absent saat kegiatan completed
-- ================================================
-- Saat status komdis_events diubah ke 'completed',
-- semua anggota (role: anggota) yang belum ada record
-- kehadiran akan otomatis di-insert sebagai 'absent'.
-- Poin pelanggaran TIDAK langsung masuk — komdis konfirmasi dulu.
-- ================================================

CREATE OR REPLACE FUNCTION public.handle_komdis_event_completed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Hanya jalankan saat status berubah ke 'completed'
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.komdis_attendances (
      event_id,
      user_id,
      status,
      is_late,
      late_minutes,
      scanned_at
    )
    SELECT
      NEW.id,
      ur.user_id,
      'absent',
      false,
      0,
      now()
    FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE r.name = 'anggota'
      -- Hanya yang belum ada record kehadiran
      AND NOT EXISTS (
        SELECT 1
        FROM public.komdis_attendances ka
        WHERE ka.event_id = NEW.id
          AND ka.user_id  = ur.user_id
      );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_komdis_event_completed
  AFTER UPDATE ON public.komdis_events
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_komdis_event_completed();