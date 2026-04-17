-- ================================================
-- Migration: Custom Access Token Hook
-- Embed roles, department slug, division slugs,
-- dan posisi divisi ke JWT claims
-- ================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims          jsonb;
  user_id         uuid;
  v_roles         text[];
  v_departments   text[];
  v_divisions     text[];
  v_div_positions text[];
BEGIN
  user_id := (event->>'user_id')::uuid;

  -- Ambil semua role name milik user
  SELECT ARRAY_AGG(r.name ORDER BY r.name)
  INTO v_roles
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = user_id;

  -- Ambil slug departemen jabatan user (maks 1, tapi pakai array untuk konsistensi)
  SELECT ARRAY_AGG(d.slug)
  INTO v_departments
  FROM public.user_departments ud
  JOIN public.departments d ON d.id = ud.department_id
  WHERE ud.user_id = user_id;

  -- Ambil slug divisi milik user
  SELECT ARRAY_AGG(dv.slug ORDER BY dv.slug)
  INTO v_divisions
  FROM public.user_divisions udv
  JOIN public.divisions dv ON dv.id = udv.division_id
  WHERE udv.user_id = user_id;

  -- Ambil posisi di setiap divisi (urutan sama dengan v_divisions)
  SELECT ARRAY_AGG(udv.position ORDER BY dv.slug)
  INTO v_div_positions
  FROM public.user_divisions udv
  JOIN public.divisions dv ON dv.id = udv.division_id
  WHERE udv.user_id = user_id;

  claims := event->'claims';

  claims := jsonb_set(claims, '{app_roles}',
    COALESCE(to_jsonb(v_roles), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_departments}',
    COALESCE(to_jsonb(v_departments), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_divisions}',
    COALESCE(to_jsonb(v_divisions), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_div_positions}',
    COALESCE(to_jsonb(v_div_positions), '[]'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;

-- Grant akses ke Supabase Auth
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook
  TO supabase_auth_admin;

REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook
  FROM PUBLIC;