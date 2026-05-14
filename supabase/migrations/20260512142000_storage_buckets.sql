-- 1. Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('profiles', 'profiles', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('registrations', 'registrations', false) ON CONFLICT (id) DO NOTHING;

-- 2. RLS for profiles bucket (Pas Foto)
CREATE POLICY "Public profiles are viewable by everyone" ON storage.objects FOR SELECT USING ( bucket_id = 'profiles' );
CREATE POLICY "Users can upload their own profile photo" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'profiles' AND owner = auth.uid() );
CREATE POLICY "Users can update their own profile photo" ON storage.objects FOR UPDATE USING ( bucket_id = 'profiles' AND owner = auth.uid() );
CREATE POLICY "Users can delete their own profile photo" ON storage.objects FOR DELETE USING ( bucket_id = 'profiles' AND owner = auth.uid() );

-- 3. RLS for registrations bucket (Private files)
CREATE POLICY "Users can view their own registration files" ON storage.objects FOR SELECT USING ( bucket_id = 'registrations' AND owner = auth.uid() );
CREATE POLICY "Admins can view all registration files" ON storage.objects FOR SELECT USING ( bucket_id = 'registrations' AND public.get_my_role() IN ('super-admin', 'admin-or') );
CREATE POLICY "Users can upload their own registration files" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'registrations' AND owner = auth.uid() );
CREATE POLICY "Users can update their own registration files" ON storage.objects FOR UPDATE USING ( bucket_id = 'registrations' AND owner = auth.uid() );
CREATE POLICY "Users can delete their own registration files" ON storage.objects FOR DELETE USING ( bucket_id = 'registrations' AND owner = auth.uid() );
