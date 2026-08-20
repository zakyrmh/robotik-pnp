# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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

[Unreleased]: https://github.com/zakyrmh/robotik-pnp/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.2...v0.3.0
[0.2.2]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.1...v0.2.2
[0.2.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1
