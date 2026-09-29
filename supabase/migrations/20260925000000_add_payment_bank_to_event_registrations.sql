-- Migration: Add denormalized snapshot of the destination bank account to
-- event_registrations so admins (panitia-pendaftaran / super-admin) can record
-- which committee rekening a team's payment went to.
--
-- Snapshot (3 scalar columns) instead of a FK to a bank table because the
-- source of bank accounts is JSONB (event_settings.bank_accounts) plus a single
-- fallback pair (bank_name / bank_account_number / bank_account_holder). Storing
-- a snapshot preserves the historical rekening for auditing even if the
-- committee later edits the account list.

ALTER TABLE public.event_registrations
    ADD COLUMN IF NOT EXISTS payment_bank_name VARCHAR(100),
    ADD COLUMN IF NOT EXISTS payment_bank_account_number VARCHAR(50),
    ADD COLUMN IF NOT EXISTS payment_bank_account_holder VARCHAR(100);
