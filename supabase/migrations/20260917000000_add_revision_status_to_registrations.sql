-- Migration: Add 'revision' value to reg_status enum and add revision_notes column to registrations table
-- Purpose: Allows Super Admin & Admin OR to set a candidate registration to 'revision' when submitted data needs correction.

-- 1. Add 'revision' enum value to reg_status
ALTER TYPE public.reg_status ADD VALUE IF NOT EXISTS 'revision';

-- 2. Add revision_notes column to store notes/reasons from admin regarding what needs to be revised
ALTER TABLE public.registrations
    ADD COLUMN IF NOT EXISTS revision_notes TEXT;

-- Comment for documentation
COMMENT ON COLUMN public.registrations.revision_notes IS 'Catatan perbaikan/revisi dari Super Admin atau Admin OR jika data registrasi calon anggota perlu diperbaiki';
