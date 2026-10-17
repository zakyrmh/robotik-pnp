-- Caang can read only activities created in their registration year (WIB).
-- Restrictive policy composes with existing audience/soft-delete policies.
-- Lists, detail pages, metadata and attendance queries use the same RLS rule.
DROP POLICY IF EXISTS activities_caang_registration_year ON public.activities;

CREATE POLICY activities_caang_registration_year
ON public.activities
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  (SELECT public.get_my_role()) <> 'caang'::public.user_role
  OR (
    target_audience = 'caang'::public.activity_target
    AND EXISTS (
      SELECT 1
      FROM public.registrations AS registration
      WHERE registration.profile_id = (SELECT auth.uid())
        AND registration.deleted_at IS NULL
        AND EXTRACT(YEAR FROM registration.created_at AT TIME ZONE 'Asia/Jakarta')
          = EXTRACT(YEAR FROM activities.created_at AT TIME ZONE 'Asia/Jakarta')
    )
  )
);

COMMENT ON POLICY activities_caang_registration_year ON public.activities IS
  'Caang: target caang and activities.created_at year matches their active registrations.created_at year in Asia/Jakarta; other roles retain existing access.';
