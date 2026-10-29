-- Run after migrations with:
-- docker exec -i supabase_db_robotik-pnp psql -U postgres -d postgres \
--   -v ON_ERROR_STOP=1 < supabase/tests/event_checkins.sql
-- All fixtures and mutations are rolled back.
BEGIN;

SET LOCAL session_replication_role = replica;

INSERT INTO auth.users (id, email)
VALUES
  ('e2710000-0000-4000-8000-000000000001', 'checkin-registration@example.invalid'),
  ('e2710000-0000-4000-8000-000000000002', 'checkin-match@example.invalid'),
  ('e2710000-0000-4000-8000-000000000003', 'checkin-member@example.invalid');

INSERT INTO public.profiles (id, email, role, role_event)
VALUES
  ('e2710000-0000-4000-8000-000000000001', 'checkin-registration@example.invalid', 'anggota', 'panitia-pendaftaran'),
  ('e2710000-0000-4000-8000-000000000002', 'checkin-match@example.invalid', 'anggota', 'panitia-pertandingan'),
  ('e2710000-0000-4000-8000-000000000003', 'checkin-member@example.invalid', 'anggota', NULL);

SET LOCAL session_replication_role = origin;

INSERT INTO public.event_categories (id, slug, name)
VALUES ('e2720000-0000-4000-8000-000000000001', 'checkin-fixture', 'Check-in Fixture');

INSERT INTO public.event_registrations (
  id, registration_code, category_id, team_name, institution, advisor_name,
  team_email, team_whatsapp, payment_status, total_amount
) VALUES
  (
    'e2730000-0000-4000-8000-000000000001', 'CHECKIN-PAID',
    'e2720000-0000-4000-8000-000000000001', 'Robot PNP',
    'Politeknik Negeri Padang', 'Dr. Pembimbing', 'paid@example.invalid',
    '081234567890', 'paid', 100000
  ),
  (
    'e2730000-0000-4000-8000-000000000002', 'CHECKIN-UNPAID',
    'e2720000-0000-4000-8000-000000000001', 'Robot Belum Bayar',
    'Politeknik Negeri Padang', NULL, 'unpaid@example.invalid',
    '081234567891', 'unpaid', 100000
  );

INSERT INTO public.event_team_members (
  id, registration_id, full_name, photo_url, role_in_team
) VALUES
  (
    'e2740000-0000-4000-8000-000000000001',
    'e2730000-0000-4000-8000-000000000001', 'Ketua Tim',
    '/api/r2/mrc/photos/leader.webp', 'Ketua Tim'
  ),
  (
    'e2740000-0000-4000-8000-000000000002',
    'e2730000-0000-4000-8000-000000000001', 'Anggota Tim',
    '/api/r2/mrc/photos/member.webp', 'Anggota'
  ),
  (
    'e2740000-0000-4000-8000-000000000003',
    'e2730000-0000-4000-8000-000000000002', 'Anggota Belum Bayar',
    '/api/r2/mrc/photos/unpaid.webp', 'Ketua Tim'
  );

-- Realistic peak-search fixture: hundreds of teams, three members each.
INSERT INTO public.event_registrations (
  id, registration_code, category_id, team_name, institution,
  team_email, team_whatsapp, payment_status, total_amount
)
SELECT
  md5('checkin-registration-' || n)::uuid,
  'BENCH-' || lpad(n::text, 4, '0'),
  'e2720000-0000-4000-8000-000000000001',
  'Robot Benchmark ' || n,
  'Benchmark Institute ' || (n % 25),
  'benchmark-' || n || '@example.invalid',
  '0812' || lpad(n::text, 8, '0'),
  'unpaid',
  100000
FROM generate_series(1, 500) n;

INSERT INTO public.event_team_members (
  id, registration_id, full_name, photo_url, role_in_team
)
SELECT
  md5('checkin-member-' || n || '-' || member_no)::uuid,
  md5('checkin-registration-' || n)::uuid,
  'Benchmark Member ' || n || '-' || member_no,
  '/api/r2/mrc/photos/benchmark.webp',
  CASE WHEN member_no = 1 THEN 'Ketua Tim' ELSE 'Anggota' END
