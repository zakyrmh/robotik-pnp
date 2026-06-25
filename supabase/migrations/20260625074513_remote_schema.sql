


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."activity_target" AS ENUM (
    'caang',
    'anggota'
);


ALTER TYPE "public"."activity_target" OWNER TO "postgres";


CREATE TYPE "public"."attendance_status" AS ENUM (
    'hadir',
    'izin',
    'sakit',
    'alfa',
    'telat'
);


ALTER TYPE "public"."attendance_status" OWNER TO "postgres";


CREATE TYPE "public"."gender_type" AS ENUM (
    'L',
    'P'
);


ALTER TYPE "public"."gender_type" OWNER TO "postgres";


CREATE TYPE "public"."piket_day" AS ENUM (
    'Senin',
    'Selasa',
    'Rabu',
    'Kamis',
    'Jumat',
    'Sabtu',
    'Minggu'
);


ALTER TYPE "public"."piket_day" OWNER TO "postgres";


CREATE TYPE "public"."reg_status" AS ENUM (
    'process',
    'pending',
    'verified',
    'rejected'
);


ALTER TYPE "public"."reg_status" OWNER TO "postgres";


CREATE TYPE "public"."task_status" AS ENUM (
    'belum_selesai',
    'diperiksa',
    'selesai',
    'revisi'
);


ALTER TYPE "public"."task_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'super-admin',
    'admin-or',
    'admin-komdis',
    'anggota',
    'caang'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_legacy_member"("input_nim" "text") RETURNS TABLE("is_legacy" boolean, "member_data" "jsonb")
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) AS is_legacy,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) THEN
        (SELECT row_to_json(lm.*)::jsonb 
         FROM public.legacy_members lm 
         WHERE lm.nim = input_nim)
      ELSE NULL
    END AS member_data;
END;
$$;


ALTER FUNCTION "public"."check_legacy_member"("input_nim" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."check_registration_completeness"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  -- Hanya berlaku saat status berubah menjadi 'verified'
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    IF NEW.high_school       IS NULL OR NEW.high_school       = '' OR
       NEW.current_class     IS NULL OR NEW.current_class     = '' OR
       NEW.motivation        IS NULL OR NEW.motivation        = '' OR
       NEW.photo_url         IS NULL OR NEW.photo_url         = '' OR
       NEW.payment_proof_url IS NULL OR NEW.payment_proof_url = '' OR
       NEW.payment_method    IS NULL OR NEW.payment_method    = ''
    THEN
      RAISE EXCEPTION 'Registrasi belum lengkap. Pastikan semua step telah diisi sebelum diverifikasi.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."check_registration_completeness"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_my_role"() RETURNS "public"."user_role"
    LANGUAGE "sql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;


ALTER FUNCTION "public"."get_my_role"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, nim)
  VALUES (NEW.id, NEW.email, 'caang', (NEW.raw_user_meta_data->>'nim')::TEXT);
  RETURN NEW;
END; $$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_registration_approval"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
BEGIN
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    UPDATE public.profiles
    SET is_onboarded = true
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_registration_approval"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    SET "search_path" TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."promote_legacy_member_to_anggota"("user_id" "uuid", "input_nim" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
  legacy_exists BOOLEAN;
BEGIN
  -- Cek apakah NIM ada di legacy_members
  SELECT EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) INTO legacy_exists;
  
  IF NOT legacy_exists THEN
    RETURN FALSE;
  END IF;
  
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
$$;


ALTER FUNCTION "public"."promote_legacy_member_to_anggota"("user_id" "uuid", "input_nim" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rls_auto_enable"() RETURNS "event_trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'pg_catalog'
    AS $$
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
$$;


ALTER FUNCTION "public"."rls_auto_enable"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."achievements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "year" integer NOT NULL,
    "level" "text" NOT NULL,
    "division_id" "uuid",
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."achievements" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."activities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "description" "text",
    "start_date" timestamp with time zone NOT NULL,
    "end_date" timestamp with time zone NOT NULL,
    "location" "text",
    "banner_url" "text",
    "target_audience" "public"."activity_target" DEFAULT 'caang'::"public"."activity_target" NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone,
    CONSTRAINT "chk_activity_dates" CHECK (("end_date" >= "start_date"))
);


