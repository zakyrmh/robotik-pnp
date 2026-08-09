# Panduan Konfigurasi Proyek Supabase & Connection Pooling (Supabase Project Setup & Connection Pooling Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                     |
| :------------------------------------ | :---------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-SUP-01`                                                                          |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                           |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                            |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                   |
| **Induk Kebijakan (_Master Policy_)** | _Infrastructure Configuration & Cloud Services Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                            |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis                 | Ringkasan Perubahan                                                                   |
| :------: | :--------: | :---------------------- | :------------------------------------------------------------------------------------ |
| `v1.0.0` | 02/08/2026 | Infrastructure Engineer | Draf awal spesifikasi Supabase, Supavisor, Auth, dan Storage Buckets.                 |
| `v2.0.0` | 09/08/2026 | System Analyst          | Revisi: Penambahan Document Control, perbaikan URL di code block, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis dan panduan konfigurasi **Supabase Backend** (PostgreSQL Database, Auth, Storage, dan Connection Pooling via Supavisor) pada **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Spesifikasi Proyek Supabase

- **Project Name**: `sistem-informasi-manajemen-ukm-robotik-pnp`
- **Project ID (Reference ID)**: `qtblwlzbxfopcvyvplfh`
- **Database Engine**: PostgreSQL `15.x` / `16.x`
- **Region Host**: `ap-southeast-1` (Singapore)
- **Primary Authentication SDK**: `@supabase/ssr` (v2.x)
- **Local Development CLI Port**: `http://127.0.0.1:54321`

---

## 3. Project Settings & Database Configuration

Konfigurasi berikut disesuaikan pada **Supabase Dashboard** $\rightarrow$ **Project Settings**:

### 3.1. General Settings

- **Project Name**: SIM UKM Robotik PNP
- **Pricing Tier**: Pro / Free Tier dengan Kuota Otomatis
- **Pause Project**: Disabled (Selalu Aktif)

### 3.2. API & Security Settings

- **REST / PostgREST API Endpoint**: `https://qtblwlzbxfopcvyvplfh.supabase.co/rest/v1`
- **GraphQL Endpoint**: `https://qtblwlzbxfopcvyvplfh.supabase.co/graphql/v1`
- **Auth JWT Secret**: Dikonfigurasi untuk otentikasi signature token aman.
- **Row Level Security (RLS)**: **Enforced On All Tables** (Seluruh tabel di skema `public` wajib mengaktifkan RLS).

---

## 4. Connection Pooling dengan Supavisor

Pada arsitektur _serverless_ Next.js 16 (Server Components, Server Actions, Vercel Edge/Node Functions), setiap eksekusi fungsi dapat membuat koneksi database baru secara mendadak. Untuk mencegah _connection exhaustion_ (kehabisan koneksi PostgreSQL), proyek ini menggunakan **Supavisor** (Connection Pooler bawaan Supabase).

### 4.1. Perbandingan Port Koneksi Supavisor

| Fitur / Parameter       | Direct Connection                                               | Session Mode Pooler                                      | Transaction Mode Pooler (Disarankan)                    |
| :---------------------- | :-------------------------------------------------------------- | :------------------------------------------------------- | :------------------------------------------------------ |
| **Port**                | `5432`                                                          | `5432`                                                   | **`6543`**                                              |
| **Protocol**            | PostgreSQL Protocol                                             | PostgreSQL Protocol                                      | PostgreSQL Protocol (Supavisor Engine)                  |
| **Mode Use Case**       | Migrasi DB CLI (`npx supabase db push`), DDL Queries, Local CLI | Long-running server processes (Dedicated Node.js server) | **Serverless / Next.js Server Actions / Vercel Edge**   |
| **Prepared Statements** | Didukung penuh                                                  | Didukung                                                 | Membutuhkan penanganan khusus                           |
| **Connection Cap**      | Terbatas (sesuai RAM DB)                                        | Terbatas                                                 | **Dapat menangani ribuan koneksi serverless bersamaan** |

---

### 4.2. Pemetaan Connection Strings (`.env.local`)

```bash
# 1. Connection String untuk Application Runtime (Transaction Mode via Supavisor Port 6543)
DATABASE_URL="postgres://postgres.qtblwlzbxfopcvyvplfh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

# 2. Connection String untuk Database Migration / Direct Admin (Direct Connection Port 5432)
DIRECT_URL="postgres://postgres.qtblwlzbxfopcvyvplfh:[YOUR-PASSWORD]@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres"

# 3. Supabase REST API & Keys (Digunakan oleh Client @supabase/ssr)
NEXT_PUBLIC_SUPABASE_URL="https://qtblwlzbxfopcvyvplfh.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 5. Konfigurasi Auth & Storage Buckets

### 5.1. Authentication Settings

- **Site URL**: `https://ukmrobotik-pnp.or.id`
- **Redirect URLs**:
  - `http://localhost:3000/**`
  - `https://ukmrobotik-pnp.or.id/**`
  - `https://*.vercel.app/**`

- **Email Auth**:
  - Enable Email Confirmations: `true`
  - Confirm Email Template URL: `{{ .SiteURL }}/verify-email`

### 5.2. Storage Buckets & RLS Policy Matrix

| Nama Bucket Storage    | Public / Private | Max File Size | Allowed MIME Types                           | Fungsi / Aset Media                             |
| ---------------------- | ---------------- | ------------- | -------------------------------------------- | ----------------------------------------------- |
| **`profiles`**         | **Public**       | 2 MB          | `image/jpeg`, `image/png`, `image/webp`      | Foto profil anggota & calon anggota (_caang_)   |
| **`registrations`**    | **Private**      | 5 MB          | `image/jpeg`, `image/png`, `application/pdf` | Berkas pendaftaran (KTM, Transkrip, Surat Izin) |
| **`activity-banners`** | **Public**       | 5 MB          | `image/jpeg`, `image/png`, `image/webp`      | Banner/Poster kegiatan & workshop UKM           |
| **`piket-proofs`**     | **Private**      | 3 MB          | `image/jpeg`, `image/png`                    | Foto bukti piket laboratorium                   |
| **`task-submissions`** | **Private**      | 10 MB         | `application/pdf`, `application/zip`         | Pengumpulan tugas magang caang                  |

---

## 6. Checklist Verifikasi Supabase Setup

- [ ] Project Supabase aktif pada region `ap-southeast-1`.
- [ ] Direct URL (`5432`) dan Pooler URL (`6543`) terkonfigurasi di `.env.local`.
- [ ] Seluruh 5 Storage Buckets (`profiles`, `registrations`, dll) telah dibuat.
- [ ] RLS Policy terpasang pada seluruh tabel di skema `public`.
- [ ] Perintah `npm run gen:types` berhasil mengekstraksi struktur skema ke `types/database.types.ts`.

---

_Dokumen ini diterbitkan sebagai standar panduan konfigurasi Supabase & Connection Pooling resmi untuk UKM Robotik Politeknik Negeri Padang._
