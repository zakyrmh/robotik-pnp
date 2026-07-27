set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.check_contact_message_rate_limit()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    message_count INTEGER;
    limit_count CONSTANT INTEGER := 3; -- Maksimal 3 pesan per email
    time_window CONSTANT INTERVAL := INTERVAL '1 hour'; -- Rentang waktu 1 jam
BEGIN
    -- Menghitung jumlah pesan dari email yang sama dalam rentang waktu yang ditentukan
    SELECT COUNT(*) INTO message_count
    FROM public.contact_messages
    WHERE email = NEW.email
      AND created_at > now() - time_window;

    -- Jika melebihi batas, gagalkan operasi insert dengan Exception
    IF message_count >= limit_count THEN
        RAISE EXCEPTION 'Rate limit database terlampaui. Maksimal pengiriman pesan adalah % kali per % untuk email %.', 
            limit_count, time_window, NEW.email;
    END IF;

    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_legacy_member(input_nim text)
 RETURNS TABLE(is_legacy boolean, member_data jsonb)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) AS is_legacy,
    CASE 
      WHEN EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) THEN
        (SELECT row_to_json(lm.*)::jsonb 
         FROM public.legacy_members lm 
         WHERE lm.nim = input_nim)
      ELSE NULL
    END AS member_data;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.check_registration_completeness()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Hanya berlaku saat status berubah menjadi 'verified'
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    IF NEW.high_school       IS NULL OR NEW.high_school       = '' OR
       NEW.current_class     IS NULL OR NEW.current_class     = '' OR
       NEW.motivation        IS NULL OR NEW.motivation        = '' OR
       NEW.photo_url         IS NULL OR NEW.photo_url         = '' OR
       NEW.payment_proof_url IS NULL OR NEW.payment_proof_url = '' OR
       NEW.payment_method    IS NULL OR NEW.payment_method    = ''
    THEN
      RAISE EXCEPTION 'Registrasi belum lengkap. Pastikan semua step telah diisi sebelum diverifikasi.'
        USING ERRCODE = 'P0001';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_my_role()
 RETURNS public.user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_next_unique_slug(v_name text, v_current_nim text)
 RETURNS text
 LANGUAGE plpgsql
AS $function$
DECLARE
  v_base_slug text;
  v_final_slug text;
  v_counter integer := 1;
BEGIN
  v_base_slug := public.slugify(v_name);
  v_final_slug := v_base_slug;
  
  -- Lakukan pengecekan berulang (loop) selama slug sudah terpakai oleh NIM lain
  WHILE EXISTS (
    SELECT 1 FROM public.legacy_members 
    WHERE slug = v_final_slug AND nim <> v_current_nim
  ) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_base_slug || '-' || v_counter; -- Pasang angka terurut (cth: nama-2)
  END LOOP;
  
  RETURN v_final_slug;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_legacy_members_slug()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Jalankan jika data baru masuk atau ada perubahan pada kolom full_name
  IF (TG_OP = 'INSERT') OR (NEW.full_name IS DISTINCT FROM OLD.full_name) THEN
    NEW.slug := public.get_next_unique_slug(NEW.full_name, NEW.nim);
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_onboarded)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        'caang'::public.user_role,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_registration_approval()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'verified' AND OLD.status <> 'verified' THEN
    UPDATE public.profiles
    SET is_onboarded = true
    WHERE id = NEW.profile_id;
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.promote_legacy_member_to_anggota(user_id uuid, input_nim text)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  legacy_exists BOOLEAN;
BEGIN
  -- Cek apakah NIM ada di legacy_members
  SELECT EXISTS(SELECT 1 FROM public.legacy_members WHERE nim = input_nim) INTO legacy_exists;
  
  IF NOT legacy_exists THEN
    RETURN FALSE;
  END IF;
  
  -- Update role dari caang ke anggota dan set is_onboarded = true
  UPDATE public.profiles 
  SET 
    role = 'anggota',
    is_onboarded = TRUE,
    nim = input_nim,
    updated_at = NOW()
  WHERE id = user_id;
  
  -- Update profile_id di legacy_members jika belum di-set
  UPDATE public.legacy_members
  SET profile_id = user_id
  WHERE nim = input_nim AND profile_id IS NULL;
  
  RETURN TRUE;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        IF public.get_my_role() IS DISTINCT FROM 'super-admin'::public.user_role THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.';
        END IF;
    END IF;
    RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.set_activity_target_audience()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  v_role text;
BEGIN
  -- Mengambil role user yang sedang membuat kegiatan
  v_role := public.get_my_role()::text;
  
  IF v_role = 'admin-komdis' THEN
    NEW.target_audience := 'anggota'::public.activity_target;
  ELSIF v_role = 'admin-or' THEN
    NEW.target_audience := 'caang'::public.activity_target;
  END IF;

  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.slugify(v_text text)
 RETURNS text
 LANGUAGE plpgsql
 IMMUTABLE STRICT
AS $function$
BEGIN
  RETURN regexp_replace(
    regexp_replace(
      lower(v_text),
      '[^a-z0-9\s_-]', '', 'g' -- Hapus karakter spesial selain huruf, angka, spasi, dan strip
    ),
    '[\s_-]+', '-', 'g'       -- Ubah spasi ganda atau separator menjadi satu strip (-)
  );
END;
$function$
;

-- CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


