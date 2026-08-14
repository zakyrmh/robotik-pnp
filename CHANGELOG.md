# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Penanganan dispensasi magang/PKL untuk Anggota Aktif pada sistem presensi Komisi Disiplin (Komdis).
- Kolom `is_on_internship`, `internship_start_date`, dan `internship_end_date` pada tabel `profiles` (`20260814000000_add_member_internship_status.sql`).
- Server Action `updateMemberInternshipStatus` untuk mengelola status magang anggota aktif khusus role `super-admin` dan `admin-komdis`.
- Skema validasi Zod `UpdateMemberInternshipSchema` di `lib/schemas/komdis.ts`.
- Komponen dialog `MemberInternshipModal` untuk menetapkan status & tanggal magang anggota secara interaktif.
- Indikator/badge `💼 MAGANG / PKL` dan tombol aksi pada `DisciplineRecapTable`.
- Komponen Client `KedisiplinanClient` dengan Shadcn UI primitives (Card, Table, Badge, Button, Input, Dialog) dan visual telemetry cards untuk halaman `/kedisiplinan`.
- Komponen Client `MemberDisciplineDetailClient` berbasis Shadcn UI primitives (Card, Table, Badge, Button, Dialog) untuk halaman detail & sanksi anggota `/kedisiplinan/[profileId]`.

### Changed

- Redesign konsisten komponen pop-up modal (`MemberInternshipModal`, `GoroReductionDialog`, dan `IssueSanctionDialog`) dengan Shadcn UI primitives (Dialog, Input, Label, Textarea, Switch, Button) dan standar visual `DESIGN.md`.
- Redesign halaman Kedisiplinan (`app/(private)/kedisiplinan/page.tsx`) sebagai Server Component terpisah yang memanggil `KedisiplinanClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Redesign halaman Detail Kedisiplinan (`app/(private)/kedisiplinan/[profileId]/page.tsx`) sebagai Server Component terpisah yang memanggil `MemberDisciplineDetailClient` dengan proteksi ketat RBAC `super-admin` dan `admin-komdis`.
- Logika `batchMarkAlfa` pada kegiatan Komdis (`target_audience = 'anggota'`) agar anggota yang sedang magang otomatis diset berstatus `izin` dengan 0 poin sanksi dan catatan _"Dispensasi Magang / PKL"_.
- Fungsi `getKomdisMemberAttendanceSummary` dan `getUsersAction` untuk mengembalikan data status magang anggota aktif.

### Fixed

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

[Unreleased]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.1...v0.1.3
[0.1.1]: https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1
