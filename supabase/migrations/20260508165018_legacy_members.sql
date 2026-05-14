-- ============================================================
-- Tabel Legacy Members
-- ============================================================
CREATE TABLE public.legacy_members (
  profile_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_program_id UUID REFERENCES public.study_programs(id),
  division TEXT, -- Contoh: KRSBI-B, MRC, dll

  -- Identitas Pribadi
  nim TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT CHECK (gender IN ('L', 'P')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_legacy_nim ON public.legacy_members(nim);
ALTER TABLE public.legacy_members ENABLE ROW LEVEL SECURITY;

-- Hanya admin yang bisa melihat data anggota lama secara keseluruhan
CREATE POLICY "Admins can view legacy members"
ON public.legacy_members FOR SELECT
TO authenticated
USING ( public.get_my_role() IN ('super-admin', 'admin-or') );

-- ============================================================
-- Functions untuk Legacy Member Management
-- ============================================================

-- Function untuk cek apakah NIM terdaftar sebagai anggota lama
CREATE OR REPLACE FUNCTION public.check_legacy_member(input_nim TEXT)
RETURNS TABLE(
  is_legacy BOOLEAN,
  member_data JSONB
) LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) AS is_legacy,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) THEN
        (SELECT row_to_json(lm.*)::jsonb 
         FROM public.legacy_members lm 
         WHERE lm.nim = input_nim)
      ELSE NULL
    END AS member_data;
END;
$$;

-- Function untuk update profile menjadi anggota (dari caang ke anggota)
CREATE OR REPLACE FUNCTION public.promote_legacy_member_to_anggota(user_id UUID, input_nim TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  legacy_exists BOOLEAN;
BEGIN
  -- Cek apakah NIM ada di legacy_members
  SELECT EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) INTO legacy_exists;
  
  IF NOT legacy_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update role dari caang ke anggota dan set is_onboarded = true
  UPDATE public.profiles 
  SET 
    role = 'anggota',
    is_onboarded = TRUE,
    nim = input_nim,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Update profile_id di legacy_members jika belum di-set
  UPDATE public.legacy_members
  SET profile_id = user_id
  WHERE nim = input_nim AND profile_id IS NULL;
  
  RETURN TRUE;
END;
$$;