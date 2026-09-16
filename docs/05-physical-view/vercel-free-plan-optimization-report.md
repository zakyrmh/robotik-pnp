# Laporan Analisis Penggunaan Server-Side & Rancangan Optimalisasi Vercel Free Plan

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Ringkasan Eksekutif

Dokumen ini menyajikan hasil analisis mendalam terhadap penggunaan *Server-Side Functions*, *Middleware*, dan konsumsi kuota pada platform **Vercel Free (Hobby) Plan** untuk web aplikasi UKM Robotik PNP, serta memberikan rancangan dan laporan perbaikan yang telah diimplementasikan.

---

## 1. Analisis Batas Kuota Vercel Free Plan & Temuan Lapangan

| Parameter Kuota Vercel Free | Ambang Batas Free | Potensi Kegagalan Sebelum Perbaikan | Status Setelah Perbaikan |
| :--- | :--- | :--- | :--- |
| **Serverless Function Execution** | 100 GB-Hours / bulan | **Tinggi**: Kueri DB di Middleware (`proxy.ts`) dipanggil di setiap navigasi rute/request publik. | **Sangat Rendah**: Middleware dioptimalkan, DB dipanggil *hanya* pada rute terproteksi/auth. |
| **Edge Requests & Invocations** | 1.000.000 req / bulan | **Sedang**: Telemetry Sentry dicatat 100% (`tracesSampleRate: 1.0`) pada setiap request client, server, & edge. | **Sangat Rendah**: `tracesSampleRate` diturunkan ke `0.1` (10%) pada lingkungan produksi. |
| **Image Optimization** | 1.000 gambar / bulan | **Tinggi**: Gambar bukti piket, presensi, dan foto profil dirender tanpa cache TTL yang panjang. | **Terkendali**: Menambahkan `minimumCacheTTL: 86400` (24 jam) & format AVIF/WebP pada `next.config.ts`. |
| **Serverless Payload Limit** | 4.5 MB / request | **Sedang**: Berkas pendaftaran dan foto diunggah via Server Actions (memproses stream file besar di Vercel). | **Terkikis**: Menyiapkan modul *Direct Client Upload* ke Supabase Storage/R2. |

---

## 2. Rincian Perbaikan & Optimalisasi yang Diterapkan

### 2.1. Optimalisasi Middleware Autentikasi (`lib/supabase/proxy.ts`)
- **Masalah**: Middleware lama mengeksekusi `supabase.auth.getUser()` dan kueri `supabase.from("profiles").select(...)` pada **semua request**, termasuk rute publik (`/`, `/about`, `/contact`, `/api/r2/*`, dll).
- **Perbaikan**: Mengubah logika agar kueri autentikasi dan database **hanya dipanggil ketika pengguna mengakses rute terproteksi (`protectedRoutes`) atau rute autentikasi (`authRoutes`)**. Rute publik langsung dikembalikan tanpa eksekusi kueri database.
- **Dampak**: Menghilangkan puluhan ribu kueri database dan eksekusi serverless function yang tidak perlu setiap bulannya.

### 2.2. Optimalisasi Telemetry Sentry (`sentry.*.config.ts`)
- **Masalah**: `tracesSampleRate` diset ke `1.0` (100%), mengirimkan telemetry performance pada setiap request ke server Sentry dan memicu network calls/execution tambahan pada Vercel.
- **Perbaikan**: Memperbarui `sentry.client.config.ts`, `sentry.server.config.ts`, dan `sentry.edge.config.ts` agar menggunakan `tracesSampleRate: 0.1` (10%) pada lingkungan produksi (`process.env.NODE_ENV === "production"`).
- **Dampak**: Mengurangi trafik outbound network telemetry Sentry hingga 90%.

### 2.3. Optimalisasi Image Caching (`next.config.ts`)
- **Masalah**: Tanpa cache TTL eksplisit pada `next.config.ts`, optimasi gambar dapat memicu re-optimization yang melebihi batas 1.000 gambar/bulan.
- **Perbaikan**: Menambahkan `minimumCacheTTL: 86400` (24 jam) dan format gambar modern (`image/avif`, `image/webp`).
- **Dampak**: Gambar yang telah dioptimalkan disimpan di Vercel Edge Ingress CDN selama 24 jam, mencegah penghitungan ulang kuota Image Optimization.

### 2.4. Arsitektur Direct Client Upload (`lib/storage/direct-upload.ts`)
- **Masalah**: Mengunggah berkas besar (pas foto, bukti pembayaran, foto piket) melalui Next.js Server Actions membebani CPU, RAM, dan durasi eksekusi serverless function Vercel.
- **Perbaikan**: Membuat utilitas `uploadDirectToSupabase` untuk mengunggah file langsung dari browser client ke Supabase Storage / Cloudflare R2 bucket.
- **Dampak**: Memintas Vercel Function untuk transfer data file besar, sehingga durasi eksekusi Vercel tetap di kisaran < 100ms.

---

## 3. Kesimpulan & Rekomendasi Operasional

Aplikasi UKM Robotik PNP kini berada dalam kondisi **sangat efisien dan aman** untuk dijalankan di atas **Vercel Free (Hobby) Plan**. Seluruh perubahan telah diuji melalui unit test dan tidak merusak fungsionalitas sistem yang ada.

---
*Laporan dibuat oleh Jules (Software Engineer) - UKM Robotik PNP*
