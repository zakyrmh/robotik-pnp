# Technical Blueprint: UKM Robotik PNP Management System

Version: 2.0.0 (Extensive Core Features)
Target Environment: Next.js 16.2.5 | Tailwind v4.0 | Supabase + Docker

---

## 1. Arsitektur Sistem & Konvensi Kode

Dokumen ini adalah _source of truth_ arsitektur untuk seluruh Agen AI. Agen wajib mematuhi konvensi berikut tanpa pengecualian.

### 1.1 Paradigma Next.js App Router (React 19)

- **Server Components (Default):** Semua pengambilan data (_data fetching_) langsung dilakukan di level komponen server melalui `supabaseServerInstance`. Tanpa melalui API layer tambahan kecuali untuk eksekusi latar belakang yang kompleks.
- **Client Components (`'use client'`):** Hanya digunakan pada komponen UI interaktif yang membutuhkan _state_ (framer-motion, form handling, tombol interaktif shadcn).
- **Server Actions:** Digunakan untuk seluruh operasi mutasi data (Insert, Update, Delete) dan proses mutasi _state_ form.

### 1.2 Konvensi Direktori Proyek (Workspace Tree)

```text
├── app/
│   ├── (auth)/                # Route Group: Login & Register
│   ├── (dashboard)/           # Route Group: Halaman Terproteksi
│   │   ├── absensi/           # /absensi (Absensi Caang & Anggota)
│   │   ├── audit-log/         # /audit-log (Super Admin Only)
│   │   ├── dashboard/         # /dashboard (Statistik berbasis Role)
│   │   ├── kegiatan/          # /kegiatan (List & Detail Kegiatan)
│   │   ├── magang/            # /magang (Progress Magang Caang)
│   │   ├── manajemen-caang/   # /manajemen-caang (Admin OR: Seleksi & Verifikasi)
│   │   ├── manajemen-kelompok/# /manajemen-kelompok (Admin OR: Grouping)
│   │   ├── manajemen-magang/  # /manajemen-magang (Admin OR: Plotting Divisi)
│   │   ├── onboarding/        # /onboarding (Graduated Stepper Flow untuk caang baru)
│   │   ├── piket/             # /piket (Kirim bukti & Riwayat Piket)
│   │   ├── rejected/          # /rejected (Halaman Penolakan untuk caang)
│   │   ├── tugas/             # /tugas (Manajemen Tugas Caang)
│   │   └── waiting/           # /waiting (Halaman Tunggu Validasi untuk caang)
│   ├── onboarding/            # /onboarding (Graduated Stepper Flow)
│   ├── waiting/               # /waiting (Halaman Tunggu Validasi)
│   └── rejected/              # /rejected (Halaman Penolakan)
├── components/
│   ├── ui/                    # Komponen Primitif Shadcn/ui v2
│   └── shared/                # Sidebar, Navbar, & Komponen Reusable

```

---

## 2. Skema Database Komprehensif (3NF PostgreSQL)

Seluruh tabel baru di bawah ini melengkapi tabel _existing_ (`profiles`, `registrations`, `activities`, `majors`, `study_programs`, `legacy_members`).

### 2.1 Kode DDL & Relasi Tabel (Format DBML / SQL)

```sql
-- ENUM TYPES EXTENSION
CREATE TYPE attendance_status AS ENUM ('hadir', 'izin', 'sakit', 'alfa');
CREATE TYPE piket_day AS ENUM ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu');
CREATE TYPE task_status AS ENUM ('belum_selesai', 'diperiksa', 'selesai', 'revisi');

-- 1. TABEL: DIVISI (Untuk Keperluan Plotting Magang)
CREATE TABLE divisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- KRSBI-B, KRAI, KRSTI, KRT, Desain
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL: KELOMPOK CAANG (Untuk Pengelompokan Pembinaan / OR)
CREATE TABLE caang_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE, -- Kelompok 1, Kelompok 2, dst.
    mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Anggota/Admin pembimbing
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL: ANGGOTA KELOMPOK (Relasi M-M Profiles ke Kelompok)
CREATE TABLE group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID REFERENCES caang_groups(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE, -- 1 Caang hanya boleh di 1 kelompok
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL: PLOTTING MAGANG CAANG
CREATE TABLE internships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE, -- 1 Caang dimagang di 1 divisi pada 1 periode
    division_id UUID REFERENCES divisions(id) ON DELETE CASCADE,
    mentor_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    task_description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL: ABSENSI KEGIATAN (Modul /absensi & /kegiatan)
CREATE TABLE attendances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    activity_id UUID REFERENCES activities(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    check_in_at TIMESTAMPTZ DEFAULT NOW(),
    status attendance_status NOT NULL DEFAULT 'alfa',
    notes TEXT, -- Keterangan jika izin/sakit
    proof_url TEXT, -- URL bukti surat sakit/izin di Supabase Storage
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Admin Komdis/OR yang verifikasi
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_activity UNIQUE (activity_id, profile_id)
);

-- 6. TABEL: JADWAL PIKET HARIAN (Modul /piket - Master Data)
CREATE TABLE piket_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    day piket_day NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_day UNIQUE (day)
);

-- 7. TABEL: PLOTTING ANGGOTA PIKET (Relasi M-M Anggota ke Jadwal)
CREATE TABLE piket_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES piket_schedules(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_member_schedule UNIQUE (schedule_id, profile_id)
);

-- 8. TABEL: LOG BUKTI PIKET (Modul /piket - Transaksional harian)
CREATE TABLE piket_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID REFERENCES piket_schedules(id) ON DELETE CASCADE,
    reported_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    duty_date DATE NOT NULL DEFAULT CURRENT_DATE,
    notes TEXT NOT NULL, -- Kondisi lab, barang inventaris aman, dll.
    proof_image_url TEXT NOT NULL, -- Bukti foto lab setelah piket (Supabase Storage)
    is_verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. TABEL: TUGAS PEMBINAAN CAANG (Modul /tugas)
CREATE TABLE tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMPTZ NOT NULL,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. TABEL: PENGUMPULAN TUGAS CAANG
CREATE TABLE task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
    profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    submission_url TEXT, -- Link repository / berkas tugas
    notes TEXT,
    status task_status DEFAULT 'belum_selesai',
    feedback TEXT,
    graded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_caang_task UNIQUE (task_id, profile_id)
);

```

