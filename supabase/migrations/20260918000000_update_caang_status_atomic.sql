-- Migration: Update caang registration status atomically and handle registration approval trigger logic
-- Purpose: Ensures when registrations.status is changed to 'verified', profiles.is_onboarded becomes TRUE.
-- If registrations.status is changed from 'verified' to another status (e.g. revision/pending/process/rejected), profiles.is_onboarded becomes FALSE.

CREATE OR REPLACE FUNCTION public.handle_registration_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'verified' THEN
    UPDATE public.profiles
    SET is_onboarded = TRUE
    WHERE id = NEW.profile_id;
  ELSIF OLD.status = 'verified' AND NEW.status <> 'verified' THEN
    UPDATE public.profiles
    SET is_onboarded = FALSE
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$function$;

-- Drop trigger if exists to ensure clean binding
DROP TRIGGER IF EXISTS on_registration_approved ON public.registrations;

CREATE TRIGGER on_registration_approved
  AFTER UPDATE ON public.registrations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_registration_approval();

-- RPC function for explicit atomic status update call from server actions
CREATE OR REPLACE FUNCTION public.update_caang_registration_status(
  p_profile_id UUID,
  p_status public.reg_status,
  p_revision_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_is_onboarded BOOLEAN;
BEGIN
  -- Determine is_onboarded flag based on status
  v_is_onboarded := (p_status = 'verified');

  -- Update registrations table
  UPDATE public.registrations
  SET
    status = p_status,
    revision_notes = CASE WHEN p_status = 'revision' THEN p_revision_notes ELSE NULL END,
    updated_at = NOW()
  WHERE profile_id = p_profile_id;

  -- Update profiles table
  UPDATE public.profiles
  SET
    is_onboarded = v_is_onboarded,
    updated_at = NOW()
  WHERE id = p_profile_id;

  RETURN jsonb_build_object(
    'success', true,
    'status', p_status,
    'is_onboarded', v_is_onboarded
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.update_caang_registration_status(UUID, public.reg_status, TEXT) TO authenticated, service_role;
