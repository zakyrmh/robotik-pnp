-- Migration: Fix piket_logs RLS insert policy for weekly schedule system & multi-role assignments

DROP POLICY IF EXISTS "allow_insert_piket_logs" ON public.piket_logs;

CREATE POLICY "allow_insert_piket_logs" ON public.piket_logs
FOR INSERT TO authenticated
WITH CHECK (
  reported_by = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.piket_members pm
    WHERE pm.schedule_id = piket_logs.schedule_id
      AND pm.profile_id = auth.uid()
  )
);

-- Ensure update policy includes admin-kestari
DROP POLICY IF EXISTS "allow_update_piket_logs" ON public.piket_logs;

CREATE POLICY "allow_update_piket_logs" ON public.piket_logs
FOR UPDATE TO authenticated
USING (
  public.get_my_role() IN ('admin-komdis'::public.user_role, 'admin-kestari'::public.user_role, 'super-admin'::public.user_role)
)
WITH CHECK (
  public.get_my_role() IN ('admin-komdis'::public.user_role, 'admin-kestari'::public.user_role, 'super-admin'::public.user_role)
);
