-- Migration: Fix piket verification names for admin-kestari (log reporter/verifier & fine member)
-- Description:
--   Policy SELECT `profiles` untuk admin-kestari hanya mengizinkan role
--   ('anggota','caang','alumni'). Akibatnya, ketika sebuah laporan piket
--   dibuat / diverifikasi oleh pengurus (super-admin / admin-*), nested join
--   `piket_logs -> profiles(reported_by/verified_by)` dan
--   `piket_fines -> profiles(profile_id)` mengembalikan null untuk kestari,
--   sehingga nama penanggung jawab kosong / jatuh ke fallback "Anggota".
--
--   Solusi: RPC SECURITY DEFINER terbatas yang mengembalikan HANYA nama & NIM
--   (proyeksi kolom minimal, tanpa email/telepon) untuk sekumpulan id profile.
--   Mengikuti pola public.get_piket_roster / get_unrecorded_activity_members.

DROP FUNCTION IF EXISTS public.get_piket_person_names(uuid[]);

CREATE OR REPLACE FUNCTION public.get_piket_person_names(p_ids uuid[])
RETURNS TABLE (
  id uuid,
  nim text,
  full_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    p.id                              AS id,
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
    )                                 AS full_name
  FROM public.profiles p
  WHERE p.id = ANY(p_ids);
$$;

COMMENT ON FUNCTION public.get_piket_person_names(uuid[]) IS
  'Nama & NIM sekumpulan profile (SECURITY DEFINER). Dipakai halaman /piket/verifikasi karena RLS profiles memblokir admin-kestari membaca profil pengurus (super-admin/admin-*). Hanya mengekspos id, nim, full_name.';

REVOKE ALL ON FUNCTION public.get_piket_person_names(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_piket_person_names(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_piket_person_names(uuid[]) TO service_role;
