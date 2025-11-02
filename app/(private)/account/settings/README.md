# Account Settings Page

Halaman pengaturan akun untuk user yang memungkinkan mereka mengedit profil dan keamanan akun.

## Fitur

### 1. Edit Profil
User dapat mengedit field-field berikut:
- **Foto Profil** (`profile.photoUrl`)
- **Foto KTM** (`profile.ktmUrl`)
- **Nama Lengkap** (`profile.fullName`)
- **Nama Panggilan** (`profile.nickname`)
- **NIM** (`profile.nim`)
- **Nomor Telepon** (`profile.phone`)
- **Jenis Kelamin** (`profile.gender`)
- **Tanggal Lahir** (`profile.birthDate`)
- **Tempat Lahir** (`profile.birthPlace`)
- **Alamat** (`profile.address`)
- **Jurusan** (`profile.major`)
- **Program Studi** (`profile.department`)
- **Tahun Masuk** (`profile.entryYear`)

### 2. Keamanan Akun
- **Ubah Email**: User dapat mengubah email dengan konfirmasi password
- **Ubah Password**: User dapat mengubah password dengan memasukkan password lama

## Setup Supabase Storage

Sebelum menggunakan fitur upload foto, pastikan Anda sudah membuat bucket di Supabase Storage:

### 1. Buat Bucket di Supabase Dashboard

1. Buka [Supabase Dashboard](https://app.supabase.com)
2. Pilih project Anda
3. Pergi ke **Storage** di sidebar
4. Klik **New bucket**
5. Buat 2 bucket dengan nama:
   - `user-photos` (untuk foto profil)
   - `user-ktm` (untuk foto KTM)
6. Set bucket menjadi **Public** agar file dapat diakses

### 2. Environment Variables

Pastikan environment variables berikut sudah diset di `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Setup Collection jurusan-prodi di Firestore

Buat collection `jurusan-prodi` di Firestore dengan struktur berikut:

```json
{
  "nama": "Teknologi Informasi",
  "program_studi": [
    {
      "jenjang": "D3",
      "nama": "Teknik Komputer"
    },
    {
      "jenjang": "D4",
      "nama": "Teknik Informatika"
    }
  ]
}
```

## Teknologi yang Digunakan

- **Next.js 15** - Framework React
- **Firebase Auth** - Autentikasi user
- **Firestore** - Database untuk user data
- **Supabase Storage** - Storage untuk file upload
- **React Hook Form** - Form management
- **Zod** - Validasi form
- **Shadcn UI** - UI components
- **Tailwind CSS** - Styling

## Struktur File

```
app/(private)/account/settings/
??? page.tsx              # Halaman settings account
??? README.md            # Dokumentasi

lib/
??? supabase-storage.ts   # Helper functions untuk Supabase Storage
??? firebase/
    ??? users.ts          # CRUD operations untuk users
    ??? jurusan-prodi.ts  # Fetch data jurusan-prodi
```

## Catatan

1. **File Upload**:
   - Maksimal ukuran file: 2MB
   - Format yang didukung: JPG, PNG
   - File akan diunggah ke Supabase Storage

2. **Update Email**:
   - Memerlukan re-authentication dengan password
   - Email akan diupdate di Firebase Auth
   - User akan tetap login setelah update

3. **Update Password**:
   - Memerlukan password lama untuk verifikasi
   - Password baru minimal 6 karakter
   - User akan tetap login setelah update

4. **Data Storage**:
   - Profile data disimpan di Firestore collection `users_new`
   - Photo URL disimpan di field `profile.photoUrl` dan `profile.ktmUrl`
   - Firebase Auth hanya menyimpan email dan password
