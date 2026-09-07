-- Migration: Add timeline release date and technical meeting date range to event_settings

ALTER TABLE public.event_settings
    ADD COLUMN IF NOT EXISTS timeline_release_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS technical_meeting_start TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS technical_meeting_end TIMESTAMPTZ;

-- Constraints
ALTER TABLE public.event_settings
    DROP CONSTRAINT IF EXISTS chk_tech_meeting_range;

ALTER TABLE public.event_settings
    ADD CONSTRAINT chk_tech_meeting_range CHECK (
        technical_meeting_start IS NULL OR technical_meeting_end IS NULL OR technical_meeting_start <= technical_meeting_end
    );
