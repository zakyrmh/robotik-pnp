-- ================================================
-- Migration: Perbesar batas karakter URL pada dokumen OR
-- ================================================
-- Mengubah tipe kolom VARCHAR(500) menjadi TEXT
-- karena URL token Supabase Storage bisa melebihi 500 karakter.

ALTER TABLE public.or_registrations
  ALTER COLUMN photo_url TYPE TEXT,
  ALTER COLUMN ktm_url TYPE TEXT,
  ALTER COLUMN ig_follow_url TYPE TEXT,
  ALTER COLUMN ig_mrc_url TYPE TEXT,
  ALTER COLUMN yt_sub_url TYPE TEXT,
  ALTER COLUMN payment_url TYPE TEXT;
