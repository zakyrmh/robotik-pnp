# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini.

Format berdasarkan [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
dan proyek ini mengikuti [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

### Changed

### Fixed

### Removed

---

## [0.2.0] - 2026-02-25

### Added

- Skema RBAC (Role-Based Access Control) dengan tabel `roles`, `permissions`, `role_permissions`, dan `user_roles`
- Tabel `departments` dengan hierarki self-referencing (`parent_id`) untuk sub-departemen
- Tabel `divisions` untuk 5 divisi kontes robot (KRAI, KRSBI Beroda, KRSBI Humanoid, KRSRI, KRSTI)
- Tabel `user_departments` untuk assignment jabatan departemen (maks 1 per user)
- Tabel `user_divisions` untuk assignment divisi dengan role teknis: mekanik, elektrikal, programmer (maks 2 per user)
- Enum PostgreSQL `division_role` untuk role teknis di divisi
- Trigger `assign_default_role` — user baru otomatis mendapat role `caang` (calon anggota) saat registrasi
- Trigger `check_max_user_divisions` — validasi maksimal 2 divisi per user di level database
- Fungsi helper `user_has_permission()` dan `user_has_role()` untuk pengecekan akses di RLS dan application code
- Seed data: 10 departemen utama, 6 sub-departemen, 5 divisi, 5 role sistem, dan 17 permission granular
- RLS policies untuk seluruh tabel RBAC, departemen, dan divisi
- TypeScript schema types untuk semua tabel baru (`departments`, `divisions`, `roles`, `permissions`, `rbac`)
- Validasi Zod untuk departemen, divisi, roles, permissions, dan seluruh tabel junction RBAC
- UI halaman login dan register dengan layout Bento Grid yang responsif (mobile–desktop)
- Komponen `BentoAuthLayout` — layout bersama untuk halaman autentikasi
- Komponen `AuthFormField` — field input reusable (Label + Input + Error)
- Custom hook `useAuthForm` — logika validasi Zod dan integrasi Supabase Auth

### Changed

- Halaman login dibungkus `Suspense` boundary untuk mendukung `useSearchParams` di Next.js 16
- Policy RLS `blacklist: admin only` diganti dengan `blacklist: admin manage` menggunakan RBAC via `user_has_permission()`

---

## [0.1.0] - 2026-02-24

### Added

- Setup awal proyek Next.js App Router
- Konfigurasi Supabase Authentication dengan email
- Halaman register dengan validasi input
- Halaman login dengan redirect ke dashboard
- Fungsi logout via Server Action
- Middleware proteksi halaman dashboard
- Callback route untuk konfirmasi email
- Skema database: users, profiles, education_details user_blacklist, majors, study_programs
- Migrasi database dengan Supabase CLI
- Row Level Security (RLS) untuk semua tabel
- Validasi input dengan Zod
- Setup shadcn/ui

---

## Template Entry

## [X.Y.Z] - YYYY-MM-DD

### Added

- Fitur baru yang ditambahkan

### Changed

- Perubahan pada fitur yang sudah ada

### Deprecated

- Fitur yang akan dihapus di versi mendatang

### Removed

- Fitur yang dihapus

### Fixed

- Bug yang diperbaiki

### Security

- Perbaikan celah keamanan
