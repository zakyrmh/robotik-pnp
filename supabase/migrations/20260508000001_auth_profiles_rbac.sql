-- 1. Setup Jenis Data & Tabel
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super-admin', 'admin-or', 'anggota', 'caang');
EXCEPTION WHEN duplicate_object THEN null; END $$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT         NOT NULL,
  nim          TEXT         UNIQUE,
  role         user_role    NOT NULL DEFAULT 'caang',
  is_onboarded BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Fungsi Helper (Internal Logic)
-- Menggunakan SECURITY DEFINER untuk memutus rekursi RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Otomatisasi Profil saat Register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, nim)
  VALUES (NEW.id, NEW.email, 'caang', (NEW.raw_user_meta_data->>'nim')::TEXT);
  RETURN NEW;
END; $$;

-- Manajemen Timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = NOW(); RETURN NEW;
END; $$;

-- 3. Triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Keamanan (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Membersihkan policy lama (jika ada)
DO $$ BEGIN
    DROP POLICY IF EXISTS "view_own" ON public.profiles;
    DROP POLICY IF EXISTS "update_own" ON public.profiles;
    DROP POLICY IF EXISTS "admin_view_all" ON public.profiles;
    DROP POLICY IF EXISTS "super_admin_update_all" ON public.profiles;
END $$;

CREATE POLICY "view_own" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "update_own" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_view_all" ON public.profiles FOR SELECT USING (get_my_role() IN ('super-admin', 'admin-or'));
CREATE POLICY "super_admin_update_all" ON public.profiles FOR UPDATE USING (get_my_role() = 'super-admin');