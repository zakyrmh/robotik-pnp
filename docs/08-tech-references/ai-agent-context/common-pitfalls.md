# Common Pitfalls & Anti-Patterns Guide in Next.js 16 & Modern Stack

Dokumen teknis ini mendokumentasikan berbagai **jebakan umum (common pitfalls)**, _runtime error_, dan _anti-patterns_ yang sering ditemui saat mengembangkan aplikasi web dengan **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, dan **Supabase**.

Panduan ini ditujukan sebagai konteks kritis bagi pengembang dan **AI Agent** agar tidak menghasilkan kode yang memicu _bugs_ laten atau _degradasi performa_.

---

## 1. Hydration Errors & Server-Client Mismatch

### 1.1. Penggunaan API Browser di Level Top-Level / Initial Render

_Hydration Error_ terjadi ketika struktur HTML yang di-render oleh Server (Prerender/RSC) tidak cocok 100% dengan HTML awal yang di-generate oleh React di browser client.

#### ❌ Salah (Penyebab Mismatch):

```tsx
"use client";

export function UserHeader() {
  // ERROR: window/localStorage tidak ada di Server, menyebabkan markup mismatch!
  const theme = localStorage.getItem("theme") || "light";
  const width = window.innerWidth;

  return (
    <div>
      Theme: {theme}, Width: {width}px
    </div>
  );
}
```

#### ✅ Benar (Solusi `useEffect` atau Mounted State):

```tsx
"use client";

import { useState, useEffect } from "react";

export function UserHeader() {
  const [isMounted, setIsMounted] = useState(false);
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    setIsMounted(true);
    setTheme(localStorage.getItem("theme") || "light");
  }, []);

  if (!isMounted) {
    return <div>Loading header...</div>; // Skeleton matching server HTML
  }

  return <div>Theme: {theme}</div>;
}
```

---

### 1.2. Mismatch Tanggal & Waktu (Timezone Discrepancy)

Memformat tanggal menggunakan `new Date().toLocaleString()` secara langsung di Server Component akan menggunakan timezone server (misal: UTC), sedangkan di client browser akan menggunakan timezone lokal user (misal: WIB/GMT+7).

#### ❌ Salah:

```tsx
export default function EventCard({ date }: { date: Date }) {
  // Hasil server vs client berbeda tergantung timezone OS
  return <span>{date.toLocaleTimeString()}</span>;
}
```

#### ✅ Benar:

Format tanggal dengan pustaka terstandar (seperti `date-fns`) atau tentukan timezone secara eksplisit (`timeZone: 'Asia/Jakarta'`).

---

## 2. React Server Components (RSC) & Server Actions Pitfalls

### 2.1. Lupa Meng-`await` Async `params` dan `searchParams` di Next.js 16

Pada Next.js 16, `params` dan `searchParams` pada `page.tsx`, `layout.tsx`, dan Route Handlers bersifat **asynchronous** (`Promise`).

#### ❌ Salah (Pola Next.js versi lama):

```tsx
// app/members/[id]/page.tsx
export default function MemberPage({ params }: { params: { id: string } }) {
  // ERROR di Next.js 16: params.id diakses secara synchronous!
  return <h1>Member ID: {params.id}</h1>;
}
```

#### ✅ Benar (Next.js 16 Standard):

```tsx
// app/members/[id]/page.tsx
export default async function MemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <h1>Member ID: {id}</h1>;
}
```

---

### 2.2. Menandai Seluruh Halaman dengan `'use client'`

Memasang `'use client'` di file `page.tsx` paling atas akan membuat seluruh halaman beserta komponen turunannya menjadi Client Component, sehingga menghilangkan manfaat zero-bundle-size RSC, caching server, dan keamanan RLS.

#### ❌ Salah:

```tsx
// app/inventory/page.tsx
"use client"; // Jangan lakukan ini di level Page utama jika tidak terpaksa!

import { useState } from "react";

export default function InventoryPage() {
  // ...
}
```

#### ✅ Benar (Pola Interleaving):

Biarkan `page.tsx` tetap sebagai **Server Component** (RSC) untuk mengambil data dari Supabase, lalu lempar data tersebut sebagai props ke Client Component atomic yang membutuhkan _state_ interaktif.

---

### 2.3. Kebocoran Data Sensitif di Server Actions

Server Action yang dideklarasikan dengan `'use server'` bertindak sebagai endpoint HTTP publik tersembunyi. Jangan pernah mempercayai parameter input dari client tanpa validasi ulang!

