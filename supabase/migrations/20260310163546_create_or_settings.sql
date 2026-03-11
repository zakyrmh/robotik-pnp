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

-- Semua orang (termasuk anon) bisa membaca pengaturan OR.
-- Diperlukan oleh halaman publik /register untuk mengecek
-- apakah pendaftaran sedang buka/tutup tanpa perlu login.
CREATE POLICY "or_settings_public_read" ON public.or_settings
    FOR SELECT
    USING (true);

-- Admin, super_admin, dan pengurus bisa melakukan upsert
-- (INSERT + UPDATE) pada pengaturan OR.
--
-- Catatan penting: operasi .upsert() di Supabase JS client
-- diterjemahkan menjadi INSERT ... ON CONFLICT DO UPDATE.
-- PostgreSQL RLS memeriksa KEDUA policy INSERT dan UPDATE
-- bahkan ketika baris sudah ada dan hanya UPDATE yang dieksekusi.
-- Menggunakan FOR ALL memastikan kedua operasi selalu diizinkan.
CREATE POLICY "or_settings_admin_write" ON public.or_settings
    FOR ALL
    USING (
        public.user_has_role(auth.uid(), 'admin')
        OR public.user_has_role(auth.uid(), 'super_admin')
        OR public.user_has_role(auth.uid(), 'pengurus')
    )
    WITH CHECK (
        public.user_has_role(auth.uid(), 'admin')
        OR public.user_has_role(auth.uid(), 'super_admin')
        OR public.user_has_role(auth.uid(), 'pengurus')
    );
