# Panduan Konfigurasi & Strategi Caching Upstash Redis (Upstash Redis Configuration & Caching Strategy Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                     |
| :------------------------------------ | :---------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-PHY-UPS-01`                                                                          |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                           |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                            |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                   |
| **Induk Kebijakan (_Master Policy_)** | _Infrastructure Configuration & Cloud Services Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                            |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                              |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis                 | Ringkasan Perubahan                                                             |
| :------: | :--------: | :---------------------- | :------------------------------------------------------------------------------ |
| `v1.0.0` | 02/08/2026 | Infrastructure Engineer | Draf awal spesifikasi instance, use cases, dan inisialisasi kode Upstash Redis. |
| `v2.0.0` | 09/08/2026 | System Analyst          | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal.  |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi spesifikasi teknis dan panduan konfigurasi **Upstash Redis** sebagai serverless in-memory data store untuk _caching_, _rate limiting_, dan _session management_ pada **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 2. Spesifikasi Instance & Region Hosting

Upstash Redis dipilih karena mendukung REST API HTTP/HTTPS murni yang sangat cepat dan kompatibel dengan lingkungan _serverless_ Next.js (Vercel Edge & Serverless Functions) tanpa terkendala _connection limit_.

- **Provider**: Upstash Serverless Redis
- **Primary Region**: `ap-southeast-1` (Singapore)
  - _Alasan_: Menyamakan region fisik dengan Vercel Serverless Functions (`sin1`) dan Supabase PostgreSQL untuk menghasilkan latensi _round-trip_ terendah ($\approx 5\text{ms} - 15\text{ms}$).
- **Eviction Policy**: **`volatile-lru`** (Least Recently Used with TTL)
  - _Alasan_: Menghapus kunci (_keys_) yang paling jarang digunakan yang memiliki batas waktu kadaluarsa (TTL) terlebih dahulu jika memori penuh. Ini mencegah terhapusnya konfigurasi penting yang bersifat permanen.
- **Max Memory Strategy**: Automated Scale & Eviction upon reaching quota limit.
- **Primary Client SDK**: `@upstash/redis` & `@upstash/ratelimit`.

---

## 3. Penggunaan Upstash Redis di Aplikasi (_Use Cases_)

Upstash Redis difungsikan untuk 3 skenario utama dalam sistem:

```
[ Client Request ]
│
├──> [ 1. Rate Limiter ] ──────> (Blokir jika > 10 req/menit)
│
├──> [ 2. Cache-Aside Engine ] ─> (Kembalikan data ter-cache ~24ms)
│
└──> [ 3. Session Store ] ─────> (Simpan token QR presensi aktif)
```

### 3.1. Rate Limiting (Mencegah Spam & Brute Force)

- **Implementasi**: `@upstash/ratelimit`
- **Lokasi Endpoint**:
  - **Auth Actions** (`/login`, `/register`): Maksimal 5 percobaan per 1 menit per IP.
  - **Presensi QR Code** (`/kegiatan-absensi-caang/scan`): Maksimal 10 request pemindaian per 1 menit per Admin IP.
  - **Public APIs**: Maksimal 60 request per 1 menit.

### 3.2. Cache-Aside Strategy (Optimasi Query Read-Heavy)

- **Implementasi**: Caching hasil kueri Supabase PostgreSQL yang sering dibaca tetapi jarang berubah.
- **Objek Ter-cache**:
  - **Struktur Kepengurusan & Divisi** (`ukmrobotik:cache:org:structure`) $\rightarrow$ TTL: 24 Jam.
  - **Pengaturan Oprec (Oprec Settings)** (`ukmrobotik:cache:or:settings`) $\rightarrow$ TTL: 1 Jam.
  - **Daftar Anggota Aktif** (`ukmrobotik:cache:members:active`) $\rightarrow$ TTL: 30 Menit (Di-invalidasi saat ada mutasi anggota).

### 3.3. Temporary QR Attendance Token Storage

- **Implementasi**: Menyimpan token rahasia QR Code sesi presensi kegiatan yang berganti secara dinamis.
- **Pattern Key**: `ukmrobotik:qr:session:{activity_id}`
- **TTL**: 30 detik (Otomatis terhapus demi keamanan token presensi).

---

## 4. Inisialisasi & Konfigurasi Kode (`lib/redis.ts`)

File instansiasi pustaka Upstash Redis yang digunakan di seluruh Server Actions:

```typescript
// lib/redis.ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Inisialisasi Redis HTTP Client
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Rate Limiter untuk Endpoint Sensitive
export const loginRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "1 m"),
  analytics: true,
  prefix: "ukmrobotik:ratelimit:login",
});

export const attendanceRateLimiter = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"),
  analytics: true,
  prefix: "ukmrobotik:ratelimit:attendance",
});
```

---

## 5. Injeksi Variabel Lingkungan (`.env.local`)

Variabel rahasia yang wajib terpasang di Vercel Environment Variables:

```bash
# Upstash Redis REST Credentials
UPSTASH_REDIS_REST_URL="https://[YOUR-INSTANCE].upstash.io"
UPSTASH_REDIS_REST_TOKEN="AX...[YOUR-REST-TOKEN]"
```

---

## 6. Checklist Verifikasi Upstash Redis Setup

- [ ] Instance Upstash Redis aktif di region `ap-southeast-1` (Singapore).
- [ ] Eviction Policy di-set ke `volatile-lru`.
- [ ] Environment variables `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` terpasang di Vercel.
- [ ] Pustaka `@upstash/redis` dan `@upstash/ratelimit` terinstal di `package.json`.
- [ ] Rate Limiter berfungsi dengan benar saat pengujian pengiriman form berulang.

---

_Dokumen ini diterbitkan sebagai standar panduan konfigurasi Upstash Redis & strategi caching resmi untuk UKM Robotik Politeknik Negeri Padang._
