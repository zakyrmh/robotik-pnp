-- ================================================
-- Migration: Audit Logs — Pencatatan Aktivitas Sistem
-- ================================================
-- Tabel ini mencatat perubahan data penting secara otomatis
-- via database trigger pada tabel kritis (users, profiles, user_roles).
--
-- Setiap baris menyimpan:
-- - Siapa yang melakukan aksi (actor_id)
-- - Tabel dan rekaman mana yang berubah
-- - Tipe aksi (INSERT, UPDATE, DELETE)
-- - Data sebelum dan sesudah perubahan (JSONB)
-- - Timestamp aksi


-- =====================================================
-- TABEL: AUDIT_LOGS
-- =====================================================

CREATE TABLE public.audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Siapa yang melakukan aksi (null jika sistem/trigger)
  actor_id    UUID NULL REFERENCES public.users(id) ON DELETE SET NULL,

  -- Aksi yang dilakukan
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),

  -- Tabel target yang berubah
  table_name  TEXT NOT NULL,

  -- ID rekaman yang berubah
  record_id   TEXT NOT NULL,

  -- Deskripsi singkat (opsional, diisi oleh trigger atau manual)
  summary     TEXT NULL,

  -- Snapshot data sebelum dan sesudah perubahan
  old_data    JSONB NULL,
  new_data    JSONB NULL,

  -- Metadata
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.audit_logs           IS 'Log perubahan data penting untuk audit trail';
COMMENT ON COLUMN public.audit_logs.actor_id  IS 'User yang melakukan perubahan (null = sistem)';
COMMENT ON COLUMN public.audit_logs.action    IS 'Tipe operasi: INSERT, UPDATE, DELETE';
COMMENT ON COLUMN public.audit_logs.summary   IS 'Deskripsi singkat perubahan (auto-generated)';
COMMENT ON COLUMN public.audit_logs.old_data  IS 'Snapshot data sebelum perubahan';
COMMENT ON COLUMN public.audit_logs.new_data  IS 'Snapshot data sesudah perubahan';

-- Index untuk query yang sering digunakan
CREATE INDEX idx_audit_logs_actor     ON public.audit_logs(actor_id);
CREATE INDEX idx_audit_logs_table     ON public.audit_logs(table_name);
CREATE INDEX idx_audit_logs_created   ON public.audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_record    ON public.audit_logs(table_name, record_id);


-- =====================================================
-- FUNGSI: Auto-generate summary berdasarkan perubahan
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_audit_summary(
  p_action     TEXT,
  p_table_name TEXT,
  p_old_data   JSONB,
  p_new_data   JSONB
) RETURNS TEXT
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
  summary TEXT;
BEGIN
  -- Generate deskripsi berdasarkan tabel dan aksi
  CASE p_table_name
    WHEN 'users' THEN
      CASE p_action
        WHEN 'INSERT' THEN
          summary := 'Akun baru dibuat: ' || COALESCE(p_new_data->>'email', '-');
        WHEN 'UPDATE' THEN
          -- Cek perubahan status
          IF p_old_data->>'status' IS DISTINCT FROM p_new_data->>'status' THEN
            summary := 'Status akun diubah: ' ||
              COALESCE(p_old_data->>'status', '-') || ' → ' ||
              COALESCE(p_new_data->>'status', '-');
          -- Cek soft delete
          ELSIF p_new_data->>'deleted_at' IS NOT NULL AND p_old_data->>'deleted_at' IS NULL THEN
            summary := 'Akun dihapus (soft delete)';
          ELSE
            summary := 'Data akun diperbarui';
          END IF;
        WHEN 'DELETE' THEN
          summary := 'Akun dihapus permanen: ' || COALESCE(p_old_data->>'email', '-');
      END CASE;

    WHEN 'profiles' THEN
      CASE p_action
        WHEN 'INSERT' THEN
          summary := 'Profil dibuat: ' || COALESCE(p_new_data->>'full_name', '-');
        WHEN 'UPDATE' THEN
          summary := 'Profil diperbarui: ' || COALESCE(p_new_data->>'full_name', p_old_data->>'full_name', '-');
        WHEN 'DELETE' THEN
          summary := 'Profil dihapus: ' || COALESCE(p_old_data->>'full_name', '-');
      END CASE;

    WHEN 'user_roles' THEN
      CASE p_action
        WHEN 'INSERT' THEN
          summary := 'Role ditambahkan ke user';
        WHEN 'DELETE' THEN
          summary := 'Role dicabut dari user';
      END CASE;

    ELSE
      summary := p_action || ' pada ' || p_table_name;
  END CASE;

  RETURN COALESCE(summary, p_action || ' pada ' || p_table_name);
