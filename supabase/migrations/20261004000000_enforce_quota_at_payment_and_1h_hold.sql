-- Migration: Tegakkan kuota pada titik pembayaran & verifikasi, perpendek masa tahan slot ke 1 jam
--
-- LATAR BELAKANG
-- Insiden produksi: kategori "Line Follower Umum" menampilkan 39 tim padahal kuota
-- hanya 36; "Soccer Bot" 32 padahal kuota 30. Over-booking berasal dari tim berstatus
-- 'paid'.
--
-- AKAR MASALAH
-- Kuota HANYA dicek di satu titik: RPC `register_team` saat submit form.
-- Setelah itu tidak ada pengecekan kuota lagi:
--   1. `submitManualPaymentProofAction` meng-update `.update({ payment_status:
--      'pending_verification' })` secara polos -> menandai pendaftaran MENAHAN SLOT
--      PERMANEN tanpa cek kuota & tanpa cek kedaluwarsa masa tahan.
--   2. `verifyManualPaymentAction` (admin) meng-update ke 'paid' (permanen) tanpa cek.
-- Karena pendaftaran 'unpaid' yang sudah lewat batas masa tahan TIDAK ikut dihitung
-- saat submit, slot tampak kosong dan diisi pendaftar baru; tetapi pendaftar lama
-- yang sudah lewat batas tetap bisa mengunggah bukti bayar dan berubah menjadi
-- 'pending_verification'/'paid' (permanen). Akibatnya jumlah 'paid' melampaui kuota.
-- Tidak ada cron yang benar-benar men-set 'expired' untuk 'unpaid' kedaluwarsa.
--
-- KEPUTUSAN (disetujui pemilik proyek)
-- 1. 'unpaid' yang melewati masa tahan -> slot DILEPAS dan pendaftaran DITUTUP
--    permanen (harus mendaftar ulang bila kuota masih ada).
-- 2. Pengecekan kuota DITAMBAHKAN di titik upload bukti bayar peserta dan di titik
--    verifikasi admin.
-- 3. Admin DIBLOKIR TOTAL saat kuota penuh (tanpa override).
-- 4. Masa tahan slot diperpendek dari 5 jam menjadi 1 jam.
--
-- ATURAN TUNGGAL PENAHAN SLOT
--   'paid' dan 'pending_verification'  -> menahan PERMANEN
--   'unpaid' dan 'pending'             -> menahan SEMENTARA selama 1 jam
--   'rejected', 'expired', 'failed'    -> TIDAK menahan
-- Sejak transisi menuju status permanen selalu dicek kuota secara atomik, jumlah
-- 'paid' + 'pending_verification' tidak dapat melebihi kuota.

-- ---------------------------------------------------------------------------
-- 1. register_team: perpendek masa tahan dari 5 jam -> 1 jam
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.register_team(
    p_category_id UUID,
    p_registration_code VARCHAR,
    p_team_name VARCHAR,
    p_institution VARCHAR,
    p_origin_city VARCHAR,
    p_advisor_name VARCHAR,
    p_team_email VARCHAR,
    p_team_whatsapp VARCHAR,
    p_total_amount NUMERIC,
    p_rules_version_id UUID,
    p_members JSONB
) RETURNS UUID AS $$
DECLARE
    v_quota INT;
    v_taken INT;
    v_reg_id UUID;
    v_member JSONB;
BEGIN
    -- Kunci baris kategori untuk mencegah race condition kuota
    SELECT quota INTO v_quota FROM public.event_categories
        WHERE id = p_category_id FOR UPDATE;

    IF v_quota IS NULL THEN
        RAISE EXCEPTION 'category_not_found';
    END IF;

    -- Hitung slot yang sedang terpakai.
    -- 'paid' dan 'pending_verification' menahan permanen; 'unpaid'/'pending'
    -- menahan selama 1 jam sejak dibuat agar verifikasi manual punya waktu.
    SELECT count(*) INTO v_taken FROM public.event_registrations
        WHERE category_id = p_category_id
        AND (
            payment_status IN ('paid', 'pending_verification')
            OR (
                payment_status IN ('unpaid', 'pending')
                AND created_at > now() - interval '1 hour'
            )
        );

    IF v_taken >= v_quota THEN
        RAISE EXCEPTION 'quota_full';
    END IF;

    INSERT INTO public.event_registrations (
        registration_code,
        category_id,
        team_name,
        institution,
        origin_city,
        advisor_name,
        team_email,
        team_whatsapp,
        total_amount,
        rules_version_id,
        rules_accepted_at
    ) VALUES (
        p_registration_code,
        p_category_id,
        p_team_name,
        p_institution,
        p_origin_city,
        p_advisor_name,
        p_team_email,
        p_team_whatsapp,
        p_total_amount,
        p_rules_version_id,
        now()
    ) RETURNING id INTO v_reg_id;

    -- Simpan anggota tim
    FOR v_member IN SELECT * FROM jsonb_array_elements(p_members) LOOP
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
            v_member->>'identity_card_url',
            CASE
                WHEN v_member->>'birth_date' IS NOT NULL AND v_member->>'birth_date' <> ''
                THEN (v_member->>'birth_date')::DATE
                ELSE NULL
            END,
            COALESCE(v_member->>'role_in_team', 'Anggota')
        );
    END LOOP;

    RETURN v_reg_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 2. reserve_slot_for_payment: upload bukti bayar peserta + cek kuota + kedaluwarsa
