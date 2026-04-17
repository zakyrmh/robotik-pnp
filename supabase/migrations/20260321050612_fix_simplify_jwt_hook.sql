-- ================================================
-- Migration: Sederhanakan JWT hook sementara
-- (tanpa app_div_positions sampai kolom position confirmed)
-- ================================================

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claims        jsonb;
  v_user_id       uuid;
  v_roles       text[];
  v_departments text[];
  v_divisions   text[];
BEGIN
  v_user_id := (event->>'v_user_id')::uuid;

  SELECT ARRAY_AGG(r.name ORDER BY r.name)
  INTO v_roles
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.v_user_id = v_user_id;

  SELECT ARRAY_AGG(d.slug)
  INTO v_departments
  FROM public.user_departments ud
  JOIN public.departments d ON d.id = ud.department_id
  WHERE ud.v_user_id = v_user_id;

  SELECT ARRAY_AGG(dv.slug ORDER BY dv.slug)
  INTO v_divisions
  FROM public.user_divisions udv
  JOIN public.divisions dv ON dv.id = udv.division_id
  WHERE udv.v_user_id = v_user_id;

  claims := event->'claims';

  claims := jsonb_set(claims, '{app_roles}',
    COALESCE(to_jsonb(v_roles), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_departments}',
    COALESCE(to_jsonb(v_departments), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_divisions}',
    COALESCE(to_jsonb(v_divisions), '[]'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$$;