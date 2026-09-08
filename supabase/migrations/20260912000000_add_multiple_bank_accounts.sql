-- Migration: Add bank_accounts JSONB column to event_settings for multiple bank accounts
ALTER TABLE public.event_settings
    ADD COLUMN IF NOT EXISTS bank_accounts JSONB DEFAULT '[]'::jsonb;
