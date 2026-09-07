# Panduan Konfigurasi & Deployment Proyek Vercel (Vercel Project Configuration & Deployment Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                     |
| :------------------------------------ | :---------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-VCL-01`                                                                          |
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
| `v1.0.0` | 02/08/2026 | Infrastructure Engineer | Draf awal konfigurasi Vercel, build settings, Git integration, dan env variables.     |
| `v2.0.0` | 09/08/2026 | System Analyst          | Revisi: Penambahan Document Control, perbaikan URL di code block, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi konfigurasi teknis deployment pada platform **Vercel** untuk aplikasi **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Ikhtisar Platform & Arsitektur Hosting

- **Deployment Provider**: Vercel Cloud Platform
- **Framework Preset**: Next.js (App Router, Node.js & Edge Runtime)
- **Node.js Version**: `20.x` (LTS)
- **Root Directory**: `./` (Tanpa folder `src/`)
- **Primary Production Domain**: `ukmrobotik-pnp.or.id` / `sistem-ukmrobotik.vercel.app`

---

## 3. Build & Development Settings

Pengaturan build dan perintah eksekusi yang dikonfigurasi pada **Vercel Dashboard** $\rightarrow$ **Project Settings** $\rightarrow$ **Build & Development Settings**:

| Parameter Setting       | Nilai Konfigurasi Default | Custom Override / Command | Keterangan / Fungsi                        |
| :---------------------- | :------------------------ | :------------------------ | :----------------------------------------- |
| **Framework Preset**    | `Next.js`                 | `Next.js`                 | Optimasi otomatis untuk Next.js App Router |
| **Build Command**       | `next build`              | `npm run build`           | Kompilasi aplikasi & Server Components     |
| **Output Directory**    | `.next`                   | `.next`                   | Direktori artefak hasil build              |
| **Install Command**     | `npm install`             | `npm install`             | Instalasi dependensi runtime & dev         |
| **Development Command** | `next dev`                | `npm run dev`             | Perintah server lokal dev                  |
| **Node.js Version**     | `20.x`                    | `20.x`                    | Runtime Node.js LTS terkini                |

### 3.1. Konfigurasi `vercel.json` (Opsional Custom Rules)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "regions": ["sin1"],
  "cleanUrls": true,
  "git": {
    "deploymentEnabled": {
      "main": true,
      "staging": true
    }
  }
}
```

_Catatan_: Region ditetapkan ke `sin1` (Singapore) untuk meminimalkan latensi geografis dari pengguna di Indonesia (Politeknik Negeri Padang).

---

## 4. Git Integration & Branching Workflow

Vercel terintegrasi langsung dengan repositori GitHub proyek untuk mengotomatiskan alur CI/CD (_Continuous Integration / Continuous Deployment_).

### 4.1. Pemetaan Cabang Git (_Branch Mapping_)

```
  [ Feature / Fix Branch ] ──(Push / PR)──> [ Preview Deployment ] (Tinjauan Tim)
                                                    │
                                             (PR Merged)
                                                    ▼
  [ main Branch ] ──────────(Auto Push)───> [ Production Deployment ] (Live Web)
```

| Nama Cabang Git      | Tipe Environment Vercel | Perilaku Deployment                                                           | Akses URL / Subdomain           |
| -------------------- | ----------------------- | ----------------------------------------------------------------------------- | ------------------------------- |
| **`main`**           | **Production**          | Automatic Live Deployment saat _commit/merge_ diterima di cabang `main`.      | `ukmrobotik-pnp.or.id`          |
| **`staging`**        | **Preview**             | Automatic Staging Deployment untuk pengujian integrasi akhir sebelum rilis.   | `staging-ukmrobotik.vercel.app` |
| **`feature/*` / PR** | **Preview**             | Unique Per-Pull Request Deployment untuk pengujian terisolasi tim pengembang. | `*-git-feature-*.vercel.app`    |

---

## 5. Preview Deployments & Feedback Loop

Fitur **Preview Deployments** pada Vercel digunakan untuk memvalidasi perubahan kode sebelum digabungkan ke cabang `main`:

1. **Automatic PR Deployment**: Setiap kali Pull Request (PR) dibuka ke repositori GitHub, Vercel secara otomatis membangun _Preview URL_ unik.
2. **Vercel Toolbar & Visual Feedback**: Anggota tim, pengurus, atau penguji QA dapat memberikan komentar, _screenshot_, dan penandaan _bug_ langsung di atas antarmuka web Preview menggunakan Vercel Toolbar.
3. **Environment Variable Parity**: Preview Deployment menggunakan konfigurasi variabel lingkungan khusus (_Preview Environment Variables_) yang terhubung ke database staging Supabase untuk mencegah eror mutasi data produksi.

---

## 6. Injeksi Environment Variables di Vercel

Variabel lingkungan dikonfigurasi melalui menu **Project Settings** $\rightarrow$ **Environment Variables** dengan membedakan _scope_ antara **Production**, **Preview**, dan **Development**:

```bash
# Variabel Publik (Di-embed ke Client Bundle)
NEXT_PUBLIC_SITE_URL=https://ukmrobotik-pnp.or.id
NEXT_PUBLIC_SUPABASE_URL=https://qtblwlzbxfopcvyvplfh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAA...

# Variabel Rahasia Server-Only (TIDAK BOLEH Bocor ke Client)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1...
TURNSTILE_SECRET=0x4...
UPSTASH_REDIS_REST_URL=https://...upstash.io
UPSTASH_REDIS_REST_TOKEN=AX...
SENTRY_AUTH_TOKEN=sntrys_...
```

---

## 7. Checklist Readiness Deployment

- [ ] Node.js Version di-set ke `20.x` pada Vercel Project Settings.
- [ ] Seluruh Environment Variables rahasia terpasang lengkap di scope Production & Preview.
- [ ] GitHub Repository Integration terhubung dengan akun organisasi/pengembang.
- [ ] Custom Domain `ukmrobotik-pnp.or.id` terkonfigurasi dengan status DNS _Valid_ (CName / A Record Cloudflare).

---

_Dokumen ini diterbitkan sebagai standar panduan konfigurasi & deployment Vercel resmi untuk UKM Robotik Politeknik Negeri Padang._