END;
$$;


-- =====================================================
-- FUNGSI TRIGGER: Mencatat perubahan ke audit_logs
-- =====================================================
-- Trigger ini bersifat generik — bisa dipasang di tabel manapun.
-- Menggunakan auth.uid() untuk mendeteksi user yang sedang login.

CREATE OR REPLACE FUNCTION public.fn_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id   UUID;
  v_action     TEXT;
  v_record_id  TEXT;
  v_old_data   JSONB;
  v_new_data   JSONB;
  v_summary    TEXT;
BEGIN
  -- Deteksi user yang login via Supabase Auth
  v_actor_id := auth.uid();

  -- Tentukan tipe aksi dan data
  IF TG_OP = 'INSERT' THEN
    v_action    := 'INSERT';
    v_record_id := NEW.id::TEXT;
    v_new_data  := to_jsonb(NEW);
    v_old_data  := NULL;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action    := 'UPDATE';
    v_record_id := NEW.id::TEXT;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    v_action    := 'DELETE';
    v_record_id := OLD.id::TEXT;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
  END IF;

  -- Generate summary otomatis
  v_summary := public.generate_audit_summary(v_action, TG_TABLE_NAME, v_old_data, v_new_data);

  -- Insert log record
  INSERT INTO public.audit_logs (
    actor_id, action, table_name, record_id, summary, old_data, new_data
  ) VALUES (
    v_actor_id, v_action, TG_TABLE_NAME, v_record_id, v_summary, v_old_data, v_new_data
  );

  -- Return sesuai tipe operasi (wajib di trigger)
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;


-- =====================================================
-- TRIGGER: Pasang audit trail pada tabel kritis
-- =====================================================

-- Audit trail untuk tabel users
CREATE TRIGGER trg_audit_users
  AFTER INSERT OR UPDATE OR DELETE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Audit trail untuk tabel profiles
CREATE TRIGGER trg_audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_log();

-- Catatan: user_roles tidak punya kolom 'id', jadi perlu handler khusus.
-- Trigger terpisah di bawah untuk user_roles yang menggunakan composite key.


-- =====================================================
-- FUNGSI TRIGGER KHUSUS: user_roles (composite key)
-- =====================================================
-- Tabel user_roles menggunakan composite PK (user_id, role_id)
-- sehingga tidak punya kolom 'id'. Perlu handler khusus.

CREATE OR REPLACE FUNCTION public.fn_audit_user_roles()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor_id   UUID;
  v_action     TEXT;
  v_record_id  TEXT;
  v_old_data   JSONB;
  v_new_data   JSONB;
  v_summary    TEXT;
BEGIN
  v_actor_id := auth.uid();

  IF TG_OP = 'INSERT' THEN
    v_action    := 'INSERT';
    v_record_id := NEW.user_id::TEXT || ':' || NEW.role_id::TEXT;
    v_new_data  := to_jsonb(NEW);
    v_old_data  := NULL;
    v_summary   := 'Role ditambahkan ke user';
  ELSIF TG_OP = 'DELETE' THEN
    v_action    := 'DELETE';
    v_record_id := OLD.user_id::TEXT || ':' || OLD.role_id::TEXT;
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;
    v_summary   := 'Role dicabut dari user';
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, action, table_name, record_id, summary, old_data, new_data
  ) VALUES (
    v_actor_id, v_action, 'user_roles', v_record_id, v_summary, v_old_data, v_new_data
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Pasang trigger pada user_roles
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR DELETE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_user_roles();


-- =====================================================
-- RLS POLICY: Audit Logs
-- =====================================================

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Hanya user dengan permission 'audit:read' yang bisa membaca audit logs
CREATE POLICY "audit_logs: admin read" ON public.audit_logs
  FOR SELECT USING (
    public.user_has_permission(auth.uid(), 'audit:read')
  );

-- Tidak ada policy untuk INSERT/UPDATE/DELETE karena
-- hanya trigger SECURITY DEFINER yang boleh menulis.


-- =====================================================
-- SEED: Tambah permission audit:read ke role super_admin
-- =====================================================

-- Pastikan permission audit:read sudah ada
INSERT INTO public.permissions (name, description)
VALUES ('audit:read', 'Membaca audit logs sistem')
ON CONFLICT (name) DO NOTHING;

-- Assign ke role super_admin
INSERT INTO public.role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM public.roles r, public.permissions p
WHERE r.name = 'super_admin'
  AND p.name = 'audit:read'
ON CONFLICT DO NOTHING;
