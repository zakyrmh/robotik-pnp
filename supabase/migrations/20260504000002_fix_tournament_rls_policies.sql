-- ================================================
-- Migration: Fix tournament RLS policies - use isBypassRole approach
-- ================================================
-- Ganti RLS policies tournament tables untuk menggunakan
-- pendekatan isBypassRole (cek user_roles) secara langsung,
-- bukan melalui user_has_permission yang bergantung pada permissions table.

-- =====================================================
-- DROP OLD POLICIES
-- =====================================================

DROP POLICY IF EXISTS "groups: authenticated read" ON public.groups;
DROP POLICY IF EXISTS "groups: admin create" ON public.groups;
DROP POLICY IF EXISTS "groups: admin update" ON public.groups;
DROP POLICY IF EXISTS "groups: admin delete" ON public.groups;

DROP POLICY IF EXISTS "teams: authenticated read" ON public.teams;
DROP POLICY IF EXISTS "teams: admin create" ON public.teams;
DROP POLICY IF EXISTS "teams: admin update" ON public.teams;
DROP POLICY IF EXISTS "teams: admin delete" ON public.teams;

DROP POLICY IF EXISTS "matches: authenticated read" ON public.matches;
DROP POLICY IF EXISTS "matches: admin create" ON public.matches;
DROP POLICY IF EXISTS "matches: admin update" ON public.matches;
DROP POLICY IF EXISTS "matches: admin delete" ON public.matches;

-- =====================================================
-- POLICY: GROUPS (NEW)
-- Authenticated users dapat baca, admin/super_admin dapat kelola
-- =====================================================

CREATE POLICY "groups: authenticated read" ON public.groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups: admin manage" ON public.groups
  FOR ALL USING (
    -- Cek apakah user adalah admin atau super_admin
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICY: TEAMS (NEW)
-- Authenticated users dapat baca, admin/super_admin dapat kelola
-- =====================================================

CREATE POLICY "teams: authenticated read" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "teams: admin manage" ON public.teams
  FOR ALL USING (
    -- Cek apakah user adalah admin atau super_admin
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICY: MATCHES (NEW)
-- Authenticated users dapat baca, admin/super_admin dapat kelola
-- =====================================================

CREATE POLICY "matches: authenticated read" ON public.matches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "matches: admin manage" ON public.matches
  FOR ALL USING (
    -- Cek apakah user adalah admin atau super_admin
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );
