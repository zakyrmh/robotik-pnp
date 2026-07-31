-- Migration: Fix legacy member promotion RLS trigger protection
-- Allows promote_legacy_member_to_anggota SECURITY DEFINER function to set role = 'anggota'
-- without being blocked by protect_profile_role_update trigger.

CREATE OR REPLACE FUNCTION public.promote_legacy_member_to_anggota(user_id uuid, input_nim text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  legacy_exists BOOLEAN;
BEGIN
  -- Cek apakah NIM ada di legacy_members
  SELECT EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) INTO legacy_exists;
  
  IF NOT legacy_exists THEN
    RETURN FALSE;
  END IF;

  -- Set flag transaksi lokal agar trigger izinkan perubahan role khusus dari fungsi ini
  PERFORM set_config('app.allow_legacy_promotion', 'true', true);
  
  -- Update role dari caang ke anggota dan set is_onboarded = true
  UPDATE public.profiles 
  SET 
    role = 'anggota',
    is_onboarded = TRUE,
    nim = input_nim,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Update profile_id di legacy_members jika belum di-set
  UPDATE public.legacy_members
  SET profile_id = user_id
  WHERE nim = input_nim AND profile_id IS NULL;
  
  RETURN TRUE;
END;
$function$;

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
$function$;
