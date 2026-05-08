-- ============================================================
-- Migration: Auth Profiles with RBAC & RLS (Fixed Recursion)
-- ============================================================

-- 1. Enum untuk role
DO $$ BEGIN
    CREATE TYPE public.user_role AS ENUM ('super-admin', 'admin-or', 'caang');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Tabel profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID         PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email        TEXT         NOT NULL,
  role         user_role    NOT NULL DEFAULT 'caang',
  is_onboarded BOOLEAN      NOT NULL DEFAULT FALSE,
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 3. Index untuk performa query by role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 4. Fungsi Helper untuk mengecek role tanpa rekursi (SECURITY DEFINER)
-- Fungsi ini sangat efisien untuk laptop RAM 8GB karena menghindari nested queries yang berat.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
SECURITY DEFINER -- Berjalan sebagai pemilik DB untuk bypass RLS
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- 5. Trigger: otomatis buat profile saat user baru register
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (NEW.id, NEW.email, 'caang');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Pastikan trigger tidak duplikat
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. Trigger: auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Bersihkan policy lama agar tidak bentrok
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super-admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super-admin can update all profiles" ON public.profiles;

-- Policy: User hanya bisa lihat/edit profil sendiri
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy: Super-admin & Admin-OR bisa lihat semua profil
-- Menggunakan fungsi get_my_role() untuk memutus rantai rekursi.
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    public.get_my_role() IN ('super-admin', 'admin-or')
  );

-- Policy: Super-admin bisa update semua profil (termasuk ubah role)
CREATE POLICY "Super-admin can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    public.get_my_role() = 'super-admin'
  );