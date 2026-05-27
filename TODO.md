# Project Backlog & Task Matrix (TODO.md)

Project: SIM UKM Robotik PNP
Target Execution: Antigravity 2.0 Task Graph Engine

---

## Tahap 1: Skema Database & Storage (Infrastruktur)

| ID Tugas  | Deskripsi / Spesifikasi                                                             | Dependensi | Ekspektasi Output                                                                            |
| :-------- | :---------------------------------------------------------------------------------- | :--------- | :------------------------------------------------------------------------------------------- |
| **DB-01** | Setup Tabel Master & Relasi Kelompok (`divisions`, `caang_groups`, `group_members`) | -          | File migrasi SQL, tipe TypeScript diperbarui, RLS aktif sesuai matriks keamanan.             |
| **DB-02** | Setup Tabel Transaksional Absensi & Magang (`attendances`, `internships`)           | DB-01      | File migrasi SQL dengan ENUM `attendance_status`, RLS diaktifkan ketat.                      |
| **DB-03** | Setup Tabel Modul Piket (`piket_schedules`, `piket_members`, `piket_logs`)          | -          | File migrasi SQL dengan ENUM `piket_day`, RLS diaktifkan.                                    |
| **DB-04** | Setup Tabel Modul LMS Tugas (`tasks`, `task_submissions`)                           | -          | File migrasi SQL dengan ENUM `task_status`, RLS diaktifkan.                                  |
| **ST-01** | Konfigurasi Supabase Storage Buckets Baru                                           | -          | Bucket `piket-proofs` (Private) dan `task-submissions` (Private) beserta kebijakan aksesnya. |

---

## Tahap 2: Logika Bisnis & Mutasi Data (Server Actions)

| ID Tugas   | Deskripsi / Spesifikasi                                                      | Dependensi   | Ekspektasi Output                                                                                                                              |
| :--------- | :--------------------------------------------------------------------------- | :----------- | :--------------------------------------------------------------------------------------------------------------------------------------------- |
| **ACT-01** | Implementasi Action Absensi QR (`generateAttendanceQR` & `scanAttendanceQR`) | DB-02        | Enkripsi JWT short-string token (5 menit expiry), validasi geo-lock koordinat (opsional), auto-set status 'hadir'/'telat'.                     |
| **ACT-02** | Implementasi Action Pengajuan Izin/Sakit & Override Admin                    | DB-02, ST-01 | Fungsi upload bukti ke bucket, manual override status kehadiran oleh admin dengan wajib mengisi kolom `notes`.                                 |
| **ACT-03** | Implementasi Action Laporan Piket Berkala (`submitPiketReport`)              | DB-03, ST-01 | Fungsi membaca binary EXIF foto `before`/`after`. Validasi tanggal foto harus cocok dengan hari ini, dan validasi jadwal minggu aktif user.    |
| **ACT-04** | Implementasi Algoritma Pembagian Kelompok Berbasis Nilai                     | DB-01        | Fungsi `generateGroupsAlgorithmic` dengan logika Semi-Queue Tiering (Urut Nilai ➔ Pecah Tier ➔ Shuffle Fisher-Yates ➔ Distribusi Bulk Insert). |
| **ACT-05** | Implementasi Workflow LMS Tugas (`createTask`, `submitTask`, `gradeTask`)    | DB-04, ST-01 | Server actions lengkap untuk pembuatan tugas oleh Admin OR, upload jawaban oleh Caang, dan input nilai (0-100) oleh Admin.                     |

---

## Tahap 3: Pembuatan Antarmuka & Integrasi (UI Layer - Mobile First)

| ID Tugas  | Deskripsi / Spesifikasi                                        | Dependensi     | Ekspektasi Output                                                                                                                     |
| :-------- | :------------------------------------------------------------- | :------------- | :------------------------------------------------------------------------------------------------------------------------------------ |
| **UI-01** | Slicing & Integrasi Modul Absensi (`/absensi`)                 | ACT-01, ACT-02 | Tampilan tab kegiatan hari ini, button generate QR, modal kamera scan QR (khusus Admin), dan form pengajuan izin/sakit.               |
| **UI-02** | Slicing & Integrasi Modul Piket (`/piket`)                     | ACT-03         | Tampilan kalender/jadwal piket harian, area drop-zone upload foto _before_ & _after_, serta riwayat log piket lab.                    |
| **UI-03** | Slicing & Integrasi Manajemen Kelompok (`/manajemen-kelompok`) | ACT-04         | Halaman Admin OR untuk memicu algoritma pembagian kelompok, slider penentuan jumlah kelompok, dan visualisasi kartu anggota kelompok. |
| **UI-04** | Slicing & Integrasi Modul Tugas (`/tugas`)                     | ACT-05         | Sisi Caang: List tugas aktif & form upload berkas. Sisi Admin: Tabel submission Caang yang butuh penilaian beserta form input nilai.  |
| **UI-05** | Refaktor & Agregasi Statistik Dashboard (`/dashboard`)         | Semua UI       | Mengubah placeholder H1 menjadi widget ringkasan data real-time dinamis yang menyesuaikan dengan 5 Role pengguna (RBAC).              |

---

## Tahap 4: Penjaminan Mutu & Standar Rilis (QA & DX)

| ID Tugas  | Deskripsi / Spesifikasi                     | Dependensi | Ekspektasi Output                                                                                                                   |
| :-------- | :------------------------------------------ | :--------- | :---------------------------------------------------------------------------------------------------------------------------------- |
| **QA-01** | Pembuatan Unit Testing untuk Server Actions | Semua ACT  | File `.test.ts` menggunakan **Vitest** untuk menguji kasus ekstrem (seperti manipulasi tanggal foto piket atau kegagalan token QR). |
| **QA-02** | Verifikasi Akhir Standar Kode & Linting     | Semua UI   | Menjalankan `pnpm lint` dan `pnpm tsc` untuk memastikan nol eror tipe data atau sintaks Tailwind v4 sebelum proses build Docker.    |
