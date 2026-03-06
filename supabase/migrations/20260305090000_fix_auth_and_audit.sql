-- ================================================
-- Migration: Fix Auth and Audit Triggers
-- ================================================
-- Perbaikan bug "Database error saving new user" saat register:
-- 1. `fn_audit_log` sebelumnya memaksa baca `NEW.id`, padahal
--    tabel `profiles` tidak punya kolom `id` (primary key-nya `user_id`).
--    Sekarang diganti dengan pengecekan JSON keys secara dinamis.
-- 2. Menggabungkan trigger auth.users menjadi satu fungsi saja agar
--    urutan eksekusi lebih pasti dan transaksi lebih efisien.
-- ================================================

-- 1. PERBAIKAN FUNGSI AUDIT LOG
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

  -- Tentukan tipe aksi dan susun datanya sebagai JSONB agar fleksibel
  IF TG_OP = 'INSERT' THEN
    v_action    := 'INSERT';
    v_new_data  := to_jsonb(NEW);
    v_old_data  := NULL;
    
    -- Ekstrak ID dinamis (cari 'id' dulu, kalau tidak ada cari 'user_id')
    IF v_new_data ? 'id' THEN
      v_record_id := v_new_data->>'id';
    ELSIF v_new_data ? 'user_id' THEN
      v_record_id := v_new_data->>'user_id';
    ELSE
      v_record_id := 'unknown';
    END IF;

  ELSIF TG_OP = 'UPDATE' THEN
    v_action    := 'UPDATE';
    v_old_data  := to_jsonb(OLD);
    v_new_data  := to_jsonb(NEW);

    IF v_new_data ? 'id' THEN
      v_record_id := v_new_data->>'id';
    ELSIF v_new_data ? 'user_id' THEN
      v_record_id := v_new_data->>'user_id';
    ELSE
      v_record_id := 'unknown';
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    v_action    := 'DELETE';
    v_old_data  := to_jsonb(OLD);
    v_new_data  := NULL;

    IF v_old_data ? 'id' THEN
      v_record_id := v_old_data->>'id';
    ELSIF v_old_data ? 'user_id' THEN
      v_record_id := v_old_data->>'user_id';
    ELSE
      v_record_id := 'unknown';
    END IF;
  END IF;

  -- Generate summary otomatis
  v_summary := public.generate_audit_summary(v_action, TG_TABLE_NAME, v_old_data, v_new_data);

  -- Insert log record
  INSERT INTO public.audit_logs (
    actor_id, action, table_name, record_id, summary, old_data, new_data
  ) VALUES (
    v_actor_id, v_action, TG_TABLE_NAME, v_record_id, v_summary, v_old_data, v_new_data
  );

  -- Return sesuai tipe operasi
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 2. PERBAIKAN TRIGGER AUTH.USERS (Gabung dan Sederhanakan)
-- Hapus trigger terpisah untuk profiles agar tidak ada race condition
DROP TRIGGER IF EXISTS on_auth_user_created_profile ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_profile();

-- Gabung fungsinya ke dalam satu handler utama
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- 1. Insert ke tabel users
  -- (Tidak perlu explicit 'active' karena DEFAULT constraint yang jalan)
  INSERT INTO public.users (id, email)
  VALUES (NEW.id, NEW.email);

  -- 2. Insert ke tabel profiles
  -- (Menjalankan insert ke profiles dalam transaksi yang sama)
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));

  RETURN NEW;
END;
$$;
