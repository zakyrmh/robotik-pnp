# Prosedur Pembaruan Versi Teknologi & Pengujian Regresi (Technology Stack Update & Regression Testing Procedures)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                   |
| :------------------------------------ | :-------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-UPD-01`                                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                 |
| **Induk Kebijakan (_Master Policy_)** | _System Maintenance & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis        | Ringkasan Perubahan                                                                 |
| :------: | :--------: | :------------- | :---------------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Lead Developer | Draf awal prosedur upgrade Next.js, Supabase SDK, dan regression testing checklist. |
| `v2.0.0` | 09/08/2026 | System Analyst | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.      |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi panduan teknis dan prosedur operasi standar (_SOP_) untuk melakukan pembaruan versi pustaka/framework (_version upgrade_) secara aman, mencakup migrasi **Next.js 16 ke Next.js 17**, pembaruan **Supabase JS Client SDK**, serta eksekusi pengujian regresi (_regression testing_) pada proyek **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 2. Prinsip & Aturan Umum Pembaruan Versi

1. **Prinsip SemVer (Semantic Versioning)**:
   - **Patch/Minor Updates** (`x.Y.z`): Dapat langsung diuji dan digabungkan setelah lolos CI/CD Pipeline.
   - **Major Updates** (`X.0.0`): Wajib melalui cabang fitur khusus (`feature/upgrade-nextjs-17`), pengujian regresi penuh di lingkungan lokal/staging, dan persetujuan Technical Lead.
2. **Jangan Gunakan `npm update` Massal**: Selalu perbarui paket secara selektif atau per modul domain agar dampak perubahan terpantau dengan presisi.
3. **Penyelarasan Tipe data Supabase**: Setiap kali ada perubahan skema database atau SDK, tipe TypeScript database (`types/database.types.ts`) wajib di-regenerate ulang.

---

## 3. Prosedur Upgrade Framework Major (Next.js 16 ke Next.js 17)

### Langkah 1: Persiapan & Penelaahan Breaking Changes

- Buka panduan migrasi resmi dari Vercel/Next.js (`nextjs.org/docs/app/building-your-application/upgrading`).
- Jalankan pemeriksaan kompatibilitas React 19 dan perkakas terkait (`vitest`, `playwright`, `@sentry/nextjs`).

### Langkah 2: Pembaruan Packages & Engine Codemod

```bash
# 1. Buat cabang migrasi baru
git checkout -b feature/upgrade-nextjs-17

# 2. Jalankan Codemod Otomatis Next.js (jika tersedia)
npx @next/codemod@latest upgrade

# 3. Atau perbarui package secara manual
npm install next@17 react@19 react-dom@19
npm install -D eslint-config-next@17
```

### Langkah 3: Verifikasi breaking changes khas Next.js App Router

- Periksa bahwa seluruh parameter `params` dan `searchParams` pada Server Components & Route Handlers tetap di-`await`.
- Periksa bahwa registrasi Sentry/Instrumentation di `instrumentation.ts` kompatibel dengan Next.js 17 runtime.

---

## 4. Prosedur Update Library Supabase JS & `@supabase/ssr`

Pembaruan pustaka client `@supabase/supabase-js` dan `@supabase/ssr` dilakukan untuk mendapatkan perbaikan keamanan dan fitur PostgREST terbaru.

### Langkah 1: Update Packages

```bash
npm install @supabase/supabase-js@latest @supabase/ssr@latest
```

### Langkah 2: Regenerate Database TypeScript Definitions

```bash
# Regenerate ulang tipe data dari Supabase Cloud / Local CLI
npm run gen:types
```

### Langkah 3: Verifikasi Kompatibilitas Auth Cookie Handlers

- Pastikan inisialisasi `createServerClient` dan `createBrowserClient` di `lib/supabase/` tidak mengalami depresiasi method pada opsi pengelolaan cookie (`getAll`, `setAll`).
- Pastikan pengecekan autentikasi di server tetap memanggil `supabase.auth.getUser()`.

---

## 5. Alur Pengujian Regresi (_Regression Testing Checklist_)

Setelah proses instalasi/upgrade selesai dilakukan, jalankan urutan tes berikut untuk memastikan **tidak ada fitur yang rusak (_zero regression_)**:

```
[ Update Packages ] ──> [ 1. Typecheck ] ──> [ 2. Linter & Format ] ──> [ 3. Unit Tests ] ──> [ 4. Integration & E2E ]
```

### Langkah 1: Pemeriksaan Static Type Safety (`typecheck`)

```bash
npm run typecheck
```

> _Tujuan_: Memastikan tidak ada _breaking changes_ pada tipe data props, fungsi, atau definisi Supabase.

### Langkah 2: Pemeriksaan Formatting & Static Code Analysis

```bash
npm run lint
```

### Langkah 3: Eksekusi Unit Test Suite (Vitest)

```bash
npm run test:run
```

> _Tujuan_: Memastikan seluruh logika fungsi utilitas, validasi NIM/Email, perhitungan poin presensi, dan mock Server Actions tetap berfungsi $100\%$.

### Langkah 4: Eksekusi Integration & E2E Test Suite (Playwright)

```bash
# Menjalankan E2E test pada browser headless
npm run test:e2e
```

> _Tujuan_: Memastikan alur interaksi kritis (Login Happy Path, Scan QR Presensi, Registrasi Caang, dan Proteksi Akses RBAC) berjalan normal tanpa _error runtime_.

---

## 6. Prosedur Rollback (Jika Terjadi Kegagalan Regresi)

Jika pengujian regresi menemukan _unresolved breaking changes_ atau _build failure_:

```bash
# 1. Batalkan perubahan pada cabang lokal
git reset --hard HEAD

# 2. Hapus node_modules & lockfile jika ada desinkronisasi dependensi
rm -rf node_modules package-lock.json

# 3. Re-install dependensi stabil sebelumnya
npm install

# 4. Kembali ke cabang utama
git checkout main
```

---

_Dokumen ini diterbitkan sebagai standar prosedur pembaruan versi teknologi & pengujian regresi resmi untuk UKM Robotik Politeknik Negeri Padang._
