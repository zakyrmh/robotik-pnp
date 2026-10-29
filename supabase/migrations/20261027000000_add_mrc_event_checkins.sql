-- MRC daftar ulang: kehadiran anggota dan penyerahan kokarde adalah status terpisah.
-- Semua mutasi dilakukan lewat RPC terautentikasi agar bulk, audit, dan concurrency
-- berada dalam satu transaksi PostgreSQL.

CREATE EXTENSION IF NOT EXISTS pg_trgm WITH SCHEMA extensions;

ALTER TABLE public.event_team_members
    ADD CONSTRAINT event_team_members_id_registration_unique
    UNIQUE (id, registration_id);

CREATE TABLE public.event_member_checkins (
    member_id UUID PRIMARY KEY,
    registration_id UUID NOT NULL,
    checked_in_at TIMESTAMPTZ,
    checked_in_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    badge_handed_at TIMESTAMPTZ,
    badge_handed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    badge_handoff_type VARCHAR(20)
        CHECK (badge_handoff_type IN ('self', 'representative')),
    badge_recipient_name VARCHAR(120),
    badge_recipient_role VARCHAR(20)
        CHECK (badge_recipient_role IN ('member', 'leader', 'advisor')),
    version INTEGER NOT NULL DEFAULT 1 CHECK (version > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT event_member_checkins_member_registration_unique
        UNIQUE (member_id, registration_id),
    CONSTRAINT event_member_checkins_member_registration_fkey
        FOREIGN KEY (member_id, registration_id)
        REFERENCES public.event_team_members(id, registration_id)
        ON DELETE RESTRICT,
    -- Actor may become NULL later through ON DELETE SET NULL; the timestamp
    -- remains the durable operational fact.
    CHECK (checked_in_at IS NOT NULL OR checked_in_by IS NULL),
    CHECK (
        (badge_handed_at IS NULL AND badge_handed_by IS NULL
            AND badge_handoff_type IS NULL AND badge_recipient_name IS NULL
            AND badge_recipient_role IS NULL)
        OR
        (badge_handed_at IS NOT NULL AND badge_handoff_type IS NOT NULL
            AND badge_recipient_name IS NOT NULL
            AND badge_recipient_role IS NOT NULL)
    )
);

ALTER TABLE public.event_registrations
    ADD COLUMN checkin_started_at TIMESTAMPTZ,
    ADD COLUMN advisor_badge_handed_at TIMESTAMPTZ,
    ADD COLUMN advisor_badge_handed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN advisor_badge_handoff_type VARCHAR(20)
        CHECK (advisor_badge_handoff_type IN ('self', 'representative')),
    ADD COLUMN advisor_badge_recipient_name VARCHAR(120),
    ADD COLUMN advisor_badge_recipient_role VARCHAR(20)
        CHECK (advisor_badge_recipient_role IN ('advisor', 'leader')),
    ADD COLUMN advisor_badge_version INTEGER NOT NULL DEFAULT 0 CHECK (advisor_badge_version >= 0),
    ADD CONSTRAINT event_registrations_advisor_badge_complete CHECK (
        (advisor_badge_handed_at IS NULL AND advisor_badge_handed_by IS NULL
            AND advisor_badge_handoff_type IS NULL
            AND advisor_badge_recipient_name IS NULL
            AND advisor_badge_recipient_role IS NULL)
        OR
        (advisor_badge_handed_at IS NOT NULL
            AND advisor_badge_handoff_type IS NOT NULL
            AND advisor_badge_recipient_name IS NOT NULL
            AND advisor_badge_recipient_role IS NOT NULL)
    );

CREATE INDEX idx_event_member_checkins_registration
    ON public.event_member_checkins(registration_id);
CREATE INDEX idx_event_registrations_team_name_trgm
    ON public.event_registrations USING gin (lower(team_name) extensions.gin_trgm_ops);
CREATE INDEX idx_event_registrations_institution_trgm
    ON public.event_registrations USING gin (lower(institution) extensions.gin_trgm_ops);
CREATE INDEX idx_event_team_members_full_name_trgm
    ON public.event_team_members USING gin (lower(full_name) extensions.gin_trgm_ops);

ALTER TABLE public.event_member_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "event committee read member checkins"
    ON public.event_member_checkins FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = auth.uid()
              AND (p.role = 'super-admin' OR p.role_event IN (
                  'panitia-pendaftaran', 'panitia-verifikasi', 'panitia-pertandingan'
              ))
        )
    );

