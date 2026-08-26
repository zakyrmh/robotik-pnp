# Architecture Document: Sistem Registrasi & Pembayaran — Minangkabau Robot Contest

- **Project:** SIM UKM Robotik Politeknik Negeri Padang
- **Feature Module:** Event Competition Registration & Payment Gateway Integration
- **Target Event Types:** Robot Soccer, Robot Line Follower, Robot Sumo, dll.
- **Skala Estimasi:** ±100 tim per event (single event musiman)
- **Stack:** Next.js 16 (App Router), Supabase Free Tier (PostgreSQL + RLS + Storage), Midtrans Snap & Webhook, Vercel Hobby, Resend (email)
- **Status:** **Final — siap implementasi**

---

## 1. Latar Belakang & Ruang Lingkup

Dokumen ini mencakup **modul registrasi tim, pembayaran, dan verifikasi identitas peserta** untuk Minangkabau Robot Contest. Modul manajemen pertandingan (bracket, penjadwalan, live score, overlay OBS) dirancang sebagai modul terpisah dengan dokumen arsitektur sendiri, dikelola oleh role berbeda (wasit/panitia pertandingan), dan **tidak termasuk** dalam dokumen ini.

Tabel-tabel di bawah adalah **tabel baru**, tidak ada tabel event lomba sebelumnya di database SIM UKM — sehingga skema ditulis langsung sebagai `CREATE TABLE`, tanpa migrasi `ALTER TABLE`.

> **Catatan desain — satu instansi dengan banyak tim:** satu pembimbing/manajer dari instansi yang sama boleh mendaftarkan lebih dari satu tim, tetapi ini ditangani di **level UX form**, bukan skema data. Setiap tim tetap 1 baris `event_registrations` terpisah (pembayaran, kuota, dan verifikasi wajah independen per tim). Form pendaftaran cukup menawarkan opsi "daftarkan tim lain dari instansi yang sama?" untuk mengisi ulang `institution`, `advisor_name`, `team_email`, `team_whatsapp` secara otomatis dari submission sebelumnya. Rekap "instansi mana membawa berapa tim" cukup lewat `GROUP BY institution, advisor_name` saat query, tanpa tabel/kolom tambahan.

| Aspek Domain             | Sistem SIM UKM Internal      | Sistem Pendaftaran Lomba (Event)                        |
| :----------------------- | :--------------------------- | :------------------------------------------------------ |
| **Audience**             | Mahasiswa internal PNP.      | Siswa SMA/SMK, mahasiswa lain, delegasi eksternal.      |
| **Lifecycle Akun**       | Long-term & persistent.      | Seasonal & ephemeral (aktif ~1–3 bulan).                |
| **Representasi Entitas** | 1 akun = 1 individu.         | 1 kontak tim mendaftarkan 1 tim (2+ anggota).           |
| **Retensi Data**         | Permanen (arsip organisasi). | 3 bulan setelah event, dihapus manual oleh super-admin. |

---

## 2. Keputusan Arsitektur Autentikasi

### Guest Checkout + Access Token (Magic Link)

Tidak ada akun password permanen untuk peserta. Sistem membuat `registration_code` unik dan `access_token` (UUID) yang dikirim ke email peserta sebagai tautan akses status pendaftaran.

**Aturan keras:** `access_token` **tidak pernah** bisa dibaca lewat query publik langsung. Semua pembacaan (cek status, dashboard peserta) wajib lewat Server Action menggunakan `service_role` key yang memverifikasi token di sisi server sebelum mengembalikan data.

```
Form Registrasi ──▶ Midtrans Snap ──▶ Halaman Konfirmasi & E-Tiket (QR)
                                              │
                                Kirim Access Token & E-Tiket via Email (Resend)
```

Notifikasi WhatsApp **tidak diotomatiskan** (menghindari biaya WA Business API) — halaman konfirmasi menyediakan tombol `wa.me` berisi pesan siap kirim, dipakai peserta untuk mengirim reminder ke diri sendiri atau dibagikan panitia secara manual bila diperlukan.

---

## 3. Skema Database (PostgreSQL / Supabase)

