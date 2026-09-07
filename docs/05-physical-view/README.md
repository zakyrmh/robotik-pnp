# Induk Tata Kelola Pandangan Fisik & Topologi Deployment (Physical View & Deployment Topology Master Framework)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                                                                           |
| :------------------------------------ | :-------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID Dokumen Master**                 | `DOC-PHY-MST-00`                                                                                                                                                |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Audit-Ready Release)                                                                                                                 |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                                                                                                  |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                                                                                         |
| **Sistem Induk (_Master Framework_)** | **Infrastructure Configuration & Cloud Services Policy** dan **Deployment Architecture & Operational Continuity Policy** (ISMS & Physical View UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                                                                                                  |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                                                                                                        |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                                                                                    |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Folder `05-physical-view` merupakan **Pusat Tata Kelola Pandangan Fisik, Topologi Deployment, Infrastruktur Cloud, dan Keberlangsungan Operasional (Physical View & Deployment Master Directory)** pada Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.

Arsitektur tata kelola ini dirancang secara komprehensif untuk menghubungkan:

1. **Diagram & Narasi Topologi Deployment** (`deployment-diagrams/`).
2. **Spesifikasi Konfigurasi Layanan Infrastruktur Cloud** (`infrastructure/`).
3. **Strategi Cadangan Data & Pemulihan Insiden** (`backup-recovery.md`).
4. **Otomatisasi Alur Deployment & Pengujian Integrasi** (`ci-cd-pipeline.md`).
5. **Arsitektur Isolasi Lingkungan Pengembangan** (`environment-strategy.md`).
6. **Pemetaan Batas Sumber Daya & Mitigasi Beban Kritis REQ-MRC-08** (`resource-tiers-and-limits.md`).
7. **Strategi Penskalaan & Edge Caching Offloading** (`scaling-strategy.md`).

---

## 2. Landasan Arsitektur & Penyedia Infrastruktur Cloud

Sistem dibangun di atas arsitektur _Serverless Cloud Stack_ modern yang saling terintegrasi:

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                   ARSITEKTUR INFRASTRUKTUR FISIK                       │
 ├──────────────────────────────────┬─────────────────────────────────────┤
 │ Layer Infrastruktur              │ Penyedia Layanan Cloud & Engine     │
 ├──────────────────────────────────┼─────────────────────────────────────┤
 │ • Edge Network, WAF & DNS        │ • Cloudflare Global CDN & WAF       │
 │ • Application Serverless Host    │ • Vercel Platform (Next.js 16 App)  │
 │ • Database, Auth & Storage       │ • Supabase Cloud (PostgreSQL 15/16) │
 │ • In-Memory Cache & Rate Limit   │ • Upstash Redis (Singapore Region)  │
 │ • Monitoring & Error Tracking    │ • Sentry APM & Log Explorer         │
 └──────────────────────────────────┴─────────────────────────────────────┘
```

---

## 3. Peta Navigasi & Indeks Dokumen Terstruktur

Pengelolaan tata kelola dibagi ke dalam **2 (dua) subfolder utama** dan **5 (lima) dokumen kebijakan operasional**:

```
docs/05-physical-view/
├── README.md                                           # Master Framework & Central Index (Dokumen Ini)
├── deployment-diagrams/                                # Subfolder 1: Diagram Topologi & Narasi
│   ├── deployment-topology.dd.xml                      # Diagram Topologi UML 2.1 Enterprise Architect (XMI)
│   └── deployment-topology.md                          # DOC-PHY-DTD-01 (v2.0.0) - Deskripsi Naratif Diagram Topologi
├── infrastructure/                                     # Subfolder 2: Konfigurasi Layanan Cloud
│   ├── cloudflare-dns-config.md                        # DOC-PHY-CFL-01 (v2.0.0) - Konfigurasi DNS, Proxy & SSL/TLS
│   ├── supabase-project-setup.md                       # DOC-PHY-SUP-01 (v2.0.0) - Setup Supabase & Supavisor Pooler
│   ├── upstash-redis-config.md                         # DOC-PHY-UPS-01 (v2.0.0) - Upstash Redis & Rate Limiting
│   └── vercel-project-config.md                        # DOC-PHY-VCL-01 (v2.0.0) - Vercel Build & Environment Variables
├── backup-recovery.md                                  # DOC-PHY-BCK-01 (v2.0.0) - Multi-Project Isolation & Backup SOP
├── ci-cd-pipeline.md                                   # DOC-PHY-CIC-01 (v2.0.0) - Pipeline GitHub Actions & Migrasi DB
├── environment-strategy.md                             # DOC-PHY-ENV-01 (v2.0.0) - Isolasi Local, Preview & Production
├── resource-tiers-and-limits.md                        # DOC-PHY-RES-01 (v2.0.0) - Batas Kuota Cloud & Mitigasi REQ-MRC-08
└── scaling-strategy.md                                 # DOC-PHY-SCL-01 (v2.0.0) - Pemicu Upgrade Pro Tier & Edge Caching
```

---

## 4. Ringkasan Fungsi Berkas per Subfolder & Dokumen

### 4.1 Subfolder `deployment-diagrams/` (Diagram & Narasi Topologi)

- 📄 **`deployment-topology.dd.xml`**: Berkas diagram topologi deployment berbasis standar UML 2.1 XMI hasil ekspor Enterprise Architect.
- 📄 **[deployment-topology.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/deployment-diagrams/deployment-topology.md)** (`v2.0.0`): Menyediakan pendamping naratif diagram topologi deployment, memetakan 7 node utama (Client, Vercel, Cloudflare Turnstile, Supabase Cloud, Upstash Redis, Sentry, Supabase Realtime) beserta spesifikasi protokol dan jalur komunikasi antar-node.

---

### 4.2 Subfolder `infrastructure/` (Konfigurasi Layanan Cloud)

- 📄 **[cloudflare-dns-config.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/infrastructure/cloudflare-dns-config.md)** (`v2.0.0`): Mengatur pemetaan DNS record (Proxied vs DNS Only), enkripsi SSL/TLS mode Full (Strict), aturan HSTS, kompresi Brotli, serta Page Rules caching aset statis dan bypass rute interaktif Next.js.
- 📄 **[supabase-project-setup.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/infrastructure/supabase-project-setup.md)** (`v2.0.0`): Menetapkan spesifikasi proyek Supabase di region Singapore (`ap-southeast-1`), konfigurasi PostgREST API, koneksi Supavisor Transaction Pooler (port `6543`), pemetaan RLS Policy, dan pengelolaan 5 Storage Buckets (`profiles`, `registrations`, `activity-banners`, `piket-proofs`, `task-submissions`).
- 📄 **[upstash-redis-config.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/infrastructure/upstash-redis-config.md)** (`v2.0.0`): Menetapkan konfigurasi instance Upstash Redis (Singapore), kebijakan _eviction_ `volatile-lru`, 3 skenario penggunaan (Rate Limiting via `@upstash/ratelimit`, Cache-Aside Engine latensi 24ms, dan penyimpanan token temporary QR presensi 30s).
- 📄 **[vercel-project-config.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/infrastructure/vercel-project-config.md)** (`v2.0.0`): Mengatur spesifikasi build Vercel (Node.js 20.x, region `sin1`), integrasi cabang Git (`main` Production, `staging` & `feature/*` Preview), Vercel Toolbar feedback loop, dan injeksi variabel lingkungan terpisah per scope.

---

### 4.3 Dokumen Kebijakan Operasional Fisik (Root Files)

- 📄 **[backup-recovery.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/backup-recovery.md)** (`v2.0.0`): Mengatur strategi isolasi 2 proyek Supabase terpisah (Dev/Staging vs Production), matriks RPO/RTO harian, SOP snapshot harian dan dump manual CLI, serta langkah pemulihan darurat jika terjadi kerusakan data produksi.
- 📄 **[ci-cd-pipeline.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/ci-cd-pipeline.md)** (`v2.0.0`): Menjelaskan alur otomatisasi GitHub Actions (Lint, Typecheck, Vitest), deployment preview Vercel, serta penetapan waktu migrasi skema Supabase (otomatis di staging vs _backward-compatible_ terkontrol di produksi).
- 📄 **[environment-strategy.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/environment-strategy.md)** (`v2.0.0`): Memetakan matriks 3 lingkungan (Local Development, Preview, Production), isolasi database dan cache per lingkungan, aturan keamanan `.gitignore`, dan pengelolaan variabel lingkungan terpusat.
- 📄 **[resource-tiers-and-limits.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/resource-tiers-and-limits.md)** (`v2.0.0`): Mengurai batas kuota gratis cloud provider, menganalisis titik kegagalan kritis Supabase Realtime (200 koneksi), serta menetapkan solusi arsitektur _Hybrid Short-Polling + Redis Cache_ untuk memenuhi persyaratan **REQ-MRC-08** (High Availability Live Score MRC).
- 📄 **[scaling-strategy.md](file:///d:/Project/robotik-pnp/docs/05-physical-view/scaling-strategy.md)** (`v2.0.0`): Menentukan matriks indikator kuantitatif pemicu upgrade Supabase Free ke Pro Tier (threshold 90%), serta strategi Vercel Edge Caching (ISR 1 jam untuk pengumuman, Short ISR 3s untuk live score) untuk meminimalisasi beban compute server.

---

## 5. Matriks Ringkasan Parameter Infrastruktur & Ambang Batas

Seluruh dokumen fisik dan operasional terhubung menjadi satu dasbor metrik infrastruktur:

| Berkas Dokumen                 | Parameter Utama              | Target Ambang Batas / Spesifikasi | Status Konfigurasi       |
| :----------------------------- | :--------------------------- | :-------------------------------- | :----------------------- |
| `cloudflare-dns-config.md`     | SSL/TLS Encryption Mode      | **Full (Strict)**                 | **ENFORCED**             |
| `supabase-project-setup.md`    | Supavisor Connection Pooler  | Transaction Mode (Port `6543`)    | **ACTIVE**               |
| `upstash-redis-config.md`      | Cache Eviction Policy        | **`volatile-lru`**                | **CONFIGURED**           |
| `vercel-project-config.md`     | Node.js Runtime & Region     | Node.js `20.x` / Region `sin1`    | **DEPLOYED**             |
| `backup-recovery.md`           | Multi-Project Isolation      | 2 Instance (Dev/Staging vs Prod)  | **ISOLATED**             |
| `ci-cd-pipeline.md`            | Quality Gate Workflow        | Typecheck + Lint + Vitest Pass    | **AUTOMATED**            |
| `environment-strategy.md`      | Environment Variable Scoping | 3 Scope (Dev / Preview / Prod)    | **SCOPED**               |
| `resource-tiers-and-limits.md` | Live Score Bottleneck Mitig. | Short-Polling + Upstash Shield    | **REQ-MRC-08 COMPLIANT** |
| `scaling-strategy.md`          | Pro Tier Upgrade Trigger     | Data usage menyentuh $90\%$       | **MONITORED**            |

---

## 6. Prosedur Pembaruan & Kontrol Perubahan Dokumen Physical View

1. Dokumen di dalam folder `05-physical-view` ditinjau secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi perubahan arsitektur cloud, penambahan infrastruktur baru, atau insiden operasional major.
2. Setiap perubahan wajib mencantumkan versi baru pada tabel _Document Control_ dan mendapat persetujuan tertulis dari **Lead IT**, **Ketua Umum**, dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Tata Kelola Pandangan Fisik & Topologi Deployment Resmi UKM Robotik Politeknik Negeri Padang._
