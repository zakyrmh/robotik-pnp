-- ================================================
-- Migration: Row Level Security Policies
-- ================================================

-- == Aktifkan RLS di semua tabel publik ==

ALTER TABLE public.users              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.education_details  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blacklist     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.majors             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_programs     ENABLE ROW LEVEL SECURITY;

-- == POLICY: USERS ==

-- User hanya bisa lihat data dirinya sendiri
CREATE POLICY "users: self read" ON public.users
  FOR SELECT USING (auth.uid() = id);

-- == POLICY: PROFILES ==

-- User bisa baca profil sendiri
CREATE POLICY "profiles: self read" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

-- User bisa update profil sendiri
CREATE POLICY "profiles: self update" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Insert diizinkan untuk user sendiri (trigger handle_new_profile pakai SECURITY DEFINER)
CREATE POLICY "profiles: self insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- == POLICY: EDUCATION DETAILS ==

CREATE POLICY "education: self read" ON public.education_details
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "education: self insert" ON public.education_details
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "education: self update" ON public.education_details
  FOR UPDATE USING (auth.uid() = user_id);

-- == POLICY: MASTER TABLES (publik read-only) ==

CREATE POLICY "majors: public read" ON public.majors
  FOR SELECT USING (true);

CREATE POLICY "study_programs: public read" ON public.study_programs
  FOR SELECT USING (true);

-- == POLICY: BLACKLIST (hanya admin) ==
-- Catatan: implementasikan custom claims atau role tabel untuk admin check

CREATE POLICY "blacklist: admin only" ON public.user_blacklist
  FOR ALL USING (
    auth.uid() IN (
      SELECT id FROM public.users
      WHERE id = auth.uid()
      -- Tambahkan kondisi role admin sesuai implementasi
    )
  );