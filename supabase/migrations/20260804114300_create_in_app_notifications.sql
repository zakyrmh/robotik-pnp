-- =============================================================================
-- Migration: in_app_notifications
-- Deskripsi: Tabel notifikasi in-app untuk mengirim pemberitahuan ke user
--            saat admin membuat kegiatan, sanksi, pengumuman, dll.
-- =============================================================================

-- 1. Buat tabel in_app_notifications
CREATE TABLE IF NOT EXISTS public.in_app_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'activity',
    reference_id UUID,
    reference_type TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT in_app_notifications_type_check CHECK (
        type IN ('activity', 'discipline', 'announcement', 'piket', 'task')
    )
);

-- 2. Index untuk query cepat per user (notifikasi terbaru, unread first)
CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
    ON public.in_app_notifications(recipient_id, is_read, created_at DESC);

-- 3. Aktifkan RLS
ALTER TABLE public.in_app_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Bersihkan policy lama jika ada
DROP POLICY IF EXISTS "notifications_select_own" ON public.in_app_notifications;
DROP POLICY IF EXISTS "notifications_update_own" ON public.in_app_notifications;
DROP POLICY IF EXISTS "notifications_insert_admin" ON public.in_app_notifications;

-- 5. Policy SELECT: User hanya bisa baca notifikasi miliknya sendiri
CREATE POLICY "notifications_select_own" ON public.in_app_notifications
FOR SELECT USING (recipient_id = auth.uid());

-- 6. Policy UPDATE: User hanya bisa update (mark as read) notifikasi miliknya
CREATE POLICY "notifications_update_own" ON public.in_app_notifications
FOR UPDATE USING (recipient_id = auth.uid());

-- 7. Policy INSERT: Hanya admin roles yang bisa insert notifikasi
CREATE POLICY "notifications_insert_admin" ON public.in_app_notifications
FOR INSERT WITH CHECK (
    public.get_my_role()::text IN (
        'super-admin', 'admin-or', 'admin-komdis', 'admin-kestari', 'admin-divisi'
    )
);
