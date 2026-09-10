-- Migration: Dedicated Midtrans Business Review Simulation Tables
-- Purpose: Isolated tables for Midtrans Reviewer verification without affecting live MRC data

CREATE TABLE IF NOT EXISTS public.review_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name TEXT NOT NULL,
    leader_name TEXT NOT NULL,
    email TEXT NOT NULL,
    whatsapp TEXT NOT NULL,
    category TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, SETTLEMENT, EXPIRE, CANCEL
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.review_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID REFERENCES public.review_registrations(id) ON DELETE CASCADE,
    order_id TEXT UNIQUE NOT NULL,
    gross_amount NUMERIC NOT NULL,
    snap_token TEXT,
    payment_type TEXT,
    transaction_status TEXT NOT NULL DEFAULT 'pending',
    raw_response JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.review_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies allowing unauthenticated review submissions
CREATE POLICY "public insert review registrations" ON public.review_registrations
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "public select review registrations" ON public.review_registrations
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public update review registrations" ON public.review_registrations
    FOR UPDATE TO anon, authenticated USING (true);

CREATE POLICY "public insert review transactions" ON public.review_transactions
    FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "public select review transactions" ON public.review_transactions
    FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "public update review transactions" ON public.review_transactions
    FOR UPDATE TO anon, authenticated USING (true);
