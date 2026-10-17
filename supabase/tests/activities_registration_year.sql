-- Run with psql -v ON_ERROR_STOP=1 -f supabase/tests/activities_registration_year.sql.
-- Requires the registration-year and September-December migrations. All fixtures are rolled back.
BEGIN;
SET LOCAL session_replication_role = replica;

INSERT INTO auth.users (id, email)
SELECT ('e1910000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'activity-cohort-' || n || '@example.invalid'
FROM generate_series(1, 9) n;

INSERT INTO public.profiles (id, email, role)
SELECT ('e1910000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'activity-cohort-' || n || '@example.invalid', role::public.user_role
FROM (VALUES (1,'caang'), (2,'caang'), (3,'caang'), (4,'caang'),
             (5,'caang'), (6,'admin-or'), (7,'admin-komdis'),
             (8,'anggota'), (9,'super-admin')) AS users(n,role);

INSERT INTO public.registrations (
  id, profile_id, full_name, nickname, gender, pob, dob, phone_number,
  origin_address, domicile_address, entry_year, created_at, deleted_at
)
SELECT ('e1920000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       ('e1910000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       'Fixture Candidate', 'Fixture', 'L', 'Padang', '2005-01-01',
       '081234567890', 'Padang', 'Padang', 2020,
       registered_at::timestamptz, removed_at::timestamptz
FROM (VALUES
  (1, '2026-09-10T00:00:00Z', NULL),
  (2, '2025-01-15T00:00:00Z', NULL),
  (4, NULL, NULL),
  (5, '2026-06-01T00:00:00Z', '2026-07-01T00:00:00Z')
) AS registrations(n,registered_at,removed_at);

INSERT INTO public.activities (
  id, title, start_date, end_date, target_audience, created_at, deleted_at
)
SELECT ('e1930000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid,
       '__cohort_test__' || label,
       '2030-01-01T00:00:00Z', '2030-01-02T00:00:00Z',
       audience::public.activity_target, inserted_at::timestamptz,
       removed_at::timestamptz
FROM (VALUES
  (1,'previous_end','caang','2025-12-31T16:59:59.999999Z',NULL),
  (2,'year_start','caang','2025-12-31T17:00:00Z',NULL),
  (3,'year_middle','caang','2026-07-01T00:00:00Z',NULL),
  (4,'year_end','caang','2026-12-31T16:59:59.999999Z',NULL),
  (5,'next_start','caang','2026-12-31T17:00:00Z',NULL),
  (6,'member','anggota','2026-06-01T00:00:00Z',NULL),
  (7,'deleted','caang','2026-06-01T00:00:00Z','2026-07-01T00:00:00Z'),
  (8,'previous_start','caang','2025-01-15T00:00:00Z',NULL),
  (9,'august_end','caang','2026-08-31T16:59:59.999999Z',NULL),
  (10,'september_start','caang','2026-08-31T17:00:00Z',NULL),
  (11,'october','caang','2026-10-15T00:00:00Z',NULL),
  (12,'november','caang','2026-11-15T00:00:00Z',NULL),
  (13,'previous_september','caang','2025-09-15T00:00:00Z',NULL)
) AS activities(n,label,audience,inserted_at,removed_at);

SET LOCAL session_replication_role = origin;
SET LOCAL timezone = 'Pacific/Honolulu';

CREATE FUNCTION pg_temp.assert_activity_list(expected text[], test_name text)
RETURNS text LANGUAGE plpgsql AS $$
DECLARE actual text[];
BEGIN
  SELECT coalesce(array_agg(substr(title,16) ORDER BY substr(title,16)), ARRAY[]::text[])
  INTO actual FROM public.activities WHERE title LIKE '__cohort_test__%';
  IF actual IS DISTINCT FROM ARRAY(SELECT unnest(expected) ORDER BY 1) THEN
    RAISE EXCEPTION '%: expected %, received %', test_name, expected, actual;
  END IF;
  RETURN 'PASS: ' || test_name;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000001',true);
SELECT pg_temp.assert_activity_list(ARRAY['september_start','october','november','year_end'],
  '2026 caang sees September-December WIB only, independent of start_date, entry_year, session timezone');
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM public.activities WHERE id IN ('e1930000-0000-4000-8000-000000000001', 'e1930000-0000-4000-8000-000000000003', 'e1930000-0000-4000-8000-000000000009')) THEN
    RAISE EXCEPTION 'Direct detail lookup must reject other years and January-August';
  END IF;
END $$;
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000002',true);
SELECT pg_temp.assert_activity_list(ARRAY['previous_end','previous_september'],'2025 caang cannot use another candidate registration');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000003',true);
SELECT pg_temp.assert_activity_list(ARRAY[]::text[],'missing registration denies activities');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000004',true);
SELECT pg_temp.assert_activity_list(ARRAY[]::text[],'null registration timestamp denies activities');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000005',true);
SELECT pg_temp.assert_activity_list(ARRAY[]::text[],'soft-deleted registration denies activities');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000006',true);
SELECT pg_temp.assert_activity_list(ARRAY['previous_end','year_start','year_middle','year_end','next_start','member','deleted','previous_start','august_end','september_start','october','november','previous_september'],'admin-or retains all years and trash');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000007',true);
SELECT pg_temp.assert_activity_list(ARRAY['member'],'admin-komdis retains member audience');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000008',true);
SELECT pg_temp.assert_activity_list(ARRAY['member'],'anggota retains member audience without registration');
SELECT set_config('request.jwt.claim.sub','e1910000-0000-4000-8000-000000000009',true);
SELECT pg_temp.assert_activity_list(ARRAY['previous_end','year_start','year_middle','year_end','next_start','member','deleted','previous_start','august_end','september_start','october','november','previous_september'],'super-admin retains all years and trash');

RESET ROLE;
ROLLBACK;