```sql
-- 1. Kategori Lomba
CREATE TABLE public.event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    registration_fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
    max_team_members INT NOT NULL DEFAULT 3,
    quota INT NOT NULL DEFAULT 32,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Versi Aturan Lomba (disnapshot agar bisa dirujuk saat sengketa)
CREATE TABLE public.event_rules_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES public.event_categories(id),
    version VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Pendaftaran Tim & Transaksi
CREATE TABLE public.event_registrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_code VARCHAR(30) UNIQUE NOT NULL,
    category_id UUID NOT NULL REFERENCES public.event_categories(id) ON DELETE RESTRICT,

    team_name VARCHAR(100) NOT NULL,
    institution VARCHAR(150) NOT NULL,       -- Asal Sekolah / Kampus
    origin_city VARCHAR(100),                -- Asal Daerah / Kota
    advisor_name VARCHAR(120),               -- Nama Pembimbing
    team_email VARCHAR(150) NOT NULL,
    team_whatsapp VARCHAR(25) NOT NULL,

    -- Status Transaksi
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (payment_status IN ('pending', 'paid', 'expired', 'failed')),
    total_amount NUMERIC(12, 2) NOT NULL,
    midtrans_order_id VARCHAR(100) UNIQUE,
    midtrans_snap_token TEXT,
    midtrans_payment_type VARCHAR(50),
    paid_at TIMESTAMPTZ,
    manual_payment_proof_url TEXT,           -- fallback saat verifikasi manual

    -- Aturan & Akses
    rules_version_id UUID REFERENCES public.event_rules_versions(id),
    rules_accepted_at TIMESTAMPTZ,
    access_token UUID NOT NULL DEFAULT gen_random_uuid(),

    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Data Anggota Tim
CREATE TABLE public.event_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    full_name VARCHAR(120) NOT NULL,
    photo_url TEXT NOT NULL,                 -- wajib, untuk verifikasi wajah on-site
    member_qr_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE, -- token scan kokarde, TERPISAH dari access_token
    verification_status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (verification_status IN ('pending', 'verified', 'mismatch')),
    role_in_team VARCHAR(50) DEFAULT 'Anggota',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Log Verifikasi Wajah di Lapangan
CREATE TABLE public.event_member_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id UUID NOT NULL REFERENCES public.event_team_members(id) ON DELETE CASCADE,
    verified_by UUID NOT NULL,
    result VARCHAR(20) NOT NULL CHECK (result IN ('verified', 'mismatch')),
    notes TEXT,
    scanned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Pelanggaran & Peringatan
CREATE TABLE public.event_violations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    registration_id UUID NOT NULL REFERENCES public.event_registrations(id) ON DELETE CASCADE,
    violation_type VARCHAR(50) NOT NULL,     -- 'joki', 'terlambat', 'pelanggaran teknis', dll
    description TEXT,
    warning_number INT NOT NULL,
    issued_by UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'dq_confirmed', 'appealed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes
CREATE INDEX idx_event_reg_code ON public.event_registrations(registration_code);
CREATE INDEX idx_event_reg_email ON public.event_registrations(team_email);
CREATE INDEX idx_event_reg_order_id ON public.event_registrations(midtrans_order_id);
CREATE INDEX idx_event_reg_status ON public.event_registrations(payment_status);
CREATE INDEX idx_event_member_qr ON public.event_team_members(member_qr_token);
```

> **Catatan cakupan foto:** berdasarkan data tahun lalu, tim rata-rata beranggotakan 2 orang. `max_team_members` tetap dikonfigurasi per kategori di `event_categories`, bukan di-hardcode.

---

## 4. Konkurensi Kuota (Race Condition Safe)

Dieksekusi lewat satu fungsi Postgres — cukup untuk skala ±100 tim, tanpa infrastruktur tambahan (Redis/queue):

```sql
CREATE OR REPLACE FUNCTION public.register_team(
    p_category_id UUID,
    p_payload JSONB
) RETURNS UUID AS $$
DECLARE
    v_quota INT;
    v_taken INT;
    v_id UUID;
BEGIN
    SELECT quota INTO v_quota FROM event_categories
        WHERE id = p_category_id FOR UPDATE;

    SELECT count(*) INTO v_taken FROM event_registrations
        WHERE category_id = p_category_id
        AND (
            payment_status = 'paid'
            OR (payment_status = 'pending' AND created_at > now() - interval '2 hours')
        );

    IF v_taken >= v_quota THEN
        RAISE EXCEPTION 'quota_full';
    END IF;

    INSERT INTO event_registrations (...) VALUES (...) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

`FOR UPDATE` pada baris kategori mengunci secara alami saat dua submit bersamaan. Baris `pending` yang lewat 2 jam otomatis tidak dihitung sebagai kuota terpakai — **tanpa bergantung pada cron job apa pun**, karena Vercel Hobby hanya mengizinkan cron 1×/hari yang terlalu jarang untuk pelepasan kuota real-time. Cron harian tetap dipasang, tapi hanya untuk mengubah status jadi `'expired'` demi kerapian tampilan admin — bukan untuk korektnya sistem.

---

## 5. Row Level Security (RLS)

### 5.1 Kolom `role_event` di `profiles`

Role kepanitiaan event bersifat temporer/musiman dan terpisah dari role organisasi permanen (`super-admin`, `admin-or`, dst) agar orang yang sama bisa berbeda peran tiap musim event tanpa mengubah role strukturalnya.

```sql
ALTER TABLE public.profiles
    ADD COLUMN role_event VARCHAR(30)
        CHECK (role_event IN ('panitia-pendaftaran', 'panitia-verifikasi', 'panitia-pertandingan'));
