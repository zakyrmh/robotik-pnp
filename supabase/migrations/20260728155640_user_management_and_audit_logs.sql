-- 1. Tambahkan kolom deleted_at dan delete_reason pada public.profiles untuk dukungan Soft Delete
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN IF NOT EXISTS delete_reason TEXT DEFAULT NULL;

-- 2. Buat tabel system_audit_logs untuk pencatatan jejak audit mutasi admin
CREATE TABLE IF NOT EXISTS public.system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    old_value JSONB DEFAULT NULL,
    new_value JSONB DEFAULT NULL,
    details TEXT DEFAULT NULL,
    ip_address TEXT DEFAULT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Aktifkan Row Level Security (RLS) pada system_audit_logs
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "system_audit_logs_select_policy" ON public.system_audit_logs;
DROP POLICY IF EXISTS "system_audit_logs_insert_policy" ON public.system_audit_logs;

-- 5. Policy SELECT: Hanya super-admin yang dapat membaca audit logs
CREATE POLICY "system_audit_logs_select_policy" ON public.system_audit_logs
FOR SELECT USING (
  public.get_my_role()::text IN ('super-admin')
);

-- 6. Policy INSERT: Seluruh admin sistem dapat menambahkan entri audit log
CREATE POLICY "system_audit_logs_insert_policy" ON public.system_audit_logs
FOR INSERT WITH CHECK (
  public.get_my_role()::text IN ('super-admin', 'admin-or', 'admin-komdis', 'admin-kestari', 'admin-divisi')
);
