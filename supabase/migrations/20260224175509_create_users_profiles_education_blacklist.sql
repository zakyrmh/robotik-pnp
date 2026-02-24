-- ================================================
-- Migration: Create Users, Profiles, Education, Blacklist
-- ================================================

-- ========================================
-- TABEL 1: USERS (mirror dari auth.users)
-- ========================================

CREATE TABLE public.users (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      varchar(255) UNIQUE NOT NULL,
  status     public.user_status NOT NULL DEFAULT 'active',

  -- Soft delete
  deleted_at timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.users IS 'Mirror auth.users — data auth utama Supabase';
COMMENT ON COLUMN public.users.deleted_at IS 'Soft delete: jika terisi, user dianggap terhapus';

-- Trigger sync dari auth.users → public.users otomatis saat user baru daftar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, status)
  VALUES (NEW.id, NEW.email, 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- TABEL 2: PROFILES (One-to-One dengan users)
-- ========================================

CREATE TABLE public.profiles (
  user_id          uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  membership_id    varchar(50)  UNIQUE NULL,
  full_name        varchar(255) NOT NULL,
  nickname         varchar(100) NULL,
  gender           public.gender_type NULL,
  birth_place      varchar(100) NULL,
  birth_date       date NULL,
  phone            varchar(20)  NULL,
  avatar_url       varchar(500) NULL,
  address_domicile text NULL,
  address_origin   text NULL,

  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.profiles.membership_id  IS 'NIA — diisi setelah lulus seleksi';
COMMENT ON COLUMN public.profiles.phone          IS 'Nomor WhatsApp aktif';
COMMENT ON COLUMN public.profiles.avatar_url      IS 'URL file di Cloudflare R2';

-- Trigger auto-create profile saat user baru dibuat
CREATE OR REPLACE FUNCTION public.handle_new_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>
'full_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_profile();

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- TABEL 3: EDUCATION DETAILS (One-to-One dengan users)
-- ========================================

CREATE TABLE public.education_details (
  user_id         uuid PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  nim             varchar(20)  UNIQUE NOT NULL,
  study_program_id uuid NOT NULL REFERENCES public.study_programs(id),
  class           varchar(20)  NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN public.education_details.class IS 'Contoh: TRPL 2A';

CREATE INDEX idx_education_details_study_program ON public.education_details(study_program_id);

CREATE TRIGGER education_details_updated_at
  BEFORE UPDATE ON public.education_details
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ========================================
-- TABEL 4: USER BLACKLIST (Many-to-One)
-- ========================================

CREATE TABLE public.user_blacklist (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid NOT NULL REFERENCES public.users(id),
  admin_id     uuid NOT NULL REFERENCES public.users(id),

  reason       text NOT NULL,
  evidence_url varchar(500) NULL,

  is_permanent boolean NOT NULL DEFAULT false,
  expires_at   timestamptz NULL,

  created_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: jika tidak permanen, expires_at harus diisi
  CONSTRAINT chk_blacklist_expiry
    CHECK (is_permanent = true OR expires_at IS NOT NULL)
);

COMMENT ON COLUMN public.user_blacklist.user_id      IS 'User yang masuk daftar hitam';
COMMENT ON COLUMN public.user_blacklist.admin_id      IS 'Pengurus/Komdis yang mengeksekusi';
COMMENT ON COLUMN public.user_blacklist.evidence_url  IS 'Link bukti foto/dokumen di R2';

CREATE INDEX idx_blacklist_user_id  ON public.user_blacklist(user_id);
CREATE INDEX idx_blacklist_admin_id ON public.user_blacklist(admin_id);