```

| `role_event`           | Cakupan tugas                                                           | Akses tabel                                                                                  |
| ---------------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `panitia-pendaftaran`  | Kelola kategori & kuota, pantau pendaftar, verifikasi pembayaran manual | `event_categories` (CRUD), `event_registrations` (read + update `payment_status`)            |
| `panitia-verifikasi`   | Scan QR kokarde, cocokkan wajah di lapangan                             | `event_team_members` (read foto via `member_qr_token`), `event_member_verifications` (write) |
| `panitia-pertandingan` | Atur jadwal/bracket, klik mulai-selesai, input skor                     | `event_matches` (di luar cakupan dokumen ini), `event_registrations` (read nama tim saja)    |

Nullable karena tidak semua anggota SIM UKM terlibat kepanitiaan event tertentu. Kuota per kategori (kolom `quota` di `event_categories`, §3) ditetapkan oleh role `panitia-pendaftaran` lewat form CRUD kategori di dashboard.

### 5.2 Policy

```sql
ALTER TABLE public.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_team_members ENABLE ROW LEVEL SECURITY;

REVOKE SELECT ON public.event_registrations FROM anon;
REVOKE SELECT ON public.event_team_members FROM anon;

CREATE POLICY "public insert registration" ON public.event_registrations
    FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "public insert member" ON public.event_team_members
    FOR INSERT TO anon WITH CHECK (true);

-- Tidak ada policy SELECT untuk anon.
-- Semua pembacaan (cek status, dashboard peserta) dari sisi peserta
-- WAJIB melalui Server Action dengan service_role key yang memvalidasi
-- access_token secara eksplisit di server.

CREATE POLICY "panitia pendaftaran manage categories" ON public.event_categories
    FOR ALL TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

CREATE POLICY "panitia pendaftaran read & verify payment" ON public.event_registrations
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_event = 'panitia-pendaftaran')
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super-admin')
    );

CREATE POLICY "panitia verifikasi read member photo" ON public.event_team_members
    FOR SELECT TO authenticated
    USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role_event = 'panitia-verifikasi')
    );
```

Mutasi status pembayaran (`payment_status`) hanya boleh dilakukan oleh `service_role` (Server Action / webhook) atau `panitia-pendaftaran` (verifikasi manual, fallback saat webhook gagal — lihat §6). Setiap `role_event` dibatasi hanya ke tabel yang relevan dengan tugasnya, sesuai prinsip _least privilege_ — `panitia-verifikasi` misalnya tidak diberi akses ke `payment_status` atau kontak tim sama sekali.

---

## 6. Integrasi Midtrans Payment Gateway

```
[Form Pendaftaran] ──▶ [Server Action: registerEventAction]
                              │
                              ├── Zod validation
                              ├── RPC register_team() — atomik cek kuota + insert
                              └── Call Midtrans Snap API
                              │
[Midtrans Snap Popup] ◀── snap_token
       │
       ├── Peserta bayar (QRIS/VA/E-Wallet)
       │
[Midtrans Engine] ──webhook──▶ [/api/webhooks/midtrans]
                              │
                              ├── Verifikasi signature SHA-512
                              ├── Verifikasi gross_amount & transaction_status cocok DB
                              ├── Update idempoten (skip jika sudah 'paid')
                              └── Kirim email e-tiket via Resend
```

$$\text{Signature} = \text{SHA512}(\text{order\_id} + \text{status\_code} + \text{gross\_amount} + \text{ServerKey})$$

**Fallback verifikasi manual:** jika webhook gagal (misal Midtrans down atau delay), admin dengan permission `event:verify-payment` dapat menandai `payment_status = 'paid'` secara manual berdasarkan `manual_payment_proof_url`, dicatat di audit trail (lihat §8).

---

## 7. Verifikasi Wajah di Lapangan (Anti-Joki)

QR di kokarde/name tag mengenkode `member_qr_token` — **bukan** `access_token` tim, agar scope-nya terbatas hanya untuk menampilkan foto + nama + kategori, read-only.

```
Panitia scan QR kokarde ──▶ Sistem tampilkan foto & data ──▶ Panitia bandingkan wajah
                                                                        │
                                                    ┌───────────────────┴──────────────────┐
                                                 cocok                                  tidak cocok
                                                    │                                       │
                                          Tandai terverifikasi                    Tandai mismatch
                                          (izinkan bertanding)                    (eskalasi ke panitia inti)
