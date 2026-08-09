# Panduan Alur Integrasi & Deployment Berkelanjutan (Continuous Integration & Continuous Deployment Pipeline Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                        |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-CIC-01`                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                      |
| **Induk Kebijakan (_Master Policy_)** | _Deployment Architecture & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                         |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                 |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis         | Ringkasan Perubahan                                                                    |
| :------: | :--------: | :-------------- | :------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | DevOps Engineer | Draf awal alur CI/CD pipeline, GitHub Actions workflow, dan strategi migrasi Supabase. |
| `v2.0.0` | 09/08/2026 | System Analyst  | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.         |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis dan panduan alur **CI/CD Pipeline** yang mengintegrasikan **GitHub Actions**, **Vercel Git Integration**, dan **Supabase Schema Migrations** pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Arsitektur Alur CI/CD Pipeline

Alur otomatisasi dirancang untuk menjamin bahwa seluruh kode yang masuk ke cabang _production_ telah melalui verifikasi tipe data, _linting_, pengujian unit/E2E, serta sinkronisasi skema database secara aman.

```
[ Dev / Feature Branch ] ──(Push / PR)──> [ GitHub Actions: Lint, Typecheck & Vitest ]
                                                │ (Pass Quality Gate)
                                                ▼
[ Vercel Auto-Deploy Preview ] <───────────────── [ Vercel Deployment Trigger ]
                                │
                                ├──> (PR Staging Merged) ──────────────> [ Auto Supabase Migration (Staging DB) ]
                                │
                                └──> (PR Main Merged) ──────────────────> [ Production Deployment ]
                                                                                │
                                                                                └──> [ Supabase Migration (Prod Strategy) ]
```

---

## 3. Rincian Alur Tahapan Deployment (Step-by-Step)

| Tahapan                   | Pemicu (Trigger)                                | Tindakan Automasi                                                                                 | Lingkungan Target                    |
| :------------------------ | :---------------------------------------------- | :------------------------------------------------------------------------------------------------ | :----------------------------------- |
| **1. Feature Push / PR**  | Push ke `feature/*` atau PR ke `staging`/`main` | GitHub Actions mengeksekusi `npm run typecheck`, `npm run lint`, dan `npm run test:run` (Vitest). | GitHub Runners                       |
| **2. Preview Deployment** | Quality Gate GitHub Actions **PASSED**          | Vercel secara otomatis membangun _Preview Deployment URL_ untuk peninjauan visual tim.            | Vercel Preview Subdomain             |
| **3. Merge to Staging**   | PR digabungkan (_merged_) ke cabang `staging`   | GitHub Actions mengeksekusi otomatis `supabase db push` ke database Staging Supabase.             | Supabase Staging DB & Staging Vercel |
| **4. Merge to Main**      | PR digabungkan (_merged_) ke cabang `main`      | Vercel melakukan kompilasi otomatis ke _Production Domain_.                                       | `ukmrobotik-pnp.or.id`               |

---

## 4. Strategi & Penetapan Waktu Migrasi Supabase (Schema Synchronization)

Salah satu aspek paling kritis dalam arsitektur Next.js + Supabase adalah **kapan dan bagaimana migrasi SQL (`supabase/migrations/*.sql`) dieksekusi** agar tidak merusak aplikasi yang sedang _live_.

Sesuai dengan acuan `docs/03-development-view/migration-strategy.md`, strategi dipisahkan berdasarkan lingkungan:

### 4.1. Lingkungan Staging / Preview (Otomatis via GitHub Actions)

Pada cabang `staging`, migrasi skema dijalankan **secara otomatis** dalam pipeline GitHub Actions begitu PR digabungkan, sehingga penguji QA dapat langsung menguji fitur baru dengan skema database terkini.

```yaml
# .github/workflows/supabase-staging-migration.yml
name: Supabase Staging Database Migration

on:
  push:
    branches:
      - staging
    paths:
      - "supabase/migrations/**"

jobs:
  migrate-staging:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Supabase CLI
        uses: supabase/setup-cli@v1
        with:
          version: latest

      - name: Execute Supabase DB Push (Staging)
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_STAGING_DB_PASSWORD }}
        run: |
          supabase link --project-ref ${{ secrets.SUPABASE_STAGING_PROJECT_REF }}
          supabase db push
```

---

### 4.2. Lingkungan Production (Terkontrol & Backward-Compatible First)

Untuk lingkungan **Production**, migrasi database **TIDAK Boleh dijalankan secara meraba-raba/tanpa pengawasan** di tengah proses build Vercel.

#### Alasan Keamanan:

1. **Penerapan Non-Breaking Changes First**: Aplikasi Next.js versi lama yang masih di-cache di browser pengguna harus tetap bisa berjalan saat skema baru diterapkan.
2. **Keterpisahan Build & DB State**: Jika `next build` gagal di pertengahan jalan padahal migrasi SQL sudah telanjur mengeksekusi `ALTER TABLE`, database produksi bisa berada dalam kondisi tidak konsisten.

#### Prosedur Eksekusi Migrasi Production:

1. **Langkah A (Pre-Deploy Migration)**: Sebelum merilis/menggabungkan PR ke `main`, developer mengeksekusi _dry-run_ dan migrasi skema yang bersifat _backward-compatible_ (misal: `ADD COLUMN` opsional, `CREATE TABLE` baru) via Supabase CLI dari mesin lokal yang terotorisasi:

```bash
npx supabase link --project-ref qtblwlzbxfopcvyvplfh
npx supabase db push --dry-run
npx supabase db push
```

2. **Langkah B (App Deployment)**: Gabungkan PR ke cabang `main` untuk memicu Vercel _Auto-Deployment_.
3. **Langkah C (Post-Deploy Cleanup)**: Jika ada penghapusan kolom lama (`DROP COLUMN`), eksekusi SQL pembersihan baru dilakukan _setelah_ versi Next.js 16 terbaru 100% aktif dan berjalan stabil.

---

## 5. Spesifikasi Workflows GitHub Actions (`.github/workflows/ci.yml`)

File integrasi CI utama untuk validasi _Quality Gate_:

```yaml
name: CI Quality Gate Checks

on:
  pull_request:
    branches: [main, staging]
  push:
    branches: [main, staging]

jobs:
  verify-quality:
    name: Typecheck, Lint & Unit Tests
    runs-on: ubuntu-latest

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Setup Node.js 20
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"

      - name: Install Dependencies
        run: npm ci

      - name: Run TypeScript Typecheck
        run: npm run typecheck

      - name: Run ESLint
        run: npm run lint

      - name: Run Vitest Suite
        run: npm run test:run
```

---

## 6. Checklist Monitoring Pipeline

- [ ] GitHub Actions Workflow `ci.yml` berstatus _Passing_.
- [ ] Vercel Preview Deployment berhasil dibuat tanpa _build error_.
- [ ] Skema Supabase Staging tersinkronisasi via `supabase db push`.
- [ ] Migrasi Production dieksekusi secara _backward-compatible_ sebelum penggabungan ke `main`.

---

_Dokumen ini diterbitkan sebagai standar panduan alur CI/CD pipeline resmi untuk UKM Robotik Politeknik Negeri Padang._
