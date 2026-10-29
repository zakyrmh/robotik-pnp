# Rancangan Arsitektur Pemisahan Subdomain dan Ekosistem Project Robotik PNP

Dokumen ini merangkum hasil analisis teknis dan keputusan arsitektur terkait pemisahan sistem **UKM Robotik Politeknik Negeri Padang** ke dalam 3 subdomain dengan isolasi proyek dan basis data untuk efisiensi, skalabilitas, dan kemudahan pemeliharaan.

---

## 1. Latar Belakang & Urgensi

Saat ini, seluruh fitur organisasi internal (absensi, piket lab, evaluasi caang, kedisiplinan) dan sistem event kompetisi eksternal (Minangkabau Robot Contest / MRC) bertumpuk dalam satu repositori Next.js dan satu skema basis data `public` di Supabase.

### Kendala Utama:

1. **Pencemaran Basis Data:** Tabel event MRC (registrasi tim, verifikasi berkas, kuota, bank) bercampur baur dengan tabel harian internal UKM (`profiles`, `piket_*`, `caang_*`, `audit_logs`).
2. **Kapasitas Media (Storage):** Berkas foto bukti piket internal dan ribuan berkas peserta MRC (KTM/kartu pelajar, pas foto, bukti transfer) berebut kuota gratis 1 GB Supabase Storage.
3. **Risiko Deployment & Keamanan:** Bug atau lonjakan traffic saat pendaftaran MRC dibuka berpotensi melumpuhkan sistem operasional internal organisasi dan website publik.
4. **Perbedaan Pola Pengguna:**
   - **Internal:** Membutuhkan autentikasi ketat harian dan audit log permanen.
   - **Publik:** Menuntut kecepatan akses dan sifatnya mayoritas _read-only_.
   - **MRC:** Bersifat musiman (_seasonal event-commerce_) dengan pendaftar dari sekolah/kampus luar.

---

## 2. Arsitektur Global (3 Subdomain + 2 Supabase)

### Pemetaan Domain & Alokasi Resource

| Domain / Subdomain              | Target Pengguna               | Basis Kode (Vercel Free)                  | Basis Data & Auth               | Peran Utama                                                         |
| :------------------------------ | :---------------------------- | :---------------------------------------- | :------------------------------ | :------------------------------------------------------------------ |
| **`robotik-pnp.com`**           | Publik / Umum                 | Proyek Vercel 1 (Next.js)                 | Supabase 1 (Read-only) / Statis | Profil UKM, artikel, etalase prestasi, divisi.                      |
| **`dashboard.robotik-pnp.com`** | Pengurus, Anggota, Caang      | Proyek Vercel 2 (Next.js - Repo Saat Ini) | **Supabase 1 (Organisasi)**     | Piket lab, absensi QR dinamis, oprec, sanksi/SP, audit logs.        |
| **`mrc.robotik-pnp.com`**       | Pembina/Peserta & Panitia MRC | Proyek Vercel 3 (Next.js Baru)            | **Supabase 2 (Khusus MRC)**     | Pendaftaran keranjang multi-tim, tiket invoice, verifikasi panitia. |

---

## 3. Rincian Modul Tiap Subdomain

### A. Website Publik (`robotik-pnp.com`)

- **Tujuan:** _Front-facing branding_ UKM Robotik PNP.
- **Karakteristik:** Statis, ringan, terindeks SEO maksimal (SSR/SSG), tanpa otorisasi login.
- **Fitur Utama:**
  - Profil sejarah, visi & misi UKM.
  - Struktur divisi & galeri karya robot.
  - Etalase pencapaian prestasi lomba.
  - Artikel & publikasi berita organisasi.

### B. Dashboard Organisasi (`dashboard.robotik-pnp.com`)

- **Tujuan:** Sistem informasi manajemen operasional internal harian.
- **Basis Data:** **Supabase 1 (Aktif Sepanjang Tahun)**.
- **Fitur Utama:**
  - **Manajemen Open Recruitment (Oprec):** Seleksi berkas calon anggota, penilaian wawancara teknis/organisasi, plotting kelompok magang, dan SK pelantikan.
  - **Manajemen Piket Laboratorium:** Roster rotasi mingguan/bulanan, upload foto _before-after_, verifikasi, dan denda ketidakhadiran.
  - **Presensi Digital:** QR scanner dinamis bereksipirasi 30 detik untuk kegiatan mingguan.
  - **Sanksi & Kedisiplinan:** Poin pelanggaran, akumulasi denda, dan penerbitan Surat Peringatan (SP).
  - **Audit Log:** Pencatatan mutasi data sensitif secara _immutable_ (PostgreSQL trigger).

### C. Portal Minangkabau Robot Contest (`mrc.robotik-pnp.com`)

