# Changelog

Semua perubahan penting pada proyek ini akan didokumentasikan di file ini. Lihat [standard-version](https://github.com/conventional-changelog/standard-version) untuk panduan penulisan commit.

## [0.1.3] (2026-08-10)

### ✨ Features

- **Sidebar Navigation**: Menambahkan item menu `Perizinan` (`/perizinan`) dan `Kedisiplinan` (`/kedisiplinan`) pada section `KEANGGOTAAN UKM`. Hak akses dibatasi via `roleMenuKeys` secara khusus hanya untuk `admin-komdis` dan `super-admin` ([aadeac0](https://github.com/zakyrmh/robotik-pnp/commit/aadeac0))
- **Direktori Kedisiplinan**: Merevisi total tampilan UI/UX halaman `/kedisiplinan` dan komponen `DisciplineRecapTable` agar sesuai dengan `DESIGN.md` (Clean Technical Theme, HSL token, dan kontras Light/Dark mode) ([f32688a](https://github.com/zakyrmh/robotik-pnp/commit/f32688a))

### 🐛 Bug Fixes

- **Perizinan Komdis**: Mengabaikan data perizinan dari user role `caang` dan `alumni` pada halaman `/perizinan` sehingga antrean Komdis hanya menampilkan anggota aktif dan pengurus ([de23d1a](https://github.com/zakyrmh/robotik-pnp/commit/de23d1a))
- **Direktori Kedisiplinan**: Mengabaikan data poin dan sanksi dari role `caang` dan `alumni` pada halaman `/kedisiplinan` ([f32688a](https://github.com/zakyrmh/robotik-pnp/commit/f32688a))

## [0.1.1](https://github.com/zakyrmh/robotik-pnp/compare/v0.1.0...v0.1.1) (2026-05-08)

> Inisialisasi ulang proyek robotik-pnp dengan stack yang lebih terstandarisasi.

### ✨ Features

- Inisialisasi Supabase lokal dengan Docker ([f63cb3c](https://github.com/zakyrmh/robotik-pnp/commit/f63cb3c26b5c7eac7f304aa41b0ebaf0d310332c))
- Setup Husky pre-commit hook dan Commitlint ([139e7fc](https://github.com/zakyrmh/robotik-pnp/commit/139e7fc81b79b66f783cf48a3316ff28d52f91d0))
- Setup Next.js dengan pnpm ([bf8c9ff](https://github.com/zakyrmh/robotik-pnp/commit/bf8c9ff74f6e83e1b798d044399d7dfb5fc5912e))
