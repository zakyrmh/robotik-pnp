# Onboarding Fix Summary

## Masalah yang Diperbaiki

1. **File image profile tidak masuk ke bucket profiles**
   - Sebelumnya: Upload pas foto menggunakan path yang salah
   - Sekarang: Upload pas foto ke bucket `profiles` dengan path `{userId}/profile_{timestamp}_{filename}`

2. **Data registrasi tidak tersimpan dengan benar**
   - Sebelumnya: Hanya update tanpa validasi error
   - Sekarang: Update dengan error handling yang lebih baik dan throw error jika gagal

3. **Tahun masuk tidak diambil dari NIM**
   - Dibuat action baru `lib/actions/registration.ts` dengan fungsi `extractEntryYearFromNim()`
   - Fungsi ini mengambil 2 digit pertama dari NIM dan mengkonversi ke tahun (20xx)
   - Contoh: NIM `2411082024` → tahun masuk `2024`
   - Contoh: NIM `2610081011` → tahun masuk `2026`

## File yang Dibuat/Dimodifikasi

### 1. `lib/actions/registration.ts` (BARU)
Action baru untuk menangani penyimpanan data registrasi:

**Functions:**
- `extractEntryYearFromNim(nim: string)`: Extract tahun masuk dari 2 digit pertama NIM
- `savePersonalData(data: PersonalData)`: Simpan data personal ke tabel registrations
- `saveAcademicData(data: AcademicData)`: Simpan data akademik ke tabel registrations
- `updateProfilePhotoUrl(photoUrl: string)`: Update URL foto profil di tabel registrations

**Types:**
- `PersonalData`: Interface untuk data personal (nama, gender, tempat/tanggal lahir, alamat, dll)
- `AcademicData`: Interface untuk data akademik (sekolah, prodi, kelas, pengalaman organisasi, prestasi)

### 2. `app/(private)/onboarding/page.tsx` (DIMODIFIKASI)
Perbaikan pada fungsi `handleFinalSubmit`:

**Perubahan:**
- Upload pas foto ke bucket `profiles` dengan path yang benar: `{userId}/profile_{timestamp}_{filename}`
- Menambahkan timestamp pada semua file upload untuk menghindari konflik nama file
- Mengubah `stepsCount` dari 6 menjadi 7 untuk progress bar yang lebih akurat
- Menambahkan error handling yang lebih baik dengan throw error jika database update gagal
- Menggunakan `toast.error()` untuk menampilkan error message (menggantikan `alert()`)

**Path Upload:**
- Pas Foto: `profiles/{userId}/profile_{timestamp}_{filename}`
- KTM: `registrations/{year}/{userId}/ktm_{timestamp}_{filename}`
- IG Robotik: `registrations/{year}/{userId}/ig_robotik_{timestamp}_{filename}`
- IG MRC: `registrations/{year}/{userId}/ig_mrc_{timestamp}_{filename}`
- YT Robotik: `registrations/{year}/{userId}/yt_robotik_{timestamp}_{filename}`
- Payment: `registrations/{year}/{userId}/payment_{timestamp}_{filename}`

## Cara Penggunaan Action Baru

### Untuk menyimpan data personal (Step 2):
```typescript
import { savePersonalData } from "@/lib/actions/registration";

const result = await savePersonalData({
  fullName: "John Doe",
  nickname: "Doe",
  gender: "L",
  pob: "Padang",
  dob: "2000-01-01",
  phoneNumber: "081234567890",
  originAddress: "Jl. Contoh No. 1",
  domicileAddress: "Jl. Kos No. 2",
});

if (result.success) {
  // Data berhasil disimpan
  // Tahun masuk otomatis di-extract dari NIM
}
```

### Untuk menyimpan data akademik (Step 3):
```typescript
import { saveAcademicData } from "@/lib/actions/registration";

const result = await saveAcademicData({
  highSchool: "SMKN 1 Padang",
  studyProgramId: "uuid-prodi",
  currentClass: "2A",
  orgExperience: "OSIS, PMR",
  achievements: "Juara 1 Lomba Robotik",
});

if (result.success) {
  // Data akademik berhasil disimpan
}
```

## Catatan Penting

1. **Tahun Masuk Otomatis**: Tahun masuk akan otomatis di-extract dari NIM saat `savePersonalData()` dipanggil. Tidak perlu input manual dari user.

2. **Validasi NIM**: Pastikan NIM sudah tersimpan di tabel `profiles` sebelum memanggil `savePersonalData()`. NIM disimpan saat user melakukan validasi NIM di Step 1.

3. **Placeholder Study Program**: Saat insert pertama kali (di `savePersonalData`), study_program_id menggunakan placeholder UUID. Ini akan di-update saat `saveAcademicData()` dipanggil.

4. **Error Handling**: Semua action mengembalikan object dengan property `success` dan `error`/`message`. Selalu cek `success` sebelum melanjutkan ke step berikutnya.

5. **Timestamp pada File Upload**: Semua file upload sekarang menggunakan timestamp untuk menghindari konflik nama file jika user upload ulang.

## Testing

Untuk testing, pastikan:
1. User sudah login dan memiliki NIM di tabel profiles
2. Bucket `profiles` dan `registrations` sudah dibuat di Supabase Storage
3. RLS policy untuk bucket sudah dikonfigurasi dengan benar
4. Tabel `registrations` sudah ada dan sesuai dengan schema

## Next Steps (Opsional)

Jika ingin mengintegrasikan action baru ke dalam flow onboarding:

1. **Step 2 (Personal)**: Panggil `savePersonalData()` saat user klik "Lanjut"
2. **Step 3 (Academic)**: Panggil `saveAcademicData()` saat user klik "Lanjut"
3. **Step 5 (Upload)**: Tetap gunakan `handleFinalSubmit()` yang sudah diperbaiki

Dengan cara ini, data akan tersimpan secara bertahap dan user tidak perlu mengisi ulang jika terjadi error di step terakhir.
