# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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

[Unreleased]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1
