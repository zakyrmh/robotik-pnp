-- ================================================
-- Migration: Add RLS policies for tournaments and tournament_matches tables
-- ================================================
-- Tabel tournaments dan tournament_matches belum memiliki RLS policies
-- untuk INSERT/UPDATE/DELETE. Migration ini menambahkan policy yang diperlukan.

-- =====================================================
-- ENABLE RLS (jika belum)
-- =====================================================

ALTER TABLE IF EXISTS public.tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.tournament_teams ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- DROP OLD POLICIES (cleanup)
-- =====================================================

DROP POLICY IF EXISTS "tournaments: admin manage" ON public.tournaments;
DROP POLICY IF EXISTS "tournament_matches: admin manage" ON public.tournament_matches;
DROP POLICY IF EXISTS "tournament_teams: admin manage" ON public.tournament_teams;

-- =====================================================
-- POLICY: TOURNAMENTS
-- Admin dan super_admin dapat buat, ubah, hapus tournament
-- =====================================================

CREATE POLICY "tournaments: admin manage" ON public.tournaments
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICY: TOURNAMENT_MATCHES
-- Admin dan super_admin dapat buat, ubah, hapus pertandingan bracket
-- =====================================================

CREATE POLICY "tournament_matches: admin manage" ON public.tournament_matches
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- POLICY: TOURNAMENT_TEAMS
-- Admin dan super_admin dapat sinkronisasi tim ke tournament_teams
-- =====================================================

CREATE POLICY "tournament_teams: admin manage" ON public.tournament_teams
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON ur.role_id = r.id
      WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
  );
