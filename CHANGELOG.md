# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.6.0] - 2026-08-29

### Added

- **Pemisahan Poin Awal/Manual vs Pemutihan Gotong Royong (Goro) Kedisiplinan**:
  - **Database View (`supabase/migrations/20260828220000_update_v_user_discipline_summary.sql`)**: Memperbarui view `v_user_discipline_summary` untuk memisahkan agregasi poin penambahan sanksi bawaan / manual (`total_legacy_points` > 0) dan poin pengurangan sanksi melalui goro (`total_goro_points` < 0) dari poin presensi (`total_attendance_points`).
  - **Direktori Kedisiplinan (`components/features/komdis/kedisiplinan-client.tsx` & `app/(private)/kedisiplinan/page.tsx`)**: Menampilkan kolom tabel terpisah antara "Poin Awal/Manual" (+X PTS) dan "Pemutihan Goro" (-X PTS) serta metrik netto yang transparan.
  - **Halaman Detail Kedisiplinan Anggota (`components/features/komdis/member-discipline-detail-client.tsx`)**: Menampilkan ringkasan telemetri breakdown live dan tab log terpisah.
- **Preset Sanksi Keterlambatan SOP Komdis & Modal Pop-up Scanner Instan**:
  - **QR Scanner Komdis (`components/features/komdis/komdis-scanner-view.tsx` & `lib/actions/komdis.ts`)**: Integrasi pop-up modal penetapan sanksi instan saat scan anggota yang terlambat $\ge 60$ menit, lengkap dengan pilihan cepat SOP Komdis:
    - 🏃 Sanksi Fisik Saja (0 PTS)
    - 📋 Fisik + Izin Diterima (+3 PTS)
    - ⚠️ Fisik + Izin Ditolak / Tanpa Izin (+5 PTS)
    - ✏️ Kustom Angka Poin & Catatan Sanksi.
  - **Drawer Presensi Manual (`components/features/presensi/activity-attendance-detail-client.tsx`)**: Menyediakan tombol preset cepat sanksi keterlambatan yang sama pada form presensi manual kegiatan.
  - **Alur Scan Berkelanjutan**: Petugas Komdis dapat langsung menyimpan sanksi dan melanjutkan scan QR peserta berikutnya tanpa perlu beralih ke halaman rekap.

### Fixed

- **PostgreSQL View Migration Fix (`supabase/migrations/20260828220000_update_v_user_discipline_summary.sql`)**: Memperbaiki migrasi view dengan menambahkan `DROP VIEW IF EXISTS ... CASCADE` sebelum re-create view guna menghindari error `SQLSTATE 42P16` saat `db push`.
- **Type Definitions Synchronization (`types/database.types.ts`)**: Regenerasi TypeScript database types untuk menyelaraskan skema database terbaru.

## [0.5.0] - 2026-08-26

### Added

- **Redesign Halaman Publik & Landing Pages (Clean Institutional Standard)**:
  - **Navbar & Footer (`components/landing/navbar.tsx`, `components/landing/footer.tsx`)**: Navigasi institusional modern dengan active route indicator, mobile drawer sheet, live system status, dan kontak resmi.
  - **Halaman Beranda (`app/(marketing)/page.tsx`)**: Mengimplementasikan 5 section baru sesuai `RANCANGA_CONTENT_BERANDA.md` (Hero CAD visual, 4 kartu metric stats, 5 divisi KRI + Join card, 5 siklus timeline operasional, dan CTA).
  - **Halaman Profil (`app/(marketing)/profil/page.tsx`)**: Desain ulang hero, moto/slogan bento grid, visi & misi dual card, timeline sejarah organisasi, dan struktur pimpinan BPH.
  - **Halaman Divisi (`app/(marketing)/divisi/page.tsx`)**: Grid 3 kolom divisi robotik dengan badge spesifikasi, icons, dan link eksplorasi divisi.
  - **Halaman Prestasi (`app/(marketing)/prestasi/page.tsx`)**: Sticky search & filter bar, badge capaian kompetisi, CAD watermark header, dan layout responsif.
  - **Halaman Keanggotaan (`app/(marketing)/keanggotaan/page.tsx`)**: Struktur hirarki Pengurus Harian Inti, Badan Ad-Hoc, dan Departemen accordion dengan optimasi `next/image` avatar.
  - **Halaman Artikel & Berita (`app/(marketing)/artikel/page.tsx`)**: Featured article hero card, sticky category filter bar, 3-column article grid, dan badge semantik.
  - **Halaman Hubungi Kami (`app/(marketing)/hubungi-kami/page.tsx`)**: Split layout 5:7 dengan kartu kontak resmi, tautan media sosial Hugeicons, Google Maps interaktif, dan form kirim pesan terproteksi honeypot.
