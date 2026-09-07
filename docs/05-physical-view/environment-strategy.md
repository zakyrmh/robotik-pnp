# Panduan Strategi & Isolasi Lingkungan Pengembangan (Environment Strategy & Isolation Architecture Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                        |
| :------------------------------------ | :------------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-ENV-01`                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                      |
| **Induk Kebijakan (_Master Policy_)** | _Deployment Architecture & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                               |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                         |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                 |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis         | Ringkasan Perubahan                                                                           |
| :------: | :--------: | :-------------- | :-------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | DevOps Engineer | Draf awal arsitektur isolasi lingkungan, preview environments, dan pengelolaan env variables. |
| `v2.0.0` | 09/08/2026 | System Analyst  | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.                |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis dan panduan pengelolaan lingkungan pengembangan (_environment strategy_) yang membedakan **Local Development**, **Preview Environments (Per-Branch / Staging)**, dan **Production** pada **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Arsitektur Isolasi Lingkungan (Environment Matrix)

Untuk mencegah kontaminasi data produksi (_data corruption_) dan insiden keamanan, setiap lingkungan terisolasi secara penuh mulai dari layer aplikasi (Vercel), database & autentikasi (Supabase), hingga in-memory cache (Upstash Redis).

```
[ Local Dev Environment ] ──> Supabase Local Docker Engine (127.0.0.1:54321)
                              Local Redis Mock / Upstash Dev Instance

[ Preview Environment ]   ──> Automatic Vercel Deployment per PR/Branch
  (Branch/Staging)             Supabase Staging Project (Isolated Ref)
                              Upstash Redis Staging Namespace

[ Production ]            ──> Vercel Production (`ukmrobotik-pnp.or.id`)
                              Supabase Production Project (`qtblwlzbxfopcvyvplfh`)
                              Upstash Redis Production Instance (Singapore)
```

---

## 3. Tabel Perbandingan Karakteristik Environment

| Parameter / Layer        | Local Development                | Preview (Per-Branch & Staging)                        | Production                                      |
| :----------------------- | :------------------------------- | :---------------------------------------------------- | :---------------------------------------------- |
| **Trigger Deployment**   | `npm run dev` (Lokal Developer)  | Automatic Vercel Build saat Push/PR ke Git            | Automatic Vercel Build saat PR Merged ke `main` |
| **Domain / URL**         | `http://localhost:3000`          | `*-git-*.vercel.app` / `staging.ukmrobotik-pnp.or.id` | `ukmrobotik-pnp.or.id`                          |
| **Node.js Runtime**      | Node.js v20 LTS (Lokal)          | Vercel Edge / Serverless (Node.js 20.x)               | Vercel Edge / Serverless (Node.js 20.x)         |
| **Database Instance**    | Local Supabase Docker (`54321`)  | Isolated Supabase Staging Project                     | Live Supabase Production Project                |
| **Cache Store**          | Local Memory / Upstash Dev       | Upstash Redis (Staging Prefix)                        | Upstash Redis (Production Singapore)            |
| **Cloudflare Turnstile** | Dummy Testing Keys (Always Pass) | Staging Keys (Testing Mode)                           | Live Production Secret Keys                     |
| **Sentry Monitoring**    | Disabled / Development Log       | Scope: `environment: preview`                         | Scope: `environment: production`                |

---

## 4. Strategi Preview Environments (Vercel Integration)

Vercel secara otomatis membuat **Preview Deployment** unik untuk setiap Pull Request (PR) atau _commit_ pada cabang non-main (`feature/*`, `fix/*`, `staging`).

### 4.1. Karakteristik Preview Environment

1. **Per-Branch Dynamic Subdomain**: Setiap cabang mendapatkan URL khusus (misal: `sim-robotik-git-feature-presensi-pnp.vercel.app`).
2. **Isolasi Database Staging**: Seluruh Preview Environment dihubungkan ke **Supabase Staging Instance** yang berisi _seed data_ dummy. Ini menjamin pengujian fitur baru tidak akan memodifikasi atau menghapus data riil anggota pada database produksi.
3. **Branch Protection & Preview Gate**: PR hanya dapat digabungkan (_merged_) ke cabang `main` setelah Vercel Preview Deployment berhasil di-build tanpa eror dan seluruh _Quality Gate_ GitHub Actions berstatus _Passed_.

---

## 5. Pengelolaan Variabel Lingkungan (Environment Variable Scoping)

Variabel lingkungan dikelola terpusat di Vercel Dashboard dengan pemisahan _Scope_ yang ketat:

### 5.1. Pemetaan Scope Variabel di Vercel Dashboard

| Variable Key                     | Development (`.env.local`) | Preview Scope (Vercel)              | Production Scope (Vercel)                  |
| :------------------------------- | :------------------------- | :---------------------------------- | :----------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`           | `http://localhost:3000`    | `https://$VERCEL_URL`               | `https://ukmrobotik-pnp.or.id`             |
| `NEXT_PUBLIC_SUPABASE_URL`       | `http://127.0.0.1:54321`   | `https://[STAGING-REF].supabase.co` | `https://qtblwlzbxfopcvyvplfh.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY`  | Local Anon Key             | Staging Anon Key                    | Production Anon Key                        |
| `SUPABASE_SERVICE_ROLE_KEY`      | Local Service Key          | Staging Service Key                 | Production Service Key                     |
| `UPSTASH_REDIS_REST_URL`         | Local / Staging URL        | Staging Upstash URL                 | Production Upstash URL                     |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` | Staging Turnstile Key               | Live Production Turnstile Key              |

---

## 6. Secret Management & Aturan Keamanan (.gitignore)

1. **Dilarang Commit File Rahasia**: File `.env`, `.env.local`, `.env.production`, dan kredensial SQL dump **wajib** terdaftar di `.gitignore`.
2. **Penggunaan Service Role Key**: `SUPABASE_SERVICE_ROLE_KEY` hanya boleh diakses di layer _Server-Only_ (Server Actions / Route Handlers) dan **TIDAK BOLEH** diberi awalan `NEXT_PUBLIC_`.
3. **Audit Variable Regular**: Lakukan pemeriksaan berkala pada Vercel Dashboard untuk memastikan tidak ada token eksperimental yang tertinggal di scope Production.

---

## 7. Checklist Verifikasi Environment

- [ ] `.env.local` terdaftar di `.gitignore` dan tidak terlacak di repositori Git.
- [ ] Vercel Environment Variables terbagi dengan benar di scope Development, Preview, dan Production.
- [ ] Preview Deployment terhubung ke Supabase Staging DB (Bukan DB Production).
- [ ] Custom domain `ukmrobotik-pnp.or.id` hanya terikat pada scope Production.

---

_Dokumen ini diterbitkan sebagai standar panduan strategi & isolasi lingkungan pengembangan resmi untuk UKM Robotik Politeknik Negeri Padang._
