# Induk Kerangka Kerja Jaminan Mutu & Pengujian Perangkat Lunak (QA & Testing Master Framework)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                                                                                        |
| :------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **ID Dokumen Master**                 | `DOC-TST-MST-00`                                                                                                                                             |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Audit-Ready Release)                                                                                                              |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                                                                                               |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                                                                                      |
| **Sistem Induk (_Master Framework_)** | **Quality Assurance & Testing Policy**, **Performance Management Policy**, dan **System Maintenance & Operational Continuity Policy** (ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                                                                                               |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                                                                                                     |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                                                                                                 |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Folder `06-testing-quality` merupakan **Pusat Tata Kelola Jaminan Mutu, Pengujian Perangkat Lunak, Pemantauan Kinerja, dan Pemeliharaan Sistem (QA & Testing Master Directory)** pada Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.

Arsitektur tata kelola ini dirancang secara komprehensif untuk menghubungkan:

1. **Spesifikasi Pengujian Unit & Cakupan Kode** (`unit-tests/`).
2. **Panduan Pengujian Integrasi API & Supabase** (`integration-tests/`).
3. **Skenario Pengujian End-to-End Alur Kritis** (`e2e-tests/`).
4. **Laporan Benchmark Kinerja & Rekomendasi Optimasi** (`performance-testing/`).
5. **Prosedur Pemeliharaan Sistem, Pemantauan, & Tanggap Insiden** (`maintenance/`).

---

## 2. Pilar Strategi Pengujian & Jaminan Mutu

Sistem menerapkan pendekatan pengujian berlapis (_Testing Pyramid_) dengan cakupan menyeluruh:

```
 ┌──────────────────────────────────────────────────────────────────────┐
 │                    PIRAMIDA STRATEGI PENGUJIAN                       │
 ├──────────────────────────────┬───────────────────────────────────────┤
 │ Tingkat Pengujian            │ Alat & Metode                         │
 ├──────────────────────────────┼───────────────────────────────────────┤
 │ • Unit Tests (Basis)         │ • Vitest + V8 Coverage Provider       │
 │ • Integration Tests (Tengah) │ • Vitest Mocking + Supabase Local CLI │
 │ • E2E Tests (Puncak)         │ • Playwright Multi-Browser            │
 │ • Performance Tests          │ • Lighthouse CI + k6 (Grafana)        │
 │ • Monitoring & Maintenance   │ • Sentry + Supabase Logs + Cloudflare │
 └──────────────────────────────┴───────────────────────────────────────┘
```

---

## 3. Peta Navigasi & Indeks Dokumen Terstruktur

Pengelolaan tata kelola dibagi ke dalam **5 (lima) subfolder utama**:

```
docs/06-testing-quality/
├── README.md                                           # Master Framework & Central Index (Dokumen Ini)
├── unit-tests/                                         # Subfolder 1: Pengujian Unit & Cakupan Kode
│   ├── test-cases.md                                   # DOC-TST-UNT-01 (v2.0.0) - Spesifikasi Kasus Uji Unit
│   └── coverage-report.md                              # DOC-TST-COV-01 (v2.0.0) - Laporan Coverage & Quality Gate
├── integration-tests/                                  # Subfolder 2: Pengujian Integrasi API & Database
│   └── api-integration-tests.md                        # DOC-TST-INT-01 (v2.0.0) - Integration Test Mock & Real RLS
├── e2e-tests/                                          # Subfolder 3: Pengujian End-to-End Alur Kritis
│   └── critical-flows.md                               # DOC-TST-E2E-01 (v2.0.0) - Playwright E2E Critical Flows
├── performance-testing/                                # Subfolder 4: Benchmark Kinerja & Optimasi
│   ├── benchmarks.md                                   # DOC-TST-BNC-01 (v2.0.0) - Core Web Vitals & Benchmark
│   └── optimization-recommendations.md                 # DOC-TST-OPT-01 (v2.0.0) - Rekomendasi Optimasi Kinerja
└── maintenance/                                        # Subfolder 5: Pemeliharaan & Operasional Sistem
    ├── monitoring-setup.md                             # DOC-TST-MON-01 (v2.0.0) - Setup Monitoring Real-Time
    ├── incident-response.md                            # DOC-TST-IRP-01 (v2.0.0) - SOP Tanggap Insiden Darurat
    ├── backup-strategy.md                              # DOC-TST-BCK-01 (v2.0.0) - Strategi Backup & Disaster Recovery
    └── update-procedures.md                            # DOC-TST-UPD-01 (v2.0.0) - Prosedur Update & Regression Testing
```

---

## 4. Ringkasan Fungsi Berkas per Subfolder

### 4.1 Subfolder `unit-tests/` (Pengujian Unit & Cakupan Kode)

- 📄 **[test-cases.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/unit-tests/test-cases.md)** (`v2.0.0`): Menyediakan spesifikasi lengkap kasus uji unit menggunakan Vitest, mencakup validasi NIM/Email akademik, format tanggal/waktu presensi WIB, logika perhitungan poin kehadiran (_scoring engine_), Server Action presensi QR Code (token expiry, duplicate check), dan pendaftaran calon anggota (Zod schema validation).
- 📄 **[coverage-report.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/unit-tests/coverage-report.md)** (`v2.0.0`): Mengatur laporan cakupan pengujian unit Vitest V8, status Quality Gate per metrik (Statements 81.4%, Branches 76.2%, Functions 79.8%, Lines 82.1%), breakdown coverage per modul domain bisnis (Auth/RBAC, Audit Logs, Oprec, Presensi, Piket), konfigurasi threshold/exclusion `vitest.config.ts`, dan daftar file kritis prioritas peningkatan.

---

### 4.2 Subfolder `integration-tests/` (Pengujian Integrasi API & Database)

- 📄 **[api-integration-tests.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/integration-tests/api-integration-tests.md)** (`v2.0.0`): Menyediakan panduan teknis dual/hybrid strategy pengujian integrasi: Fast Mock Tests (Vitest mocking `@supabase/ssr` untuk validasi Server Actions & RLS Error Code 42501) dan Real RLS Integration Tests (Supabase Local CLI PostgreSQL pada `http://127.0.0.1:54321`), termasuk pengujian integrasi Supabase Storage bucket `profiles`.

---

### 4.3 Subfolder `e2e-tests/` (Pengujian End-to-End Alur Kritis)

- 📄 **[critical-flows.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/e2e-tests/critical-flows.md)** (`v2.0.0`): Menyediakan spesifikasi 4 skenario E2E kritis menggunakan Playwright multi-browser: Happy Path Login (termasuk Cloudflare Turnstile), Pemindaian Presensi QR Code (html5-qrcode + Sonner toast), Registrasi Calon Anggota Baru (onboarding → waiting flow), dan Proteksi RBAC (proxy middleware redirect enforcement).

---

### 4.4 Subfolder `performance-testing/` (Benchmark Kinerja & Optimasi)

- 📄 **[benchmarks.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/performance-testing/benchmarks.md)** (`v2.0.0`): Menyediakan laporan hasil benchmark Core Web Vitals (LCP 1.42s, INP 85ms, CLS 0.02, FCP 0.85s, TTFB 180ms), Server Actions response time (cache hit 24ms vs cache miss 168ms via Upstash Redis), cold start benchmarks (Vercel 420ms, Supabase Edge 82ms), dan daftar tooling monitoring (Lighthouse CI, k6, Sentry APM).
- 📄 **[optimization-recommendations.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/performance-testing/optimization-recommendations.md)** (`v2.0.0`): Menyediakan 4 rekomendasi optimasi strategis: migrasi `<img>` ke `next/image` untuk kompresi WebP/AVIF, expanded Cache-Aside Pattern via Upstash Redis (TTL 24 jam), B-Tree indexing pada kolom `attendances(activity_id, profile_id)` dan `profiles(nim, role)`, serta dynamic import `html5-qrcode` via `next/dynamic`.

---

### 4.5 Subfolder `maintenance/` (Pemeliharaan & Operasional Sistem)

- 📄 **[monitoring-setup.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/maintenance/monitoring-setup.md)** (`v2.0.0`): Menyediakan panduan konfigurasi pemantauan kesehatan aplikasi: Sentry `@sentry/nextjs` (instrumentation.ts hook + manual capture), Supabase Logs (deteksi RLS violation Error 42501 & API latensi tinggi), dan Cloudflare WAF (deteksi bot, brute force, custom rate limiting rule endpoint presensi).
- 📄 **[incident-response.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/maintenance/incident-response.md)** (`v2.0.0`): Menyediakan SOP tanggap insiden darurat 3 tingkat severity (SEV-1 Critical < 15 menit, SEV-2 High < 1 jam, SEV-3 Low < 24 jam), matriks tim PIC insiden, 3 skenario playbook (website down total + Vercel rollback, data breach + REVOKE akses darurat, kegagalan presensi QR + fallback manual/paper mode), dan checklist blameless post-mortem.
- 📄 **[backup-strategy.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/maintenance/backup-strategy.md)** (`v2.0.0`): Menyediakan strategi backup PITR (RPO < 1 detik), daily automated backup (retensi 30 hari), manual `pg_dump` via Supabase CLI, sinkronisasi Storage bucket (`profiles`, `registrations`) via `rclone`, dan prosedur restore data (PITR dashboard & SQL dump lokal).
- 📄 **[update-procedures.md](file:///d:/Project/robotik-pnp/docs/06-testing-quality/maintenance/update-procedures.md)** (`v2.0.0`): Menyediakan prosedur pembaruan versi teknologi: upgrade framework major (Next.js 16 → 17 dengan codemod), update Supabase JS SDK (regenerate types), alur regression testing checklist 4 tahap (typecheck → lint → unit test → E2E), dan prosedur rollback saat kegagalan regresi.

---

## 5. Ringkasan Metrik Quality Gate & Target Kinerja Sistem

Seluruh dokumen pengujian dan benchmark terhubung menjadi satu dasbor metrik kualitas:

| Berkas Dokumen         | Metrik Utama                    | Target Ambang Batas        | Status Aktual         |
| :--------------------- | :------------------------------ | :------------------------- | :-------------------- |
| `coverage-report.md`   | Vitest Statements Coverage      | $\ge 75\%$                 | **81.4%** (PASSED)    |
| `coverage-report.md`   | Vitest Branches Coverage        | $\ge 70\%$                 | **76.2%** (PASSED)    |
| `benchmarks.md`        | Lighthouse Overall Score        | $\ge 90 / 100$             | **96 / 100** (PASSED) |
| `benchmarks.md`        | LCP (Largest Contentful Paint)  | $< 2.5\text{s}$            | **1.42s** (PASSED)    |
| `benchmarks.md`        | INP (Interaction to Next Paint) | $< 200\text{ms}$           | **85ms** (PASSED)     |
| `benchmarks.md`        | CLS (Cumulative Layout Shift)   | $< 0.1$                    | **0.02** (PASSED)     |
| `benchmarks.md`        | Server Action Cache Hit         | $< 50\text{ms}$            | **24ms** (PASSED)     |
| `monitoring-setup.md`  | Sentry Unhandled Issues         | 0 new critical bugs / hari | Target Ongoing        |
| `incident-response.md` | SEV-1 Response Time             | $< 15\text{ menit}$        | SLA Target            |
| `backup-strategy.md`   | RPO (PITR)                      | $< 1\text{ detik}$         | PITR Active           |

---

## 6. Ritme Operasional Pengujian & Jaminan Mutu (_QA Operational Rhythm Calendar_)

Pelaksanaan pengawasan mutu perangkat lunak dijalankan berdasarkan ritme waktu yang teratur:

```
  HARIAN               MINGGUAN               BULANAN              TRIWULANAN            TAHUNAN / H-30 OPREC
 ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌─────────────────────┐
 │ • CI/CD Unit │ ──> │ • Review     │ ──> │ • Coverage   │ ──> │ • Upgrade    │ ──> │ • Full Regression   │
 │   Test Run   │     │   Sentry     │     │   Report     │     │   Dependency │     │   Test Suite        │
 │ • Sentry     │     │ • Slow Query │     │ • Restore    │     │ • Performance│     │ • Load Test k6      │
 │   Monitoring │     │   Review     │     │   Dry-Run    │     │   Benchmark  │     │   (200 Users)       │
 │ • Backup DB  │     │ • WAF Rule   │     │ • Cloudflare │     │ • Secret Key │     │ • E2E Flow Review   │
 │   02.00 WIB  │     │   Review     │     │   Review     │     │   Rotation   │     │ • Vendor Risk Audit │
 └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └─────────────────────┘
```

---

## 7. Prosedur Pembaruan & Kontrol Perubahan Dokumen QA

1. Dokumen di dalam folder `06-testing-quality` ditinjau secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi perubahan arsitektur besar (upgrade framework major, perubahan skema database, atau insiden keamanan SEV-0/SEV-1).
2. Setiap perubahan wajib mencantumkan versi baru pada tabel _Document Control_ dan mendapat persetujuan tertulis dari **Lead IT**, **Ketua Umum**, dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Tata Kelola Jaminan Mutu & Pengujian Perangkat Lunak Resmi UKM Robotik Politeknik Negeri Padang._
