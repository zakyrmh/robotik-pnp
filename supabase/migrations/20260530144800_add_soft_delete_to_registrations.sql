-- Alter registrations table to support soft delete
ALTER TABLE public.registrations 
ADD COLUMN deleted_at TIMESTAMPTZ DEFAULT NULL,
ADD COLUMN delete_reason TEXT DEFAULT NULL;

-- Create an index to speed up filtering of non-deleted registrations
CREATE INDEX idx_registrations_deleted_at ON public.registrations(deleted_at) WHERE deleted_at IS NULL;
