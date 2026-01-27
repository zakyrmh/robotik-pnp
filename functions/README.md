# Firebase Cloud Functions - Robotik PNP

Folder ini berisi Cloud Functions untuk website UKM Robotik PNP.

## 📋 Overview

Cloud Functions digunakan untuk menerapkan konsep **Atomic & Secure**, dimana operasi sensitif seperti:

- Pembuatan akun user
- Penetapan role
- Penyimpanan ke database

...dijalankan sepenuhnya di server, bukan di client.

## 🗂 Struktur Folder

```
functions/
├── src/
│   ├── index.ts          # Entry point - export semua functions
│   └── auth/
│       └── register.ts   # Function untuk registrasi user
├── package.json          # Dependencies untuk Cloud Functions
├── tsconfig.json         # TypeScript config
└── .gitignore
```

## 🚀 Getting Started

### 1. Install Dependencies

```bash
cd functions
npm install
```

### 2. Build

```bash
npm run build
```

### 3. Run Emulator (Development)

```bash
npm run serve
# atau dari root project:
firebase emulators:start --only functions
```

### 4. Deploy ke Production

```bash
npm run deploy
# atau dari root project:
firebase deploy --only functions
```

## 📦 Functions

### `registerUser`

**Type:** Callable Function  
**Region:** `asia-southeast2` (Jakarta)

Menangani proses registrasi user baru secara atomik:

1. **Validasi Data** - Server-side validation menggunakan Zod
2. **Cek Email** - Memastikan email belum terdaftar
3. **Buat Auth User** - Membuat user di Firebase Authentication
4. **Set Role** - Menetapkan role default (`isCaang: true`)
5. **Simpan Database** - Menyimpan data ke Firestore `users_new`
6. **Generate Verification Link** - Membuat link verifikasi email

**Input:**

```typescript
{
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}
```

**Output:**

```typescript
{
  success: boolean;
  message: string;
  userId?: string;
}
```

**Rollback:**  
Jika terjadi error setelah user dibuat di Auth, function akan otomatis menghapus user tersebut (rollback).

## 🔒 Keamanan

- Semua operasi sensitif berjalan di server
- Client tidak memiliki akses langsung ke Firebase Admin SDK
- Password tidak pernah terekspos dalam logs
- Validasi dilakukan di server (tidak percaya input dari client)

## 📝 Environment Variables

Pastikan environment variables berikut tersedia:

```env
# Di .env.local (untuk emulator) atau Firebase Console (production)
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## 🔧 Troubleshooting

### Error: "Cannot find module 'firebase-functions/v2/https'"

Jalankan `npm install` di folder `functions/`.

### Error saat build

Pastikan TypeScript version compatible:

```bash
npm install typescript@^5.7.0 --save-dev
```

### Error saat deploy

Periksa apakah project Firebase sudah di-setup:

```bash
firebase login
firebase use --add
```

## 📚 Referensi

- [Firebase Functions v2 Documentation](https://firebase.google.com/docs/functions)
- [Callable Functions](https://firebase.google.com/docs/functions/callable)
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
