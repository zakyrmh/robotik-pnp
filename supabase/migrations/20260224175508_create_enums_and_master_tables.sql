-- ================================================
-- Migration: Create Enums & Master Tables
-- Proyek: Sistem Informasi UKM Robotik PNP
-- ================================================

-- == ENUMS ==

CREATE TYPE public.user_status AS ENUM (
  'active',
  'banned',
  'deleted',
  'inactive'
);

CREATE TYPE public.gender_type AS ENUM (
  'L',
  'P'
);

-- == TABEL MASTER JURUSAN ==

CREATE TABLE public.majors (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name      varchar(255) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.majors IS 'Tabel master jurusan — misal: Teknologi Informasi';

-- == TABEL MASTER PROGRAM STUDI ==

CREATE TABLE public.study_programs (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  major_id  uuid NOT NULL REFERENCES public.majors(id) ON DELETE CASCADE,
  name      varchar(255) NOT NULL,

  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.study_programs IS 'Tabel master program studi — misal: TRPL';

-- == INDEXES ==

CREATE INDEX idx_study_programs_major_id ON public.study_programs(major_id);

-- == TRIGGER: updated_at otomatis ==

-- Function untuk update kolom updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER majors_updated_at
  BEFORE UPDATE ON public.majors
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER study_programs_updated_at
  BEFORE UPDATE ON public.study_programs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();