```

Setiap hasil scan (cocok maupun tidak) dicatat di `event_member_verifications` untuk jejak audit bila terjadi sengketa.

**Pertimbangan operasional:**

- Endpoint scan wajib melalui sesi panitia yang sudah login — tidak ada akses publik ke foto peserta (data biometrik, sebagian peserta di bawah umur).
- Halaman scan sebaiknya PWA dengan caching data di awal hari, mengingat koneksi venue kompetisi sering tidak stabil.

---

## 8. Aturan Lomba & Penanganan Pelanggaran

Peserta menyetujui `event_rules_versions` tertentu saat mendaftar (`rules_version_id` + `rules_accepted_at` disnapshot, bukan boolean biasa — agar ada bukti persis versi aturan yang disetujui).

**Diskualifikasi tidak sepenuhnya otomatis.** Sistem mengakumulasi peringatan di `event_violations` dan mengusulkan status `flagged_for_dq` setelah N peringatan, tapi eksekusi final tetap membutuhkan konfirmasi manual dari admin berwenang — mencegah diskualifikasi keliru akibat human error atau duplikat input tanpa jalur banding.

---

## 9. Optimasi Resource (Supabase Free + Vercel Hobby)

| Area                             | Risiko                                                      | Mitigasi                                                                                                     |
| :------------------------------- | :---------------------------------------------------------- | :----------------------------------------------------------------------------------------------------------- |
| Storage foto (1GB limit)         | Foto resolusi tinggi menghabiskan kuota cepat               | Kompresi client-side sebelum upload: resize maks lebar 480px, WebP, target <150KB/foto                       |
| Egress (5GB/bulan)               | Serving foto berulang                                       | Signed URL berumur pendek dari Storage, bukan public bucket                                                  |
| Vercel Cron (1×/hari di Hobby)   | Tidak cukup untuk pelepasan kuota real-time                 | Korektnya sistem tidak bergantung cron (lihat §4); cron hanya kosmetik                                       |
| DB size (500MB limit)            | Tidak signifikan                                            | Skema ini murni metadata teks; foto disimpan di Storage, bukan DB — jauh di bawah limit untuk skala ±100 tim |
| Project auto-pause (7 hari idle) | Cron/job terjadwal bisa gagal diam-diam saat project paused | Retensi data (§10) sengaja dibuat manual (tombol admin), bukan cron, agar tidak bergantung uptime otomatis   |
| WhatsApp otomatis                | Butuh API berbayar                                          | Tidak diotomatiskan — tautan `wa.me` siap kirim di halaman konfirmasi                                        |

---

## 10. Retensi Data

Data pendaftaran (termasuk foto peserta) disimpan **3 bulan setelah event selesai**, kemudian dihapus **manual oleh super-admin** melalui tombol khusus di dashboard admin (bukan cron otomatis):

```sql
DELETE FROM public.event_registrations
WHERE created_at < now() - interval '3 months';
-- CASCADE menghapus event_team_members, event_violations,
-- event_member_verifications terkait.
-- File foto di Supabase Storage dihapus terpisah oleh aplikasi
-- sebelum row dihapus, karena CASCADE tidak menyentuh Storage.
```

---

## 11. Lokasi File Rencana Implementasi

- Dokumen Arsitektur: `docs/04-process-view/architecture-event-registration-payment.md`
- Frontend Public Event: `app/(marketing)/event/[slug]/daftar/page.tsx`
- Midtrans Webhook: `app/api/webhooks/midtrans/route.ts`
- Server Actions: `lib/actions/event-registration.ts`
- Zod Schemas: `lib/schemas/event-registration.ts`
- Dashboard Panitia: `app/(private)/manajemen-event/`
- Halaman Scan Verifikasi Wajah: `app/(private)/manajemen-event/verifikasi/`

---

## 12. Di Luar Cakupan Dokumen Ini

Modul berikut dirancang terpisah, menyusul setelah modul ini diimplementasikan:

- Manajemen babak grup & bracket otomatis
- Live score & role wasit/panitia pertandingan
- Overlay OBS real-time
