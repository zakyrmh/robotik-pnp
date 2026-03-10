-- ================================================
-- Migration: Create OR Settings Table
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Tabel ini digunakan untuk menyimpan pengaturan global 
-- terkait Open Recruitment, seperti periode pendaftaran.
-- ================================================

CREATE TABLE public.or_settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) UNIQUE NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE public.or_settings IS 'Pengaturan Open Recruitment';
COMMENT ON COLUMN public.or_settings.key IS 'Kunci pengaturan, e.g., registration_period';
COMMENT ON COLUMN public.or_settings.value IS 'Nilai pengaturan dalam format JSON';

-- Insert default registration period (tertutup secara default)
INSERT INTO public.or_settings (key, value, description)
VALUES (
    'registration_period',
    '{"is_open": false, "start_date": null, "end_date": null}'::jsonb,
    'Periode pendaftaran Open Recruitment'
);

-- =====================================================
-- RLS POLICIES
-- =====================================================

ALTER TABLE public.or_settings ENABLE ROW LEVEL SECURITY;

-- Semua orang bisa membaca pengaturan OR (untuk mengecek apakah pendaftaran buka/tutup)
CREATE POLICY "or_settings_public_read" ON public.or_settings
    FOR SELECT
    USING (true);

-- Hanya admin pengelolaan OR yang bisa mengubah pengaturan
CREATE POLICY "or_settings_admin_update" ON public.or_settings
    FOR UPDATE
    USING (
        public.user_has_role(auth.uid(), 'admin')
        OR public.user_has_role(auth.uid(), 'super_admin')
        OR public.user_has_role(auth.uid(), 'pengurus')
    );