- **Redesign Portal Autentikasi (`app/(auth)/login/page.tsx`, `app/(auth)/register/page.tsx`)**:
  - Peningkatan ukuran touch target form input & tombol minimal 44px (`min-h-[44px]`).
  - Indikator kekuatan kata sandi 4-segmen responsif pada registrasi akun baru.
  - Integrasi Cloudflare Turnstile bot protection dan error alert terstandarisasi.
- **Dokumentasi Operasional & Arsitektur Baru**:
  - `docs/04-process-view/SOP_KEGIATAN_KOMDIS.md`: Standar operasional prosedur kegiatan, absensi QR, dan sanksi Komdis.
  - `docs/architecture-event-registration-payment.md`: Spesifikasi arsitektur registrasi event & pembayaran.

### Changed

- **Optimalisasi SEO & Tipografi Global**:
  - Mengonfigurasi font Plus Jakarta Sans (`--font-display`), Inter (`--font-body`), dan Geist/System Mono (`--font-mono`).
  - Menyelaraskan OpenGraph metadata dan skema Organization JSON-LD pada layout root dan marketing.
- **Peningkatan Dashboard Super Admin Terpadu & Real-Time Telemetry (`app/(private)/dashboard/page.tsx` & `components/features/dashboard/dashboard-client.tsx`)**:
  - Menyajikan telemetri operasional cepat: Total Pengguna Aktif & Terarsip, Dispensasi Pending Komdis, Tugas Caang Menunggu Penilaian OR, dan Sanksi SP Aktif.
  - Menampilkan panel status kepatuhan keamanan dan immutability trigger UU PDP No. 27/2022.
  - Menambahkan pusat kendali & pintasan cepat (Quick Access Hub) ke 6 modul utama (Akun, Struktur, Audit Log, Kegiatan, Disiplin, Piket).
  - Menampilkan live feed 5 log mutasi audit terbaru lengkap dengan nama aktor, role, tipe aksi, target, timestamp, dan IP address.
  - Menampilkan agenda kegiatan organisasi terdekat lengkap dengan waktu dan lokasi.

### Added

- **Penguatan Sistem Audit Log Sistem (100% Immutable, Resilient, & Compliant UU PDP 27/2022)**:
  - **Database Immutability Trigger (`supabase/migrations/20260824150000_audit_log_immutability_and_triggers.sql`)**: Menambahkan trigger PL/pgSQL `prevent_audit_log_tampering()` pada tabel `public.system_audit_logs` untuk mencegah segala bentuk `UPDATE` dan `DELETE` di level database engine.
  - **Index Performa Database**: Menambahkan indeks komposit pada `actor_id`, `target_user_id`, `action_type`, dan `created_at DESC`.
  - **Utilitas Audit Terpusat (`lib/audit.ts`)**: Modul audit logger terpusat dengan penangkapan alamat IP request (`x-forwarded-for`/`x-real-ip`) dan sanitasi penyamaran data pribadi PII (Nomor Telepon `0812-****-5678`, NIM `240104****`, Email `u***r@domain.com`, dan `[REDACTED_SECRET]`).
  - **Integrasi Audit Lintas Modul**: Menghubungkan pencatatan audit log otomatis ke modul Manajemen Pengguna (`admin-users.ts`), Pengaturan Akun (`settings.ts`), Komisi Disiplin & Sanksi SP (`komdis.ts`), dan Struktur Organisasi (`structure.ts`).
  - **UI Viewer Audit Log Modern (`components/admin/audit-log/audit-log-viewer.tsx` & `app/(private)/audit-log/page.tsx`)**: Menampilkan relasi nama aktor, role badge, nama target, badge IP address, dan inspeksi diff data JSON interaktif.
