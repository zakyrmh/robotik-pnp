-- Migration: Allow Super Admin & Admin OR to manage (Insert/Update/Delete) registrations
-- Enables Super Admin to edit student study programs, phone numbers, and profile details.

DROP POLICY IF EXISTS "allow_admin_manage_registrations" ON public.registrations;

CREATE POLICY "allow_admin_manage_registrations" ON public.registrations
FOR ALL TO authenticated
USING (
  public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])
)
WITH CHECK (
  public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-or'::public.user_role])
);
