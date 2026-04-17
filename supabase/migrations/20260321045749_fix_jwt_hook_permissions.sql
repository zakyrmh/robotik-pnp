-- ================================================
-- Migration: Fix permissions untuk custom_access_token_hook
-- ================================================

-- Grant akses baca ke tabel yang diquery oleh hook
GRANT SELECT ON public.user_roles      TO supabase_auth_admin;
GRANT SELECT ON public.roles           TO supabase_auth_admin;
GRANT SELECT ON public.user_departments TO supabase_auth_admin;
GRANT SELECT ON public.departments     TO supabase_auth_admin;
GRANT SELECT ON public.user_divisions  TO supabase_auth_admin;
GRANT SELECT ON public.divisions       TO supabase_auth_admin;

-- Pastikan function bisa dieksekusi
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook(jsonb)
  FROM PUBLIC, authenticated, anon;