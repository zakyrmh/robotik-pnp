-- Migration: Allow public (anon + authenticated) select on or_settings table

-- Create policy allowing anonymous users to read or_settings
CREATE POLICY "allow_select_anon" ON "public"."or_settings"
  FOR SELECT
  TO "anon"
  USING (true);
