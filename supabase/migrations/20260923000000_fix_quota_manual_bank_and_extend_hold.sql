-- Migration: Hitung kuota manual bank & perpanjang tahan slot menjadi 5 jam
--
-- LATAR BELAKANG
-- MRC X 2026 tidak memakai payment gateway; pembayaran hanya manual via transfer
-- bank. Karena itu seluruh pendaftaran berbayar melewati status berikut:
--   unpaid -> pending_verification -> paid | rejected
--
-- MASALAH
-- Definisi `register_team` sebelumnya hanya menghitung:
--   payment_status = 'paid'
--   OR (payment_status = 'pending' AND created_at > now() - interval '2 hours')
--
-- Dampak:
-- 1. Status 'unpaid' (yang di-set mode manual_bank sesaat SETELAH insert)
--    TIDAK ikut terhitung, sehingga slot dapat ter-over-booking.
-- 2. 'pending_verification' (bukti bayar sudah diunggah, menunggu verifikasi
--    admin) juga tidak terhitung.
-- 3. Jendela penahanan 2 jam terlalu singkat untuk verifikasi manual panitia.
--
-- SOLUSI
-- 1. Slot ditahan untuk SEMUA pendaftaran aktif berbayar selama masa tunggu:
--      - 'paid'                  -> menahan permanen
--      - 'unpaid'                -> menahan selama masa tunggu
--      - 'pending'               -> menahan selama masa tunggu (mode midtrans)
--      - 'pending_verification'  -> menahan permanen (menunggu keputusan admin)
--    Status final-gagal ('rejected', 'expired', 'failed') TIDAK menahan.
-- 2. Masa tunggu diperpanjang dari 2 jam menjadi 5 jam agar verifikasi manual
--    transfer bank punya waktu memadai sebelum slot otomatis dilepas.
-- 3. Pendaftaran GRATIS (total_amount <= 0) di-set 'paid' langsung, jadi tetap
--    terhitung normal.

-- Konstanta masa tunggu (dipusatkan agar mudah diubah)
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
    -- menahan selama 5 jam sejak dibuat agar verifikasi manual punya waktu.
    SELECT count(*) INTO v_taken FROM public.event_registrations
        WHERE category_id = p_category_id
        AND (
            payment_status IN ('paid', 'pending_verification')
            OR (
                payment_status IN ('unpaid', 'pending')
                AND created_at > now() - interval '5 hours'
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
