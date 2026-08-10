-- Migration: Automatic sync of email from auth.users to public.profiles

-- 1. Function to handle auth.users email update
CREATE OR REPLACE FUNCTION public.handle_user_email_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.email IS DISTINCT FROM NEW.email THEN
    UPDATE public.profiles
    SET email = NEW.email,
        updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

-- 2. Trigger on auth.users when email column is updated
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_email_update();

-- 3. One-time sync for any existing out-of-sync profiles
UPDATE public.profiles p
SET email = u.email,
    updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id AND p.email IS DISTINCT FROM u.email;
