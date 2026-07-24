drop policy "allow_select_divisions" on "public"."divisions";


  create table "public"."contact_messages" (
    "id" uuid not null default gen_random_uuid(),
    "full_name" text not null,
    "organization" text,
    "email" text not null,
    "category" text not null,
    "message" text not null,
    "status" text not null default 'unread'::text,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."contact_messages" enable row level security;


  create table "public"."departments" (
    "id" uuid not null default gen_random_uuid(),
    "name" text not null,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "category" text not null default 'departemen'::text
      );


alter table "public"."departments" enable row level security;


  create table "public"."membership_periods" (
    "id" uuid not null default gen_random_uuid(),
    "period_name" text not null,
    "is_active" boolean not null default false,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now()
      );


alter table "public"."membership_periods" enable row level security;


  create table "public"."organizational_histories" (
    "id" uuid not null default gen_random_uuid(),
    "period_id" uuid not null,
    "nim_member" text not null,
    "department_id" uuid not null,
    "sub_section" text,
    "sort_order" integer default 0,
    "created_at" timestamp with time zone not null default now(),
    "updated_at" timestamp with time zone not null default now(),
    "division_id" uuid,
    "role_name" text not null default 'Anggota'::text
      );


alter table "public"."organizational_histories" enable row level security;

alter table "public"."legacy_members" drop column "division";

alter table "public"."legacy_members" add column "avatar_url" text;

alter table "public"."legacy_members" add column "slug" text;

CREATE UNIQUE INDEX contact_messages_pkey ON public.contact_messages USING btree (id);

CREATE UNIQUE INDEX departments_name_key ON public.departments USING btree (name);

CREATE UNIQUE INDEX departments_pkey ON public.departments USING btree (id);

CREATE UNIQUE INDEX legacy_members_slug_key ON public.legacy_members USING btree (slug);

CREATE UNIQUE INDEX membership_periods_period_name_key ON public.membership_periods USING btree (period_name);

CREATE UNIQUE INDEX membership_periods_pkey ON public.membership_periods USING btree (id);

CREATE UNIQUE INDEX organizational_histories_pkey ON public.organizational_histories USING btree (id);

CREATE UNIQUE INDEX unique_member_assignment_per_period ON public.organizational_histories USING btree (period_id, nim_member, department_id, division_id);

alter table "public"."contact_messages" add constraint "contact_messages_pkey" PRIMARY KEY using index "contact_messages_pkey";

alter table "public"."departments" add constraint "departments_pkey" PRIMARY KEY using index "departments_pkey";

alter table "public"."membership_periods" add constraint "membership_periods_pkey" PRIMARY KEY using index "membership_periods_pkey";

alter table "public"."organizational_histories" add constraint "organizational_histories_pkey" PRIMARY KEY using index "organizational_histories_pkey";

alter table "public"."achievements" add constraint "achievements_level_check" CHECK ((level = ANY (ARRAY['Lokal'::text, 'Regional'::text, 'Nasional'::text, 'Internasional'::text]))) not valid;

alter table "public"."achievements" validate constraint "achievements_level_check";

alter table "public"."contact_messages" add constraint "contact_messages_status_check" CHECK ((status = ANY (ARRAY['unread'::text, 'read'::text, 'replied'::text, 'archived'::text]))) not valid;

alter table "public"."contact_messages" validate constraint "contact_messages_status_check";

alter table "public"."departments" add constraint "departments_category_check" CHECK ((category = ANY (ARRAY['presidium'::text, 'adhoc'::text, 'departemen'::text]))) not valid;

alter table "public"."departments" validate constraint "departments_category_check";

alter table "public"."departments" add constraint "departments_name_key" UNIQUE using index "departments_name_key";

alter table "public"."legacy_members" add constraint "legacy_members_slug_key" UNIQUE using index "legacy_members_slug_key";

alter table "public"."membership_periods" add constraint "membership_periods_period_name_key" UNIQUE using index "membership_periods_period_name_key";

alter table "public"."organizational_histories" add constraint "org_histories_department_fkey" FOREIGN KEY (department_id) REFERENCES public.departments(id) ON DELETE RESTRICT not valid;

alter table "public"."organizational_histories" validate constraint "org_histories_department_fkey";

alter table "public"."organizational_histories" add constraint "org_histories_division_id_fkey" FOREIGN KEY (division_id) REFERENCES public.divisions(id) ON DELETE SET NULL not valid;

alter table "public"."organizational_histories" validate constraint "org_histories_division_id_fkey";

alter table "public"."organizational_histories" add constraint "org_histories_member_fkey" FOREIGN KEY (nim_member) REFERENCES public.legacy_members(nim) ON UPDATE CASCADE ON DELETE CASCADE not valid;

alter table "public"."organizational_histories" validate constraint "org_histories_member_fkey";

alter table "public"."organizational_histories" add constraint "org_histories_period_fkey" FOREIGN KEY (period_id) REFERENCES public.membership_periods(id) ON DELETE CASCADE not valid;

alter table "public"."organizational_histories" validate constraint "org_histories_period_fkey";

alter table "public"."organizational_histories" add constraint "unique_member_assignment_per_period" UNIQUE using index "unique_member_assignment_per_period";

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    message_count INTEGER;
    limit_count CONSTANT INTEGER := 3; -- Maksimal 3 pesan per email
    time_window CONSTANT INTERVAL := INTERVAL '1 hour'; -- Rentang waktu 1 jam
BEGIN
    -- Menghitung jumlah pesan dari email yang sama dalam rentang waktu yang ditentukan
    SELECT COUNT(*) INTO message_count
    FROM public.contact_messages
    WHERE email = NEW.email
      AND created_at > now() - time_window;

    -- Jika melebihi batas, gagalkan operasi insert dengan Exception
    IF message_count >= limit_count THEN
        RAISE EXCEPTION 'Rate limit database terlampaui. Maksimal pengiriman pesan adalah % kali per % untuk email %.', 
            limit_count, time_window, NEW.email;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_unique_slug(v_name text, v_current_nim text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_base_slug text;
  v_final_slug text;
  v_counter integer := 1;
BEGIN
  v_base_slug := public.slugify(v_name);
  v_final_slug := v_base_slug;
  
  -- Lakukan pengecekan berulang (loop) selama slug sudah terpakai oleh NIM lain
  WHILE EXISTS (
    SELECT 1 FROM public.legacy_members 
    WHERE slug = v_final_slug AND nim <> v_current_nim
  ) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_base_slug || '-' || v_counter; -- Pasang angka terurut (cth: nama-2)
  END LOOP;
  
  RETURN v_final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_legacy_members_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Jalankan jika data baru masuk atau ada perubahan pada kolom full_name
  IF (TG_OP = 'INSERT') OR (NEW.full_name IS DISTINCT FROM OLD.full_name) THEN
    NEW.slug := public.get_next_unique_slug(NEW.full_name, NEW.nim);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.slugify(v_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      lower(v_text),
      '[^a-z0-9\s_-]', '', 'g' -- Hapus karakter spesial selain huruf, angka, spasi, dan strip
    ),
    '[\s_-]+', '-', 'g'       -- Ubah spasi ganda atau separator menjadi satu strip (-)
  );
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = now();
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

grant delete on table "public"."contact_messages" to "anon";

grant insert on table "public"."contact_messages" to "anon";

grant references on table "public"."contact_messages" to "anon";

grant select on table "public"."contact_messages" to "anon";

grant trigger on table "public"."contact_messages" to "anon";

grant truncate on table "public"."contact_messages" to "anon";

grant update on table "public"."contact_messages" to "anon";

grant delete on table "public"."contact_messages" to "authenticated";

grant insert on table "public"."contact_messages" to "authenticated";

grant references on table "public"."contact_messages" to "authenticated";

grant select on table "public"."contact_messages" to "authenticated";

grant trigger on table "public"."contact_messages" to "authenticated";

grant truncate on table "public"."contact_messages" to "authenticated";

grant update on table "public"."contact_messages" to "authenticated";

grant delete on table "public"."contact_messages" to "service_role";

grant insert on table "public"."contact_messages" to "service_role";

grant references on table "public"."contact_messages" to "service_role";

grant select on table "public"."contact_messages" to "service_role";

grant trigger on table "public"."contact_messages" to "service_role";

grant truncate on table "public"."contact_messages" to "service_role";

grant update on table "public"."contact_messages" to "service_role";

grant delete on table "public"."departments" to "anon";

grant insert on table "public"."departments" to "anon";

grant references on table "public"."departments" to "anon";

grant select on table "public"."departments" to "anon";

grant trigger on table "public"."departments" to "anon";

grant truncate on table "public"."departments" to "anon";

grant update on table "public"."departments" to "anon";

grant delete on table "public"."departments" to "authenticated";

grant insert on table "public"."departments" to "authenticated";

grant references on table "public"."departments" to "authenticated";

grant select on table "public"."departments" to "authenticated";

grant trigger on table "public"."departments" to "authenticated";

grant truncate on table "public"."departments" to "authenticated";

grant update on table "public"."departments" to "authenticated";

grant delete on table "public"."departments" to "service_role";

grant insert on table "public"."departments" to "service_role";

grant references on table "public"."departments" to "service_role";

grant select on table "public"."departments" to "service_role";

grant trigger on table "public"."departments" to "service_role";

grant truncate on table "public"."departments" to "service_role";

grant update on table "public"."departments" to "service_role";

grant delete on table "public"."membership_periods" to "anon";

grant insert on table "public"."membership_periods" to "anon";

grant references on table "public"."membership_periods" to "anon";

grant select on table "public"."membership_periods" to "anon";

grant trigger on table "public"."membership_periods" to "anon";

grant truncate on table "public"."membership_periods" to "anon";

grant update on table "public"."membership_periods" to "anon";

grant delete on table "public"."membership_periods" to "authenticated";

grant insert on table "public"."membership_periods" to "authenticated";

grant references on table "public"."membership_periods" to "authenticated";

grant select on table "public"."membership_periods" to "authenticated";

grant trigger on table "public"."membership_periods" to "authenticated";

grant truncate on table "public"."membership_periods" to "authenticated";

grant update on table "public"."membership_periods" to "authenticated";

grant delete on table "public"."membership_periods" to "service_role";

grant insert on table "public"."membership_periods" to "service_role";

grant references on table "public"."membership_periods" to "service_role";

grant select on table "public"."membership_periods" to "service_role";

grant trigger on table "public"."membership_periods" to "service_role";

grant truncate on table "public"."membership_periods" to "service_role";

grant update on table "public"."membership_periods" to "service_role";

grant delete on table "public"."organizational_histories" to "anon";

grant insert on table "public"."organizational_histories" to "anon";

grant references on table "public"."organizational_histories" to "anon";

grant select on table "public"."organizational_histories" to "anon";

grant trigger on table "public"."organizational_histories" to "anon";

grant truncate on table "public"."organizational_histories" to "anon";

grant update on table "public"."organizational_histories" to "anon";

grant delete on table "public"."organizational_histories" to "authenticated";

grant insert on table "public"."organizational_histories" to "authenticated";

grant references on table "public"."organizational_histories" to "authenticated";

grant select on table "public"."organizational_histories" to "authenticated";

grant trigger on table "public"."organizational_histories" to "authenticated";

grant truncate on table "public"."organizational_histories" to "authenticated";

grant update on table "public"."organizational_histories" to "authenticated";

grant delete on table "public"."organizational_histories" to "service_role";

grant insert on table "public"."organizational_histories" to "service_role";

grant references on table "public"."organizational_histories" to "service_role";

grant select on table "public"."organizational_histories" to "service_role";

grant trigger on table "public"."organizational_histories" to "service_role";

grant truncate on table "public"."organizational_histories" to "service_role";

grant update on table "public"."organizational_histories" to "service_role";


  create policy "allow_admin_delete_articles"
  on "public"."articles"
  as permissive
  for delete
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_admin_insert_articles"
  on "public"."articles"
  as permissive
  for insert
  to authenticated
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_admin_select_all_articles"
  on "public"."articles"
  as permissive
  for select
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_admin_update_articles"
  on "public"."articles"
  as permissive
  for update
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])))
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_public_select_published_articles"
  on "public"."articles"
  as permissive
  for select
  to public
