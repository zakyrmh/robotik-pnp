ALTER TABLE public.or_internship_applications
ADD COLUMN IF NOT EXISTS recommended_divisi_id UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS recommended_dept_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL;
