-- ================================================
-- Migration: Create OR Internship Applications
-- ================================================

CREATE TABLE public.or_internship_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Step 1 (Minat)
  minat VARCHAR(100) NOT NULL,
  alasan_minat TEXT NOT NULL,
  skill TEXT NOT NULL,
  
  -- Step 2 (Divisi)
  divisi_1_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
  yakin_divisi_1 VARCHAR(50) NOT NULL,
  alasan_divisi_1 TEXT NOT NULL,
  
  divisi_2_id UUID NOT NULL REFERENCES public.divisions(id) ON DELETE RESTRICT,
  yakin_divisi_2 VARCHAR(50) NOT NULL,
  alasan_divisi_2 TEXT NOT NULL,

  -- Step 3 (Departemen)
  dept_1_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  yakin_dept_1 VARCHAR(50) NOT NULL,
  alasan_dept_1 TEXT NOT NULL,
  
  dept_2_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  yakin_dept_2 VARCHAR(50) NOT NULL,
  alasan_dept_2 TEXT NOT NULL,
  
  -- Hasil Algoritma Rekomendasi (Draft by System)
  recommended_divisi_id UUID NULL REFERENCES public.divisions(id) ON DELETE SET NULL,
  recommended_dept_id UUID NULL REFERENCES public.departments(id) ON DELETE SET NULL,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'pending',

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- 1 Caang hanya bisa kirim 1 form magang (bila perlu edit, gunakan update)
  CONSTRAINT uq_or_internship_app_user UNIQUE (user_id)
);

COMMENT ON TABLE public.or_internship_applications IS 'Data formulir magang caang';

CREATE TRIGGER or_internship_applications_updated_at
  BEFORE UPDATE ON public.or_internship_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE public.or_internship_applications ENABLE ROW LEVEL SECURITY;

-- Caang: create and read own
CREATE POLICY "or_internship_app_caang_insert" ON public.or_internship_applications
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "or_internship_app_caang_read" ON public.or_internship_applications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "or_internship_app_caang_update" ON public.or_internship_applications
  FOR UPDATE USING (user_id = auth.uid());

-- Admin: read, update
CREATE POLICY "or_internship_app_admin_all" ON public.or_internship_applications
  FOR ALL USING (
    public.user_has_permission(auth.uid(), 'or:manage')
    OR public.user_has_role(auth.uid(), 'super_admin')
    OR public.user_has_role(auth.uid(), 'admin')
  );

ALTER PUBLICATION supabase_realtime ADD TABLE public.or_internship_applications;
