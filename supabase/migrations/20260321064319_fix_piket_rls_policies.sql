-- ================================================
-- Migration: Fix RLS piket — ganti pengurus ke
-- department-based (kesekretariatan)
-- ================================================

-- Hapus policy lama yang pakai role 'pengurus'
DROP POLICY IF EXISTS "pengurus_full_piket_periods"     ON public.piket_periods;
DROP POLICY IF EXISTS "pengurus_full_piket_assignments" ON public.piket_assignments;
DROP POLICY IF EXISTS "pengurus_full_piket_submissions" ON public.piket_submissions;
DROP POLICY IF EXISTS "pengurus_full_piket_fines"       ON public.piket_fines;

-- Buat policy baru berdasarkan departemen kesekretariatan
CREATE POLICY "kestari_full_piket_periods" ON public.piket_periods
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kestari_full_piket_assignments" ON public.piket_assignments
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kestari_full_piket_submissions" ON public.piket_submissions
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

CREATE POLICY "kestari_full_piket_fines" ON public.piket_fines
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'member:read')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );