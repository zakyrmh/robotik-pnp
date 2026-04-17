ALTER TABLE public.or_internship_applications
ADD COLUMN IF NOT EXISTS final_divisi_id UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS final_dept_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_manual_registration BOOLEAN NOT NULL DEFAULT false;

INSERT INTO public.or_settings (key, value, description)
VALUES (
    'internship_period',
    '{"is_open": false, "start_date": null, "end_date": null}'::jsonb,
    'Periode pendaftaran Magang Caang'
)
ON CONFLICT (key) DO NOTHING;
