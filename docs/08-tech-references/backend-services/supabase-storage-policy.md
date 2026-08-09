# Supabase Storage Access Control & Security Policy Guide

Panduan teknis mendalam mengenai tata cara pengelolaan file, konfigurasi bucket, dan penerapan **Row Level Security (RLS)** pada **Supabase Storage** untuk mengamankan aset media publik (seperti foto profil) dan dokumen privat (seperti identitas/dokumen rahasia).

---

## 1. Arsitektur & Konsep Dasar Supabase Storage

Supabase Storage dibangun di atas PostgreSQL dan S3-compatible storage engine. Metadata setiap file disimpan di dalam skema database `storage.objects` dan `storage.buckets`.

### Struktur Utama Skema Storage

- **`storage.buckets`**: Menyimpan konfigurasi wadah file (public vs private, batas ukuran file, MIME types yang diizinkan).
- **`storage.objects`**: Menyimpan lokasi path file, nama bucket, owner UUID, dan metadata file.

> **PENTING**: Hak akses terhadap file diatur langsung melalui **Row Level Security (RLS)** pada tabel `storage.objects`.

---

## 2. Klasifikasi Bucket: Public vs Private

| Kategori Bucket    | Akses Default                                                                    | Kasus Penggunaan Utama                                        | Metode Akses URL                                                          |
| :----------------- | :------------------------------------------------------------------------------- | :------------------------------------------------------------ | :------------------------------------------------------------------------ |
| **Public Bucket**  | File dapat dibaca oleh siapa saja tanpa autentikasi / RLS SELECT check.          | Foto profil (avatar), gambar produk, aset publik UI.          | `supabase.storage.from('avatars').getPublicUrl(filePath)`                 |
| **Private Bucket** | Semua akses (Read/Write) wajib lolos evaluasi RLS Policy pada `storage.objects`. | Dokumen KTP/Passport, invoice, laporan keuangan, file privat. | `supabase.storage.from('documents').createSignedUrl(filePath, expiresIn)` |

---

## 3. Storage RLS Helper Functions

Supabase menyediakan beberapa fungsi penolong (_helper functions_) khusus untuk memudahkan kueri path file di dalam RLS Policy:

- **`storage.filename(name text)`**: Mengambil nama file dari path lengkap (misal: `'folder/subfolder/image.png'` $
ightarrow$ `'image.png'`).
- **`storage.extension(name text)`**: Mengambil ekstensi file (misal: `'avatar.jpg'` $
ightarrow$ `'jpg'`).
- **`storage.foldername(name text)`**: Mengembalikan array segmen folder (misal: `'user_123/documents/file.pdf'` $
ightarrow$ `ARRAY['user_123', 'documents']`).

---

## 4. Implementasi RLS Policy Berdasarkan Kasus Penggunaan

### Kasus Penggunaan 1: Foto Profil / Avatar (Public Read, Owner Write)

- **Bucket Name**: `avatars` (Public Bucket = `true`)
- **Struktur Path**: `{user_id}/avatar.png`
- **Aturan**:
  1. Siapa saja (Anon & Authenticated) dapat melihat gambar.
  2. Hanya pemilik akun yang dapat mengunggah, memperbarui, atau menghapus foto profilnya di folder `{user_id}`.

```sql
-- 1. Buat Bucket Public
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- Batas 2MB (2 * 1024 * 1024 bytes)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Public Read Access
CREATE POLICY "Public Access for Avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatars');

-- 3. RLS Policy: Owner Upload (INSERT)
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. RLS Policy: Owner Update
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- 5. RLS Policy: Owner Delete
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);
```

---

### Kasus Penggunaan 2: Dokumen Privat Pengguna (Owner Only Read/Write)

- **Bucket Name**: `documents` (Public Bucket = `false`)
- **Struktur Path**: `{user_id}/{document_name}.pdf`
- **Aturan**:
  1. Halaman web/aplikasi harus menggunakan **Signed URL** untuk mengunduh/melihat file.
  2. Hanya user pemilik yang berhak membaca, mengunggah, dan mengelola dokumen miliknya.

```sql
-- 1. Buat Bucket Private
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  10485760, -- Batas 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. RLS Policy: Owner Read (SELECT) - Diperlukan untuk Signed URL Generation
CREATE POLICY "Users can view own documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- 3. RLS Policy: Owner Insert
CREATE POLICY "Users can upload own documents"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);

-- 4. RLS Policy: Owner Delete
CREATE POLICY "Users can delete own documents"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents'
  AND (SELECT auth.uid())::text = (storage.foldername(name))[1]
);
```

---

## 5. Implementasi SDK pada Next.js (Client & Server)

### 5.1. Mengunggah File dari Client Component (`'use client'`)

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function AvatarUploader({ userId }: { userId: string }) {
  const [uploading, setUploading] = useState(false);
  const supabase = createClient();

  async function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      const file = event.target.files?.[0];
      if (!file) return;

      const fileExt = file.name.split(".").pop();
      const filePath = `${userId}/profile.${fileExt}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (error) throw error;

      alert("Foto profil berhasil diunggah!");
    } catch (err: any) {
      alert(`Gagal mengunggah: ${err.message}`);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        disabled={uploading}
      />
      {uploading && <p className="text-sm text-gray-500">Mengunggah...</p>}
    </div>
  );
}
```

### 5.2. Membuat Signed URL di Server Component (SSR) untuk File Privat

```tsx
// app/dashboard/documents/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DocumentsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const filePath = `${user.id}/ktp.pdf`;

  // Buat Signed URL yang berlaku selama 60 detik
  const { data, error } = await supabase.storage
    .from("documents")
    .createSignedUrl(filePath, 60);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Dokumen Privat</h1>
      {error || !data ? (
        <p className="text-red-500">
          Dokumen tidak ditemukan atau akses ditolak.
        </p>
      ) : (
        <a
          href={data.signedUrl}
          target="_blank"
          rel="noreferrer"
          className="bg-blue-600 text-white px-4 py-2 rounded inline-block"
        >
          Unduh Dokumen (Link berlaku 60 detik)
        </a>
      )}
    </div>
  );
}
```

---

## 6. Checklist Keamanan Storage

1. **Gunakan Pembatasan MIME Type & Size Limit di Level Bucket**: Selalu atur `file_size_limit` dan `allowed_mime_types` pada konfigurasi `storage.buckets` untuk mencegah eksekusi _Denial of Service_ (DoS) atau _Arbitrary File Upload_.
2. **Jangan Lakukan Hardcode User ID**: Saat melakukan upload dari client, ambil `user.id` dari _session auth_ server atau Supabase client instance, bukan dari _input form text_ unvalidated.
3. **Optimasi Evaluasi RLS**: Selalu gunakan `(SELECT auth.uid())::text` dalam klausa `USING` / `WITH CHECK` RLS Policy untuk mencegah _per-row function evaluation_.
4. **Waktu Kadaluarsa Signed URL Pendek**: Untuk dokumen sangat sensitif, atur waktu _expiration_ Signed URL serendah mungkin (misal: 30–300 detik).
