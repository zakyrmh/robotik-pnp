-- Migration: Event Competition Registration & Payment Gateway Integration System
-- Architecture reference: docs/architecture-event-registration-payment.md

-- 1. Add role_event to profiles table
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS role_event VARCHAR(30)
        CHECK (role_event IN ('panitia-pendaftaran', 'panitia-verifikasi', 'panitia-pertandingan'));

-- 2. Event Categories
CREATE TABLE IF NOT EXISTS public.event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_team_members INT NOT NULL DEFAULT 3,
    quota INT NOT NULL DEFAULT 32,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Event Rules Versions
CREATE TABLE IF NOT EXISTS public.event_rules_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.event_categories(id) ON DELETE CASCADE,
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Event Registrations & Transactions
CREATE TABLE IF NOT EXISTS public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code VARCHAR(30) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES public.event_categories(id) ON DELETE RESTRICT,

    team_name VARCHAR(100) NOT NULL,
    institution VARCHAR(150) NOT NULL,
    origin_city VARCHAR(100),
    advisor_name VARCHAR(120),
    team_email VARCHAR(150) NOT NULL,
    team_whatsapp VARCHAR(25) NOT NULL,

    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
    total_amount NUMERIC(12, 2) NOT NULL,
    midtrans_order_id VARCHAR(100) UNIQUE,
    midtrans_snap_token TEXT,
    midtrans_payment_type VARCHAR(50),
    paid_at TIMESTAMPTZ,
    manual_payment_proof_url TEXT,

    rules_version_id UUID REFERENCES public.event_rules_versions(id),
    rules_accepted_at TIMESTAMPTZ,
    access_token UUID NOT NULL DEFAULT gen_random_uuid(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Event Team Members Data
CREATE TABLE IF NOT EXISTS public.event_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    photo_url TEXT NOT NULL,
    member_qr_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'mismatch')),
    role_in_team VARCHAR(50) DEFAULT 'Anggota',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. On-site Face Verification Logs
CREATE TABLE IF NOT EXISTS public.event_member_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.event_team_members(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL REFERENCES public.profiles(id),
    result VARCHAR(20) NOT NULL CHECK (result IN ('verified', 'mismatch')),
    notes TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Violations & Warnings
CREATE TABLE IF NOT EXISTS public.event_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,
    description TEXT,
    warning_number INT NOT NULL,
    issued_by UUID NOT NULL REFERENCES public.profiles(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'dq_confirmed', 'appealed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_event_reg_code ON public.event_registrations(registration_code);
CREATE INDEX IF NOT EXISTS idx_event_reg_email ON public.event_registrations(team_email);
CREATE INDEX IF NOT EXISTS idx_event_reg_order_id ON public.event_registrations(midtrans_order_id);
CREATE INDEX IF NOT EXISTS idx_event_reg_status ON public.event_registrations(payment_status);
CREATE INDEX IF NOT EXISTS idx_event_member_qr ON public.event_team_members(member_qr_token);

-- Quota-safe atomic registration function
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
            role_in_team
        ) VALUES (
            v_reg_id,
            v_member->>'full_name',
            v_member->>'photo_url',
            COALESCE(v_member->>'role_in_team', 'Anggota')
        );
    END LOOP;

    RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Storage bucket for event member photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-member-photos', 'event-member-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Settings
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rules_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_member_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_violations ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON public.event_registrations FROM anon;
REVOKE SELECT ON public.event_team_members FROM anon;

-- Public read for active categories & rules versions
CREATE POLICY "public read event categories" ON public.event_categories
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public read event rules versions" ON public.event_rules_versions
    FOR SELECT TO anon, authenticated USING (true);

-- Anon insert for registrations and team members
CREATE POLICY "public insert registration" ON public.event_registrations
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "public insert member" ON public.event_team_members
    FOR INSERT TO anon WITH CHECK (true);

-- Panitia Pendaftaran & Super Admin manage categories
CREATE POLICY "panitia pendaftaran manage categories" ON public.event_categories
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

CREATE POLICY "panitia pendaftaran manage rules versions" ON public.event_rules_versions
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

-- Panitia Pendaftaran & Super Admin read/update registrations
CREATE POLICY "panitia pendaftaran read & verify payment" ON public.event_registrations
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

-- Panitia Verifikasi & Panitia Pendaftaran & Super Admin read member photo
CREATE POLICY "panitia verifikasi read member photo" ON public.event_team_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event IN ('panitia-verifikasi', 'panitia-pendaftaran'))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

-- Panitia Verifikasi manage member verifications
CREATE POLICY "panitia verifikasi manage member verifications" ON public.event_member_verifications
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event = 'panitia-verifikasi')
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

-- Panitia & Super Admin manage violations
CREATE POLICY "panitia manage violations" ON public.event_violations
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role_event IN ('panitia-pendaftaran', 'panitia-verifikasi', 'panitia-pertandingan'))
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'super-admin')
    );
