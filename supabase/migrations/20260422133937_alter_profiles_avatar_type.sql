-- ================================================
-- Migration: Perbesar batas karakter URL pada avatar
-- ================================================
-- Mengubah tipe kolom avatar_url dari VARCHAR(500) menjadi TEXT
-- agar mampu menampung string panjang dari Signed URL.

ALTER TABLE public.profiles
  ALTER COLUMN avatar_url TYPE TEXT;