using (((is_published = true) AND (deleted_at IS NULL)));



  create policy "allow_select_own_articles"
  on "public"."articles"
  as permissive
  for select
  to authenticated
using ((auth.uid() = author_id));



  create policy "Allow admins to delete contact messages"
  on "public"."contact_messages"
  as permissive
  for delete
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role]))))));



  create policy "Allow admins to select contact messages"
  on "public"."contact_messages"
  as permissive
  for select
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role]))))));



  create policy "Allow admins to update contact messages"
  on "public"."contact_messages"
  as permissive
  for update
  to authenticated
using ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role]))))))
with check ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.role = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role]))))));



  create policy "Allow public insert contact messages"
  on "public"."contact_messages"
  as permissive
  for insert
  to public
with check (true);



  create policy "allow_admin_write_departments"
  on "public"."departments"
  as permissive
  for all
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])))
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_anon_select_departments"
  on "public"."departments"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "allow_select_departments"
  on "public"."departments"
  as permissive
  for select
  to authenticated
using (true);



  create policy "allow_admin_write_legacy_members"
  on "public"."legacy_members"
  as permissive
  for all
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])))
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_anon_select_legacy_members_public_fields"
  on "public"."legacy_members"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "allow_admin_write_periods"
  on "public"."membership_periods"
  as permissive
  for all
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])))
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_anon_select_membership_periods"
  on "public"."membership_periods"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "allow_select_periods"
  on "public"."membership_periods"
  as permissive
  for select
  to authenticated
using (true);



  create policy "allow_admin_write_org_histories"
  on "public"."organizational_histories"
  as permissive
  for all
  to authenticated
using ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])))
with check ((public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])));



  create policy "allow_anon_select_org_histories"
  on "public"."organizational_histories"
  as permissive
  for select
  to anon, authenticated
using (true);



  create policy "allow_select_org_histories"
  on "public"."organizational_histories"
  as permissive
  for select
  to authenticated
using (true);



  create policy "allow_select_divisions"
  on "public"."divisions"
  as permissive
  for select
  to anon, authenticated
using (true);


CREATE TRIGGER articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_contact_messages_rate_limit BEFORE INSERT ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.check_contact_message_rate_limit();

CREATE TRIGGER update_contact_messages_updated_at BEFORE UPDATE ON public.contact_messages FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER trg_generate_legacy_members_slug BEFORE INSERT OR UPDATE ON public.legacy_members FOR EACH ROW EXECUTE FUNCTION public.handle_legacy_members_slug();