ALTER TABLE "public"."activities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "excerpt" "text",
    "content" "text" NOT NULL,
    "cover_image_url" "text",
    "category" "text" NOT NULL,
    "author_id" "uuid" NOT NULL,
    "is_published" boolean DEFAULT false NOT NULL,
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "deleted_at" timestamp with time zone
);


ALTER TABLE "public"."articles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."attendances" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "activity_id" "uuid",
    "profile_id" "uuid",
    "check_in_at" timestamp with time zone DEFAULT "now"(),
    "status" "public"."attendance_status" DEFAULT 'alfa'::"public"."attendance_status" NOT NULL,
    "notes" "text",
    "proof_url" "text",
    "verified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."attendances" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."caang_groups" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "mentor_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "parent_id" "uuid"
);


ALTER TABLE "public"."caang_groups" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."divisions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(50) NOT NULL,
    "description" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "slug" "text" NOT NULL,
    "short_description" "text" NOT NULL,
    "badge_label" "text",
    "badge_color" "text",
    "accent_color" "text",
    "sort_order" integer DEFAULT 0,
    "is_active" boolean DEFAULT true NOT NULL,
    "tags" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL
);


ALTER TABLE "public"."divisions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."group_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "group_id" "uuid",
    "profile_id" "uuid",
    "joined_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."group_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."internships" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid",
    "division_id" "uuid",
    "mentor_id" "uuid",
    "task_description" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."internships" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."legacy_members" (
    "profile_id" "uuid",
    "study_program_id" "uuid",
    "division" "text",
    "nim" "text" NOT NULL,
    "full_name" "text" NOT NULL,
    "gender" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "legacy_members_gender_check" CHECK (("gender" = ANY (ARRAY['L'::"text", 'P'::"text"])))
);


ALTER TABLE "public"."legacy_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."majors" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."majors" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."or_settings" (
    "id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000000'::"uuid" NOT NULL,
    "periode_recruitment" "text" DEFAULT 'OR-21'::"text" NOT NULL,
    "status_pendaftaran" boolean DEFAULT false NOT NULL,
    "tanggal_mulai" timestamp with time zone,
    "tanggal_selesai" timestamp with time zone,
    "biaya_pendaftaran" integer DEFAULT 10000 NOT NULL,
    "rekening_penerima" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "kontak_panitia" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "link_komunitas" "jsonb" DEFAULT '{"discord_url": "", "whatsapp_url": ""}'::"jsonb" NOT NULL,
    "timeline" "jsonb" DEFAULT '[]'::"jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_single_row" CHECK (("id" = '00000000-0000-0000-0000-000000000000'::"uuid"))
);


ALTER TABLE "public"."or_settings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."piket_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid",
    "reported_by" "uuid",
    "duty_date" "date" DEFAULT CURRENT_DATE NOT NULL,
    "notes" "text" NOT NULL,
    "proof_image_url" "text" NOT NULL,
    "is_verified" boolean DEFAULT false,
    "verified_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."piket_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."piket_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "schedule_id" "uuid",
    "profile_id" "uuid"
);


ALTER TABLE "public"."piket_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."piket_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "day" "public"."piket_day" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."piket_schedules" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "nim" "text",
    "role" "public"."user_role" DEFAULT 'caang'::"public"."user_role" NOT NULL,
    "is_onboarded" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."registrations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "study_program_id" "uuid",
    "full_name" "text" NOT NULL,
    "nickname" "text" NOT NULL,
    "gender" "public"."gender_type" NOT NULL,
    "pob" "text" NOT NULL,
    "dob" "date" NOT NULL,
    "phone_number" "text" NOT NULL,
    "origin_address" "text" NOT NULL,
    "domicile_address" "text" NOT NULL,
    "high_school" "text",
    "current_class" "text",
    "entry_year" integer NOT NULL,
    "motivation" "text",
    "org_experience" "text",
    "achievements" "text",
    "photo_url" "text",
    "ktm_url" "text",
    "proof_follow_robotik" "text",
    "proof_follow_mrc" "text",
    "proof_sub_yt" "text",
    "payment_proof_url" "text",
    "payment_method" "text",
    "status" "public"."reg_status" DEFAULT 'process'::"public"."reg_status",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "deleted_at" timestamp with time zone,
    "delete_reason" "text"
);


