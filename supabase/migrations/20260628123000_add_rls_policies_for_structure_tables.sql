-- Drop existing policies if any to prevent conflicts
DROP POLICY IF EXISTS "allow_select_periods" ON "public"."membership_periods";
DROP POLICY IF EXISTS "allow_admin_write_periods" ON "public"."membership_periods";

DROP POLICY IF EXISTS "allow_select_departments" ON "public"."departments";
DROP POLICY IF EXISTS "allow_admin_write_departments" ON "public"."departments";

DROP POLICY IF EXISTS "allow_admin_write_legacy_members" ON "public"."legacy_members";

DROP POLICY IF EXISTS "allow_select_org_histories" ON "public"."organizational_histories";
DROP POLICY IF EXISTS "allow_admin_write_org_histories" ON "public"."organizational_histories";

-- Enable Row Level Security (RLS) on all structure tables
ALTER TABLE "public"."membership_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."departments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."legacy_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "public"."organizational_histories" ENABLE ROW LEVEL SECURITY;

-- 1. Policies for membership_periods
CREATE POLICY "allow_select_periods" ON "public"."membership_periods"
    FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "allow_admin_write_periods" ON "public"."membership_periods"
    TO "authenticated"
    USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])))
    WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));

-- 2. Policies for departments
CREATE POLICY "allow_select_departments" ON "public"."departments"
    FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "allow_admin_write_departments" ON "public"."departments"
    TO "authenticated"
    USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])))
    WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));

-- 3. Policies for legacy_members
CREATE POLICY "allow_admin_write_legacy_members" ON "public"."legacy_members"
    TO "authenticated"
    USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])))
    WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));

-- 4. Policies for organizational_histories
CREATE POLICY "allow_select_org_histories" ON "public"."organizational_histories"
    FOR SELECT TO "authenticated" USING (true);

CREATE POLICY "allow_admin_write_org_histories" ON "public"."organizational_histories"
    TO "authenticated"
    USING (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])))
    WITH CHECK (("public"."get_my_role"() = ANY (ARRAY['super-admin'::"public"."user_role", 'admin-or'::"public"."user_role"])));
