-- ================================================
-- Migration: Embed user roles ke JWT custom claims
-- ================================================
-- Supabase membaca function custom_access_token_hook
-- untuk menambahkan custom claims ke JWT setiap kali
-- token di-generate atau di-refresh.
-- ================================================

-- Function yang dipanggil Supabase saat generate JWT
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims jsonb;
  user_roles text[];
BEGIN
  -- Ambil semua role slug milik user
  SELECT ARRAY_AGG(r.slug)
  INTO user_roles
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = (event->>'user_id')::uuid;

  claims := event->'claims';

  -- Embed roles ke dalam claims
  IF user_roles IS NOT NULL THEN
    claims := jsonb_set(claims, '{app_roles}', to_jsonb(user_roles));
  ELSE
    claims := jsonb_set(claims, '{app_roles}', '[]'::jsonb);
  END IF;

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant akses ke Supabase Auth untuk memanggil function ini
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM PUBLIC;