- **Relokasi & Redesign Komponen Struktur Organisasi (`components/structure/structure-client.tsx`)**:
  - Memindahkan komponen client dari `app/(private)/manajemen-struktur/StructureClient.tsx` ke direktori `components/structure/`.
  - Desain ulang seluruh UI Manajemen Struktur sesuai `DESIGN.md` (Minimalist Soft Light, 70-20-10 color rule, touch target $\ge 44\text{px}$, scrollable tabs, dan adaptasi dark mode).
- **Pembaruan Konfigurasi AI Engineering `AGENTS.md`**:
  - Memperbarui sistem panduan AI native dengan stack Next.js 16.2.5, React 19.2.4, Tailwind CSS v4 `@theme`, Supabase SSR, Upstash, Turnstile, RBAC matrix, dan aturan anti-pattern.

### Changed

- **Redesign Halaman Manajemen Akun (`app/(private)/manajemen-akun/page.tsx` & `components/admin/users/`)**:
  - Mengubah hero banner menjadi soft minimalist card berbingkai tipis (`border-border bg-card text-card-foreground`).
  - Menyelaraskan seluruh toolbar pencarian, filter role/status, tabel pengguna, badge role pastel semantik, pagination, dan 4 modal dialog (Detail PII, Edit User, Soft Delete, Restore) dengan token `app/globals.css` dan Hugeicons.
  - Menstandarisasi area sentuh tombol dan elemen interaktif minimal $44\text{px}$ (`min-h-[44px]`).

### Fixed

- **Perbaikan Update Program Studi & Kontak Pengguna pada Manajemen Akun (`lib/actions/admin-users.ts`)**:
  - Menambahkan migrasi RLS `20260824140000_allow_admin_manage_registrations.sql` agar Super Admin dan Admin OR memiliki izin penuh mutasi (INSERT, UPDATE, DELETE) pada tabel `public.registrations`.
  - Mengimplementasikan mekanisme _upsert / fallback insert_ otomatis di `updateUserIdentityAction` jika record registrasi pengguna target belum ada.
  - Memperbaiki jalur revalidasi cache Next.js (`revalidatePath("/manajemen-akun")`) dan menambahkan `router.refresh()` pada modal dialog client untuk pembaruan data seketika.

### Added

- **Instant Skeleton Loading Navigasi Sidebar (`app/(private)/loading.tsx` & `app/(private)/kegiatan/loading.tsx`)**:
  - Menambahkan Skeleton UI responsif yang langsung dirender secara seketika saat pengguna mengklik menu sidebar (mencegah UI terasa beku/freeze saat server component melakukan fetching data).
  - Penutupan otomatis drawer mobile sidebar (`SheetContent`) seketika saat menu navigasi diklik (`components/shared/sidebar.tsx`).
- **Dokumentasi Terpadu Root `README.md`**:
  - Menambahkan file `README.md` lengkap di root proyek yang mencakup deskripsi sistem, panduan instalasi local dev, variabel lingkungan (`.env.local`), struktur repositori, dan matriks RBAC.
- **Pembaruan Peranan Pengguna RBAC (7 Roles)**:
  - Menambahkan rincian peranan `admin-kestari` (pengelola piket kesekretariatan & workshop) dan `admin-divisi` (pengelola magang divisi caang).
  - Mengklarifikasi cakupan modul `admin-komdis` (fokus kedisiplinan, perizinan, dan poin sanksi, tidak mengurus piket workshop).
