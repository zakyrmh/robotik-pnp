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