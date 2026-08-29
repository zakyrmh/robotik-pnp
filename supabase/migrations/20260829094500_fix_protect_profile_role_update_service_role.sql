-- Migration: Allow service_role key to update profile roles in protect_profile_role_update trigger
-- Problem: When Server Actions or Admin API use createAdminClient() (service_role key), auth.uid() is null,
-- causing public.get_my_role() to return null and triggering 'Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.'
-- Solution: Add a check for auth.role() = 'service_role' before checking public.get_my_role().

CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- 1. Izinkan jika eksekusi berasal dari fungsi RPC promote_legacy_member_to_anggota
        IF current_setting('app.allow_legacy_promotion', true) = 'true' THEN
            RETURN NEW;
        END IF;

        -- 2. Izinkan jika pemanggilan menggunakan service_role key (Server Admin Client / Admin API)
        IF auth.role() = 'service_role' THEN
            RETURN NEW;
        END IF;

        -- 3. Selain itu, hanya Super Admin yang boleh mengubah role
        IF public.get_my_role() IS DISTINCT FROM 'super-admin'::public.user_role THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;
