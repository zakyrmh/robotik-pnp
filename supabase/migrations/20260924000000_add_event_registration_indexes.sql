-- Migration: Index untuk mempercepat query dashboard & join event MRC.
--
-- LATAR BELAKANG
-- Halaman admin `/manajemen-event` (dashboard) & `/manajemen-event/pendaftaran`
-- membaca tabel `event_registrations` dengan join ke `event_categories` dan
-- `event_team_members`. Tabel ini tumbuh seiring bertambahnya tim yang
-- mendaftar. Supabase Free Plan membatasi compute & disk IO, sehingga
-- sequential scan + sort berulang harus dihindari.
--
-- MASALAH
-- Migrasi awal hanya mengindeks: registration_code, team_email,
-- midtrans_order_id, payment_status, dan member_qr_token. Tidak ada index
-- untuk:
--   1. category_id          -> FK join & filter .eq("category_id", ...)
--                              serta sub-query hitung kuota di register_team.
--   2. created_at           -> ORDER BY created_at DESC pada dashboard & tabel.
--   3. registration_id      -> embedded members(...) (lookup per registration;
--                              tanpa ini terjadi pola mirip N+1).
--
-- SOLUSI
-- Tambah 4 index di bawah. Semua memakai IF NOT EXISTS agar idempoten.

-- 1. FK & filter kategori (join embedded category/registrations, filter kategori,
--    dan COUNT kuota di fungsi register_team).
CREATE INDEX IF NOT EXISTS idx_event_reg_category
    ON public.event_registrations(category_id);

-- 2. Pengurutan kronologis (dashboard & tabel pendaftaran ORDER BY created_at DESC).
CREATE INDEX IF NOT EXISTS idx_event_reg_created_at
    ON public.event_registrations(created_at DESC);

-- 3. Pola kuota/statistik: filter per kategori + status bayar + jendela waktu
--    (register_team & getPublicEventOverviewAction). Index komposit ini
--    menutup kombinasi yang tidak tercakup index tunggal di atas.
CREATE INDEX IF NOT EXISTS idx_event_reg_category_status
    ON public.event_registrations(category_id, payment_status, created_at);

-- 4. Relasi anggota -> registrasi (embedded event_team_members(*) pada query
--    admin; mencegah lookup mahal per baris registrasi).
CREATE INDEX IF NOT EXISTS idx_event_member_registration
    ON public.event_team_members(registration_id);
