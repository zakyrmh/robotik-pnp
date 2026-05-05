-- Tambahkan kolom adjustment untuk menambah/mengurangi skor
ALTER TABLE public.matches
ADD COLUMN penalty_a int DEFAULT 0,
ADD COLUMN penalty_b int DEFAULT 0;