- **Integrasi Storage Cloudflare R2 untuk Dokumen Perizinan**:
  - Menambahkan modul koneksi S3-compatible Cloudflare R2 (`lib/storage/r2.ts`) untuk pengunggahan file dokumen bukti surat izin / sakit ke bucket `ukm-robotik-pnp`.
  - Integrasi fitur client-side image compression & konversi otomatis ke format **WebP** (`lib/utils/image-compressor.ts`) sebelum pengiriman form perizinan (`components/features/komdis/anggota-qr-view.tsx`).
  - Pembuatan API Proxy Route internal (`app/api/r2/[...key]/route.ts`) untuk menyajikan foto bukti R2 secara aman dan bebas dari pemblokiran ISP / Connection Time Out pada domain `*.r2.dev`.
- **Panduan Dokumentasi Komdis Kedisiplinan (`docs/PANDUAN_KOMDIS_KEDISIPLINAN.md`)**: Panduan operasional komprehensif bagi Admin Komdis untuk pengelolaan kegiatan, presensi QR / manual, verifikasi perizinan, alfa massal, hingga sanksi & pemutihan poin.
- **Halaman Detail Kegiatan (`/kegiatan/[id]`)**: Menambahkan rute halaman detail kegiatan responsif untuk menangani navigasi notifikasi dan link kegiatan, mencegah error 404 ketika pengguna mengklik notifikasi kegiatan.
- **Halaman 404 Kustom (`app/not-found.tsx`)**: Menambahkan halaman error 404 dengan desain Minimalist Soft yang responsif dan ramah seluler.

### Changed

- **UI Drawer Pratinjau Bukti Perizinan (`components/features/komdis/leave-approval-dashboard.tsx`)**:
  - Mengubah modal pop-up pratinjau foto bukti perizinan menjadi `Drawer` responsif mobile-first selaras dengan panduan `DESIGN.md`.
  - Menambahkan **Loading Skeleton** dan UI fallback _error handling_ jika gambar mengalami kendala jaringan/timeout.
- **Restriksi Jendela Waktu Presensi (`checkin_open_at` s/d `checkin_close_at`)**:
  - Memperbarui antarmuka `ActivityItem` (`lib/actions/activities.ts`) dan query `getActivities` untuk menyertakan `checkin_open_at`, `checkin_close_at`, dan `late_tolerance_minutes`.
  - Mengubah fungsi `isAttendanceWindowActive` pada `kegiatan-client.tsx` dan `app/(private)/kegiatan/[id]/page.tsx` agar tombol **Absen** hanya dapat diakses dalam rentang waktu dari `checkin_open_at` hingga `checkin_close_at`.
- **Modul QR Code Presensi Real-Time Ramah Supabase Free Plan**:
  - Mengimplementasikan Smart Short Polling berbasis database Supabase biasa pada `AnggotaQrView` (`components/features/komdis/anggota-qr-view.tsx`).
  - Mengoptimalkan kueri dengan jeda adaptif (interval 4 detik, maksimal 30x percobaan / 2 menit per sesi aktif).
  - Menghentikan pemanggilan API secara otomatis saat peramban/tab disembunyikan (`visibilityState === 'hidden'`) atau setelah status presensi terdeteksi (`hadir`/`telat`/`izin`/`sakit`).
  - Menambahkan _listener_ `visibilitychange` untuk mengecek ulang status presensi secara instan saat tab peramban diaktifkan kembali oleh pengguna.

### Fixed

- **Resolusi Query RBAC/RLS Halaman Perizinan Komdis (`app/(private)/perizinan/page.tsx`)**:
  - Menggunakan `createAdminClient()` untuk membaca data antrean perizinan Komdis tanpa terhalang RLS policy `target_audience`.
  - Menentukan spesifikasi foreign key eksplisit `profiles:profile_id!inner` untuk menyelesaikan error ambiguitas relasi PostgREST (_"more than one relationship was found for 'attendances' and 'profiles'"_).
  - Memperbaiki resolver URL proxy `/api/r2/[key]` agar penayangan foto bukti perizinan di browser anggota dan admin berjalan 100% lancar.
