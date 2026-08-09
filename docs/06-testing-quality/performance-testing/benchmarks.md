# Laporan Pengujian Kinerja & Benchmark Sistem (Performance Testing & System Benchmarks Report)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                             |
| :------------------------------------ | :-------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-BNC-01`                                                                  |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                   |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                    |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                           |
| **Induk Kebijakan (_Master Policy_)** | _Performance Management & Optimization Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                    |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                              |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                      |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis              | Ringkasan Perubahan                                                            |
| :------: | :--------: | :------------------- | :----------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | Performance Engineer | Draf awal laporan benchmark Core Web Vitals, Server Actions, dan cold start.   |
| `v2.0.0` | 09/08/2026 | System Analyst       | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Target Kinerja

Dokumen ini berisi hasil laporan pengukuran kinerja sistem (_performance testing & benchmarking_) pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**, **Supabase PostgreSQL**, **Upstash Redis**, dan infrastruktur **Vercel Serverless**.

Pengujian performa dilakukan untuk memastikan platform tetap responsif, memiliki _loading time_ rendah, dan mampu menangani lonjakan beban trafik pengguna (_traffic spike_) saat sesi presensi kegiatan atau pembukaan registrasi calon anggota (_caang_).

---

## 2. Ringkasan Target vs Hasil Benchmark Real

| Kategori Metrik                     | Target Ambang Batas | Status Benchmark Real |        Evaluasi Status        |
| :---------------------------------- | :-----------------: | :-------------------: | :---------------------------: |
| **Lighthouse Overall Score**        |   $\ge 90 / 100$    |     **96 / 100**      |    **PASSED** (Green Zone)    |
| **LCP (Largest Contentful Paint)**  |   $< 2.5\text{s}$   |       **1.42s**       |   **PASSED** (Fast Render)    |
| **INP (Interaction to Next Paint)** |  $< 200\text{ms}$   |       **85ms**        | **PASSED** (Ultra Responsive) |
| **CLS (Cumulative Layout Shift)**   |       $< 0.1$       |       **0.02**        | **PASSED** (Visual Stability) |
| **Server Action Cache Hit Latency** |   $< 50\text{ms}$   |       **24ms**        |  **PASSED** (Upstash Redis)   |
| **Next.js Serverless Cold Start**   |  $< 600\text{ms}$   |       **420ms**       | **PASSED** (Vercel Edge/Node) |

---

## 3. Core Web Vitals & Lighthouse Synthetic Benchmarks

Pengukuran dilakukan menggunakan **Lighthouse CI** dan dipantau secara langsung melalui **Vercel Speed Insights** pada tampilan Dashboard dan Halaman Presensi.

### 3.1. Matriks Detail Core Web Vitals (Google Standards)

| Metrik Web Vitals                     | Nilai Benchmark | Ambang Batas Google  | Kategori Status | Impact pada User Experience                                                                   |
| :------------------------------------ | :-------------: | :------------------: | :-------------: | :-------------------------------------------------------------------------------------------- |
| **LCP** (_Largest Contentful Paint_)  | **1.42 detik**  | $< 2.5\text{ detik}$ |    **GOOD**     | Elemen hero visual dan tabel data utama selesai dirender di browser dalam 1.4 detik.          |
| **INP** (_Interaction to Next Paint_) |    **85 ms**    |  $< 200\text{ ms}$   |    **GOOD**     | Responsivitas tinggi saat user mengeklik tombol _Check-in_, modal scanner, atau filter tabel. |
| **CLS** (_Cumulative Layout Shift_)   |    **0.02**     |       $< 0.1$        |    **GOOD**     | Bebas dari pergeseran tata letak visual saat komponen dinamis (UI Skeleton) selesai di-load.  |
| **FCP** (_First Contentful Paint_)    | **0.85 detik**  | $< 1.8\text{ detik}$ |    **GOOD**     | Konten teks/layout pertama langsung muncul kurang dari 1 detik.                               |
| **TTFB** (_Time to First Byte_)       |   **180 ms**    |  $< 800\text{ ms}$   |    **GOOD**     | Respon awal Server Component (RSC) dikirimkan sangat cepat oleh serverless edge.              |

---

## 4. Server Actions Response Time Benchmark (Load 100 Anggota)

Pengujian eksekusi Server Action `getMembersListAction` untuk pengambilan data 100 anggota dilakukan menggunakan 2 skenario arsitektur data:

```
[ Client Request ]
│
├──> (Skenario 2: Cache Hit) ──> [ Upstash Redis REST ] ────────> ~24ms (Fastest)
│
└──> (Skenario 1: Cache Miss) ─> [ Supabase PostgreSQL + RLS ] ─> ~168ms
```

### 4.1. Hasil Uji Perbandingan Latensi Eksekusi

| Skenario Arsitektur Data       | Eksekusi Query                                              | Rata-Rata Latensi | Min Latensi | Max Latensi |
| :----------------------------- | :---------------------------------------------------------- | :---------------: | :---------: | :---------: |
| **Skenario 1: Uncached Query** | Direct Supabase PostgreSQL via `@supabase/ssr` (RLS Active) |    **168 ms**     |   125 ms    |   240 ms    |
| **Skenario 2: Cached Query**   | Upstash Redis (_Cache-Aside Pattern_ via `lib/redis.ts`)    |     **24 ms**     |    18 ms    |    38 ms    |

> **Analisis Optimasi**: Penerapan _Cache-Aside Pattern_ berbasis **Upstash Redis** berhasil memotong latensi eksekusi Server Action hingga **85.7%** dibandingkan dengan pemanggilan kueri SQL langsung ke database.

---

## 5. Cold Start Benchmarks (Serverless & Edge Runtime)

Pengukuran waktu _cold start_ (inisialisasi instance awal saat request pertama dikirim setelah masa _idle_):

| Lingkungan Infrastruktur Cloud   | Engine Runtime                | Average Cold Start Time | Catatan Inisialisasi                                                          |
| :------------------------------- | :---------------------------- | :---------------------: | :---------------------------------------------------------------------------- |
| **Next.js Serverless Functions** | Vercel Node.js / Edge Runtime |       **420 ms**        | Inisialisasi container Next.js App Router & pemuatan bundle.                  |
| **Supabase Edge Functions**      | Deno V8 Engine                |        **82 ms**        | Isolasi ringan Deno V8 untuk eksekusi fungsi publik berlatensi sangat rendah. |

---

## 6. Tooling & Monitoring Stack

1. **Synthetic & Real User Monitoring (RUM)**: **Google Lighthouse CI** dan **Vercel Speed Insights** untuk memantau nilai LCP, INP, dan CLS secara _real-time_.
2. **Load Testing & Capacity Benchmark**: **k6 (Grafana)** untuk mensimulasikan hingga 200 _concurrent virtual users_ saat sesi presensi QR Code dibuka.
3. **Application Performance Monitoring (APM)**: **Sentry** untuk pemantauan _unhandled exceptions_, performa Server Actions, dan _database query spans_.

---

_Dokumen ini diterbitkan sebagai standar laporan pengujian kinerja & benchmark sistem resmi untuk UKM Robotik Politeknik Negeri Padang._