#### ❌ Salah:

```typescript
"use server";

// BAHAYA: Client bisa memalsukan userId di parameter!
export async function deleteMemberAction(userId: string) {
  await db.from("members").delete().eq("id", userId);
}
```

#### ✅ Benar:

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function deleteMemberAction(userIdToDelete: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Validasi peran & hak akses autentikasi dari Server Session
  if (!user || user.app_metadata?.role !== "admin") {
    throw new Error("Unauthorized: Hanya Admin yang dapat menghapus anggota");
  }

  await supabase.from("members").delete().eq("id", userIdToDelete);
}
```

---

## 3. Supabase Backend & Authentication Pitfalls

### 3.1. Menggunakan `getSession()` Alih-alih `getUser()` di Server Context

Fungsi `supabase.auth.getSession()` membaca data session dari cookie tanpa memverifikasi ulang keabsahan signature token JWT ke server Supabase, sehingga rawan dipalsukan (_token forgery_).

#### ❌ Salah:

```typescript
// Di Middleware atau Server Component
const {
  data: { session },
} = await supabase.auth.getSession(); // Rawan dipalsukan!
```

#### ✅ Benar:

```typescript
// Selalu gunakan getUser() untuk re-validasi token aman di Server
const {
  data: { user },
  error,
} = await supabase.auth.getUser();
```

---

### 3.2. Lupa Mengaktifkan Row Level Security (RLS)

Membuat tabel baru di skema `public` Supabase tanpa mengaktifkan RLS akan membuat seluruh isi tabel dapat dibaca, diubah, atau dihapus oleh siapa saja menggunakan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

#### ❌ Salah (Lupa RLS):

```sql
CREATE TABLE public.inventaris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_alat TEXT NOT NULL
);
-- Tanpa RLS = VULNERABLE!
```

#### ✅ Benar:

```sql
CREATE TABLE public.inventaris (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nama_alat TEXT NOT NULL
);

-- WAJIB: Aktifkan RLS & buat Policy
ALTER TABLE public.inventaris ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anggota terautentikasi dapat melihat inventaris"
  ON public.inventaris FOR SELECT
  TO authenticated
  USING (true);
```

---

## 4. UI & Styling Pitfalls (Tailwind CSS v4 & React 19)

### 4.1. Membuat File `tailwind.config.js` di Tailwind CSS v4

Tailwind CSS v4 menggunakan arsitektur **CSS-First Configuration** berbasis Rust (_Oxide Engine_). Membuat file `tailwind.config.js` dapat memicu konflik build atau diabaikan oleh engine.

#### ❌ Salah:

Membuat file `tailwind.config.js` baru.

#### ✅ Benar:

Deklarasikan kustomisasi tema langsung di `app/globals.css` menggunakan blok `@theme`:

```css
@import "tailwindcss";

@theme {
  --color-brand: #1e40af;
}
```

---

### 4.2. Menggunakan `forwardRef` di React 19

Pada React 19, `forwardRef` telah di-deprecated. Properti `ref` kini secara resmi diteruskan sebagai **prop standar** pada Function Component.

#### ❌ Salah (Pola lama):

```tsx
const CustomInput = React.forwardRef((props, ref) => (
  <input ref={ref} {...props} />
));
```

#### ✅ Benar (React 19 Standard):

```tsx
export function CustomInput({
  ref,
  ...props
}: React.ComponentPropsWithRef<"input">) {
  return <input ref={ref} {...props} />;
}
```

---

## 5. Ringkasan Checklist Pencegahan Jebakan (Dev Checklist)

1. **[ ] Next.js 16**: Apakah semua `params` dan `searchParams` sudah di-`await`?
2. **[ ] React 19**: Apakah ada penggunaan `forwardRef` yang belum diganti ke `ref` prop biasa?
3. **[ ] Hydration**: Apakah ada pengaksesan `window`, `document`, atau `localStorage` di luar `useEffect` / event handler?
4. **[ ] Supabase Server**: Apakah pembuatan Supabase Client menggunakan `@supabase/ssr` dan verifikasi user memakai `getUser()`?
5. **[ ] Security**: Apakah `SUPABASE_SERVICE_ROLE_KEY` atau `TURNSTILE_SECRET` bebas dari prefix `NEXT_PUBLIC_`?
6. **[ ] Styling**: Apakah Tailwind CSS v4 dikonfigurasi melalui `@theme` di `app/globals.css` tanpa file `tailwind.config.js`?