- **Soft Delete Filtering pada Kegiatan**: Memastikan seluruh kueri kegiatan di server (`getActivities`) dan client menggunakan filter `.is("deleted_at", null)` agar kegiatan yang masuk ke tempat sampah tidak tampil di halaman kegiatan role mana pun (`super-admin`, `admin-komdis`, `admin-or`, `anggota`, `caang`).
- **Form Pembuatan Kegiatan Komdis (`create-komdis-activity-dialog.tsx`)**:
  - Memperbaiki perataan UI teks label kegiatan formal Komdis agar sejajar rata kiri dengan petunjuk target audience.
  - Memperbaiki fungsionalitas pemilih tanggal/waktu (popover kalender) dan input teks manual pada input datetime agar dapat digunakan secara fleksibel.

## [0.3.0] - 2026-08-15

### Added

- Redesign keseluruhan design system ke tema **Minimalist Soft (Light)** pada `DESIGN.md`: prinsip warna 70% netral / 20% warna utama (Navy lembut `#3b5b84`) / 10% aksen (Oranye lembut `#f0975a`), skala font mobile-first berbasis `clamp()`, dan aturan radius (Card 10px, Button/Input 8px, Pill 9999px).
- Token desain baru di `app/globals.css` (Tailwind v4 `@theme inline`): `--color-canvas`, `--color-surface`, `--color-text-primary/secondary/muted`, `--color-primary-hover`, `--color-primary-soft`, `--color-accent-strong`, `--shadow-soft`, `--shadow-ring`, skala `--text-micro` hingga `--text-2xl`, dan `--radius-md/lg/pill`. Dark mode kini ditangani otomatis via CSS variables (tanpa override manual `dark:`), dengan Oranye menjadi warna utama di tema gelap agar tetap kontras.
- Halaman publik baru Kebijakan Privasi (`/privacy`) dan Syarat & Ketentuan Layanan (`/terms`) dengan layout publik ber-pola Minimalist Soft.
- Komponen Shadcn UI baru: `AlertDialog`, `Drawer`, `Empty`, `Separator`, `Sheet`, `Field`, dan `Spinner`.
- Redesign `components/shared/header.tsx` berbasis Shadcn UI primitives (`Popover`, `DropdownMenu`, `Avatar`, `Badge`, `InputGroup`, `Separator`, `Skeleton`, `Empty`) dengan pendekatan mobile-first: panel notifikasi `Popover` (width responsif `max-w-[calc(100vw-2rem)]`), menu akun `DropdownMenu`, avatar fallback dengan `AvatarFallback`, tombol ikon `size="icon-lg"`, dan pemisah vertikal `Separator`.
- Redesign `components/shared/sidebar.tsx` berbasis Shadcn UI: drawer mobile memakai `Sheet` (side `left`, `w-72`) menggantikan drawer framer-motion custom, skeleton loading memakai `Skeleton`, aktif state memakai `bg-primary-soft` + indikator batang kiri `bg-primary`, serta pembagian komponen reusable `BrandLink`, `NavLink`, `SidebarNav`, dan `SettingsLink`.
- Redesign `components/shared/page-loader.tsx` dengan motion animasi halus dan penyesuaian font `font-display`.

### Changed

