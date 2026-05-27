# Server Actions & API Contract: Core Modules

Target Architecture: Next.js Server Actions (RPC Pattern) & Supabase Client-side Upload

---

## 1. Modul Absensi Digital (`/absensi`)

### 1.1 Action: `generateAttendanceQR(activityId: string, coordinates?: { lat: number, lng: number })`

- **Aktor:** `caang` dan `anggota` (Hanya pada waktu yang diizinkan oleh agenda).
- **Aturan Bisnis:** - Validasi apakah waktu sekarang berada di dalam jendela absensi kegiatan (`activities.start_date`).
  - Enkripsi data menjadi token JWT/string aman pendek yang berisi: `profile_id`, `activity_id`, dan `generated_at` (timestamp).
  - Simpan koordinat jika _user_ mengizinkan akses lokasi.
- **Payload Input:**
  ```typescript
  {
    activityId: string;
    coordinates?: { latitude: number; longitude: number; } // Optional
  }
  ```

````

* **Ekspektasi Output (Success 200):**
```typescript
{
  success: true,
  qrString: string,       // String terenkripsi yang akan di-render jadi QR Code
  expiresAt: string       // Timestamp (Waktu sekarang + 5 Menit)
}

````

### 1.2 Action: `scanAttendanceQR(qrString: string)`

- **Aktor:** `admin-komdis` atau `admin-or` (Menggunakan fitur kamera scan web).
- **Aturan Bisnis:**
- Dekripsi `qrString`. Validasi jika waktu sekarang melewati `generated_at + 5 menit`, maka return error "QR Code Expired".
- Cek waktu absensi. Jika melewati batas toleransi kegiatan, set status ke `'telat'`. Jika tepat waktu, set ke `'hadir'`.
- Lakukan `UPSERT` ke tabel `attendances`. Jika `caang`, hitung nilai kehadiran (default: hadir = 100, telat = 50).

- **Payload Input:** `{ qrString: string }`
- **Ekspektasi Output:**

```typescript
{ success: true, message: "Absensi berhasil dicatat", data: { name: string, status: 'hadir' | 'telat' } }

```

### 1.3 Action: `submitLeaveRequest(formData: FormData)`

- **Aktor:** `caang` dan `anggota` (Mengajukan sakit/izin).
- **Aturan Bisnis:** Mengunggah file bukti ke Supabase Storage, lalu mencatat data absensi dengan status `'sakit'` atau `'izin'` dengan status `verified_by = null` (menunggu intervensi admin).
- **Payload Input (FormData):** `activity_id` (string), `status` ('sakit'|'izin'), `notes` (string), `file` (File/Blob bukti foto/dokumen).

### 1.4 Action: `manualOverrideAttendance(attendanceId: string, status: string, adminNotes: string)`

- **Aktor:** `admin-komdis` atau `admin-or`.
- **Aturan Bisnis:** Mengubah status kehadiran secara sepihak. Kolom `notes` wajib diisi dengan alasan perubahan oleh admin.

---

## 2. Modul Piket Harian (`/piket`)

### 2.1 Action: `submitPiketReport(formData: FormData)`

- **Aktor:** `anggota` (Hanya yang terjadwal di minggu aktif berjalan).
- **Aturan Bisnis (Sistem Verifikasi Otomatis):**
- **Validasi Jadwal:** Cek apakah hari ini berada di dalam rentang minggu jadwal anggota (Misal: Zaky di Minggu ke-3, maka fungsi mengecek apakah minggu _current date_ == minggu ke-3 bulan ini). Jika tidak, _reject_.
- **Validasi Metadata Foto:** Agen wajib mengekstrak metadata EXIF dari file foto `before` dan `after`. Tanggal pengambilan foto pada metadata WAJIB sama dengan tanggal hari ini (`current_date`). Jika metadata dimanipulasi atau tidak cocok, kembalikan eror.
- Jika lolos semua validasi, simpan ke tabel `piket_logs` dengan status `is_verified = true`.

- **Payload Input (FormData):** - `schedule_id` (string)
- `notes` (string)
- `photo_before` (File)
- `photo_after` (File)

---

## 3. Modul Tugas, Magang, & Kelompok

### 3.1 Sub-Modul Tugas (LMS Flow)

- `createTask(data)` [Aktor: Admin OR]: Membuat tugas baru untuk Caang.
- `submitTaskSubmission(formData)` [Aktor: Caang]: Mengunggah berkas tugas (teks, gambar, docx, pdf) ke Supabase Storage private bucket `task-submissions/` dan mencatatnya ke database.
- `gradeTaskSubmission(submissionId, grade, feedback)` [Aktor: Admin OR]: Memverifikasi tugas dan memberikan nilai angka (0-100) serta umpan balik teks.

### 3.2 Sub-Modul Magang

- `toggleInternshipRegistration(isOpen: boolean)` [Aktor: Admin OR]: Membuka/menutup form pendaftaran divisi magang bagi Caang.
- `applyInternship(divisionId: string)` [Aktor: Caang]: Memilih divisi tujuan magang.
- `verifyInternshipPlotting(data)` [Aktor: Admin OR]: Menetapkan penempatan magang resmi Caang ke tabel `internships`.

### 3.3 Sub-Modul Algoritma Pembagian Kelompok (`/manajemen-kelompok`)

#### Action: `generateGroupsAlgorithmic(totalGroups: number, strategy: 'random' | 'score')`

- **Aktor:** `admin-or` atau `super-admin`.
- **Logika Algoritma Berbasis Nilai (Semi-Queue Tiering):**
  Jika strategi yang dipilih adalah `'score'`, Agen AI wajib mengimplementasikan logika berikut di sisi server:

1. Ambil seluruh data `caang` yang aktif, urutkan berdasarkan akumulasi nilai pendaftaran + nilai tugas + nilai absensi secara _descending_ (dari yang tertinggi ke terendah).
2. Hitung ukuran kapasitas per tingkatan: `tierSize = totalGroups`.
3. Kelompokkan antrean Caang ke dalam pecahan kelompok kecil berukuran `tierSize` (Peringkat 1-8 adalah Tier 1, Peringkat 9-16 adalah Tier 2, dst).
4. Lakukan _looping_ untuk setiap Tier:

- Acak urutan (_shuffle_) Caang di dalam tier tersebut menggunakan algoritma _Fisher-Yates_.
- Distribusikan hasil acakan secara merata ke Kelompok 1, Kelompok 2, hingga Kelompok N secara berurutan.

5. Simpan hasilnya secara massal (_bulk insert_) ke dalam tabel `group_members`.

---

## 4. Format Respons Standard (Standard Response Handler)

Semua Server Actions wajib mengembalikan skema objek JSON yang seragam agar komponen Frontend `shadcn/ui` (seperti komponen Toast) dapat membaca respon dengan mudah:

```typescript
export type ServerActionResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: {
    code: string;
    details: string;
  };
};
```
