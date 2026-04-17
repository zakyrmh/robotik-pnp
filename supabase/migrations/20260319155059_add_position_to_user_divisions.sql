-- ================================================
-- Migration: Tambah kolom position di user_divisions
-- untuk membedakan ketua, wakil_ketua, dan anggota divisi
-- ================================================

ALTER TABLE public.user_divisions
  ADD COLUMN position VARCHAR(50) NOT NULL DEFAULT 'anggota'
  CONSTRAINT chk_division_position CHECK (
    position IN ('ketua', 'wakil_ketua', 'anggota')
  );

COMMENT ON COLUMN public.user_divisions.position IS
  'Jabatan struktural di divisi: ketua, wakil_ketua, atau anggota';