ALTER TABLE "public"."registrations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."study_programs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "major_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "degree" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."study_programs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."task_submissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "task_id" "uuid",
    "profile_id" "uuid",
    "submission_url" "text",
    "notes" "text",
    "status" "public"."task_status" DEFAULT 'belum_selesai'::"public"."task_status",
    "feedback" "text",
    "grade" integer,
    "graded_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "chk_grade" CHECK ((("grade" >= 0) AND ("grade" <= 100)))
);


ALTER TABLE "public"."task_submissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."tasks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying(255) NOT NULL,
    "description" "text" NOT NULL,
    "due_date" timestamp with time zone NOT NULL,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."tasks" OWNER TO "postgres";


ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."caang_groups"
    ADD CONSTRAINT "caang_groups_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."divisions"
    ADD CONSTRAINT "divisions_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."divisions"
    ADD CONSTRAINT "divisions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."divisions"
    ADD CONSTRAINT "divisions_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."legacy_members"
    ADD CONSTRAINT "legacy_members_pkey" PRIMARY KEY ("nim");



ALTER TABLE ONLY "public"."legacy_members"
    ADD CONSTRAINT "legacy_members_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."majors"
    ADD CONSTRAINT "majors_name_key" UNIQUE ("name");



ALTER TABLE ONLY "public"."majors"
    ADD CONSTRAINT "majors_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."or_settings"
    ADD CONSTRAINT "or_settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."piket_logs"
    ADD CONSTRAINT "piket_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."piket_members"
    ADD CONSTRAINT "piket_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."piket_schedules"
    ADD CONSTRAINT "piket_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_nim_key" UNIQUE ("nim");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."study_programs"
    ADD CONSTRAINT "study_programs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_submissions"
    ADD CONSTRAINT "task_submissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."task_submissions"
    ADD CONSTRAINT "unique_caang_task" UNIQUE ("task_id", "profile_id");



ALTER TABLE ONLY "public"."piket_schedules"
    ADD CONSTRAINT "unique_day" UNIQUE ("day");



ALTER TABLE ONLY "public"."piket_members"
    ADD CONSTRAINT "unique_member_schedule" UNIQUE ("schedule_id", "profile_id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "unique_user_activity" UNIQUE ("activity_id", "profile_id");



CREATE INDEX "idx_achievements_division_id" ON "public"."achievements" USING "btree" ("division_id");



CREATE INDEX "idx_achievements_year" ON "public"."achievements" USING "btree" ("year" DESC);



CREATE INDEX "idx_activities_dates" ON "public"."activities" USING "btree" ("start_date", "end_date");



CREATE INDEX "idx_activities_deleted_at" ON "public"."activities" USING "btree" ("deleted_at");



CREATE INDEX "idx_activities_target" ON "public"."activities" USING "btree" ("target_audience");



CREATE INDEX "idx_articles_published" ON "public"."articles" USING "btree" ("is_published", "published_at" DESC);



CREATE INDEX "idx_attendances_activity_id" ON "public"."attendances" USING "btree" ("activity_id");



CREATE INDEX "idx_attendances_profile_id" ON "public"."attendances" USING "btree" ("profile_id");



CREATE INDEX "idx_caang_groups_parent_id" ON "public"."caang_groups" USING "btree" ("parent_id");



CREATE INDEX "idx_group_members_group_id" ON "public"."group_members" USING "btree" ("group_id");



CREATE INDEX "idx_internships_division_id" ON "public"."internships" USING "btree" ("division_id");



CREATE INDEX "idx_legacy_nim" ON "public"."legacy_members" USING "btree" ("nim");



CREATE INDEX "idx_piket_logs_schedule_id" ON "public"."piket_logs" USING "btree" ("schedule_id");



CREATE INDEX "idx_piket_members_schedule_id" ON "public"."piket_members" USING "btree" ("schedule_id");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_reg_profile_id" ON "public"."registrations" USING "btree" ("profile_id");



CREATE INDEX "idx_reg_status" ON "public"."registrations" USING "btree" ("status");



CREATE INDEX "idx_registrations_deleted_at" ON "public"."registrations" USING "btree" ("deleted_at") WHERE ("deleted_at" IS NULL);



CREATE INDEX "idx_study_programs_major_id" ON "public"."study_programs" USING "btree" ("major_id");



CREATE INDEX "idx_task_submissions_profile_id" ON "public"."task_submissions" USING "btree" ("profile_id");



CREATE INDEX "idx_task_submissions_task_id" ON "public"."task_submissions" USING "btree" ("task_id");



CREATE OR REPLACE TRIGGER "activities_updated_at" BEFORE UPDATE ON "public"."activities" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "on_registration_approved" AFTER UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_registration_approval"();



CREATE OR REPLACE TRIGGER "or_settings_updated_at" BEFORE UPDATE ON "public"."or_settings" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "registrations_check_completeness" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."check_registration_completeness"();



CREATE OR REPLACE TRIGGER "registrations_updated_at" BEFORE UPDATE ON "public"."registrations" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



CREATE OR REPLACE TRIGGER "task_submissions_updated_at" BEFORE UPDATE ON "public"."task_submissions" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();



ALTER TABLE ONLY "public"."achievements"
    ADD CONSTRAINT "achievements_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id");