FROM generate_series(1, 500) n
CROSS JOIN generate_series(1, 3) member_no;

INSERT INTO public.event_registration_change_requests (
  id, registration_id, requested_data
) VALUES
  (
    'e2750000-0000-4000-8000-000000000001',
    'e2730000-0000-4000-8000-000000000001',
    '{"team":{"team_name":"Nama Baru"},"members":[]}'::jsonb
  ),
  (
    'e2750000-0000-4000-8000-000000000002',
    'e2730000-0000-4000-8000-000000000001',
    '{"team":{"institution":"PNP Diperbarui"}}'::jsonb
  );

CREATE FUNCTION pg_temp.assert_true(condition boolean, test_name text)
RETURNS text LANGUAGE plpgsql AS $$
BEGIN
  IF NOT coalesce(condition, false) THEN
    RAISE EXCEPTION 'FAIL: %', test_name;
  END IF;
  RETURN 'PASS: ' || test_name;
END;
$$;

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e2710000-0000-4000-8000-000000000001', true);

SELECT public.record_event_member_checkins(
  'e2730000-0000-4000-8000-000000000001',
  ARRAY['e2740000-0000-4000-8000-000000000001']::uuid[],
  'present_and_badge',
  '{"e2740000-0000-4000-8000-000000000001":0}'::jsonb,
  NULL,
  NULL
);

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.event_member_checkins
    WHERE member_id = 'e2740000-0000-4000-8000-000000000001'
      AND checked_in_at IS NOT NULL
      AND badge_handed_at IS NOT NULL
      AND badge_handoff_type = 'self'
  ),
  'normal flow records attendance and badge separately in one transaction'
);

SELECT public.record_event_member_checkins(
  'e2730000-0000-4000-8000-000000000001',
  ARRAY['e2740000-0000-4000-8000-000000000002']::uuid[],
  'proxy_badge',
  '{"e2740000-0000-4000-8000-000000000002":0}'::jsonb,
  'leader',
  'e2740000-0000-4000-8000-000000000001'
);

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.event_member_checkins
    WHERE member_id = 'e2740000-0000-4000-8000-000000000002'
      AND checked_in_at IS NULL
      AND badge_handed_at IS NOT NULL
      AND badge_handoff_type = 'representative'
      AND badge_recipient_name = 'Ketua Tim'
      AND badge_recipient_role = 'leader'
  ),
  'proxy badge keeps represented member absent and records the leader'
);

SELECT public.record_event_advisor_badge(
  'e2730000-0000-4000-8000-000000000001',
  'leader',
  'e2740000-0000-4000-8000-000000000001',
  0
);

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE id = 'e2730000-0000-4000-8000-000000000001'
      AND advisor_badge_handed_at IS NOT NULL
      AND advisor_badge_recipient_role = 'leader'
      AND checkin_started_at IS NOT NULL
  ),
  'advisor badge and permanent check-in marker are recorded'
);

DO $$
BEGIN
  PERFORM public.record_event_member_checkins(
    'e2730000-0000-4000-8000-000000000001',
    ARRAY['e2740000-0000-4000-8000-000000000002']::uuid[],
    'present_only',
    '{"e2740000-0000-4000-8000-000000000002":0}'::jsonb,
    NULL,
    NULL
  );
  RAISE EXCEPTION 'FAIL: stale version was accepted';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%checkin_conflict%' THEN RAISE; END IF;
END;
$$;

SELECT public.apply_registration_change_request(
  'e2750000-0000-4000-8000-000000000002',
  'e2710000-0000-4000-8000-000000000001'
);
SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.event_registrations
    WHERE id = 'e2730000-0000-4000-8000-000000000001'
      AND institution = 'PNP Diperbarui'
  ),
  'team-only correction remains possible after check-in starts'
);

