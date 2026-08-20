set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.get_unrecorded_activity_members(p_activity_id uuid)
 RETURNS TABLE(profile_id uuid)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
  SELECT p.id AS profile_id
  FROM public.profiles p
  JOIN public.registrations r ON r.profile_id = p.id AND r.deleted_at IS NULL
  WHERE p.role IN ('super-admin', 'admin-komdis', 'admin-or', 'admin-kestari', 'admin-divisi', 'anggota')
    AND NOT EXISTS (
      SELECT 1 
      FROM public.attendances a 
      WHERE a.activity_id = p_activity_id 
        AND a.profile_id = p.id
    );
$function$
;

CREATE OR REPLACE FUNCTION public.handle_activity_deletion_cleanup()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Hapus notifikasi jika row di-DELETE atau kolom deleted_at di-UPDATE (soft delete)
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND NEW.deleted_at IS NOT NULL AND OLD.deleted_at IS NULL) THEN
    DELETE FROM public.in_app_notifications
    WHERE reference_id = OLD.id
      AND reference_type = 'activity';
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_activity_notification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
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
$function$
;

CREATE OR REPLACE FUNCTION public.handle_user_email_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_legacy_member_to_anggota(user_id uuid, input_nim text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  legacy_record RECORD;
BEGIN
  -- Ambil data legacy member sekaligus (full_name, avatar_url) dan pastikan NIM ada
  SELECT full_name, avatar_url
    INTO legacy_record
    FROM public.legacy_members
   WHERE nim = input_nim;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Set flag transaksi lokal agar trigger izinkan perubahan role khusus dari fungsi ini
  PERFORM set_config('app.allow_legacy_promotion', 'true', true);

  -- Update role, nim, full_name, dan avatar_url dari data legacy ke profiles
  UPDATE public.profiles
  SET
    role       = 'anggota',
    is_onboarded = TRUE,
    nim        = input_nim,
    full_name  = COALESCE(legacy_record.full_name, full_name),
    avatar_url = COALESCE(legacy_record.avatar_url, avatar_url),
    updated_at = NOW()
  WHERE id = user_id;

  -- Hubungkan legacy_members ke profile yang baru diklaim
  UPDATE public.legacy_members
  SET profile_id = user_id
  WHERE nim = input_nim AND profile_id IS NULL;

  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Izinkan jika eksekusi berasal dari fungsi RPC promote_legacy_member_to_anggota
        IF current_setting('app.allow_legacy_promotion', true) = 'true' THEN
            RETURN NEW;
        END IF;

        -- Selain itu, hanya Super Admin yang boleh mengubah role
        IF public.get_my_role() IS DISTINCT FROM 'super-admin'::public.user_role THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
 RETURNS event_trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$
;



