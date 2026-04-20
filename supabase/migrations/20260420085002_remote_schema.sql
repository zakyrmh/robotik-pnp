drop extension if exists "pg_net";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.assign_default_role()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_role_id UUID;
BEGIN
  -- Cari role_id dengan nama 'caang'
  SELECT id INTO v_role_id
  FROM public.roles
  WHERE name = 'caang'
  LIMIT 1;

  -- Hanya insert jika role ditemukan
  IF v_role_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_id)
    ON CONFLICT DO NOTHING; -- aman jika dipanggil dua kali
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error tapi jangan gagalkan insert user
    RAISE WARNING '[assign_default_role] Error assigning role to user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  claims        jsonb;
  v_user_id     uuid;
  v_roles       text[];
  v_departments text[];
  v_divisions   text[];
BEGIN
  v_user_id := (event->>'user_id')::uuid;

  SELECT ARRAY_AGG(r.name ORDER BY r.name)
  INTO v_roles
  FROM public.user_roles ur
  JOIN public.roles r ON r.id = ur.role_id
  WHERE ur.user_id = v_user_id;

  SELECT ARRAY_AGG(d.slug)
  INTO v_departments
  FROM public.user_departments ud
  JOIN public.departments d ON d.id = ud.department_id
  WHERE ud.user_id = v_user_id;

  SELECT ARRAY_AGG(dv.slug ORDER BY dv.slug)
  INTO v_divisions
  FROM public.user_divisions udv
  JOIN public.divisions dv ON dv.id = udv.division_id
  WHERE udv.user_id = v_user_id;

  claims := event->'claims';

  claims := jsonb_set(claims, '{app_roles}',
    COALESCE(to_jsonb(v_roles), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_departments}',
    COALESCE(to_jsonb(v_departments), '[]'::jsonb));

  claims := jsonb_set(claims, '{app_divisions}',
    COALESCE(to_jsonb(v_divisions), '[]'::jsonb));

  RETURN jsonb_set(event, '{claims}', claims);
END;
$function$
;


  create policy "education: admin read"
  on "public"."education_details"
  as permissive
  for select
  to public
using ((public.user_has_permission(auth.uid(), 'member:read'::character varying) OR public.user_has_permission(auth.uid(), 'or:manage'::character varying)));



