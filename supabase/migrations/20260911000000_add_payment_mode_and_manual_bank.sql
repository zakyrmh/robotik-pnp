-- Migration: Add payment mode, bank details, whatsapp group link, rejection reason, and update payment status constraint

-- 1. Add payment mode & bank details to event_settings
ALTER TABLE public.event_settings
    ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(20) NOT NULL DEFAULT 'midtrans'
        CHECK (payment_mode IN ('midtrans', 'manual_bank')),
    ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(100);

-- 2. Add whatsapp_group_url to event_categories
ALTER TABLE public.event_categories
    ADD COLUMN IF NOT EXISTS whatsapp_group_url TEXT;

-- 3. Add rejection_reason and update payment_status check constraint in event_registrations
ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Drop old check constraint if it exists and add updated check constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE table_name = 'event_registrations' AND constraint_name = 'event_registrations_payment_status_check'
    ) THEN
        ALTER TABLE public.event_registrations DROP CONSTRAINT event_registrations_payment_status_check;
    END IF;
END $$;

ALTER TABLE public.event_registrations
    ADD CONSTRAINT event_registrations_payment_status_check
    CHECK (payment_status IN ('unpaid', 'pending', 'pending_verification', 'paid', 'rejected', 'expired', 'failed'));
