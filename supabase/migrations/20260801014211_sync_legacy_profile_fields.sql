-- Migration: Sync full_name and avatar_url from legacy_members to profiles on account claim
-- Saat anggota lama klaim akun, salin full_name dan avatar_url dari legacy_members ke profiles.

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
$function$;