- **Tujuan:** Portal resmi kompetisi robotik tahunan.
- **Basis Data:** **Supabase 2 (Musiman / Seasonal - Lembaran Bersih)**.
- **Karakteristik Alur Pendaftaran (_Event-Commerce_):**
  - **Fitur Keranjang Belanja (_Cart_):** Pendaftar (guru pembina/ketua delegasi) dapat mendaftarkan beberapa tim sekaligus (misal: 2 tim Sumo + 1 tim Line Follower) dalam satu nomor transaksi tunggal.
  - **Akses Tanpa Akun (_Token Link Ticket_):** Pembina tidak diwajibkan registrasi akun di `auth.users`. Akses pantau status, revisi berkas, dan kartu peserta diakses via tautan unik transaksi berkeamanan tinggi (`/transaksi/[secure-token]`).
  - **Back-Office Panitia MRC:** Panel verifikasi berkas dan approval pembayaran khusus untuk panitia pelaksana lomba.
  - **Manajemen Wewenang:** Hak akses panitia MRC dikontrol dan didelegasikan langsung oleh Super Admin.
  - **Check-in Hari-H:** Modul presensi ulang tim dan distribusi kartu identitas peserta/pembina pada hari pelaksanaan lomba.

---

## 4. Strategi Pengelolaan Supabase Gratis (Free Tier)

### 1. Isolasi Kuota Media (Storage)

- **Supabase 1 (Organisasi):** Memegang kuota 1 GB storage mandiri khusus untuk bukti piket lab anggota dan arsip SK internal.
- **Supabase 2 (MRC):** Memegang kuota 1 GB storage mandiri khusus untuk unggahan kartu pelajar/KTM peserta, bukti pembayaran, dan pas foto anggota tim MRC. Kedua kebutuhan tidak saling berebut kuota.

### 2. Penanganan Fitur _Project Pause_ (Tidur Otomatis)

- **Supabase 1:** Kebal dari penalti pause 7 hari karena digunakan aktif setiap hari oleh anggota aktif dan caang untuk absensi serta piket.
- **Supabase 2:** Karena MRC hanya aktif 2–3 bulan menjelang lomba:
  - Selama masa jeda (_off-season_), Supabase 2 dibiarkan tertidur secara alami tanpa perlu biaya atau cron-job buatan.
  - Menjelang dibukanya pendaftaran tahunan, pengurus/Super Admin cukup menekan tombol **Restore/Unpause** pada dashboard Supabase.
  - Website `mrc.robotik-pnp.com` saat _off-season_ menampilkan halaman landing statis informasi kilas balik tanpa koneksi query database.

---

## 5. Strategi Data & Transisi

1. **Backup Data MRC 2026 yang Berjalan:**
   - Melakukan ekspor/dump lengkap (skema, tabel pendaftaran, anggota tim, transaksi pembayaran, dan bukti file di bucket storage) untuk data MRC 2026 yang saat ini sudah tercatat di database organisasi.
   - Hasil backup diarsipkan sebagai rekonsiliasi arsip laporan pertanggungjawaban (LPJ).
2. **Fresh Start Project MRC Baru:**
   - Proyek baru `mrc.robotik-pnp.com` dan Supabase 2 dibangun menggunakan struktur skema baru (_clean schema_) yang langsung mendukung multi-tim dalam satu order keranjang, tanpa beban skema pendaftaran tunggal lama.
3. **Pembersihan Database Organisasi:**
   - Setelah backup diverifikasi aman, tabel-tabel berkode `event_*` dan bucket storage event di Supabase 1 dapat didrop secara bertahap agar database internal kembali bersih dan ringan.

---

## 6. Rencana Tahapan Migrasi (Roadmap)

1. **Fase 1: Backup & Stabilisasi Internal (Repo Ini)**
   - Ekspor/dump arsip data MRC 2026 berjalan.
   - Fokus pemeliharaan modul Open Recruitment (Oprec) dan siklus pembinaan caang tahun berjalan di `dashboard.robotik-pnp.com`.
2. **Fase 2: Inisialisasi Repositori MRC Baru (`mrc.robotik-pnp.com`)**
   - Setup project Next.js baru dan instance Supabase 2 baru.
   - Desain skema basis data baru: `orders` (transaksi/invoice), `order_items` (kategori lomba), `teams`, `team_members`, `payments`.
   - Implementasi alur checkout keranjang dan modul tiket token pendaftar.
   - Implementasi modul verifikasi panitia pelaksana.
3. **Fase 3: Pemisahan Landing Page Publik (`robotik-pnp.com`)**
   - Pemisahan landing page profil organisasi ke repositori statis/ringan demi kecepatan dan skor SEO.
   - Konfigurasi DNS record (CNAME subdomain) pada registrar domain.
