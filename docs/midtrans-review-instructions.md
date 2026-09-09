# Midtrans Reviewer Sandbox Testing Instructions

Panduan untuk mengonfigurasi `.env.local` dan melakukan pengujian pembayaran Midtrans Snap API pada rute khusus peninjauan Midtrans Business Review.

---

## 1. Konfigurasi Environment Variables (`.env.local`)

Pastikan variabel lingkungan berikut telah ditambahkan ke dalam file `.env.local` di root proyek:

```env
# Midtrans Credentials (Sandbox)
MIDTRANS_SERVER_KEY="SB-Mid-server-xxxxxxxxxxxxxxxxxxxx"
MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-xxxxxxxxxxxxxxxxxxxx"
MIDTRANS_IS_PRODUCTION="false"
```

> **Catatan:**
> - Kunci dapat diperoleh dari Midtrans MAP Dashboard (Environment: **Sandbox** > **Settings** > **Access Keys**).
> - Pastikan `MIDTRANS_IS_PRODUCTION` diatur ke `"false"` agar menggunakan gateway Sandbox.

---

## 2. Pengaplikasian Database Migration SQL

Jalankan skrip migration SQL berikut pada Supabase SQL Editor atau CLI:

```bash
npx supabase db push
```
Atau eksekusi langsung isi file `supabase/migrations/20260911000000_create_review_midtrans_tables.sql` di SQL Editor Supabase Dashboard.

Tabel yang akan dibuat secara terisolasi:
1. `public.review_registrations`
2. `public.review_transactions`

---

## 3. Alur Pengujian di Sandbox Midtrans

1. **Akses Halaman Tersembunyi:**
   Buka browser dan navigasi ke URL tersembunyi:
   `http://localhost:3000/review-midtrans` (atau URL domain terpasang).

2. **Pilih Kategori Simulasi:**
   Pilih salah satu dari 6 kategori simulasi lomba (misal: *Line Follower Senior - Batch Review*, *Sumo Bot Senior - Batch Review*, dsb.) dengan harga tertera **Rp 100.000**.

3. **Lengkapi Form Pendaftaran:**
   Form sudah terisi nilai dummy default. Ubah jika diperlukan:
   - Nama Tim
   - Nama Ketua
   - Email
   - Nomor WhatsApp

4. **Klik Tombol Pembayaran:**
   Klik **"Uji Coba Pembayaran (Sandbox)"**. Pop-up Midtrans Snap Modal akan muncul di layar.

5. **Selesaikan Transaksi Simulasi:**
   - Gunakan metode pembayaran seperti **Virtual Account (BCA/Mandiri/BNI)**, **QRIS**, atau **Card Simulation**.
   - Untuk mensimulasikan pembayaran sukses (Settlement) via Payment Simulator Midtrans:
     - Buka Midtrans Payment Simulator: [https://simulator.sandbox.midtrans.com/](https://simulator.sandbox.midtrans.com/)
     - Masukkan Nomor VA / Order ID dan klik **Pay**.

6. **Pengujian Webhook Notification (HTTP POST Callback):**
   - Endpoint webhook notification: `/api/review-midtrans/notification`
   - Salin URL Webhook publik Anda (misal via Ngrok/Vercel) ke Midtrans MAP Dashboard > Settings > Payment Notification URL:
     `https://<domain-anda>/api/review-midtrans/notification`
   - Webhook akan secara otomatis memverifikasi SHA-512 Signature Key dan mengupdate status di tabel `review_transactions` dan `review_registrations`.
