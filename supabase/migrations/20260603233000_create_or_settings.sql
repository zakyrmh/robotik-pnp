-- Migration to create Open Recruitment (OR) settings table
CREATE TABLE IF NOT EXISTS public.or_settings (
  id UUID PRIMARY KEY DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
  periode_recruitment TEXT NOT NULL DEFAULT 'OR-21',
  status_pendaftaran BOOLEAN NOT NULL DEFAULT false,
  tanggal_mulai TIMESTAMPTZ,
  tanggal_selesai TIMESTAMPTZ,
  biaya_pendaftaran INTEGER NOT NULL DEFAULT 10000,
  rekening_penerima JSONB NOT NULL DEFAULT '[]'::jsonb,
  kontak_panitia JSONB NOT NULL DEFAULT '[]'::jsonb,
  link_komunitas JSONB NOT NULL DEFAULT '{"whatsapp_url": "", "discord_url": ""}'::jsonb,
  timeline JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT check_single_row CHECK (id = '00000000-0000-0000-0000-000000000000'::uuid)
);

-- Seed initial row if not exists
INSERT INTO public.or_settings (id, periode_recruitment, status_pendaftaran, biaya_pendaftaran, rekening_penerima, kontak_panitia, link_komunitas, timeline)
VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'OR-21',
  false,
  10000,
  '[{"bank_name": "Bank Nagari", "account_number": "1234567890", "account_holder": "Bendahara UKM Robotik"}]'::jsonb,
  '[{"name": "Naufal Khalil", "phone_number": "0812345678"}]'::jsonb,
  '{"whatsapp_url": "https://chat.whatsapp.com/example", "discord_url": "https://discord.gg/example"}'::jsonb,
  '[{"title": "Pendaftaran", "start_date": "2026-06-01T00:00:00Z", "end_date": "2026-06-15T23:59:59Z", "description": "Pengisian formulir pendaftaran online dan pembayaran biaya pendaftaran"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS
ALTER TABLE public.or_settings ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "allow_select_authenticated" ON public.or_settings
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "allow_write_admin_or" ON public.or_settings
  FOR ALL TO authenticated
  USING (public.get_my_role() IN ('admin-or', 'super-admin'))
  WITH CHECK (public.get_my_role() IN ('admin-or', 'super-admin'));

-- Trigger for updated_at
DROP TRIGGER IF EXISTS or_settings_updated_at ON public.or_settings;
CREATE TRIGGER or_settings_updated_at
  BEFORE UPDATE ON public.or_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
