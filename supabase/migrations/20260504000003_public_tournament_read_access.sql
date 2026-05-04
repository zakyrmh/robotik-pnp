-- ================================================
-- Migration: Allow public read access for tournament tables
-- ================================================

-- This migration updates the RLS policies to allow unauthenticated (anon) 
-- users to read tournament data so the public page can display live scores.

-- Drop previous restrictive policies for SELECT (optional but cleaner)
DROP POLICY IF EXISTS "groups: authenticated read" ON public.groups;
DROP POLICY IF EXISTS "teams: authenticated read" ON public.teams;
DROP POLICY IF EXISTS "matches: authenticated read" ON public.matches;
DROP POLICY IF EXISTS "tournaments: authenticated read" ON public.tournaments;
DROP POLICY IF EXISTS "tournament_matches: authenticated read" ON public.tournament_matches;
DROP POLICY IF EXISTS "tournament_teams: authenticated read" ON public.tournament_teams;

-- Create public read policies (USING true allows both anon and authenticated)
CREATE POLICY "groups: public read" ON public.groups
  FOR SELECT USING (true);

CREATE POLICY "teams: public read" ON public.teams
  FOR SELECT USING (true);

CREATE POLICY "matches: public read" ON public.matches
  FOR SELECT USING (true);

-- Also add for tournament specific tables if they exist
CREATE POLICY "tournaments: public read" ON public.tournaments
  FOR SELECT USING (true);

CREATE POLICY "tournament_matches: public read" ON public.tournament_matches
  FOR SELECT USING (true);

CREATE POLICY "tournament_teams: public read" ON public.tournament_teams
  FOR SELECT USING (true);
