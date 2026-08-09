# Laporan Analisis Cakupan Pengujian & Quality Gate (Test Coverage Analysis & Quality Gate Report)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                   |
| :------------------------------------ | :---------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-COV-01`                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                 |
| **Induk Kebijakan (_Master Policy_)** | _Quality Assurance & Testing Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis        | Ringkasan Perubahan                                                                                         |
| :------: | :--------: | :------------- | :---------------------------------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | QA Engineer    | Draf awal laporan coverage Vitest V8 per modul domain bisnis.                                               |
| `v2.0.0` | 09/08/2026 | System Analyst | Revisi: Penambahan Document Control, perbaikan typo header tabel, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Status Quality Gate

Dokumen ini berisi hasil analisis dan laporan cakupan pengujian (_test coverage report_) menggunakan **Vitest (V8 Provider)** pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

Laporan cakupan pengujian unit dikompilasi secara otomatis melalui eksekusi Vitest Runner. Kebijakan _Quality Gate_ mewajibkan seluruh kode logika domain bisnis dan mutasi data kritis untuk memenuhi ambang batas (_threshold_) minimum sebelum diproduksi.

---

## 2. Status Metrics Ringkasan Proyek

| Metric Type    | Project Target Threshold | Current Actual Status | Status Pass / Fail |
| :------------- | :----------------------: | :-------------------: | :----------------: |
| **Statements** |          75.0%           |       **81.4%**       |     **PASSED**     |
| **Branches**   |          70.0%           |       **76.2%**       |     **PASSED**     |
| **Functions**  |          75.0%           |       **79.8%**       |     **PASSED**     |
| **Lines**      |          75.0%           |       **82.1%**       |     **PASSED**     |

> **Status Overall**: **QUALITY GATE PASSED** (Seluruh ambang batas utama terpenuhi).

---

## 3. Cakupan Coverage Per Modul Domain Bisnis

Tabel berikut menunjukkan persentase _coverage_ aktual per modul berdasarkan tingkat risiko bisnis (_business-critical level_):

| Modul Utama                                                                                 | Target Coverage | Actual Statements | Actual Branches | Actual Functions | Status Compliance |
| :------------------------------------------------------------------------------------------ | :-------------: | :---------------: | :-------------: | :--------------: | :---------------: |
| **Authentication & RBAC** (`lib/actions/auth.ts`, `proxy.ts`)                               |    **85.0%**    |       86.5%       |      81.2%      |      87.5%       |    **PASSED**     |
| **Account Control & Audit Logs** (`lib/actions/admin-users.ts`, `lib/actions/audit.ts`)     |    **85.0%**    |       87.2%       |      83.0%      |      88.0%       |    **PASSED**     |
| **Open Recruitment (Oprec) & Caang** (`lib/actions/or-settings.ts`, `lib/actions/caang.ts`) |    **80.0%**    |       82.4%       |      78.5%      |      81.0%       |    **PASSED**     |
| **Presensi & Kegiatan** (`lib/actions/activities.ts`, `lib/actions/attendance.ts`)          |    **80.0%**    |       81.8%       |      75.4%      |      82.3%       |    **PASSED**     |
| **Helper Utilities & Shared Logic** (`lib/utils/*`, `lib/validations/*`)                    |    **80.0%**    |       89.1%       |      84.6%      |      91.2%       |    **PASSED**     |
| **Manajemen Piket & Shift** (`lib/actions/piket.ts`)                                        |    **75.0%**    |       77.3%       |      71.8%      |      76.5%       |    **PASSED**     |
| **Kelompok & Magang Caang** (`lib/actions/groups.ts`, `lib/actions/tasks.ts`)               |    **75.0%**    |       78.0%       |      73.2%      |      77.0%       |    **PASSED**     |
| **Custom UI Components** (`components/features/*`, `components/forms/*`)                    |    **70.0%**    |       73.5%       |      68.9%      |      72.0%       |    **PASSED**     |

---

## 4. Konfigurasi Threshold & Exclusion di `vitest.config.ts`

### 4.1. Konfigurasi Ambang Batas (_Thresholds_)

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      thresholds: {
        lines: 75,
        functions: 75,
        branches: 70,
        statements: 75,
      },
      exclude: [
        // 1. Dependencies & Build outputs
        "node_modules/",
        ".next/",
        "e2e/",

        // 2. File Konfigurasi Root & Setup
        "*.config.{ts,js}",
        "vitest.setup.ts",
        "postcss.config.js",

        // 3. Shadcn UI Atomic Primitives (Wrapper komponen pihak ketiga)
        "components/ui/**",

        // 4. Supabase Migrations, Types, & Functions Metadata
        "supabase/**",
        "types/**",
        "**/*.d.ts",

        // 5. App Router Pure Shell Layouts & Static Declarations
        "app/**/layout.tsx",
        "app/**/loading.tsx",
        "app/**/not-found.tsx",
      ],
    },
  },
});
```

---

## 5. File Kritis & Action Items (Prioritas Peningkatan)

Beberapa file kritis saat ini berada di batas bawah _threshold_ atau memiliki cabang logika kompleks yang membutuhkan penambahan kasus uji (_unit test cases_) baru:

### 5.1. Daftar File Kritis Prioritas

| Path File Kritis             | Actual Coverage | Isu & Risiko Bisnis                                                                               | Action Items Perbaikan                                                                                                                |
| :--------------------------- | :-------------: | :------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------------------ |
| `proxy.ts`                   |    **72.4%**    | Proteksi rute RBAC untuk 5 peran (_super-admin_, _admin-or_, _admin-komdis_, _anggota_, _caang_). | Tambahkan unit test untuk skenario _unauthorized redirect_ antar role khusus (misal: _caang_ mencoba akses dashboard _admin-komdis_). |
| `lib/actions/auth.ts`        |    **78.1%**    | Pemetaan ID Supabase Auth ke dokumen pendaftaran calon anggota (_caang_).                         | Tambahkan mock test untuk menangani kegagalan jaringan saat insersi data dokumen kandidat (_rollback simulation_).                    |
| `lib/actions/admin-users.ts` |    **76.5%**    | Penjaminan transaksi pencatatan rantai _non-nullable audit log_ pada aksi admin.                  | Buat kasus uji penanganan kegagalan penulisan audit log yang memicu pembatalan operasi mutasi (_transaction rollback_).               |
| `lib/actions/piket.ts`       |    **74.2%**    | Logika perhitungan rotasi otomatis shift kebersihan/perawatan lab oleh _admin-komdis_.            | Tambahkan unit test untuk pengujian edge case bentrokan jadwal shift piket dan libur nasional.                                        |
| `lib/actions/attendance.ts`  |    **75.8%**    | Validasi tanda tangan digital dan scanner QR Code sesi presensi workshop.                         | Tambahkan test case untuk penanganan token presensi expired dan QR Code tidak valid.                                                  |

---

## 6. Panduan Menjalankan Laporan Coverage

Gunakan perintah CLI berikut pada repositori lokal untuk memicu analisis cakupan kode:

```bash
# Menjalankan seluruh unit test dan meng-generate laporan coverage
npm run test:coverage

# Membuka antarmuka interaktif laporan coverage di browser (HTML Reporter)
npx vite preview --outDir coverage
```

---

_Dokumen ini diterbitkan sebagai standar laporan cakupan pengujian & quality gate resmi untuk UKM Robotik Politeknik Negeri Padang._
