-- Migration: Update allow_insert_attendances policy to allow admins to insert records for students
DROP POLICY IF EXISTS "allow_insert_attendances" ON public.attendances;

CREATE POLICY "allow_insert_attendances" ON public.attendances
    FOR INSERT TO authenticated 
    WITH CHECK (
        auth.uid() = profile_id 
        OR public.get_my_role() IN ('admin-komdis', 'admin-or', 'super-admin')
    );
