# Test Plan & Kriteria Definition of Done (DoD)

Project: SIM UKM Robotik PNP
Target Engine: Antigravity 2.0 QA & Automated Test Runner

---

## 1. Global Definition of Done (DoD) Checklist

Setiap sub-agen AI wajib memastikan seluruh poin di bawah ini berstatus **PASS** sebelum mengajukan _Pull Request_ atau menganggap sebuah fitur selesai:

- [ ] **Type-Safe & No Lint Errors:** Kode wajib lolos pengecekan `pnpm tsc` (TypeScript compiler) dan `pnpm lint` (ESLint) tanpa ada peringatan eror atau penggunaan tipe `any`.
- [ ] **Mobile-First Responsiveness:** Komponen UI wajib diuji pada resolusi layar ponsel (maksimal width 430px untuk simulasi mobile device) menggunakan utilitas kelas Tailwind v4.0.
- [ ] **Row Level Security (RLS) Verification:** Setiap query data baru wajib lolos validasi kebijakan RLS. Pastikan user dengan role `caang` tidak bisa memanipulasi data milik user lain.
- [ ] **Error Handling Standard:** Seluruh Server Actions wajib menggunakan blok `try-catch` dan mengembalikan respons berstruktur `ServerActionResponse` (tidak boleh melempar eror mentah ke klien).
- [ ] **Conventional Commit Compliance:** Judul commit wajib divalidasi oleh Husky & Commitlint sesuai format standar (contoh: `feat(absensi): ...` atau `fix(piket): ...`).
- [ ] **Unit Test Coverage:** Logika bisnis kritikal (seperti manipulasi token, pengacakan kelompok, dan pembedahan EXIF) wajib memiliki file unit test `.test.ts` dengan _coverage_ minimal 80%.

---

## 2. Rencana Pengujian Fitur (Test Plan Matrix)

Daftar skenario di bawah ini wajib ditranslasikan menjadi pengujian fungsional oleh QA Agent atau ditulis ke dalam berkas pengujian **Vitest**.

### 2.1 Modul Absensi Digital (`/absensi`)

| ID Test       | Target Fitur          | Skenario Pengujian (User Story)                                                                          | Hasil yang Diharapkan                                                                              |
| :------------ | :-------------------- | :------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------- |
| **TS-ABS-01** | Umur Token QR         | Anggota men-scan QR code kegiatan yang sudah di-generate lebih dari 5 menit yang lalu.                   | Sistem menolak absensi dan mengembalikan status eror "QR Code Expired".                            |
| **TS-ABS-02** | Geo-lock Koordinat    | Anggota melakukan absensi mandiri, namun menolak memberikan akses lokasi pada gawai mereka.              | Sistem tetap memproses absensi (karena opsional) dengan mengosongkan kolom koordinat di database.  |
| **TS-ABS-03** | Pembatasan Hak Akses  | User dengan role `caang` mencoba melihat daftar riwayat absensi internal milik `anggota` tetap.          | Database menolak request via RLS dan sistem menampilkan halaman eror/akses ditolak.                |
| **TS-ABS-04** | Manual Override Admin | Admin Komdis mengubah status absen Caang dari "Alfa" menjadi "Hadir" tanpa mengisi kolom alasan/catatan. | Form UI memblokir submisi dan Server Action mengembalikan pesan "Catatan penyesuaian wajib diisi". |

### 2.2 Modul Piket Harian (`/piket`)

| ID Test       | Target Fitur             | Skenario Pengujian (User Story)                                                                         | Hasil yang Diharapkan                                                                                                      |
| :------------ | :----------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------------------------------------------------- |
| **TS-PKT-01** | Validasi Hari Unggah     | Anggota mengunggah bukti foto piket lab pada hari Selasa, padahal jadwal piketnya berada di hari Kamis. | Sistem otomatis menolak laporan dan membatalkan proses upload ke Supabase Storage.                                         |
| **TS-PKT-02** | Validasi Siklus Mingguan | Anggota mencoba mengirim laporan piket dua kali di minggu yang sama untuk mengelabui sistem.            | Sistem mendeteksi entri ganda pada minggu aktif berjalan dan menolak pengiriman laporan baru.                              |
| **TS-PKT-03** | Ekstraksi EXIF Metadata  | Anggota mengunggah foto lab lama yang diambil seminggu lalu (manipulasi bukti kehadiran real-time).     | Sistem mendeteksi ketidakcocokan antara `DateTimeOriginal` pada EXIF foto dengan `CURRENT_DATE`, lalu membatalkan laporan. |

### 2.3 Modul Tugas & Algoritma Kelompok (`/tugas` & `/manajemen-kelompok`)

| ID Test       | Target Fitur          | Skenario Pengujian (User Story)                                                           | Hasil yang Diharapkan                                                                                                                               |
| :------------ | :-------------------- | :---------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------- |
| **TS-LMS-01** | Ekstensi Berkas Tugas | Caang mencoba mengunggah file tugas pembinaan dengan format `.exe` atau `.zip`.           | Sistem memvalidasi ekstensi file pada komponen drop-zone dan hanya mengizinkan berkas teks, gambar, docx, dan pdf.                                  |
| **TS-ALG-01** | Semi-Queue Tiering    | Admin OR mengeksekusi pembagian 4 kelompok untuk 32 Caang yang memiliki nilai bervariasi. | Sistem sukses mengurutkan nilai, memecah menjadi 4 tier peringkat, mengacak tiap tier dengan Fisher-Yates, dan membagi rata (8 Caang per kelompok). |

---

## 3. Prosedur Otomatisasi Pengujian oleh Agen AI

Ketika menugaskan _QA/Bug-Hunter Agent_ di Antigravity 2.0, instruksikan agen untuk membaca file ini dengan alur kerja berikut:

1. **Fase Inspeksi Statis:** Jalankan `pnpm lint` dan `pnpm tsc` di terminal virtual untuk memastikan kepatuhan baris kode.
2. **Fase Validasi Logika:** Buat file simulasi data (_mock data_) menggunakan Vitest untuk menguji fungsi `scanAttendanceQR` (lakukan manipulasi waktu _past & future_ untuk memastikan token kedaluwarsa dengan tepat).
3. **Fase Verifikasi RLS:** Simulasikan query menggunakan token anonim (`anon_key`) Supabase untuk memastikan data tabel sensitif seperti `registrations` dan `piket_logs` tidak bocor ke publik.
