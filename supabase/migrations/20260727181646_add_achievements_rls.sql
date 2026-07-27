-- 1. Aktifkan RLS pada tabel achievements
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- 2. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "achievements_select_policy" ON public.achievements;
DROP POLICY IF EXISTS "achievements_write_policy" ON public.achievements;

-- 3. Policy SELECT: Publik / Semua user bisa melihat data prestasi
CREATE POLICY "achievements_select_policy" ON public.achievements
FOR SELECT USING (true);

-- 4. Policy ALL (INSERT/UPDATE/DELETE): Hanya Admin yang bisa mengelola data prestasi
CREATE POLICY "achievements_write_policy" ON public.achievements
FOR ALL USING (
  public.get_my_role()::text IN ('super-admin')
) WITH CHECK (
  public.get_my_role()::text IN ('super-admin')
);