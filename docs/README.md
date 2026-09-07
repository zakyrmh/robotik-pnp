# Induk Arsitektur Sistem & Pusat Dokumentasi Terpadu (System Architecture Master Index)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                   |
| :------------------------------------ | :------------------------------------------------------------------------------------------------------ |
| **ID Dokumen Master**                 | `DOC-MST-SYS-00`                                                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade System Master Release)                                                       |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas bagi Pengurus, Developer & Auditor)              |
| **Sistem Induk (_Master Framework_)** | **Integrated Software Architecture & Governance Framework (ISAGF)** (Model 4+1 View ISO/IEC/IEEE 42010) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                                          |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                                                |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                            |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Berkas `docs/README.md` ini merupakan **Buku Induk Portal Dokumentasi Arsitektur Sistem Informasi Manajemen UKM Robotik PNP (System Architecture Master Repository)**.

Portal ini mengonsolidasikan seluruh dimensi arsitektur, proses bisnis operasional, infrastruktur deployment, jaminan kualitas, kepatuhan regulasi siber, dan standar rekayasa perangkat lunak berbasis model arsitektur **4+1 View Model (IEEE 1471 / ISO/IEC/IEEE 42010)** dan **Information Security Management System (ISMS / ISO 27001)**.

### Visi Arsitektur Sistem:

Sistem dibangun sebagai platform **SaaS Multi-Role Modern** berkinerja tinggi, aman, dan patuh hukum untuk mendukung pengelolaan operasional kepengurusan UKM Robotik PNP, kegiatan pelatihan, tugas piket laboratorium, presensi digital, serta penyelenggaraan acara besar nasional seperti **Minangkabau Robot Contest (MRC)**.

---

## 2. Peta Navigasi Arsitektur Sistem (Model 4+1 & Core Governance)

Arsitektur dokumentasi terbagi ke dalam **8 (delapan) direktori utama**:

```
docs/
├── README.md                                           # Buku Induk Arsitektur Sistem & Central Index (Dokumen Ini)
│
├── 01-scenarios/                                       # [Pending] Panduan Skenario Penggunaan & Use Cases
├── 02-logical-view/                                    # [Pending] Panduan Arsitektur Logis & Model Data (ERD/UML)
├── 03-development-view/                                # [Pending] Panduan Struktur Kode & Migrasi Skema Basis Data
│
├── 04-process-view/                                    # [v2.0.0 READY] Panduan Proses Bisnis & Workflow BPMN 2.0
│   ├── README.md                                       # DOC-PRC-MST-00 - Master Governance Process View
│   ├── workflow-documentation.md                      # DOC-PRC-WKF-01 - Panduan Spesifikasi Alur Kerja Lengkap
│   └── business-process/                               # Diagram BPMN 2.0 (attendance, piket, recruitment)
│
├── 05-physical-view/                                   # [v2.0.0 READY] Panduan Infrastruktur & Topologi Deployment
│   ├── README.md                                       # DOC-PHY-MST-00 - Master Governance Physical View
│   ├── backup-recovery.md                              # DOC-PHY-BCK-01 - Multi-Project Isolation & Backup SOP
│   ├── ci-cd-pipeline.md                               # DOC-PHY-CIC-01 - Pipeline GitHub Actions & Migrasi DB
│   ├── environment-strategy.md                         # DOC-PHY-ENV-01 - Isolasi Local, Preview & Production
│   ├── resource-tiers-and-limits.md                    # DOC-PHY-RES-01 - Batas Kuota Cloud & Mitigasi REQ-MRC-08
│   ├── scaling-strategy.md                             # DOC-PHY-SCL-01 - Pemicu Upgrade Pro Tier & Edge Caching
│   ├── deployment-diagrams/                            # DOC-PHY-DTD-01 - Diagram Topologi UML & Narasi
│   └── infrastructure/                                 # DOC-PHY-CFL-01, SUP-01, UPS-01, VCL-01 (Cloud Setup)
│
├── 06-testing-quality/                                 # [v2.0.0 READY] Panduan Jaminan Mutu, Pengujian & Pemeliharaan
│   ├── README.md                                       # DOC-TST-MST-00 - Master Governance QA & Testing
│   ├── unit-tests/                                     # DOC-TST-UNT-01 (Test Cases) & COV-01 (Coverage Report)
│   ├── integration-tests/                              # DOC-TST-INT-01 - Integration Test Mock & Real RLS
│   ├── e2e-tests/                                      # DOC-TST-E2E-01 - Playwright E2E Critical Flows
│   ├── performance-testing/                            # DOC-TST-BNC-01 (Benchmarks) & OPT-01 (Optimization)
│   └── maintenance/                                    # DOC-TST-MON-01, IRP-01, BCK-01, UPD-01 (SOP Monitoring)
│
├── 07-compliance-security/                             # [v2.0.0 READY] Tata Kelola ISMS, Kepatuhan & Privasi Data
│   ├── README.md                                       # DOC-SEC-MST-00 - Master Governance ISMS & PIMS
│   ├── security-policies/                              # DOC-SEC-ACC-03, DAT-04, PWD-02, SES-01 (Security Policies)
│   ├── audit-trails/                                   # DOC-AUD-IRP-02, LOG-01, BCP-03, CHK-04 (Audit Trails)
│   ├── regulations/                                    # UU PDP No. 27/2022, PP 71/2019, UU ITE, Permenkominfo
│   └── standards/                                      # ISO/IEC 27001:2022, ISO/IEC 27701:2019, OWASP Top 10
│
└── 08-tech-references/                                 # [v2.0.0 READY] Standar Rekayasa & Referensi Teknis (TAES)
    ├── README.md                                       # DOC-TEC-MST-00 - Master Governance Technical References
    ├── core-framework/                                 # Next.js 16 App Router, React 19, TypeScript Strict
    ├── backend-services/                               # PostgreSQL Schema, Supabase Auth SSR, Storage, Edge Func
    ├── ui-styling/                                     # Tailwind v4, Shadcn UI, Responsive Mobile-First
    ├── infrastructure-security/                        # Cloudflare WAF, Zod Env Validation, Upstash Redis
    ├── testing-quality/                                # Vitest Unit Setup, Playwright E2E, Supabase Mocking
    └── ai-agent-context/                               # Current Stack Versions, Code Gen Rules, Prompt Library
```

