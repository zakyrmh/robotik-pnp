-- ================================================
-- Migration: Fix RLS komdis — ganti pengurus ke
-- department-based (komisi-disiplin)
-- ================================================

-- Hapus policy lama
DROP POLICY IF EXISTS "komdis_events_pengurus"      ON public.komdis_events;
DROP POLICY IF EXISTS "komdis_tokens_pengurus"      ON public.komdis_attendance_tokens;
DROP POLICY IF EXISTS "komdis_attendances_pengurus" ON public.komdis_attendances;
DROP POLICY IF EXISTS "komdis_sanctions_pengurus"   ON public.komdis_sanctions;
DROP POLICY IF EXISTS "komdis_violations_pengurus"  ON public.komdis_violations;
DROP POLICY IF EXISTS "komdis_reductions_pengurus"  ON public.komdis_point_reductions;
DROP POLICY IF EXISTS "komdis_sp_pengurus"          ON public.komdis_warning_letters;

-- Buat policy baru
CREATE POLICY "komdis_full_events" ON public.komdis_events
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_tokens" ON public.komdis_attendance_tokens
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_attendances" ON public.komdis_attendances
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_sanctions" ON public.komdis_sanctions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_violations" ON public.komdis_violations
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_reductions" ON public.komdis_point_reductions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "komdis_full_sp" ON public.komdis_warning_letters
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );