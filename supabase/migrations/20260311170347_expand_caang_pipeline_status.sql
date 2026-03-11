-- Add new status values to the existing or_registration_status enum
-- For adding to enum in postgres, we must use ALTER TYPE ADD VALUE
ALTER TYPE public.or_registration_status ADD VALUE IF NOT EXISTS 'training';
ALTER TYPE public.or_registration_status ADD VALUE IF NOT EXISTS 'interview_1';
ALTER TYPE public.or_registration_status ADD VALUE IF NOT EXISTS 'project_phase';
ALTER TYPE public.or_registration_status ADD VALUE IF NOT EXISTS 'interview_2';
ALTER TYPE public.or_registration_status ADD VALUE IF NOT EXISTS 'graduated';

-- NOTE: Since 'accepted' already exists from previous migration, 
-- we can keep it to mean "Accepted to training phase" (Lolos Berkas)
-- or redefine it slightly in the UI labels.
-- 
-- The new expected pipeline flow:
-- draft -> submitted -> (revision) -> accepted (Lolos Berkas) -> 
-- training -> interview_1 -> project_phase -> interview_2 -> graduated -> (dilantik)
