-- ================================================
-- Migration: Tabel Token Absensi OR (QR Code)
-- ================================================
-- Digunakan untuk menyimpan token sementara (5 menit)
-- yang di-generate oleh caang untuk discan oleh admin.

CREATE TABLE IF NOT EXISTS public.or_attendance_tokens (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id    UUID NOT NULL REFERENCES public.or_events(id) ON DELETE CASCADE,
    token       VARCHAR(255) NOT NULL UNIQUE,
    expires_at  TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index untuk performa
CREATE INDEX idx_or_att_tokens_user_event ON public.or_attendance_tokens(user_id, event_id);
CREATE INDEX idx_or_att_tokens_token ON public.or_attendance_tokens(token);

-- RLS
ALTER TABLE public.or_attendance_tokens ENABLE ROW LEVEL SECURITY;

-- Caang bisa melihat dan membuat token miliknya sendiri
CREATE POLICY "Users can manage their own attendance tokens"
ON public.or_attendance_tokens
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin bisa melihat semua token (untuk validasi scan)
CREATE POLICY "Admins can view all attendance tokens"
ON public.or_attendance_tokens
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON ur.role_id = r.id
        WHERE ur.user_id = auth.uid()
        AND r.name IN ('admin', 'super_admin')
    )
);
