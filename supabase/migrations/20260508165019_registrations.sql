-- 1. Setup ENUMs untuk Konsistensi 3NF
DO $$ BEGIN
    CREATE TYPE public.reg_status AS ENUM ('pending', 'verified', 'rejected');
    CREATE TYPE public.gender_type AS ENUM ('L', 'P');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabel Registrations
CREATE TABLE public.registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_program_id  UUID NOT NULL REFERENCES public.study_programs(id),
  
  -- Identitas (Atomic)
  full_name         TEXT NOT NULL,
  nickname          TEXT NOT NULL,
  gender            gender_type NOT NULL,
  pob               TEXT NOT NULL, -- Place of Birth
  dob               DATE NOT NULL, -- Date of Birth
  phone_number      TEXT NOT NULL,
  origin_address    TEXT NOT NULL,
  domicile_address  TEXT NOT NULL,
  high_school       TEXT NOT NULL,
  
  -- Akademik
  current_class     TEXT NOT NULL,
  entry_year        INTEGER NOT NULL,
  
  -- Naratif
  motivation        TEXT NOT NULL,
  org_experience    TEXT,
  achievements      TEXT,
  
  -- Berkas & Media (Link URL)
  photo_url         TEXT NOT NULL,
  ktm_url           TEXT, -- Opsional
  proof_follow_robotik BOOLEAN DEFAULT FALSE,
  proof_follow_mrc     BOOLEAN DEFAULT FALSE,
  proof_sub_yt        BOOLEAN DEFAULT FALSE,
  
  -- Pembayaran
  payment_proof_url TEXT NOT NULL,
  payment_method    TEXT NOT NULL, -- Contoh: 'Transfer Bank', 'Tunai'
  
  status            reg_status DEFAULT 'pending',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Indexing
CREATE INDEX idx_reg_profile_id ON public.registrations(profile_id);
CREATE INDEX idx_reg_status ON public.registrations(status);

-- RLS
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "manage_own_registration" ON public.registrations FOR ALL USING (auth.uid() = profile_id);
CREATE POLICY "admins_view_all_reg" ON public.registrations FOR SELECT USING (get_my_role() IN ('super-admin', 'admin-or'));

-- Trigger
CREATE TRIGGER registrations_updated_at
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();