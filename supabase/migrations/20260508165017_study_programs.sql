-- 1. Pembuatan Tabel Study Programs
CREATE TABLE IF NOT EXISTS public.study_programs (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  major_id  UUID NOT NULL REFERENCES public.majors(id) ON DELETE CASCADE,
  name      TEXT NOT NULL,
  degree    TEXT NOT NULL, -- D3 atau D4
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Indexing untuk pencarian cepat berdasarkan major
CREATE INDEX IF NOT EXISTS idx_study_programs_major_id ON public.study_programs(major_id);

-- 3. Inserasi Data Lengkap berdasarkan jurusan-prodi.json
INSERT INTO public.study_programs (major_id, name, degree)
-- Administrasi Niaga
SELECT id, 'Administrasi Bisnis', 'D3' FROM public.majors WHERE name = 'Administrasi Niaga' UNION ALL
SELECT id, 'Destinasi Pariwisata', 'D4' FROM public.majors WHERE name = 'Administrasi Niaga' UNION ALL
SELECT id, 'Bisnis Digital', 'D4' FROM public.majors WHERE name = 'Administrasi Niaga' UNION ALL
SELECT id, 'Logistik Perdagangan Internasional', 'D4' FROM public.majors WHERE name = 'Administrasi Niaga' UNION ALL
SELECT id, 'Usaha Perjalanan Wisata', 'D4' FROM public.majors WHERE name = 'Administrasi Niaga' UNION ALL

-- Akuntansi
SELECT id, 'Akuntansi', 'D3' FROM public.majors WHERE name = 'Akuntansi' UNION ALL
SELECT id, 'Akuntansi', 'D4' FROM public.majors WHERE name = 'Akuntansi' UNION ALL
SELECT id, 'Akuntansi (Kab. Solok Selatan)', 'D3' FROM public.majors WHERE name = 'Akuntansi' UNION ALL

-- Bahasa Inggris
SELECT id, 'Bahasa Inggris', 'D3' FROM public.majors WHERE name = 'Bahasa Inggris' UNION ALL
SELECT id, 'Bahasa Inggris untuk Komunikasi Bisnis dan Profesional', 'D4' FROM public.majors WHERE name = 'Bahasa Inggris' UNION ALL

-- Teknik Elektro
SELECT id, 'Teknik Elektronika', 'D4' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL
SELECT id, 'Teknik Telekomunikasi', 'D4' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL
SELECT id, 'Teknik Elektronika', 'D3' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL
SELECT id, 'Teknik Telekomunikasi', 'D3' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL
SELECT id, 'Teknik Listrik', 'D3' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL
SELECT id, 'Teknologi Rekayasa Instalasi Listrik', 'D4' FROM public.majors WHERE name = 'Teknik Elektro' UNION ALL

-- Teknik Mesin
SELECT id, 'Teknik Mesin', 'D3' FROM public.majors WHERE name = 'Teknik Mesin' UNION ALL
SELECT id, 'Teknik Manufaktur', 'D4' FROM public.majors WHERE name = 'Teknik Mesin' UNION ALL
SELECT id, 'Rekayasa Perancangan Mekanik', 'D4' FROM public.majors WHERE name = 'Teknik Mesin' UNION ALL
SELECT id, 'Teknik Alat Berat', 'D3' FROM public.majors WHERE name = 'Teknik Mesin' UNION ALL

-- Teknik Sipil
SELECT id, 'Teknik Sipil', 'D3' FROM public.majors WHERE name = 'Teknik Sipil' UNION ALL
SELECT id, 'Manajemen Rekayasa Konstruksi', 'D4' FROM public.majors WHERE name = 'Teknik Sipil' UNION ALL
SELECT id, 'Perancangan Jalan dan Jembatan', 'D4' FROM public.majors WHERE name = 'Teknik Sipil' UNION ALL
SELECT id, 'Teknik Perencanaan Irigasi dan Rawa', 'D4' FROM public.majors WHERE name = 'Teknik Sipil' UNION ALL
SELECT id, 'Teknologi Sipil (Kab. Tanah Datar)', 'D3' FROM public.majors WHERE name = 'Teknik Sipil' UNION ALL

-- Teknologi Informasi
SELECT id, 'Animasi', 'D4' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Teknik Komputer', 'D3' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Manajemen Informatika', 'D3' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Teknologi Rekayasa Perangkat Lunak', 'D4' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Manajemen Informatika (Kab. Pelalawan)', 'D3' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Teknik Komputer (Kab. Solok Selatan)', 'D3' FROM public.majors WHERE name = 'Teknologi Informasi' UNION ALL
SELECT id, 'Sistem Informasi (Kab. Tanah Datar)', 'D3' FROM public.majors WHERE name = 'Teknologi Informasi';

-- 4. Row Level Security (RLS)
ALTER TABLE public.study_programs ENABLE ROW LEVEL SECURITY;

-- Izinkan siapa pun (termasuk yang belum login) untuk melihat daftar prodi
-- Penting agar bisa muncul di form pendaftaran sebelum login/saat onboarding
CREATE POLICY "Allow public read-only access to study programs"
  ON public.study_programs FOR SELECT
  USING (true);