- Redesign `app/globals.css`: penggantian seluruh token lama (`dongker-*`, `pnp-orange`, `orange-wash`, `blueprint-*`, `mist-gray`, `steel-gray`, `canvas-white`, `shadow-blueprint`) dengan token semantik yang otomatis menyesuaikan light/dark mode.
- Redesign modul Autentikasi (`app/(auth)/layout.tsx` & `components/features/auth/`): layout split-screen dengan hero header _"Portal UKM Robotik PNP"_, penyesuaian hirarki tipografi, serta redesign `LoginForm`, `RegisterForm`, `ForgotPasswordForm`, `ForgotPasswordWaitingCard`, `UpdatePasswordForm`, `VerifiedCard`, dan `VerifyEmailCard` sesuai standar `DESIGN.md`.
- Redesign `components/features/kegiatan/kegiatan-client.tsx`, `components/features/komdis/create-komdis-activity-dialog.tsx`, dan `components/features/komdis/edit-komdis-activity-dialog.tsx` sesuai standar visual `DESIGN.md` (Card `bg-card`, `border-border`, `rounded-lg`, Badge pill `bg-accent text-accent-foreground`, tombol sekunder `border-primary text-primary`).
- Redesign `components/features/kegiatan/trash-activities-client.tsx` berbasis Shadcn UI (`Card` untuk mobile, `Table` + zebra-stripe `bg-surface` untuk desktop, `Empty` untuk state kosong, `AlertDialog` untuk konfirmasi hapus permanen) dengan token desain baru.

## [0.2.2] - 2026-08-14

### Fixed

- Perbaikan error _"captcha protection: request disallowed (no captcha_token found)"_ di production: token Turnstile kini dikirim langsung ke Supabase Auth (`captchaToken` di `options`) alih-alih diverifikasi server-side terlebih dahulu, karena token Turnstile bersifat one-time use dan tidak bisa di-consume dua kali (double-consume).

## [0.2.1] - 2026-08-14

### Added

- Workaround Supabase Free Plan: `lib/password-security.ts` — Leaked Password Protection via HaveIBeenPwned Pwned Passwords API (k-anonymity, password asli tidak pernah terkirim ke pihak ketiga).

### Changed

- Server Actions `register()`, `login()`, dan `updatePassword()` (`lib/actions/auth.ts`) — integrasi HIBP check sebelum `signUp()`, `signInWithPassword()`, dan `updateUser()` dengan strategi fail-open.
- Server Action `changePasswordAction()` (`lib/actions/settings.ts`) — integrasi HIBP check sebelum `updateUser()` dengan strategi fail-open.
- Zod schemas `registerSchema`, `updatePasswordSchema` (`lib/schemas/auth.ts`) dan `changePasswordSchema` (`lib/schemas/settings.ts`) — enforcing password complexity: huruf kecil + huruf besar + angka + simbol (sinkron dengan konfigurasi Supabase Dashboard).

## [0.2.0] - 2026-08-14

### Added

- Halaman Pengaturan Akun (`/settings`) dengan 5 tab utama (Profil, Keamanan, Preferensi, Keanggotaan, Privasi) dan Server Actions backend.
- Penanganan dispensasi magang/PKL untuk Anggota Aktif pada sistem presensi Komisi Disiplin (Komdis).
- Migrasi database `20260814000000_add_member_internship_status.sql` (kolom `is_on_internship`, `internship_start_date`, `internship_end_date`).
- Server Action `updateMemberInternshipStatus` untuk mengelola status magang anggota aktif khusus role `super-admin` dan `admin-komdis`.
- Skema validasi Zod `UpdateMemberInternshipSchema` di `lib/schemas/komdis.ts`.
- Komponen dialog `MemberInternshipModal` untuk menetapkan status & tanggal magang anggota secara interaktif.
- Indikator/badge `💼 MAGANG / PKL` dan tombol aksi pada `DisciplineRecapTable`.
- Komponen Client `KedisiplinanClient` dengan Shadcn UI primitives (Card, Table, Badge, Button, Input, Dialog) dan visual telemetry cards untuk halaman `/kedisiplinan`.
- Komponen Client `MemberDisciplineDetailClient` berbasis Shadcn UI primitives (Card, Table, Badge, Button, Dialog) untuk halaman detail & sanksi anggota `/kedisiplinan/[profileId]`.
- Redesign Client Component `LeaveApprovalDashboard` berbasis Shadcn UI primitives (Card, Badge, Button, Input, Dialog, Textarea) dengan telemetry metric cards dan filter pencarian interaktif untuk halaman `/perizinan`.

### Changed

