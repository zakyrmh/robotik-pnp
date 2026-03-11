-- ================================================
-- Migration: Fix RLS Policy for or_settings
-- Proyek  : Sistem Informasi UKM Robotik PNP
-- ================================================
-- Perbaikan bug: policy "or_settings_admin_update" hanya
-- mencakup FOR UPDATE, sedangkan operasi .upsert() di
-- Supabase JS client diterjemahkan menjadi:
--
--   INSERT ... ON CONFLICT (key) DO UPDATE SET ...
--
-- PostgreSQL RLS memeriksa KEDUA policy INSERT dan UPDATE
-- untuk pernyataan ini, bahkan ketika baris sudah ada dan
-- hanya UPDATE yang dieksekusi. Akibatnya upsert selalu
-- gagal karena tidak ada policy INSERT untuk admin.
--
-- Solusi: hapus policy lama dan ganti dengan FOR ALL
-- yang mencakup INSERT + UPDATE + DELETE sekaligus.
--
-- Idempotent: aman dijalankan berulang kali.
-- ================================================

-- Hapus semua varian policy lama (apapun namanya)
DROP POLICY IF EXISTS "or_settings_admin_update" ON public.or_settings;
DROP POLICY IF EXISTS "or_settings_admin_write"  ON public.or_settings;

-- Buat policy baru yang mencakup INSERT + UPDATE + DELETE
-- sekaligus dengan USING dan WITH CHECK
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
