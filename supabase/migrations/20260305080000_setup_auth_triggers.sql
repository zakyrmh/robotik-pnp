-- ================================================
-- Migration: Setup Auth Triggers
-- ================================================
-- Trigger ini HARUS dijalankan setelah tabel users
-- dan profiles sudah dibuat.
--
-- File terpisah karena trigger pada auth.users
-- memerlukan penanganan khusus:
-- 1. DROP IF EXISTS dulu (auth.users tidak di-drop saat reset)
-- 2. Function harus SECURITY DEFINER + SET search_path
-- ================================================

-- Recreate functions dengan SET search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, status)
  VALUES (NEW.id, NEW.email, 'active');
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

-- Recreate triggers on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();
