CREATE TABLE public.majors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert Data Jurusan
INSERT INTO public.majors (name) VALUES 
('Administrasi Niaga'), ('Akuntansi'), ('Bahasa Inggris'), 
('Teknik Elektro'), ('Teknik Mesin'), ('Teknik Sipil'), ('Teknologi Informasi');

ALTER TABLE public.majors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read-only access to majors" ON public.majors FOR SELECT USING (true);