-- ---------------------------------------------------------------------------
-- Dipanggil dari server action `submitManualPaymentProofAction` (service-role).
-- Mengunci baris kategori (FOR UPDATE) sehingga dua pendaftar yang mengunggah
-- bukti secara bersamaan tidak dapat dua-duanya lolos melebihi kuota.
--
-- Menegakkan dua hal:
--   * 'hold_expired' : pendaftaran sudah melewati masa tahan 1 jam -> slot dilepas,
--                      pendaftaran ditutup permanen (peserta harus daftar ulang).
--   * 'quota_full'   : kuota kategori sudah penuh (di luar dirinya sendiri).
--
-- Idempoten: bila pendaftaran sudah 'paid'/'pending_verification', cukup kembalikan id.
CREATE OR REPLACE FUNCTION public.reserve_slot_for_payment(
    p_access_token UUID,
    p_proof_url TEXT
) RETURNS UUID AS $$
DECLARE
    v_quota INT;
    v_taken INT;
    v_reg public.event_registrations%ROWTYPE;
BEGIN
    -- Ambil pendaftaran berdasarkan token akses (otorisasi). Tidak ada lock di sini
    -- untuk menghindari deadlock; lock justru diambil pada baris kategori di bawah.
    SELECT * INTO v_reg FROM public.event_registrations
        WHERE access_token = p_access_token;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'registration_not_found';
    END IF;

    -- Idempoten: sudah menahan permanen, tidak perlu transisi/kuota lagi.
    IF v_reg.payment_status IN ('paid', 'pending_verification') THEN
        RETURN v_reg.id;
    END IF;

    -- Status final-gagal tidak boleh dihidupkan kembali lewat jalur ini.
    IF v_reg.payment_status IN ('rejected', 'expired', 'failed') THEN
        RAISE EXCEPTION 'registration_closed';
    END IF;

    -- Kunci baris kategori untuk cek kuota atomik.
    SELECT quota INTO v_quota FROM public.event_categories
        WHERE id = v_reg.category_id FOR UPDATE;

    IF v_quota IS NULL THEN
        RAISE EXCEPTION 'category_not_found';
    END IF;

    -- Kedaluwarsa masa tahan: hanya berlaku untuk status sementara ('unpaid'/'pending').
    IF v_reg.payment_status IN ('unpaid', 'pending')
       AND v_reg.created_at <= now() - interval '1 hour' THEN
        RAISE EXCEPTION 'hold_expired';
    END IF;

    -- Hitung slot terpakai DI LUAR pendaftaran ini (pendaftaran ini belum menahan
    -- permanen, jadi tidak akan ikut terhitung).
    SELECT count(*) INTO v_taken FROM public.event_registrations
        WHERE category_id = v_reg.category_id
        AND id <> v_reg.id
        AND (
            payment_status IN ('paid', 'pending_verification')
            OR (
                payment_status IN ('unpaid', 'pending')
                AND created_at > now() - interval '1 hour'
            )
        );

    IF v_taken >= v_quota THEN
        RAISE EXCEPTION 'quota_full';
    END IF;

    UPDATE public.event_registrations
        SET manual_payment_proof_url = p_proof_url,
            payment_status = 'pending_verification',
            rejection_reason = NULL,
            updated_at = now()
        WHERE id = v_reg.id;

    RETURN v_reg.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------------
-- 3. verify_payment_with_quota: verifikasi admin + cek kuota (blokir total)
-- ---------------------------------------------------------------------------
-- Dipanggil dari server action `verifyManualPaymentAction` (aksi "approve").
-- Mengunci baris kategori, lalu menolak bila kuota sudah penuh. Tidak ada
-- mekanisme override: admin diblokir total saat kuota penuh.
CREATE OR REPLACE FUNCTION public.verify_payment_with_quota(
    p_registration_id UUID
) RETURNS VOID AS $$
DECLARE
    v_quota INT;
    v_taken INT;
    v_reg public.event_registrations%ROWTYPE;
BEGIN
    SELECT * INTO v_reg FROM public.event_registrations
        WHERE id = p_registration_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'registration_not_found';
    END IF;

    -- Idempoten: sudah lunas.
    IF v_reg.payment_status = 'paid' THEN
        RETURN;
    END IF;

    -- Kunci baris kategori untuk cek kuota atomik.
    SELECT quota INTO v_quota FROM public.event_categories
        WHERE id = v_reg.category_id FOR UPDATE;

    IF v_quota IS NULL THEN
        RAISE EXCEPTION 'category_not_found';
    END IF;

    -- Hitung slot terpakai DI LUAR pendaftaran ini. Karena pendaftaran ini
    -- (pending_verification) sedang menahan slot permanen DAN akan tetap menahan
    -- setelah menjadi 'paid', ia tidak dihitung agar transisi ini sendiri tidak
    -- memicu quota_full. Yang dihitung adalah pendaftar permanen lain.
    SELECT count(*) INTO v_taken FROM public.event_registrations
        WHERE category_id = v_reg.category_id
        AND id <> v_reg.id
        AND payment_status IN ('paid', 'pending_verification');

    IF v_taken >= v_quota THEN
        RAISE EXCEPTION 'quota_full';
    END IF;

    UPDATE public.event_registrations
        SET payment_status = 'paid',
            paid_at = now(),
            updated_at = now()
        WHERE id = v_reg.id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
