-- 1. Setup ENUMs untuk Konsistensi 3NF
DO $$ BEGIN
    CREATE TYPE public.reg_status AS ENUM ('process', 'pending', 'verified', 'rejected');
    CREATE TYPE public.gender_type AS ENUM ('L', 'P');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Tabel Registrations
CREATE TABLE public.registrations (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id        UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  study_program_id  UUID REFERENCES public.study_programs(id),
  
  -- Identitas (Atomic)
  full_name         TEXT NOT NULL,
  nickname          TEXT NOT NULL,
  gender            gender_type NOT NULL,
  pob               TEXT NOT NULL, -- Place of Birth
  dob               DATE NOT NULL, -- Date of Birth
  phone_number      TEXT NOT NULL,
  origin_address    TEXT NOT NULL,
  domicile_address  TEXT NOT NULL,
  high_school       TEXT,
  
  -- Akademik
  current_class     TEXT,
  entry_year        INTEGER NOT NULL,
  
  -- Naratif
  motivation        TEXT,
  org_experience    TEXT,
  achievements      TEXT,
  
  -- Berkas & Media (Link URL)
  photo_url         TEXT,
  ktm_url           TEXT, -- Opsional
  proof_follow_robotik TEXT,
  proof_follow_mrc     TEXT,
  proof_sub_yt         TEXT,
  
  -- Pembayaran
  payment_proof_url TEXT,
  payment_method    TEXT, -- Contoh: 'Transfer Bank', 'Tunai'
  
  status            reg_status DEFAULT 'process',
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

-- ============================================================
-- Guard: Cegah status 'verified' jika data belum lengkap
-- ============================================================

-- Function: cek kelengkapan semua kolom wajib sebelum verified
CREATE OR REPLACE FUNCTION public.check_registration_completeness()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  -- Hanya berlaku saat status berubah menjadi 'verified'
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    IF NEW.high_school       IS NULL OR NEW.high_school       = '' OR
       NEW.current_class     IS NULL OR NEW.current_class     = '' OR
       NEW.motivation        IS NULL OR NEW.motivation        = '' OR
       NEW.photo_url         IS NULL OR NEW.photo_url         = '' OR
       NEW.payment_proof_url IS NULL OR NEW.payment_proof_url = '' OR
       NEW.payment_method    IS NULL OR NEW.payment_method    = ''
    THEN
      RAISE EXCEPTION 'Registrasi belum lengkap. Pastikan semua step telah diisi sebelum diverifikasi.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER registrations_check_completeness
    BEFORE UPDATE ON public.registrations
    FOR EACH ROW EXECUTE FUNCTION public.check_registration_completeness();