ALTER TABLE ONLY "public"."activities"
    ADD CONSTRAINT "activities_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."attendances"
    ADD CONSTRAINT "attendances_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."caang_groups"
    ADD CONSTRAINT "caang_groups_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."caang_groups"
    ADD CONSTRAINT "caang_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "public"."caang_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "public"."caang_groups"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."group_members"
    ADD CONSTRAINT "group_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_division_id_fkey" FOREIGN KEY ("division_id") REFERENCES "public"."divisions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_mentor_id_fkey" FOREIGN KEY ("mentor_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."internships"
    ADD CONSTRAINT "internships_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_members"
    ADD CONSTRAINT "legacy_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."legacy_members"
    ADD CONSTRAINT "legacy_members_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id");



ALTER TABLE ONLY "public"."piket_logs"
    ADD CONSTRAINT "piket_logs_reported_by_fkey" FOREIGN KEY ("reported_by") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piket_logs"
    ADD CONSTRAINT "piket_logs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."piket_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piket_logs"
    ADD CONSTRAINT "piket_logs_verified_by_fkey" FOREIGN KEY ("verified_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."piket_members"
    ADD CONSTRAINT "piket_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."piket_members"
    ADD CONSTRAINT "piket_members_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "public"."piket_schedules"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."registrations"
    ADD CONSTRAINT "registrations_study_program_id_fkey" FOREIGN KEY ("study_program_id") REFERENCES "public"."study_programs"("id");



ALTER TABLE ONLY "public"."study_programs"
    ADD CONSTRAINT "study_programs_major_id_fkey" FOREIGN KEY ("major_id") REFERENCES "public"."majors"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_submissions"
    ADD CONSTRAINT "task_submissions_graded_by_fkey" FOREIGN KEY ("graded_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."task_submissions"
    ADD CONSTRAINT "task_submissions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."task_submissions"
    ADD CONSTRAINT "task_submissions_task_id_fkey" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."tasks"
    ADD CONSTRAINT "tasks_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



CREATE POLICY "Admins can view legacy members" ON "public"."legacy_members" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "Allow public read-only access to majors" ON "public"."majors" FOR SELECT USING (true);



CREATE POLICY "Allow public read-only access to study programs" ON "public"."study_programs" FOR SELECT USING (true);



ALTER TABLE "public"."achievements" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."activities" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "admin_view_all" ON "public"."profiles" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "admins_view_all_reg" ON "public"."registrations" FOR SELECT USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "allow_admin_write_activities" ON "public"."activities" USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"])));



CREATE POLICY "allow_admin_write_divisions" ON "public"."divisions" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "allow_admin_write_piket_members" ON "public"."piket_members" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "allow_admin_write_piket_schedules" ON "public"."piket_schedules" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role"])));



CREATE POLICY "allow_delete_attendances" ON "public"."attendances" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



CREATE POLICY "allow_delete_caang_groups" ON "public"."caang_groups" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



CREATE POLICY "allow_delete_group_members" ON "public"."group_members" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_delete_internships" ON "public"."internships" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_delete_piket_logs" ON "public"."piket_logs" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



CREATE POLICY "allow_delete_task_submissions" ON "public"."task_submissions" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



CREATE POLICY "allow_delete_tasks" ON "public"."tasks" FOR DELETE TO "authenticated" USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



CREATE POLICY "allow_insert_attendances" ON "public"."attendances" FOR INSERT TO "authenticated" WITH CHECK ((("auth"."uid"() = "profile_id") OR ("public"."get_my_role"() = ANY (ARRAY['admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))));



CREATE POLICY "allow_insert_caang_groups" ON "public"."caang_groups" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_insert_group_members" ON "public"."group_members" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_insert_internships" ON "public"."internships" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_insert_piket_logs" ON "public"."piket_logs" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_my_role"() = 'anggota'::"public"."user_role") AND ("reported_by" = "auth"."uid"()) AND (EXISTS ( SELECT 1
   FROM ("public"."piket_members" "pm"
     JOIN "public"."piket_schedules" "ps" ON (("pm"."schedule_id" = "ps"."id")))
  WHERE (("pm"."profile_id" = "auth"."uid"()) AND ("ps"."day" =
        CASE EXTRACT(isodow FROM "piket_logs"."duty_date")
            WHEN 1 THEN 'Senin'::"public"."piket_day"
            WHEN 2 THEN 'Selasa'::"public"."piket_day"
            WHEN 3 THEN 'Rabu'::"public"."piket_day"
            WHEN 4 THEN 'Kamis'::"public"."piket_day"
            WHEN 5 THEN 'Jumat'::"public"."piket_day"
            WHEN 6 THEN 'Sabtu'::"public"."piket_day"
            WHEN 7 THEN 'Minggu'::"public"."piket_day"
            ELSE NULL::"public"."piket_day"
        END))))));



CREATE POLICY "allow_insert_task_submissions" ON "public"."task_submissions" FOR INSERT TO "authenticated" WITH CHECK ((("public"."get_my_role"() = 'caang'::"public"."user_role") AND ("auth"."uid"() = "profile_id")));



CREATE POLICY "allow_insert_tasks" ON "public"."tasks" FOR INSERT TO "authenticated" WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_select_activities" ON "public"."activities" FOR SELECT USING (((("public"."get_my_role"() = 'caang'::"public"."user_role") AND ("target_audience" = 'caang'::"public"."activity_target")) OR (("public"."get_my_role"() = ANY (ARRAY['anggota'::"public"."user_role", 'admin-or'::"public"."user_role", 'super-admin'::"public"."user_role", 'admin-komdis'::"public"."user_role"])) AND ("target_audience" = 'anggota'::"public"."activity_target")) OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_select_attendances" ON "public"."attendances" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "profile_id") OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_select_authenticated" ON "public"."or_settings" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_caang_groups" ON "public"."caang_groups" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_divisions" ON "public"."divisions" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_group_members" ON "public"."group_members" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "profile_id") OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_select_internships" ON "public"."internships" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "profile_id") OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_select_piket_logs" ON "public"."piket_logs" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_piket_members" ON "public"."piket_members" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_piket_schedules" ON "public"."piket_schedules" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "allow_select_task_submissions" ON "public"."task_submissions" FOR SELECT TO "authenticated" USING ((("auth"."uid"() = "profile_id") OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_select_tasks" ON "public"."tasks" FOR SELECT TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['caang'::"public"."user_role", 'super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"])));



