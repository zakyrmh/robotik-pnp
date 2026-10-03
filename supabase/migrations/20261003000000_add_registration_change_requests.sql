-- Migration: Permohonan Perbaikan Data Pendaftaran Event (MRC)
--
-- LATAR BELAKANG
-- MRC X 2026 tidak menyediakan akun login untuk peserta; akses dilakukan
-- melalui tautan tiket berbasis `access_token`. Peserta sering membutuhkan
-- perbaikan data (nama tim, anggota, kontak, foto). Memberi hak UPDATE
-- langsung berisiko menyalahi integritas lomba. Karena itu perubahan harus
-- DIAJUKAN lalu DISETUJUI admin (hak perbaikan data UU PDP Pasal 30 tetap
-- dipenuhi, tapi dengan kontrol panitia).
--
-- SOLUSI
-- Tabel `event_registration_change_requests` menyimpan payload perubahan
-- sebagai JSONB (field tim + array anggota) beserta status review. Payload
-- TIDAK diterapkan sampai admin menyetujui (atomik, lihat fungsi
-- `apply_registration_change_request`).

CREATE TABLE IF NOT EXISTS public.event_registration_change_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL
        REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    -- Payload perubahan: { team: {...}, members: [ {...} ] }
    requested_data JSONB NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    review_note TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_event_change_req_registration
    ON public.event_registration_change_requests(registration_id);
CREATE INDEX IF NOT EXISTS idx_event_change_req_status
    ON public.event_registration_change_requests(status, created_at DESC);

-- RLS: hanya panitia-pendaftaran & super-admin yang boleh membaca/mengelola
-- via sesi terautentikasi. Peserta mengakses lewat Server Action (service role).
ALTER TABLE public.event_registration_change_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "panitia manage registration change requests"
    ON public.event_registration_change_requests
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super-admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran'
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'super-admin'
        )
    );

-- ============================================================================
-- RPC ATOMIK: terapkan permohonan yang disetujui.
-- ============================================================================
-- Menggantikan seluruh anggota tim (delete + insert) dan memperbarui kolom
-- tim dalam SATU transaksi, sehingga tidak ada state setengah-jalan bila
-- salah satu langkah gagal. Dipanggil HANYA dari Server Action admin setelah
-- gerbang otorisasi (SECURITY DEFINER).

CREATE OR REPLACE FUNCTION public.apply_registration_change_request(
    p_request_id UUID,
    p_reviewer_id UUID
) RETURNS UUID AS $$
DECLARE
    v_reg_id UUID;
    v_data JSONB;
    v_status VARCHAR;
    v_member JSONB;
BEGIN
    -- Ambil & kunci baris permohonan untuk mencegah double-apply.
    SELECT registration_id, requested_data, status
        INTO v_reg_id, v_data, v_status
        FROM public.event_registration_change_requests
        WHERE id = p_request_id
        FOR UPDATE;

    IF v_reg_id IS NULL THEN
        RAISE EXCEPTION 'change_request_not_found';
    END IF;

    IF v_status <> 'pending' THEN
        RAISE EXCEPTION 'change_request_not_pending';
    END IF;

    -- 1) Perbarui kolom tim (hanya field yang ada di payload).
    UPDATE public.event_registrations SET
        team_name = COALESCE(v_data->'team'->>'team_name', team_name),
        institution = COALESCE(v_data->'team'->>'institution', institution),
        origin_city = COALESCE(v_data->'team'->>'origin_city', origin_city),
        advisor_name = COALESCE(v_data->'team'->>'advisor_name', advisor_name),
        team_email = COALESCE(v_data->'team'->>'team_email', team_email),
        team_whatsapp = COALESCE(v_data->'team'->>'team_whatsapp', team_whatsapp),
        updated_at = timezone('utc'::text, now())
    WHERE id = v_reg_id;

    -- 2) Ganti anggota tim (delete + re-insert) bila payload memuat members.
    IF v_data ? 'members' AND jsonb_typeof(v_data->'members') = 'array' THEN
        DELETE FROM public.event_team_members WHERE registration_id = v_reg_id;

        FOR v_member IN SELECT * FROM jsonb_array_elements(v_data->'members')
        LOOP
            INSERT INTO public.event_team_members (
                registration_id,
                full_name,
                photo_url,
                identity_card_url,
                birth_date,
                role_in_team
            ) VALUES (
                v_reg_id,
                v_member->>'full_name',
                v_member->>'photo_url',
                NULLIF(v_member->>'identity_card_url', ''),
                CASE
                    WHEN v_member->>'birth_date' IS NOT NULL
                        AND v_member->>'birth_date' <> ''
                    THEN (v_member->>'birth_date')::DATE
                    ELSE NULL
                END,
                COALESCE(v_member->>'role_in_team', 'Anggota')
            );
        END LOOP;
    END IF;

    -- 3) Tandai permohonan disetujui.
    UPDATE public.event_registration_change_requests SET
        status = 'approved',
        reviewed_by = p_reviewer_id,
        reviewed_at = timezone('utc'::text, now())
    WHERE id = p_request_id;

    RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';
