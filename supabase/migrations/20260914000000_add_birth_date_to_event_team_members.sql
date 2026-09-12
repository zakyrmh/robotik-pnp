-- Migration: Add birth_date to event_team_members table and update register_team RPC
-- birth_date is required for Line Follower Senior & Junior for age verification

-- 1. Add birth_date column to event_team_members
ALTER TABLE public.event_team_members
    ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. Update register_team RPC function to store birth_date
CREATE OR REPLACE FUNCTION public.register_team(
    p_category_id UUID,
    p_registration_code VARCHAR,
    p_team_name VARCHAR,
    p_institution VARCHAR,
    p_origin_city VARCHAR,
    p_advisor_name VARCHAR,
    p_team_email VARCHAR,
    p_team_whatsapp VARCHAR,
    p_total_amount NUMERIC,
    p_rules_version_id UUID,
    p_members JSONB
) RETURNS UUID AS $$
DECLARE
    v_quota INT;
    v_taken INT;
    v_reg_id UUID;
    v_member JSONB;
BEGIN
    -- Lock row for update
    SELECT quota INTO v_quota FROM public.event_categories
        WHERE id = p_category_id FOR UPDATE;

    IF v_quota IS NULL THEN
        RAISE EXCEPTION 'category_not_found';
    END IF;

    -- Count taken quota (paid OR pending created within last 2 hours)
    SELECT count(*) INTO v_taken FROM public.event_registrations
        WHERE category_id = p_category_id
        AND (
            payment_status = 'paid'
            OR (payment_status = 'pending' AND created_at > now() - interval '2 hours')
        );

    IF v_taken >= v_quota THEN
        RAISE EXCEPTION 'quota_full';
    END IF;

    INSERT INTO public.event_registrations (
        registration_code,
        category_id,
        team_name,
        institution,
        origin_city,
        advisor_name,
        team_email,
        team_whatsapp,
        total_amount,
        rules_version_id,
        rules_accepted_at
    ) VALUES (
        p_registration_code,
        p_category_id,
        p_team_name,
        p_institution,
        p_origin_city,
        p_advisor_name,
        p_team_email,
        p_team_whatsapp,
        p_total_amount,
        p_rules_version_id,
        now()
    ) RETURNING id INTO v_reg_id;

    -- Insert team members
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
        INSERT INTO public.event_team_members (
            registration_id,
            full_name,
            photo_url,
            identity_card_url,
            birth_date,
            role_in_team
        ) VALUES (
            v_reg_id,
            v_member->>'full_name',
            v_member->>'photo_url',
            v_member->>'identity_card_url',
            CASE
                WHEN v_member->>'birth_date' IS NOT NULL AND v_member->>'birth_date' <> ''
                THEN (v_member->>'birth_date')::DATE
                ELSE NULL
            END,
            COALESCE(v_member->>'role_in_team', 'Anggota')
        );
    END LOOP;

    RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