CREATE POLICY "allow_update_attendances" ON "public"."attendances" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-komdis'::"public"."user_role", 'admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_update_caang_groups" ON "public"."caang_groups" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_update_group_members" ON "public"."group_members" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_update_internships" ON "public"."internships" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_update_piket_logs" ON "public"."piket_logs" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-komdis'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-komdis'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_update_task_submissions" ON "public"."task_submissions" FOR UPDATE TO "authenticated" USING (((("public"."get_my_role"() = 'caang'::"public"."user_role") AND ("auth"."uid"() = "profile_id")) OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"])))) WITH CHECK (((("public"."get_my_role"() = 'caang'::"public"."user_role") AND ("auth"."uid"() = "profile_id")) OR ("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role"]))));



CREATE POLICY "allow_update_tasks" ON "public"."tasks" FOR UPDATE TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'admin-komdis'::"public"."user_role", 'super-admin'::"public"."user_role"])));



CREATE POLICY "allow_write_admin_or" ON "public"."or_settings" TO "authenticated" USING (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"]))) WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['admin-or'::"public"."user_role", 'super-admin'::"public"."user_role"])));



ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."attendances" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."caang_groups" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."divisions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."group_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."internships" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."legacy_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."majors" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "manage_own_registration" ON "public"."registrations" USING (("auth"."uid"() = "profile_id"));



ALTER TABLE "public"."or_settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."piket_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."piket_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."piket_schedules" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."registrations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."study_programs" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "super_admin_update_all" ON "public"."profiles" FOR UPDATE USING (("public"."get_my_role"() = 'super-admin'::"public"."user_role"));



ALTER TABLE "public"."task_submissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tasks" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "update_own" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id")) WITH CHECK (("auth"."uid"() = "id"));



CREATE POLICY "view_own" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."check_legacy_member"("input_nim" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_legacy_member"("input_nim" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_legacy_member"("input_nim" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_registration_completeness"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_registration_completeness"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_registration_completeness"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_my_role"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_my_role"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_registration_approval"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_registration_approval"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_registration_approval"() TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."promote_legacy_member_to_anggota"("user_id" "uuid", "input_nim" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."promote_legacy_member_to_anggota"("user_id" "uuid", "input_nim" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."promote_legacy_member_to_anggota"("user_id" "uuid", "input_nim" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "anon";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rls_auto_enable"() TO "service_role";


















GRANT ALL ON TABLE "public"."achievements" TO "anon";
GRANT ALL ON TABLE "public"."achievements" TO "authenticated";
GRANT ALL ON TABLE "public"."achievements" TO "service_role";



GRANT ALL ON TABLE "public"."activities" TO "anon";
GRANT ALL ON TABLE "public"."activities" TO "authenticated";
GRANT ALL ON TABLE "public"."activities" TO "service_role";



GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";



GRANT ALL ON TABLE "public"."attendances" TO "anon";
GRANT ALL ON TABLE "public"."attendances" TO "authenticated";
GRANT ALL ON TABLE "public"."attendances" TO "service_role";



GRANT ALL ON TABLE "public"."caang_groups" TO "anon";
GRANT ALL ON TABLE "public"."caang_groups" TO "authenticated";
GRANT ALL ON TABLE "public"."caang_groups" TO "service_role";



GRANT ALL ON TABLE "public"."divisions" TO "anon";
GRANT ALL ON TABLE "public"."divisions" TO "authenticated";
GRANT ALL ON TABLE "public"."divisions" TO "service_role";



GRANT ALL ON TABLE "public"."group_members" TO "anon";
GRANT ALL ON TABLE "public"."group_members" TO "authenticated";
GRANT ALL ON TABLE "public"."group_members" TO "service_role";



GRANT ALL ON TABLE "public"."internships" TO "anon";
GRANT ALL ON TABLE "public"."internships" TO "authenticated";
GRANT ALL ON TABLE "public"."internships" TO "service_role";



GRANT ALL ON TABLE "public"."legacy_members" TO "anon";
GRANT ALL ON TABLE "public"."legacy_members" TO "authenticated";
GRANT ALL ON TABLE "public"."legacy_members" TO "service_role";



GRANT ALL ON TABLE "public"."majors" TO "anon";
GRANT ALL ON TABLE "public"."majors" TO "authenticated";
GRANT ALL ON TABLE "public"."majors" TO "service_role";



GRANT ALL ON TABLE "public"."or_settings" TO "anon";
GRANT ALL ON TABLE "public"."or_settings" TO "authenticated";
GRANT ALL ON TABLE "public"."or_settings" TO "service_role";



GRANT ALL ON TABLE "public"."piket_logs" TO "anon";
GRANT ALL ON TABLE "public"."piket_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."piket_logs" TO "service_role";



GRANT ALL ON TABLE "public"."piket_members" TO "anon";
GRANT ALL ON TABLE "public"."piket_members" TO "authenticated";
GRANT ALL ON TABLE "public"."piket_members" TO "service_role";



GRANT ALL ON TABLE "public"."piket_schedules" TO "anon";
GRANT ALL ON TABLE "public"."piket_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."piket_schedules" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."registrations" TO "anon";
GRANT ALL ON TABLE "public"."registrations" TO "authenticated";
GRANT ALL ON TABLE "public"."registrations" TO "service_role";



GRANT ALL ON TABLE "public"."study_programs" TO "anon";
GRANT ALL ON TABLE "public"."study_programs" TO "authenticated";
GRANT ALL ON TABLE "public"."study_programs" TO "service_role";



GRANT ALL ON TABLE "public"."task_submissions" TO "anon";
GRANT ALL ON TABLE "public"."task_submissions" TO "authenticated";
GRANT ALL ON TABLE "public"."task_submissions" TO "service_role";



GRANT ALL ON TABLE "public"."tasks" TO "anon";
GRANT ALL ON TABLE "public"."tasks" TO "authenticated";
GRANT ALL ON TABLE "public"."tasks" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";



































drop extension if exists "pg_net";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


  create policy "Admins can view all registration files"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'registrations'::text) AND (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role]))));



  create policy "Allow admins to delete activity banners"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'activity-banners'::text) AND (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))));



  create policy "Allow admins to update activity banners"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'activity-banners'::text) AND (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))));



  create policy "Allow admins to upload activity banners"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'activity-banners'::text) AND (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role]))));



  create policy "Allow anggota to upload piket proofs"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'piket-proofs'::text) AND (public.get_my_role() = 'anggota'::public.user_role)));



  create policy "Allow authenticated users to view piket proofs"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using ((bucket_id = 'piket-proofs'::text));



  create policy "Allow caang to upload task submissions"
  on "storage"."objects"
  as permissive
  for insert
  to authenticated
