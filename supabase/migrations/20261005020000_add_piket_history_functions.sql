-- Migration: RPC histori piket (read-only) untuk halaman /piket/riwayat
-- SECURITY DEFINER agar admin-kestari dapat membaca nama pengurus
-- (super-admin/admin-*) yang diblokir RLS `profiles`.

DROP FUNCTION IF EXISTS public.get_piket_history_logs(text);

CREATE OR REPLACE FUNCTION public.get_piket_history_logs(p_academic_period text DEFAULT NULL)
RETURNS TABLE (
  id uuid,
  schedule_id uuid,
  academic_period text,
  week_number integer,
  room_target text,
  duty_date date,
  reported_by uuid,
  reporter_name text,
  reporter_nim text,
  is_verified boolean,
  is_final boolean,
  rejection_reason text,
  verified_at timestamptz,
  verified_by uuid,
  verifier_name text,
  notes text,
  proof_image_url text,
  proof_image_before_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id,
    l.schedule_id,
    s.academic_period,
    s.week_number,
    s.room_target,
    l.duty_date,
    l.reported_by,
    COALESCE(p.full_name, (SELECT r.full_name FROM public.registrations r
        WHERE r.profile_id = p.id AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC NULLS LAST LIMIT 1)) AS reporter_name,
    p.nim AS reporter_nim,
    l.is_verified,
    l.is_final,
    l.rejection_reason,
    l.verified_at,
    l.verified_by,
    COALESCE(vp.full_name, (SELECT r2.full_name FROM public.registrations r2
        WHERE r2.profile_id = vp.id AND r2.deleted_at IS NULL
        ORDER BY r2.created_at DESC NULLS LAST LIMIT 1)) AS verifier_name,
    l.notes,
    l.proof_image_url,
    l.proof_image_before_url,
    l.created_at
  FROM public.piket_logs l
  LEFT JOIN public.piket_schedules s ON s.id = l.schedule_id
  LEFT JOIN public.profiles p ON p.id = l.reported_by
  LEFT JOIN public.profiles vp ON vp.id = l.verified_by
  WHERE p_academic_period IS NULL OR s.academic_period = p_academic_period
  ORDER BY l.duty_date DESC, l.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_piket_history_logs(text) IS
  'Histori log piket (SECURITY DEFINER). Hanya proyeksi kolom yang dibutuhkan halaman /piket/riwayat; menembus RLS profiles untuk nama pengurus.';

REVOKE ALL ON FUNCTION public.get_piket_history_logs(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_history_logs(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_history_logs(text) TO service_role;

DROP FUNCTION IF EXISTS public.get_piket_member_history(uuid);

CREATE OR REPLACE FUNCTION public.get_piket_member_history(p_profile_id uuid)
RETURNS TABLE (
  id uuid,
  schedule_id uuid,
  academic_period text,
  week_number integer,
  room_target text,
  duty_date date,
  is_verified boolean,
  is_final boolean,
  rejection_reason text,
  verified_by uuid,
  verifier_name text,
  notes text,
  proof_image_url text,
  proof_image_before_url text,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    l.id, l.schedule_id, s.academic_period, s.week_number, s.room_target, l.duty_date,
    l.is_verified, l.is_final, l.rejection_reason, l.verified_by,
    COALESCE(vp.full_name, (SELECT r2.full_name FROM public.registrations r2
        WHERE r2.profile_id = vp.id AND r2.deleted_at IS NULL
        ORDER BY r2.created_at DESC NULLS LAST LIMIT 1)) AS verifier_name,
    l.notes, l.proof_image_url, l.proof_image_before_url, l.created_at
  FROM public.piket_logs l
  LEFT JOIN public.piket_schedules s ON s.id = l.schedule_id
  LEFT JOIN public.profiles vp ON vp.id = l.verified_by
  WHERE l.reported_by = p_profile_id
  ORDER BY l.duty_date DESC, l.created_at DESC;
$$;

COMMENT ON FUNCTION public.get_piket_member_history(uuid) IS
  'Histori lengkap log piket seorang anggota lintas semua periode (SECURITY DEFINER).';

REVOKE ALL ON FUNCTION public.get_piket_member_history(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_member_history(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_member_history(uuid) TO service_role;