- Redesign konsisten komponen pop-up modal (`MemberInternshipModal`, `GoroReductionDialog`, dan `IssueSanctionDialog`) dengan Shadcn UI primitives (Dialog, Input, Label, Textarea, Switch, Button) dan standar visual `DESIGN.md`.
- Redesign halaman Kedisiplinan (`app/(private)/kedisiplinan/page.tsx`) sebagai Server Component terpisah yang memanggil `KedisiplinanClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Redesign halaman Detail Kedisiplinan (`app/(private)/kedisiplinan/[profileId]/page.tsx`) sebagai Server Component terpisah yang memanggil `MemberDisciplineDetailClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Redesign halaman Perizinan Komdis (`app/(private)/perizinan/page.tsx`) sebagai Server Component terpisah yang memanggil `LeaveApprovalDashboard` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Logika `batchMarkAlfa` pada kegiatan Komdis (`target_audience = 'anggota'`) agar anggota yang sedang magang otomatis diset berstatus `izin` dengan 0 poin sanksi dan catatan _"Dispensasi Magang / PKL"_.
- Fungsi `getKomdisMemberAttendanceSummary` dan `getUsersAction` untuk mengembalikan data status magang anggota aktif.

### Fixed

- Perbaikan verifikasi perubahan email pada Pengaturan Akun: sinkronisasi otomatis `auth.users` ke `public.profiles` via database trigger migration.
- Penanganan preservasi sesi user (`session persistence`) saat callback verifikasi email perubahan akun.
- Konfigurasi Supabase Auth (`double_confirm_changes = false`) agar konfirmasi email hanya dikirimkan 1x ke email baru.
- Sinkronisasi state lokal `MemberInternshipModal` dengan prop `member` dan `isOpen` via `useEffect` agar status toggle dan rentang tanggal magang tampil akurat sesuai data anggota saat dialog dibuka.
- Penataan ulang responsif layout mobile-first pada `MemberDisciplineDetailClient` untuk layar perangkat kecil (seperti iPhone ~684px) agar Badge magang/PKL tidak terpotong (overflow), tombol aksi admin tersusun rapi, dan navigasi tab presensi dapat di-scroll dengan nyaman.
- Pembaruan kapsul label & rentang tanggal magang (`MemberDisciplineDetailClient`) menggunakan struktur pill terpisah ber-padding lega (`px-3 py-1 rounded-full`) yang selaras dengan panduan `DESIGN.md`.
- Penyesuaian breakpoint responsif `xl:flex-row` pada header profil `MemberDisciplineDetailClient` untuk mencegah meluapnya tombol aksi (+ Pemutihan Goro & + Terbitkan SP) keluar dari kontainer kartu pada lebar layar 1024px.

## [0.1.3] - 2026-08-10

### Added

- Sidebar Navigation: Item menu `Perizinan` (`/perizinan`) dan `Kedisiplinan` (`/kedisiplinan`) pada section `KEANGGOTAAN UKM` (akses khusus `admin-komdis` dan `super-admin`).
- Direktori Kedisiplinan: Tampilan UI/UX baru pada halaman `/kedisiplinan` dan komponen `DisciplineRecapTable` (Clean Technical Theme, HSL token, kontras Light/Dark mode).

### Fixed

- Perizinan Komdis: Mengabaikan data perizinan dari user role `caang` dan `alumni` pada halaman `/perizinan` sehingga antrean Komdis hanya menampilkan anggota aktif dan pengurus.
- Direktori Kedisiplinan: Mengabaikan data poin dan sanksi dari role `caang` dan `alumni` pada halaman `/kedisiplinan`.

## [0.1.1] - 2026-05-08

### Added

- Inisialisasi ulang proyek robotik-pnp dengan stack terstandarisasi.
- Inisialisasi Supabase lokal dengan Docker.
- Setup Husky pre-commit hook dan Commitlint.
- Setup Next.js dengan pnpm.

[Unreleased]: https://github.com/zakyrmh/robotik-pnp/compare/v0.5.0...HEAD
[0.5.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1