---

## 3. Matriks Keamanan Data (Row Level Security - RLS)

Setiap agen AI yang membuat query wajib memastikan aturan RLS ini aktif dan dipenuhi via Supabase Policies.

| Nama Tabel             | `SELECT`                              | `INSERT`                               | `UPDATE`                           | `DELETE`                  |
| ---------------------- | ------------------------------------- | -------------------------------------- | ---------------------------------- | ------------------------- |
| **`caang_groups`**     | `caang`, `anggota`, `admins`          | `admin-or`, `super-admin`              | `admin-or`, `super-admin`          | `super-admin`             |
| **`group_members`**    | `auth.uid() = profile_id` OR `admins` | `admin-or`, `super-admin`              | `admin-or`, `super-admin`          | `admin-or`, `super-admin` |
| **`internships`**      | `auth.uid() = profile_id` OR `admins` | `admin-or`, `super-admin`              | `admin-or`, `super-admin`          | `admin-or`, `super-admin` |
| **`attendances`**      | `auth.uid() = profile_id` OR `admins` | `auth.uid() = profile_id` (Self Absen) | `admin-komdis`, `admin-or`         | `super-admin`             |
| **`piket_logs`**       | Semua pengguna Login                  | `anggota` (Hanya yang terjadwal)       | `admin-komdis`, `super-admin`      | `super-admin`             |
| **`tasks`**            | `caang`, `admins`                     | `admin-or`, `admin-komdis`             | `admin-or`, `admin-komdis`         | `super-admin`             |
| **`task_submissions`** | `auth.uid() = profile_id` OR `admins` | `caang` (Self Submit)                  | `caang` (Revisi), `admins` (Nilai) | `super-admin`             |

_Keterangan `admins`: `admin-or`, `admin-komdis`, dan `super-admin`._

---

## 4. Alur Bisnis & Aturan Logika (Business Logic Rules)

### 4.1 Modul Seleksi & Manajemen Caang (`/manajemen-caang`)

- **Proses Approval:** Saat Admin OR mengubah status di `registrations.status` menjadi `'verified'`, sebuah database trigger wajib mengubah status `profiles.is_onboarded = true` dan mempertahankan role tetap `'caang'` sampai masa pembinaan selesai.
- Jika ditolak (`'rejected'`), user diarahkan ke rute `/rejected`.

### 4.2 Modul Absensi Digital (`/absensi`)

- **Radius & Waktu Geo-lock (Opsional):** Absensi mandiri untuk kegiatan luring mencocokkan `start_date` pada tabel `activities`.
- Caang hanya bisa melihat absensi untuk kegiatan yang memiliki `target_audience = 'caang'`.

### 4.3 Modul Manajemen Piket Harian (`/piket`)

- **Validasi Pelaporan:** Anggota yang bisa melakukan `INSERT` ke tabel `piket_logs` hanyalah anggota yang terdaftar di `piket_members` sesuai dengan hari berjalan (`piket_schedules.day`).
- Unggah foto wajib dialokasikan ke private bucket Supabase Storage: `piket-proofs/`.

### 4.4 Modul Kelompok & Magang Divisi (`/magang`)

- Slicing data pada sidebar `/magang` untuk aktor `caang` akan menampilkan Nama Kelompok, Mentor Pembimbing, Divisi Magang, dan Deskripsi Tugas Magang dalam satu halaman ringkas (berbasis layout kartu minimalis _glassmorphism_).

---

## 5. Kriteria Penyelesaian Tugas (Definition of Done - DoD) untuk Agen AI

Sebelum sub-agen melakukan _Push_ atau mengajukan _Pull Request_ pada modul-modul kosong di atas, kode harus lolos kriteria berikut:

1. **Lolos Linting & Tipe:** Tidak ada eror pada eksekusi perintah `pnpm lint` dan `pnpm tsc`.
2. **Format Commit:** Judul commit wajib mengikuti aturan Conventional Commits (contoh: `feat(absensi): implement server action for check-in`).
3. **Unit Test:** Fungsi krusial (terutama Server Actions untuk mutasi data seperti absensi dan pengisian form tugas) wajib memiliki unit test berbasis **Vitest**.
4. **Proteksi Rute:** Middleware Next.js wajib memeriksa validasi token JWT Supabase dan mencocokkan `profiles.role` sebelum mengizinkan pengguna masuk ke rute dashboard yang sesuai dengan matriks hak akses.
