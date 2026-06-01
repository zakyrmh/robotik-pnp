-- Migration: Add parent_id to caang_groups for 2-level hierarchy
-- Level 1 (Kelompok Induk): parent_id IS NULL
-- Level 2 (Sub Kelompok): parent_id = <id_kelompok_induk>

ALTER TABLE public.caang_groups
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.caang_groups(id) ON DELETE CASCADE;

-- Remove the UNIQUE constraint on name (sub groups in different parents can have same name)
ALTER TABLE public.caang_groups DROP CONSTRAINT IF EXISTS caang_groups_name_key;

-- Remove the UNIQUE constraint on profile_id in group_members
-- (a caang can only be in one sub-group at a time, but we keep this for now)
-- The existing UNIQUE(profile_id) stays: one caang -> one sub group only.

-- Index for parent_id lookups
CREATE INDEX IF NOT EXISTS idx_caang_groups_parent_id ON public.caang_groups(parent_id);