REVOKE ALL ON public.event_member_checkins FROM anon, authenticated;
GRANT SELECT ON public.event_member_checkins TO authenticated;

CREATE OR REPLACE FUNCTION public.record_event_member_checkins(
    p_registration_id UUID,
    p_member_ids UUID[],
    p_action TEXT,
    p_expected_versions JSONB,
    p_proxy_role TEXT DEFAULT NULL,
    p_proxy_member_id UUID DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_registration public.event_registrations%ROWTYPE;
    v_member public.event_team_members%ROWTYPE;
    v_member_id UUID;
    v_existing public.event_member_checkins%ROWTYPE;
    v_expected INTEGER;
    v_current INTEGER;
    v_recipient_name TEXT;
    v_recipient_role TEXT;
    v_handoff_type TEXT;
    v_changed INTEGER := 0;
    v_correlation_id UUID := gen_random_uuid();
BEGIN
    IF v_actor IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_actor
          AND (p.role = 'super-admin' OR p.role_event IN ('panitia-pendaftaran', 'panitia-verifikasi'))
    ) THEN
        RAISE EXCEPTION 'event_checkin_forbidden';
    END IF;

    IF p_action NOT IN ('present_and_badge', 'present_only', 'proxy_badge') THEN
        RAISE EXCEPTION 'invalid_checkin_action';
    END IF;
    IF coalesce(array_length(p_member_ids, 1), 0) = 0
       OR cardinality(p_member_ids) <> (SELECT count(DISTINCT x) FROM unnest(p_member_ids) x) THEN
        RAISE EXCEPTION 'invalid_member_selection';
    END IF;

    SELECT * INTO v_registration
    FROM public.event_registrations
    WHERE id = p_registration_id
    FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;
    IF v_registration.payment_status <> 'paid' THEN RAISE EXCEPTION 'registration_not_paid'; END IF;
    IF (SELECT count(*) FROM public.event_team_members
        WHERE registration_id = p_registration_id AND id = ANY(p_member_ids)) <> cardinality(p_member_ids) THEN
        RAISE EXCEPTION 'member_not_in_registration';
    END IF;

    IF p_action = 'proxy_badge' THEN
        IF p_proxy_role = 'advisor' AND nullif(trim(v_registration.advisor_name), '') IS NOT NULL THEN
            v_recipient_name := trim(v_registration.advisor_name);
            v_recipient_role := 'advisor';
        ELSIF p_proxy_role = 'leader' THEN
            SELECT full_name INTO v_recipient_name
            FROM public.event_team_members
            WHERE id = p_proxy_member_id AND registration_id = p_registration_id
              AND lower(coalesce(role_in_team, '')) LIKE '%ketua%';
            IF v_recipient_name IS NULL THEN RAISE EXCEPTION 'leader_not_found'; END IF;
            v_recipient_role := 'leader';
        ELSE
            RAISE EXCEPTION 'invalid_proxy';
        END IF;
        v_handoff_type := 'representative';
    END IF;

    FOREACH v_member_id IN ARRAY p_member_ids LOOP
        SELECT * INTO v_member
        FROM public.event_team_members
        WHERE id = v_member_id AND registration_id = p_registration_id;

        v_existing := NULL;
        SELECT * INTO v_existing
        FROM public.event_member_checkins
        WHERE member_id = v_member_id
        FOR UPDATE;
        v_current := coalesce(v_existing.version, 0);
        v_expected := (p_expected_versions ->> v_member_id::text)::INTEGER;
        IF v_expected IS NULL OR v_expected <> v_current THEN
            RAISE EXCEPTION 'checkin_conflict';
        END IF;

        IF p_action IN ('present_and_badge', 'present_only') AND v_existing.checked_in_at IS NULL THEN
            v_changed := v_changed + 1;
        ELSIF p_action IN ('present_and_badge', 'proxy_badge') AND v_existing.badge_handed_at IS NULL THEN
            v_changed := v_changed + 1;
        END IF;

        INSERT INTO public.event_member_checkins (
            member_id, registration_id, checked_in_at, checked_in_by,
            badge_handed_at, badge_handed_by, badge_handoff_type,
            badge_recipient_name, badge_recipient_role
        ) VALUES (
            v_member.id,
            p_registration_id,
            CASE WHEN p_action IN ('present_and_badge', 'present_only') THEN now() END,
            CASE WHEN p_action IN ('present_and_badge', 'present_only') THEN v_actor END,
            CASE WHEN p_action IN ('present_and_badge', 'proxy_badge') THEN now() END,
            CASE WHEN p_action IN ('present_and_badge', 'proxy_badge') THEN v_actor END,
            CASE WHEN p_action = 'present_and_badge' THEN 'self' ELSE v_handoff_type END,
            CASE WHEN p_action = 'present_and_badge' THEN v_member.full_name ELSE v_recipient_name END,
            CASE WHEN p_action = 'present_and_badge' THEN 'member' ELSE v_recipient_role END
        )
        ON CONFLICT (member_id) DO UPDATE SET
            checked_in_at = coalesce(event_member_checkins.checked_in_at, excluded.checked_in_at),
            checked_in_by = coalesce(event_member_checkins.checked_in_by, excluded.checked_in_by),
            badge_handed_at = coalesce(event_member_checkins.badge_handed_at, excluded.badge_handed_at),
            badge_handed_by = coalesce(event_member_checkins.badge_handed_by, excluded.badge_handed_by),
            badge_handoff_type = coalesce(event_member_checkins.badge_handoff_type, excluded.badge_handoff_type),
            badge_recipient_name = coalesce(event_member_checkins.badge_recipient_name, excluded.badge_recipient_name),
            badge_recipient_role = coalesce(event_member_checkins.badge_recipient_role, excluded.badge_recipient_role),
            version = event_member_checkins.version + CASE WHEN
                (event_member_checkins.checked_in_at IS NULL AND excluded.checked_in_at IS NOT NULL)
                OR (event_member_checkins.badge_handed_at IS NULL AND excluded.badge_handed_at IS NOT NULL)
                THEN 1 ELSE 0 END,
            updated_at = CASE WHEN
                (event_member_checkins.checked_in_at IS NULL AND excluded.checked_in_at IS NOT NULL)
                OR (event_member_checkins.badge_handed_at IS NULL AND excluded.badge_handed_at IS NOT NULL)
                THEN now() ELSE event_member_checkins.updated_at END;
    END LOOP;

    UPDATE public.event_registrations
    SET checkin_started_at = coalesce(checkin_started_at, now())
    WHERE id = p_registration_id;

    INSERT INTO public.system_audit_logs(actor_id, action_type, old_value, new_value, details)
    VALUES (
        v_actor,
        'MRC_RECORD_CHECKIN',
        jsonb_build_object('registration_id', p_registration_id),
        jsonb_build_object(
            'schema_version', '2.0',
            'timestamp', to_char(timezone('utc', clock_timestamp()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'actor_id', v_actor, 'action', 'MRC_RECORD_CHECKIN',
            'target_entity', 'event_registration', 'target_id', p_registration_id,
            'correlation_id', v_correlation_id,
            'registration_id', p_registration_id, 'member_ids', p_member_ids,
            'action', p_action, 'changed', v_changed,
            'proxy_role', p_proxy_role
        ),
        'Pencatatan daftar ulang peserta MRC'
    );

    RETURN jsonb_build_object('changed', v_changed, 'total', cardinality(p_member_ids));
END;
$$;

CREATE OR REPLACE FUNCTION public.search_event_checkins(
    p_query TEXT DEFAULT '',
    p_category_id UUID DEFAULT NULL,
    p_attendance TEXT DEFAULT 'all',
    p_badge TEXT DEFAULT 'all',
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
) RETURNS TABLE (
    registration_id UUID,
    registration_code VARCHAR,
    team_name VARCHAR,
    institution VARCHAR,
    category_id UUID,
    category_name VARCHAR,
    payment_status VARCHAR,
    member_count BIGINT,
    present_count BIGINT,
    badge_count BIGINT,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path TO 'public'
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_query TEXT := trim(coalesce(p_query, ''));
BEGIN
    IF v_actor IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = v_actor
          AND (p.role = 'super-admin' OR p.role_event IN (
              'panitia-pendaftaran', 'panitia-verifikasi', 'panitia-pertandingan'
          ))
    ) THEN RAISE EXCEPTION 'event_checkin_forbidden'; END IF;
    IF p_attendance NOT IN ('all', 'none', 'partial', 'complete')
       OR p_badge NOT IN ('all', 'pending', 'complete') THEN
        RAISE EXCEPTION 'invalid_checkin_filter';
    END IF;

    RETURN QUERY
    WITH stats AS (
        SELECT r.id, r.registration_code, r.team_name, r.institution,
            r.category_id, c.name AS category_name, r.payment_status,
            count(m.id) AS member_count,
            count(ci.checked_in_at) AS present_count,
            count(ci.badge_handed_at) AS badge_count
        FROM public.event_registrations r
        JOIN public.event_categories c ON c.id = r.category_id
        JOIN public.event_team_members m ON m.registration_id = r.id
        LEFT JOIN public.event_member_checkins ci ON ci.member_id = m.id
        WHERE (p_category_id IS NULL OR r.category_id = p_category_id)
          AND (v_query = ''
            OR lower(r.registration_code) = lower(v_query)
            OR lower(r.team_name) LIKE '%' || lower(v_query) || '%'
            OR lower(r.institution) LIKE '%' || lower(v_query) || '%'
            OR EXISTS (
                SELECT 1 FROM public.event_team_members sm
                WHERE sm.registration_id = r.id
                  AND lower(sm.full_name) LIKE '%' || lower(v_query) || '%'
            ))
        GROUP BY r.id, c.name
    ), filtered AS (
        SELECT * FROM stats s
        WHERE (p_attendance = 'all'
            OR (p_attendance = 'none' AND s.present_count = 0)
            OR (p_attendance = 'partial' AND s.present_count > 0 AND s.present_count < s.member_count)
            OR (p_attendance = 'complete' AND s.present_count = s.member_count))
          AND (p_badge = 'all'
            OR (p_badge = 'pending' AND s.badge_count < s.member_count)
            OR (p_badge = 'complete' AND s.badge_count = s.member_count))
    )
    SELECT f.id, f.registration_code, f.team_name, f.institution,
        f.category_id, f.category_name, f.payment_status,
        f.member_count, f.present_count, f.badge_count, count(*) OVER()
    FROM filtered f
    ORDER BY (lower(f.registration_code) = lower(v_query)) DESC,
        f.team_name ASC, f.registration_code ASC
    LIMIT least(greatest(p_limit, 1), 50)
    OFFSET greatest(p_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_event_advisor_badge(
    p_registration_id UUID,
    p_recipient_role TEXT,
    p_proxy_member_id UUID,
    p_expected_version INTEGER
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_registration public.event_registrations%ROWTYPE;
    v_recipient_name TEXT;
    v_handoff_type TEXT;
    v_correlation_id UUID := gen_random_uuid();
BEGIN
    IF v_actor IS NULL OR NOT EXISTS (
        SELECT 1 FROM public.profiles p WHERE p.id = v_actor
          AND (p.role = 'super-admin' OR p.role_event IN ('panitia-pendaftaran', 'panitia-verifikasi'))
    ) THEN RAISE EXCEPTION 'event_checkin_forbidden'; END IF;

    SELECT * INTO v_registration FROM public.event_registrations
    WHERE id = p_registration_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;
    IF v_registration.payment_status <> 'paid' THEN RAISE EXCEPTION 'registration_not_paid'; END IF;
    IF nullif(trim(v_registration.advisor_name), '') IS NULL THEN RAISE EXCEPTION 'advisor_not_registered'; END IF;
    IF v_registration.advisor_badge_version <> p_expected_version THEN RAISE EXCEPTION 'checkin_conflict'; END IF;

    IF p_recipient_role = 'advisor' THEN
        v_recipient_name := trim(v_registration.advisor_name);
        v_handoff_type := 'self';
    ELSIF p_recipient_role = 'leader' THEN
        SELECT full_name INTO v_recipient_name FROM public.event_team_members
        WHERE id = p_proxy_member_id AND registration_id = p_registration_id
          AND lower(coalesce(role_in_team, '')) LIKE '%ketua%';
        IF v_recipient_name IS NULL THEN RAISE EXCEPTION 'leader_not_found'; END IF;
        v_handoff_type := 'representative';
    ELSE
        RAISE EXCEPTION 'invalid_proxy';
    END IF;

    IF v_registration.advisor_badge_handed_at IS NULL THEN
        UPDATE public.event_registrations SET
            checkin_started_at = coalesce(checkin_started_at, now()),
            advisor_badge_handed_at = now(), advisor_badge_handed_by = v_actor,
            advisor_badge_handoff_type = v_handoff_type,
            advisor_badge_recipient_name = v_recipient_name,
            advisor_badge_recipient_role = p_recipient_role,
            advisor_badge_version = advisor_badge_version + 1
        WHERE id = p_registration_id;
    END IF;

    INSERT INTO public.system_audit_logs(actor_id, action_type, old_value, new_value, details)
    VALUES (v_actor, 'MRC_HAND_ADVISOR_BADGE',
        jsonb_build_object('registration_id', p_registration_id),
        jsonb_build_object(
            'schema_version', '2.0',
            'timestamp', to_char(timezone('utc', clock_timestamp()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'actor_id', v_actor, 'action', 'MRC_HAND_ADVISOR_BADGE',
            'target_entity', 'event_registration', 'target_id', p_registration_id,
            'correlation_id', v_correlation_id, 'registration_id', p_registration_id,
            'recipient_role', p_recipient_role),
        'Penyerahan kokarde pembimbing MRC');

    RETURN jsonb_build_object('changed', CASE WHEN v_registration.advisor_badge_handed_at IS NULL THEN 1 ELSE 0 END);
END;
$$;

CREATE OR REPLACE FUNCTION public.correct_event_checkin(
    p_registration_id UUID,
    p_target TEXT,
    p_field TEXT,
    p_reason TEXT,
    p_member_id UUID DEFAULT NULL,
    p_expected_version INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_role TEXT;
    v_event_role TEXT;
    v_old JSONB;
    v_correlation_id UUID := gen_random_uuid();
BEGIN
    SELECT role::TEXT, role_event INTO v_role, v_event_role
    FROM public.profiles WHERE id = v_actor;
    IF v_actor IS NULL OR NOT (v_role = 'super-admin' OR v_event_role = 'panitia-pendaftaran') THEN
        RAISE EXCEPTION 'event_checkin_correction_forbidden';
    END IF;
    IF length(trim(coalesce(p_reason, ''))) < 3 OR length(p_reason) > 500 THEN
        RAISE EXCEPTION 'invalid_correction_reason';
    END IF;
    IF p_target NOT IN ('member', 'advisor') OR p_field NOT IN ('attendance', 'badge') THEN
        RAISE EXCEPTION 'invalid_correction_target';
    END IF;

    PERFORM 1 FROM public.event_registrations WHERE id = p_registration_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;

    IF p_target = 'member' THEN
        SELECT to_jsonb(c) INTO v_old FROM public.event_member_checkins c
        WHERE c.member_id = p_member_id AND c.registration_id = p_registration_id FOR UPDATE;
        IF v_old IS NULL THEN RAISE EXCEPTION 'checkin_not_found'; END IF;
        IF (v_old->>'version')::INTEGER <> p_expected_version THEN RAISE EXCEPTION 'checkin_conflict'; END IF;
        IF p_field = 'attendance' THEN
            UPDATE public.event_member_checkins SET checked_in_at = NULL, checked_in_by = NULL,
                version = version + 1, updated_at = now() WHERE member_id = p_member_id;
        ELSE
            UPDATE public.event_member_checkins SET badge_handed_at = NULL, badge_handed_by = NULL,
                badge_handoff_type = NULL, badge_recipient_name = NULL, badge_recipient_role = NULL,
                version = version + 1, updated_at = now() WHERE member_id = p_member_id;
        END IF;
    ELSE
        IF p_field <> 'badge' THEN RAISE EXCEPTION 'invalid_correction_target'; END IF;
        SELECT jsonb_build_object('advisor_badge_handed_at', advisor_badge_handed_at,
            'advisor_badge_recipient_name', advisor_badge_recipient_name,
            'advisor_badge_recipient_role', advisor_badge_recipient_role,
            'version', advisor_badge_version) INTO v_old
        FROM public.event_registrations WHERE id = p_registration_id;
        IF (v_old->>'version')::INTEGER <> p_expected_version THEN RAISE EXCEPTION 'checkin_conflict'; END IF;
        UPDATE public.event_registrations SET advisor_badge_handed_at = NULL,
            advisor_badge_handed_by = NULL, advisor_badge_handoff_type = NULL,
            advisor_badge_recipient_name = NULL, advisor_badge_recipient_role = NULL,
            advisor_badge_version = advisor_badge_version + 1
        WHERE id = p_registration_id;
    END IF;

    INSERT INTO public.system_audit_logs(actor_id, action_type, old_value, new_value, details)
    VALUES (v_actor, 'MRC_CORRECT_CHECKIN', v_old,
        jsonb_build_object(
            'schema_version', '2.0',
            'timestamp', to_char(timezone('utc', clock_timestamp()), 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'),
            'actor_id', v_actor, 'action', 'MRC_CORRECT_CHECKIN',
            'target_entity', CASE WHEN p_target = 'member' THEN 'event_team_member' ELSE 'event_registration' END,
            'target_id', coalesce(p_member_id, p_registration_id),
            'correlation_id', v_correlation_id,
            'registration_id', p_registration_id, 'member_id', p_member_id,
            'target', p_target, 'field', p_field, 'reason', trim(p_reason)),
        'Koreksi daftar ulang MRC: ' || trim(p_reason));

    RETURN jsonb_build_object('success', true);
END;
$$;

-- Once any check-in operation starts, replacing member rows would destroy or
-- detach operational history. Re-declare the existing apply RPC with the guard.
CREATE OR REPLACE FUNCTION public.apply_registration_change_request(
    p_request_id UUID,
    p_reviewer_id UUID
) RETURNS UUID AS $$
DECLARE
    v_actor UUID := auth.uid();
    v_reg_id UUID;
    v_data JSONB;
    v_status VARCHAR;
    v_member JSONB;
    v_checkin_started_at TIMESTAMPTZ;
BEGIN
    IF v_actor IS NULL OR p_reviewer_id IS DISTINCT FROM v_actor OR NOT EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = v_actor
          AND (p.role = 'super-admin' OR p.role_event = 'panitia-pendaftaran')
    ) THEN
        RAISE EXCEPTION 'registration_change_request_forbidden';
    END IF;

    SELECT registration_id, requested_data, status
        INTO v_reg_id, v_data, v_status
        FROM public.event_registration_change_requests
        WHERE id = p_request_id FOR UPDATE;
    IF v_reg_id IS NULL THEN RAISE EXCEPTION 'change_request_not_found'; END IF;
    IF v_status <> 'pending' THEN RAISE EXCEPTION 'change_request_not_pending'; END IF;

    SELECT checkin_started_at INTO v_checkin_started_at
    FROM public.event_registrations WHERE id = v_reg_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'registration_not_found'; END IF;
    IF v_data ? 'members'
       AND jsonb_typeof(v_data->'members') = 'array'
       AND v_checkin_started_at IS NOT NULL THEN
        RAISE EXCEPTION 'registration_checkin_already_started';
    END IF;

    UPDATE public.event_registrations SET
        team_name = COALESCE(v_data->'team'->>'team_name', team_name),
        institution = COALESCE(v_data->'team'->>'institution', institution),
        origin_city = COALESCE(v_data->'team'->>'origin_city', origin_city),
        advisor_name = COALESCE(v_data->'team'->>'advisor_name', advisor_name),
        team_email = COALESCE(v_data->'team'->>'team_email', team_email),
        team_whatsapp = COALESCE(v_data->'team'->>'team_whatsapp', team_whatsapp),
        updated_at = timezone('utc', now())
    WHERE id = v_reg_id;

    IF v_data ? 'members' AND jsonb_typeof(v_data->'members') = 'array' THEN
        DELETE FROM public.event_team_members WHERE registration_id = v_reg_id;
        FOR v_member IN SELECT * FROM jsonb_array_elements(v_data->'members') LOOP
            INSERT INTO public.event_team_members (
                registration_id, full_name, photo_url, identity_card_url,
                birth_date, role_in_team
            ) VALUES (
                v_reg_id, v_member->>'full_name', v_member->>'photo_url',
                NULLIF(v_member->>'identity_card_url', ''),
                CASE WHEN nullif(v_member->>'birth_date', '') IS NOT NULL
                    THEN (v_member->>'birth_date')::DATE END,
                COALESCE(v_member->>'role_in_team', 'Anggota')
            );
        END LOOP;
    END IF;

    UPDATE public.event_registration_change_requests SET status = 'approved',
        reviewed_by = p_reviewer_id, reviewed_at = timezone('utc', now())
    WHERE id = p_request_id;
    RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

REVOKE ALL ON FUNCTION public.record_event_member_checkins(UUID, UUID[], TEXT, JSONB, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_event_advisor_badge(UUID, TEXT, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.correct_event_checkin(UUID, TEXT, TEXT, TEXT, UUID, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.search_event_checkins(TEXT, UUID, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.apply_registration_change_request(UUID, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_event_member_checkins(UUID, UUID[], TEXT, JSONB, TEXT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_event_advisor_badge(UUID, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.correct_event_checkin(UUID, TEXT, TEXT, TEXT, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.search_event_checkins(TEXT, UUID, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_registration_change_request(UUID, UUID) TO authenticated;