---

## 3. Matriks Status & Ringkasan Fungsi Direktori Dokumentasi

### 3.1. Direktori Siap Produksi (_Production-Grade Audit-Ready Directories_)

| Direktori Dokumen                |    Master ID     |    Status Rilis    | Ringkasan Fungsi Utama                                                                                                                                                                                                                           |
| :------------------------------- | :--------------: | :----------------: | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 📁 **`04-process-view/`**        | `DOC-PRC-MST-00` | **`v2.0.0` READY** | Berisi pemodelan proses bisnis BPMN 2.0 (ISO 19510) untuk presensi digital, piket lab, dan open recruitment, dilengkapi dokumen panduan alur kerja (_workflow-documentation.md_), matriks RBAC, dan automasi backend.                            |
| 📁 **`05-physical-view/`**       | `DOC-PHY-MST-00` | **`v2.0.0` READY** | Berisi arsitektur topologi deployment cloud (Vercel, Supabase, Upstash Redis, Cloudflare), strategi backup multi-project, CI/CD pipeline GitHub Actions, isolasi environment, mitigasi **REQ-MRC-08**, dan scaling strategy.                     |
| 📁 **`06-testing-quality/`**     | `DOC-TST-MST-00` | **`v2.0.0` READY** | Berisi kerangka kerja jaminan mutu (QA), unit testing Vitest (target coverage 75%), E2E testing Playwright, benchmark Core Web Vitals (Lighthouse 96/100), serta SOP pemeliharaan (monitoring Sentry, incident response, dan update procedures). |
| 📁 **`07-compliance-security/`** | `DOC-SEC-MST-00` | **`v2.0.0` READY** | Berisi tata kelola keamanan informasi (ISMS ISO 27001), pelindungan data pribadi (UU PDP No. 27/2022), kebijakan akses RBAC/RLS, Audit Trails (log immutability), incident response plan, dan disaster recovery 3-2-1-1-0.                       |
| 📁 **`08-tech-references/`**     | `DOC-TEC-MST-00` | **`v2.0.0` READY** | Berisi standar rekayasa perangkat lunak (TAES) untuk Next.js 16 App Router, React 19, Supabase Auth SSR, Tailwind v4, Shadcn UI, Zod validation, serta panduan pengembang dan konvensi AI Agent (`AGENTS.md`).                                   |

---

### 3.2. Direktori Penjadwalan Pemutakhiran (_Upcoming Directories_)

| Direktori Dokumen             |  Status Jadwal   | Target Dokumen Utama                                                                       |
| :---------------------------- | :--------------: | :----------------------------------------------------------------------------------------- |
| 📁 **`01-scenarios/`**        | _Upcoming Phase_ | Dokumentasi Use Case Scenarios, User Stories, dan Personas Pengguna.                       |
| 📁 **`02-logical-view/`**     | _Upcoming Phase_ | Diagram Kelas UML, Diagram Entitas Relasi Basis Data (ERD), dan Arsitektur Komponen Logis. |
| 📁 **`03-development-view/`** | _Upcoming Phase_ | Panduan Struktur Repositori Kode, Konvensi Modul, dan Strategi Migrasi Database.           |

---

## 4. Konsolidasi Metrik Kualitas, Performa & Keamanan Sistem

