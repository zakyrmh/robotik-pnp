-- Migration: Fix piket roster visibility for non-admin roles
-- Description:
--   RLS on public.profiles hanya mengizinkan anggota/caang membaca baris
--   profil DIRINYA SENDIRI (lihat policy "view_own" / "User read own profile").
--   Akibatnya, nested join `piket_schedules -> piket_members -> profiles` pada
--   halaman /piket mengembalikan `profiles = null` untuk semua anggota lain,
--   sehingga nama petugas piket tidak muncul (jatuh ke fallback "Anggota").
--
--   Solusi: RPC SECURITY DEFINER terbatas yang hanya memproyeksikan field
--   publik yang dibutuhkan roster piket (nama, NIM, jadwal, status magang),
--   tanpa membuka akses SELECT langsung ke seluruh kolom profiles.
--   Mengikuti pola yang sudah ada: public.get_unrecorded_activity_members.

-- Drop dulu agar aman bila signature pernah berubah (idempotent).
DROP FUNCTION IF EXISTS public.get_piket_roster(text);

CREATE OR REPLACE FUNCTION public.get_piket_roster(p_academic_period text DEFAULT NULL)
RETURNS TABLE (
  schedule_id uuid,
  academic_period text,
  week_number integer,
  room_target text,
  member_id uuid,
  profile_id uuid,
  nim text,
  full_name text,
  role text,
  is_on_internship boolean,
  internship_start_date date,
  internship_end_date date
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    s.id                              AS schedule_id,
    s.academic_period                 AS academic_period,
    s.week_number                     AS week_number,
    s.room_target                     AS room_target,
    pm.id                             AS member_id,
    pm.profile_id                     AS profile_id,
    p.nim                             AS nim,
    COALESCE(
      p.full_name,
      (
        SELECT r.full_name
        FROM public.registrations r
        WHERE r.profile_id = p.id
          AND r.deleted_at IS NULL
        ORDER BY r.created_at DESC NULLS LAST
        LIMIT 1
      )
    )                                 AS full_name,
    p.role::text                      AS role,
    COALESCE(p.is_on_internship, false) AS is_on_internship,
    p.internship_start_date           AS internship_start_date,
    p.internship_end_date             AS internship_end_date
  FROM public.piket_schedules s
  JOIN public.piket_members pm ON pm.schedule_id = s.id
  LEFT JOIN public.profiles p ON p.id = pm.profile_id
  WHERE p_academic_period IS NULL
     OR s.academic_period = p_academic_period
  ORDER BY s.academic_period DESC, s.week_number ASC, pm.id ASC;
$$;

COMMENT ON FUNCTION public.get_piket_roster(text) IS
  'Roster petugas piket (SECURITY DEFINER). Dipakai halaman /piket, /piket/kelola, /piket/verifikasi karena RLS profiles memblokir anggota/caang membaca profil anggota lain. Hanya mengekspos field publik roster.';

-- Hanya pengguna terautentikasi yang boleh memanggil; jangan expose ke anon.
REVOKE ALL ON FUNCTION public.get_piket_roster(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_roster(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_roster(text) TO service_role;
