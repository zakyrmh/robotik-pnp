-- Migration: Event batch settings (rentang tanggal batch 1/2 + acara) & fee batch per kategori
-- Halaman admin: app/(private)/manajemen-event | Publik: app/(marketing)/mrc (countdown batch)

-- 1. Global event settings (singleton, id = 1)
CREATE TABLE IF NOT EXISTS public.event_settings (
    id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    batch1_start TIMESTAMPTZ,
    batch1_end TIMESTAMPTZ,
    batch2_start TIMESTAMPTZ,
    batch2_end TIMESTAMPTZ,
    event_start TIMESTAMPTZ,
    event_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT chk_batch1_range CHECK (batch1_start IS NULL OR batch1_end IS NULL OR batch1_start < batch1_end),
    CONSTRAINT chk_batch2_range CHECK (batch2_start IS NULL OR batch2_end IS NULL OR batch2_start < batch2_end),
    CONSTRAINT chk_event_range CHECK (event_start IS NULL OR event_end IS NULL OR event_start <= event_end),
    CONSTRAINT chk_batch_order CHECK (
        batch1_end IS NULL OR batch2_start IS NULL OR batch1_end <= batch2_start
    )
);

-- Seed singleton row agar SELECT selalu ada baris
INSERT INTO public.event_settings (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- 2. Fee per batch di tiap kategori (fallback ke registration_fee bila NULL)
ALTER TABLE public.event_categories
    ADD COLUMN IF NOT EXISTS registration_fee_batch1 NUMERIC(12, 2),
    ADD COLUMN IF NOT EXISTS registration_fee_batch2 NUMERIC(12, 2);

-- Backfill: kategori lama pakai fee existing untuk kedua batch
UPDATE public.event_categories
SET registration_fee_batch1 = COALESCE(registration_fee_batch1, registration_fee, 0),
    registration_fee_batch2 = COALESCE(registration_fee_batch2, registration_fee, 0);

-- 3. Catat batch saat tim mendaftar (audit & laporan)
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS registration_batch VARCHAR(10)
        CHECK (registration_batch IN ('batch1', 'batch2'));

-- 4. RLS
ALTER TABLE public.event_settings ENABLE ROW LEVEL SECURITY;

-- Publik boleh baca settings (untuk countdown & info biaya di halaman /mrc)
DROP POLICY IF EXISTS "public read event settings" ON public.event_settings;
CREATE POLICY "public read event settings" ON public.event_settings
    FOR SELECT TO anon, authenticated USING (true);

-- Panitia Pendaftaran & Super Admin boleh kelola settings
DROP POLICY IF EXISTS "panitia pendaftaran manage event settings" ON public.event_settings;
CREATE POLICY "panitia pendaftaran manage event settings" ON public.event_settings
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );
