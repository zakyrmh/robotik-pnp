-- ================================================
-- Migration: Create tournament tables with RLS policies
-- ================================================

-- =====================================================
-- CREATE TABLES (jika belum ada)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.groups (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.teams (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  team_a_id uuid REFERENCES public.teams(id),
  team_b_id uuid REFERENCES public.teams(id),
  score_a int DEFAULT 0,
  score_b int DEFAULT 0,
  status text DEFAULT 'pending',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- =====================================================
-- ENABLE RLS
-- =====================================================

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICY: GROUPS
-- Authenticated users dapat baca, admin dapat kelola
-- =====================================================

CREATE POLICY "groups: authenticated read" ON public.groups
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "groups: admin create" ON public.groups
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "groups: admin update" ON public.groups
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "groups: admin delete" ON public.groups
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

-- =====================================================
-- POLICY: TEAMS
-- Authenticated users dapat baca, admin dapat kelola
-- =====================================================

CREATE POLICY "teams: authenticated read" ON public.teams
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "teams: admin create" ON public.teams
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "teams: admin update" ON public.teams
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "teams: admin delete" ON public.teams
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

-- =====================================================
-- POLICY: MATCHES
-- Authenticated users dapat baca, admin dapat kelola
-- =====================================================

CREATE POLICY "matches: authenticated read" ON public.matches
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "matches: admin create" ON public.matches
  FOR INSERT WITH CHECK (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "matches: admin update" ON public.matches
  FOR UPDATE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );

CREATE POLICY "matches: admin delete" ON public.matches
  FOR DELETE USING (
    public.user_has_permission(auth.uid(), 'tournament:manage')
  );