with check (((bucket_id = 'task-submissions'::text) AND (public.get_my_role() = 'caang'::public.user_role)));



  create policy "Allow owner or admins to update piket proofs"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'piket-proofs'::text) AND ((owner = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-komdis'::public.user_role])))));



  create policy "Allow owner or admins to update task submissions"
  on "storage"."objects"
  as permissive
  for update
  to authenticated
using (((bucket_id = 'task-submissions'::text) AND ((owner = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role])))));



  create policy "Allow owner or admins to view task submissions"
  on "storage"."objects"
  as permissive
  for select
  to authenticated
using (((bucket_id = 'task-submissions'::text) AND ((owner = auth.uid()) OR (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role, 'admin-komdis'::public.user_role])))));



  create policy "Allow owner or super-admin to delete piket proofs"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'piket-proofs'::text) AND ((owner = auth.uid()) OR (public.get_my_role() = 'super-admin'::public.user_role))));



  create policy "Allow owner or super-admin to delete task submissions"
  on "storage"."objects"
  as permissive
  for delete
  to authenticated
using (((bucket_id = 'task-submissions'::text) AND ((owner = auth.uid()) OR (public.get_my_role() = 'super-admin'::public.user_role))));



  create policy "Allow public to view activity banners"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'activity-banners'::text));



  create policy "Public profiles are viewable by everyone"
  on "storage"."objects"
  as permissive
  for select
  to public
using ((bucket_id = 'profiles'::text));



  create policy "Users can delete their own profile photo"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'profiles'::text) AND (owner = auth.uid())));



  create policy "Users can delete their own registration files"
  on "storage"."objects"
  as permissive
  for delete
  to public
using (((bucket_id = 'registrations'::text) AND (owner = auth.uid())));



  create policy "Users can update their own profile photo"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'profiles'::text) AND (owner = auth.uid())));



  create policy "Users can update their own registration files"
  on "storage"."objects"
  as permissive
  for update
  to public
using (((bucket_id = 'registrations'::text) AND (owner = auth.uid())));



  create policy "Users can upload their own profile photo"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'profiles'::text) AND (owner = auth.uid())));



  create policy "Users can upload their own registration files"
  on "storage"."objects"
  as permissive
  for insert
  to public
with check (((bucket_id = 'registrations'::text) AND (owner = auth.uid())));



  create policy "Users can view their own registration files"
  on "storage"."objects"
  as permissive
  for select
  to public
using (((bucket_id = 'registrations'::text) AND (owner = auth.uid())));



