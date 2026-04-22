-- Migration: Add Auto-Draft for Caang and Cleanup for Rejected Users

-- 1. Auto-Draft Creation
-- Modify assign_default_role to also create a draft registration

CREATE OR REPLACE FUNCTION public.assign_default_role()
RETURNS TRIGGER AS $$
DECLARE
  v_role_id UUID;
BEGIN
  -- Get the role ID for 'caang'
  SELECT id INTO v_role_id FROM public.roles WHERE name = 'caang';

  IF v_role_id IS NOT NULL THEN
    -- Insert user role
    INSERT INTO public.user_roles (user_id, role_id)
    VALUES (NEW.id, v_role_id);

    -- Auto-create draft registration
    INSERT INTO public.or_registrations (user_id, status, current_step)
    VALUES (NEW.id, 'draft', 'biodata')
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Cleanup Rejected Users (7 days)
-- Enable pg_cron if not already enabled (Requires Supabase superuser, but usually enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to delete rejected users older than 7 days
CREATE OR REPLACE FUNCTION public.cleanup_rejected_users()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN
  -- Find users whose registration was rejected more than 7 days ago
  -- We assume 'updated_at' is when the status was set to 'rejected'
  FOR r IN
    SELECT user_id
    FROM public.or_registrations
    WHERE status = 'rejected'
      AND updated_at < now() - interval '7 days'
  LOOP
    -- Delete the user from auth.users (this will cascade delete profiles, registrations, etc.)
    -- Note: Only postgres role can delete from auth.users directly via trigger/function
    -- if it has the right grants. In Supabase, functions with SECURITY DEFINER can do this if created by postgres.
    DELETE FROM auth.users WHERE id = r.user_id;
  END LOOP;
END;
$$;

-- Schedule the cron job to run daily at midnight
SELECT cron.schedule('cleanup-rejected-users-daily', '0 0 * * *', 'SELECT public.cleanup_rejected_users()');