DO $$
BEGIN
  PERFORM public.record_event_member_checkins(
    'e2730000-0000-4000-8000-000000000002',
    ARRAY['e2740000-0000-4000-8000-000000000003']::uuid[],
    'present_only',
    '{"e2740000-0000-4000-8000-000000000003":0}'::jsonb,
    NULL,
    NULL
  );
  RAISE EXCEPTION 'FAIL: unpaid registration was accepted';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%registration_not_paid%' THEN RAISE; END IF;
END;
$$;

DO $$
BEGIN
  PERFORM public.apply_registration_change_request(
    'e2750000-0000-4000-8000-000000000001',
    'e2710000-0000-4000-8000-000000000001'
  );
  RAISE EXCEPTION 'FAIL: member replacement after check-in was accepted';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%registration_checkin_already_started%' THEN RAISE; END IF;
END;
$$;

SELECT public.correct_event_checkin(
  'e2730000-0000-4000-8000-000000000001',
  'member',
  'badge',
  'Kokarde salah diserahkan',
  'e2740000-0000-4000-8000-000000000001',
  1
);

SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.event_member_checkins
    WHERE member_id = 'e2740000-0000-4000-8000-000000000001'
      AND checked_in_at IS NOT NULL
      AND badge_handed_at IS NULL
      AND version = 2
  ),
  'correction clears only the selected field and increments version'
);

RESET ROLE;
SELECT pg_temp.assert_true(
  (SELECT count(*) >= 4 FROM public.system_audit_logs
   WHERE action_type LIKE 'MRC_%'),
  'administrative mutations append immutable audit records'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'e2710000-0000-4000-8000-000000000001', true);
CREATE TEMP TABLE checkin_search_benchmark (duration_ms numeric) ON COMMIT DROP;
DO $$
DECLARE
  started_at timestamptz;
BEGIN
  FOR iteration IN 1..100 LOOP
    started_at := clock_timestamp();
    PERFORM count(*) FROM public.search_event_checkins(
      CASE WHEN iteration % 2 = 0 THEN 'Benchmark Institute' ELSE 'Robot Benchmark 250' END,
      NULL, 'all', 'all', 20, 0
    );
    INSERT INTO checkin_search_benchmark(duration_ms)
    VALUES (extract(epoch FROM clock_timestamp() - started_at) * 1000);
  END LOOP;
END;
$$;
SELECT pg_temp.assert_true(
  (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) < 500
   FROM checkin_search_benchmark),
  'search p95 stays below 500 ms for 500 teams'
);
SELECT round(
  (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms)
   FROM checkin_search_benchmark)::numeric,
  3
) AS measured_search_p95_ms;

SELECT set_config('request.jwt.claim.sub', 'e2710000-0000-4000-8000-000000000002', true);
SELECT pg_temp.assert_true(
  EXISTS (
    SELECT 1 FROM public.search_event_checkins('Robot PNP', NULL, 'all', 'all', 20, 0)
    WHERE registration_code = 'CHECKIN-PAID'
  ),
  'match committee can search operational status'
);

DO $$
BEGIN
  PERFORM public.record_event_member_checkins(
    'e2730000-0000-4000-8000-000000000001',
    ARRAY['e2740000-0000-4000-8000-000000000002']::uuid[],
    'present_only',
    '{"e2740000-0000-4000-8000-000000000002":1}'::jsonb,
    NULL,
    NULL
  );
  RAISE EXCEPTION 'FAIL: read-only match committee mutated check-in';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%event_checkin_forbidden%' THEN RAISE; END IF;
END;
$$;

SELECT set_config('request.jwt.claim.sub', 'e2710000-0000-4000-8000-000000000003', true);
DO $$
BEGIN
  PERFORM public.search_event_checkins('', NULL, 'all', 'all', 20, 0);
  RAISE EXCEPTION 'FAIL: non-committee user searched check-in data';
EXCEPTION WHEN OTHERS THEN
  IF SQLERRM NOT LIKE '%event_checkin_forbidden%' THEN RAISE; END IF;
END;
$$;

RESET ROLE;
ROLLBACK;
