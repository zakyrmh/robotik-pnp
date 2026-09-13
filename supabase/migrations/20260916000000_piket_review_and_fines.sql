-- Migration: Piket report review workflow (kestari) + administrative fines
-- Context: laporan piket bersifat auto-terverifikasi sistem; admin-kestari /
-- super-admin dapat menyetujui, menolak (dengan alasan), mengenakan denda
-- administratif (acuan Rp10.000), dan menandai pelunasan. Modul piket murni
-- dikelola kestari — tidak menyentuh modul kedisiplinan (komdis).

-- 1. Kolom review & bukti pada piket_logs
ALTER TABLE public.piket_logs
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS photo_taken_at_before DATE,
  ADD COLUMN IF NOT EXISTS photo_taken_at_after DATE,
  ADD COLUMN IF NOT EXISTS photo_hash_before TEXT,
  ADD COLUMN IF NOT EXISTS photo_hash_after TEXT,
  ADD COLUMN IF NOT EXISTS is_final BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS finalized_at TIMESTAMPTZ;

-- 2. Tabel denda administratif piket (satu denda per anggota per jadwal pekan)
CREATE TABLE IF NOT EXISTS public.piket_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.piket_schedules(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 10000 CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'belum_lunas' CHECK (status IN ('belum_lunas', 'lunas')),
  imposed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_profile_schedule_fine UNIQUE (profile_id, schedule_id)
);

CREATE INDEX IF NOT EXISTS idx_piket_fines_profile_id ON public.piket_fines (profile_id);
CREATE INDEX IF NOT EXISTS idx_piket_fines_schedule_id ON public.piket_fines (schedule_id);
CREATE INDEX IF NOT EXISTS idx_piket_fines_status ON public.piket_fines (status);

-- 3. RLS untuk piket_fines
ALTER TABLE public.piket_fines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_piket_fines" ON public.piket_fines;
CREATE POLICY "allow_select_piket_fines" ON public.piket_fines
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "allow_kestari_write_piket_fines" ON public.piket_fines;
CREATE POLICY "allow_kestari_write_piket_fines" ON public.piket_fines
  FOR ALL TO authenticated
  USING (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]))
  WITH CHECK (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]));

GRANT ALL ON TABLE public.piket_fines TO anon;
GRANT ALL ON TABLE public.piket_fines TO authenticated;
GRANT ALL ON TABLE public.piket_fines TO service_role;