Seluruh komponen dokumentasi terhubung ke dalam satu dasbor indikator kinerja utama (_Key Performance Indicators_):

```
 ┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
 │                         DASBOR KONSOLIDASI METRIK ARSITEKTUR SISTEM                              │
 ├────────────────────────────┬────────────────────────────┬────────────────────────────────────────┤
 │ Kategori Metrik            │ Target Ambang Batas        │ Status Terverifikasi                   │
 ├────────────────────────────┼────────────────────────────┼────────────────────────────────────────┤
 │ • Vitest Code Coverage     │ Statements $\ge 75\%$      │ **81.4%** (PASSED)                     │
 │ • Lighthouse Score         │ Overall $\ge 90 / 100$     │ **96 / 100** (PASSED)                  │
 │ • Core Web Vitals (LCP/INP)│ LCP $<2.5\text{s}$, INP $<200\text{ms}$ │ LCP **1.42s**, INP **85ms** (GOOD)    │
 │ • Redis Cache Hit Latency  │ Latensi $< 50\text{ms}$    │ **24ms** (Upstash Redis Singapore)     │
 │ • SSL/TLS Encryption       │ Enkripsi End-to-End        │ **Full (Strict)** (Cloudflare WAF)     │
 │ • RLS Table Enforcement    │ Coverage Public Tables     │ **100% Enforced** (Supabase RLS)       │
 │ • Data Breach SLA          │ Notification Window        │ **$< 3 \times 24$ Jam** (UU PDP)       │
 │ • High Availability MRC    │ Realtime Cap Mitigation    │ **REQ-MRC-08 Compliant** (Short-Poll)  │
 └────────────────────────────┴────────────────────────────┴────────────────────────────────────────┘
```

---

## 5. Ringkasan Stack Teknologi Produksi & Versi Pustaka

Aplikasi dibangun menggunakan stack teknologi teruji dengan kepastian versi (_version locking_):

- **Core Framework**: Next.js `16.x` (App Router & React Server Components)
- **Frontend Library**: React `19.x` (Actions, `useActionState`, `useFormStatus`)
- **Backend & Database**: Supabase Cloud (`PostgreSQL 15/16`, Auth SSR `@supabase/ssr`, Storage, Edge Functions)
- **In-Memory Cache & Rate Limit**: Upstash Redis (`@upstash/redis`, `@upstash/ratelimit`)
- **Styling & UI Components**: Tailwind CSS `v4.x` (Engine Oxide), Shadcn UI, Radix UI Primitives, Lucide Icons
- **Security & WAF**: Cloudflare WAF, Turnstile CAPTCHA (`siteverify`), HSTS Strict
- **Testing Engine**: Vitest (Unit Testing, V8 Provider), Playwright (E2E Automated Testing)
- **Type Safety & Data Validation**: TypeScript `5.x` (`strict: true`), Zod Validation Schemas

---

## 6. Pedoman Operasional Bagi Pengembang & AI Agent

Seluruh tim pengembang manusia (_human engineers_) dan agen kecerdasan buatan (_AI Agents_) yang berkontribusi pada repositori ini **WAJIB** mematuhi ketentuan berikut:

1. **Prinsip Server-First**: Selalu gunakan React Server Components (RSC). Hindari menambahkan instruksi `"use client"` kecuali pada komponen paling luar (_leaf component_) yang membutuhkan interaktivitas DOM.
2. **Keamanan Inisialisasi Supabase Client**: Gunakan `createServerClient` di dalam Server Components, Server Actions, dan Route Handlers. Gunakan `createBrowserClient` **hanya** di Client Components.
3. **Validasi Data Mutasi**: Seluruh masukan masukan data ke Server Actions wajib divalidasi menggunakan skema Zod sebelum dieksekusi ke basis data.
4. **Kebijakan Tanpa `any`**: Dilarang keras menggunakan tipe `any` pada TypeScript. Gunakan `unknown` atau penjelmaan generik jika struktur data bersifat dinamis.
5. **Pencatatan Audit Trail**: Setiap transaksi mutasi administratif (INSERT, UPDATE, DELETE) yang dilakukan oleh role pengurus (`super-admin`, `admin-or`, `admin-komdis`) wajib memicu pencatatan audit trail non-nullable.

---

## 7. Prosedur Pembaruan & Kontrol Perubahan Dokumentasi Sistem

1. Dokumen induk `docs/README.md` dan dokumen dalam seluruh subdirektori ditinjau secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi perubahan arsitektur utama.
2. Setiap pembaruan wajib mencantumkan pemutakhiran versi pada tabel _Document Control_ dan mendapat persetujuan tertulis dari **Lead Software Architect**, **Ketua Umum**, dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Arsitektur Sistem & Pusat Dokumentasi Terpadu Resmi UKM Robotik Politeknik Negeri Padang._
