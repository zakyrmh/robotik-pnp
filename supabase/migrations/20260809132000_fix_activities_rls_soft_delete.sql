-- =============================================================================
-- Migration: fix_activities_rls_soft_delete
-- Deskripsi: Soft-delete kegiatan gagal dengan error:
--   "new row violates row-level security policy for table activities"
--
-- Penyebab:
-- 1) activities_select_policy mensyaratkan deleted_at IS NULL. Pada UPDATE
--    soft-delete, Postgres/PostgREST juga mengevaluasi SELECT policy terhadap
--    baris baru — baris dengan deleted_at terisi ditolak.
-- 2) activities_update/delete_policy membatasi created_by = auth.uid(),
--    padahal admin-komdis/admin-or mengelola kegiatan sesuai target_audience
--    (bukan hanya milik sendiri). super-admin juga belum diizinkan mutate.
-- =============================================================================

-- ── SELECT ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activities_select_policy" ON public.activities;

CREATE POLICY "activities_select_policy"
ON public.activities
FOR SELECT
USING (
  -- Kegiatan aktif: visibility berdasarkan role + target_audience
  (
    deleted_at IS NULL
    AND (
      (public.get_my_role())::text = ANY (ARRAY['super-admin'::text, 'admin-or'::text])
      OR (
        (public.get_my_role())::text = ANY (
          ARRAY[
            'admin-komdis'::text,
            'admin-kestari'::text,
            'admin-divisi'::text,
            'anggota'::text
          ]
        )
        AND (target_audience)::text = 'anggota'::text
      )
      OR (
        (public.get_my_role())::text = 'caang'::text
        AND (target_audience)::text = 'caang'::text
      )
    )
  )
  -- Kegiatan di tempat sampah: hanya admin pengelola (agar soft-delete & trash UI lolos)
  OR (
    deleted_at IS NOT NULL
    AND (
      (public.get_my_role())::text = 'super-admin'::text
      OR (
        (public.get_my_role())::text = 'admin-komdis'::text
        AND (target_audience)::text = 'anggota'::text
      )
      OR (
        (public.get_my_role())::text = 'admin-or'::text
        AND (target_audience)::text = 'caang'::text
      )
    )
  )
);

-- ── UPDATE ───────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activities_update_policy" ON public.activities;

CREATE POLICY "activities_update_policy"
ON public.activities
FOR UPDATE
USING (
  (public.get_my_role())::text = 'super-admin'::text
  OR (
    (public.get_my_role())::text = 'admin-komdis'::text
    AND (target_audience)::text = 'anggota'::text
  )
  OR (
    (public.get_my_role())::text = 'admin-or'::text
    AND (target_audience)::text = 'caang'::text
  )
)
WITH CHECK (
  (public.get_my_role())::text = 'super-admin'::text
  OR (
    (public.get_my_role())::text = 'admin-komdis'::text
    AND (target_audience)::text = 'anggota'::text
  )
  OR (
    (public.get_my_role())::text = 'admin-or'::text
    AND (target_audience)::text = 'caang'::text
  )
);

-- ── DELETE (hard delete) ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "activities_delete_policy" ON public.activities;

CREATE POLICY "activities_delete_policy"
ON public.activities
FOR DELETE
USING (
  (public.get_my_role())::text = 'super-admin'::text
  OR (
    (public.get_my_role())::text = 'admin-komdis'::text
    AND (target_audience)::text = 'anggota'::text
  )
  OR (
    (public.get_my_role())::text = 'admin-or'::text
    AND (target_audience)::text = 'caang'::text
  )
);

-- ── INSERT (tambah super-admin agar konsisten) ───────────────────────────────
DROP POLICY IF EXISTS "activities_insert_policy" ON public.activities;

CREATE POLICY "activities_insert_policy"
ON public.activities
FOR INSERT
WITH CHECK (
  (public.get_my_role())::text = ANY (
    ARRAY['super-admin'::text, 'admin-komdis'::text, 'admin-or'::text]
  )
);
