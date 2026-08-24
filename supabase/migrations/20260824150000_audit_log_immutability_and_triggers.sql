-- Migration: Anti-Tampering Trigger and Immutability for public.system_audit_logs
-- Enforces 100% database-level non-repudiation and data protection compliance (UU PDP 27/2022)

-- 1. Fungsi Anti-Tampering: Menolak seluruh operasi UPDATE dan DELETE pada tabel audit logs
CREATE OR REPLACE FUNCTION public.prevent_audit_log_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RAISE EXCEPTION 'Pelanggaran Integritas Audit: Tabel system_audit_logs bersifat immutable (hanya-tambah) dan dilarang untuk diubah (UPDATE) atau dihapus (DELETE).'
    USING ERRCODE = '55000';
    RETURN NULL;
END;
$$;

-- 2. Pasang Trigger pada tabel system_audit_logs
DROP TRIGGER IF EXISTS trg_protect_system_audit_logs ON public.system_audit_logs;

CREATE TRIGGER trg_protect_system_audit_logs
BEFORE UPDATE OR DELETE ON public.system_audit_logs
FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_tampering();

-- 3. Tambahkan Index untuk mempercepat query relasi Aktor, Target, dan Urutan Waktu
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_actor_id ON public.system_audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_target_user_id ON public.system_audit_logs (target_user_id);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_action_type ON public.system_audit_logs (action_type);
CREATE INDEX IF NOT EXISTS idx_system_audit_logs_created_at ON public.system_audit_logs (created_at DESC);
