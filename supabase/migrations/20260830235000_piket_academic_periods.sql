-- Migration: Add academic_period to piket_schedules for multi-period DPH management

-- 1. Add academic_period column if not exists
ALTER TABLE public.piket_schedules
  ADD COLUMN IF NOT EXISTS academic_period TEXT DEFAULT '2026/2027' NOT NULL;

-- 2. Update unique constraint to include academic_period
ALTER TABLE ONLY public.piket_schedules
  DROP CONSTRAINT IF EXISTS unique_week_room;
ALTER TABLE ONLY public.piket_schedules
  DROP CONSTRAINT IF EXISTS unique_period_week_room;

ALTER TABLE ONLY public.piket_schedules
  ADD CONSTRAINT unique_period_week_room UNIQUE (academic_period, week_number, room_target);

-- 3. Seed default master schedules for default period '2026/2027'
INSERT INTO public.piket_schedules (id, academic_period, week_number, room_target) VALUES
  ('a1111111-1111-4111-a111-111111111111', '2026/2027', 1, 'workshop_dan_sekretariat'),
  ('a2222222-2222-4222-a222-222222222222', '2026/2027', 2, 'workshop_dan_sekretariat'),
  ('a3333333-3333-4333-a333-333333333333', '2026/2027', 3, 'workshop_dan_sekretariat'),
  ('a4444444-4444-4444-a444-444444444444', '2026/2027', 4, 'workshop_dan_sekretariat')
ON CONFLICT (academic_period, week_number, room_target) DO NOTHING;
