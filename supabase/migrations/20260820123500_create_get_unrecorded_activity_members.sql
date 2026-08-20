-- Migration: Create RPC function get_unrecorded_activity_members
-- Description: Retrieves profile IDs of all active members/admins who do not have an attendance record for a specific activity.

CREATE OR REPLACE FUNCTION public.get_unrecorded_activity_members(p_activity_id uuid)
RETURNS TABLE (profile_id uuid)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT p.id AS profile_id
  FROM public.profiles p
  JOIN public.registrations r ON r.profile_id = p.id AND r.deleted_at IS NULL
  WHERE p.role IN ('super-admin', 'admin-komdis', 'admin-or', 'admin-kestari', 'admin-divisi', 'anggota')
    AND NOT EXISTS (
      SELECT 1 
      FROM public.attendances a 
      WHERE a.activity_id = p_activity_id 
        AND a.profile_id = p.id
    );
$$;

GRANT EXECUTE ON FUNCTION public.get_unrecorded_activity_members(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unrecorded_activity_members(uuid) TO service_role;
