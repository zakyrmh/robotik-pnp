# Environment Variables Specification Guide

Dokumen spesifikasi variabel lingkungan (_environment variables_) untuk proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16**.

---

## 1. Aturan Keamanan & Konvensi Prefix Next.js 16

1. **`NEXT_PUBLIC_*` (Client & Server Accessible)**:
   - Variabel dengan prefix `NEXT_PUBLIC_` akan **di-embed langsung ke dalam JavaScript client bundle** saat proses build.
   - **PANTANGAN**: Dilarang keras memasukkan API Keys rahasia, secret keys, atau token administratif ke dalam variabel berbuntut `NEXT_PUBLIC_`.
2. **Server-Only Private Variables (Tanpa Prefix)**:
   - Variabel tanpa prefix `NEXT_PUBLIC_` **HANYA dapat diakses di lingkungan Server** (Server Components, Server Actions, Route Handlers, dan Middleware).
   - Variabel ini tidak akan pernah bocor ke browser client jika dikelola dengan benar.

---

## 2. Template `.env.local` Siap Pakai

Salin kode di bawah ini ke file `.env.local` di akar (_root_) proyek Anda:

```bash
# ==========================================
# 1. URL & APLIKASI CONFIG
# ==========================================
# URL Aplikasi (untuk callback, OAuth, dan redirect)
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Custom App Config
YEAR_FOUNDED=2005

# ==========================================
# 2. SUPABASE BACKEND CONFIG (LOCAL SETUP)
# ==========================================
# Supabase Local API Endpoint
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321

# Public Anon Key (Aman diakses client browser, terikat RLS)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# Service Role Key (SANGAT RAHASIA: Membypass RLS di Server-Side / API Routes)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU

# ==========================================
# 3. CLOUDFLARE TURNSTILE CAPTCHA CONFIG
# ==========================================
# Public Site Key (Untuk Widget Rendering di Frontend)
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4AAAAAAD-Ymt4GiDJPGK7O

# Private Secret Key (HANYA dibaca oleh Server Action / Backend Next.js)
TURNSTILE_SECRET=0x4

# ==========================================
# 4. UPSTASH REDIS CONFIG (CACHING & RATE LIMIT)
# ==========================================
UPSTASH_REDIS_REST_URL=""
UPSTASH_REDIS_REST_TOKEN=""

# ==========================================
# 5. SENTRY ERROR MONITORING CONFIG
# ==========================================
NEXT_PUBLIC_SENTRY_DSN=""
SENTRY_AUTH_TOKEN=""
SENTRY_ORG=""
SENTRY_PROJECT=""
```

---

## 3. Matriks Aksesibilitas & Tingkat Kerahasiaan

| Nama Variabel                    | Aksesibilitas Scope | Sifat Keamanan      | Deskripsi / Fungsi                                                   |
| :------------------------------- | :------------------ | :------------------ | :------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | Client & Server     | Public              | URL utama aplikasi web untuk pembuatan absolute path & callback.     |
| `YEAR_FOUNDED`                   | Server Only         | Private             | Tahun pendirian UKM Robotik PNP (2005).                              |
| `NEXT_PUBLIC_SUPABASE_URL`       | Client & Server     | Public              | Endpoint REST & Realtime Supabase API.                               |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Client & Server     | Public              | API key publik Supabase yang dibatasi oleh Row Level Security (RLS). |
| `SUPABASE_SERVICE_ROLE_KEY`      | **Server Only**     | **CRITICAL SECRET** | Kunci administratif Supabase. Membypass semua aturan RLS.            |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | Client & Server     | Public              | Kunci publik untuk merender widget Cloudflare Turnstile di browser.  |
| `TURNSTILE_SECRET`               | **Server Only**     | **SECRET**          | Kunci verifikasi captcha ke endpoint `siteverify` Cloudflare.        |
| `UPSTASH_REDIS_REST_URL`         | Server Only         | Private             | URL REST Endpoint Upstash Redis Database.                            |
| `UPSTASH_REDIS_REST_TOKEN`       | **Server Only**     | **SECRET**          | Bearer Token otentikasi Upstash Redis.                               |
| `NEXT_PUBLIC_SENTRY_DSN`         | Client & Server     | Public              | Data Source Name untuk pengiriman crash report ke Sentry.            |
| `SENTRY_AUTH_TOKEN`              | **Server Only**     | **SECRET**          | Token autentikasi untuk upload source maps saat build.               |
| `SENTRY_ORG`                     | Server Only         | Private             | Nama organisasi terdaftar di Sentry.                                 |
| `SENTRY_PROJECT`                 | Server Only         | Private             | Nama project terdaftar di Sentry.                                    |

---

## 4. Checklist Keamanan Management Environment

1. **Pastikan `.env.local` Ada di `.gitignore`**:
   Pastikan file `.gitignore` di root proyek mencakup baris berikut:
   ```text
   .env*.local
   .env
   ```
2. **Jangan Lakukan Inisialisasi Hardcode di Source Code**:
   Selalu akses variabel melalui `process.env.NAMA_VARIABEL`.
3. **Validasi Environment Variables pada Runtime**:
   Direkomendasikan menggunakan Zod untuk memvalidasi tipe variabel saat aplikasi pertama kali dijalankan (`lib/env.ts` pattern).
4. **Rotasi Kunci jika Bocor**:
   Jika `SUPABASE_SERVICE_ROLE_KEY` atau `TURNSTILE_SECRET` tidak sengaja ter-commit ke Git repository, segera lakukan _Secret Rotation_ / regenerasi kunci di dashboard masing-masing penyedia layanan.
