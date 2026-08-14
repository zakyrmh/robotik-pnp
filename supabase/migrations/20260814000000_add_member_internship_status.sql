-- Add internship status columns for active members in profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_on_internship BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS internship_start_date DATE,
  ADD COLUMN IF NOT EXISTS internship_end_date DATE;

-- Add index to speed up presensi filtering for interning members
CREATE INDEX IF NOT EXISTS idx_profiles_internship 
  ON public.profiles (is_on_internship, internship_start_date, internship_end_date) 
  WHERE is_on_internship = TRUE;

COMMENT ON COLUMN public.profiles.is_on_internship IS 'Flag penanda bahwa anggota aktif sedang melaksanakan magang luar / PKL';
COMMENT ON COLUMN public.profiles.internship_start_date IS 'Tanggal mulai periode magang luar anggota aktif';
COMMENT ON COLUMN public.profiles.internship_end_date IS 'Tanggal selesai periode magang luar anggota aktif';
