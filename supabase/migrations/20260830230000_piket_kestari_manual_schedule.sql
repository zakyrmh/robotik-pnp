-- Migration: Kestari Manual Piket Scheduling & 4-Week System (Pekan 1..4)
-- Restrict schedule management write access strictly to super-admin & admin-kestari

-- 1. Ensure columns exist on piket_schedules
ALTER TABLE public.piket_schedules
  ADD COLUMN IF NOT EXISTS week_number INTEGER DEFAULT 1 NOT NULL CHECK (week_number >= 1 AND week_number <= 4),
  ADD COLUMN IF NOT EXISTS room_target TEXT DEFAULT 'workshop_dan_sekretariat' NOT NULL;

-- 2. Drop legacy day constraint & remove any week_number check > 4
ALTER TABLE ONLY public.piket_schedules DROP CONSTRAINT IF EXISTS unique_day;
ALTER TABLE ONLY public.piket_schedules DROP CONSTRAINT IF EXISTS piket_schedules_day_key;
ALTER TABLE public.piket_schedules ALTER COLUMN day DROP NOT NULL;

-- Clean up any schedule with week_number 5 if present
DELETE FROM public.piket_schedules WHERE week_number > 4;

-- 3. Unique constraint for (week_number, room_target)
ALTER TABLE ONLY public.piket_schedules
  DROP CONSTRAINT IF EXISTS unique_week_room;
ALTER TABLE ONLY public.piket_schedules
  ADD CONSTRAINT unique_week_room UNIQUE (week_number, room_target);

-- 4. Update RLS policies: Restrict piket_schedules WRITE permissions to super-admin and admin-kestari ONLY
DROP POLICY IF EXISTS "allow_admin_write_piket_schedules" ON public.piket_schedules;
CREATE POLICY "allow_admin_write_piket_schedules" ON public.piket_schedules
  TO authenticated
  USING (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]))
  WITH CHECK (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]));

-- 5. Update RLS policies: Restrict piket_members WRITE permissions to super-admin and admin-kestari ONLY
DROP POLICY IF EXISTS "allow_admin_write_piket_members" ON public.piket_members;
CREATE POLICY "allow_admin_write_piket_members" ON public.piket_members
  TO authenticated
  USING (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]))
  WITH CHECK (public.get_my_role() = ANY (ARRAY['super-admin'::public.user_role, 'admin-kestari'::public.user_role]));

-- Allow select piket_members to all authenticated
DROP POLICY IF EXISTS "allow_select_piket_members" ON public.piket_members;
CREATE POLICY "allow_select_piket_members" ON public.piket_members
  FOR SELECT TO authenticated USING (true);

-- 6. Seed default 4 master schedules (Pekan 1 s.d. Pekan 4)
INSERT INTO public.piket_schedules (id, week_number, room_target) VALUES
  ('a1111111-1111-4111-a111-111111111111', 1, 'workshop_dan_sekretariat'),
  ('a2222222-2222-4222-a222-222222222222', 2, 'workshop_dan_sekretariat'),
  ('a3333333-3333-4333-a333-333333333333', 3, 'workshop_dan_sekretariat'),
  ('a4444444-4444-4444-a444-444444444444', 4, 'workshop_dan_sekretariat')
ON CONFLICT (week_number, room_target) DO NOTHING;
