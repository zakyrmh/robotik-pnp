# AI Code Generation Rules & Coding Standards

Dokumen ini mendefinisikan aturan dan standar wajib (**Code Generation Rules**) bagi **AI Agent** dan pengembang saat menggenerasi atau merestrukturisasi kode pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP**.

Proyek ini dibangun menggunakan **Next.js 16 (App Router)** tanpa folder `src/`, **React 19**, **TypeScript**, **Tailwind CSS v4**, dan **Supabase**.

---

## 1. Arsitektur & Prinsip Komponen (RSC First)

1. **Server Components Secara Default**:
   - Semua komponen di direktori `app/` dan `components/` secara default adalah **React Server Components (RSC)** [cite: 18].
   - **TIDAK BOLEH** menambahkan direktif `'use client'` di bagian atas file kecuali jika komponen membutuhkan _state_ (`useState`, `useReducer`), _lifecycle/effects_ (`useEffect`), _event listeners_ (`onClick`, `onChange`), atau _browser API_ [cite: 18].

2. **Pola Interleaving (Server Parent + Client Child)**:
   - Jika suatu halaman membutuhkan interaktivitas (seperti modal, form, atau tombol), pisahkan komponen interaktif tersebut menjadi komponen atomic kecil di folder `components/` dan tandai dengan `'use client'` [cite: 18].
   - Biarkan file `page.tsx` utama tetap sebagai Server Component (RSC) untuk menangani _data fetching_ langsung dari Supabase/Database [cite: 18].

3. **Struktur Tanpa Folder `src/`**:
   - Seluruh direktori utama diletakkan di _root_ proyek (`app/`, `components/`, `lib/`, `types/`, `styles/`, `public/`).
   - Gunakan selalu path alias `@/*` mengarah ke root (`./*`) untuk seluruh impor modul.

---

## 2. Mutasi Data & Server Actions

1. **Wajib Pakai Server Actions untuk Mutasi Data**:
   - Seluruh mutasi data (_Insert_, _Update_, _Delete_, _Form Submission_) **wajib menggunakan Server Actions** (`'use server'`) [cite: 18].
   - Hindari membuat API Routes (`app/api/.../route.ts`) baru hanya untuk pengiriman form standar.

2. **Validasi Input & Type-Safety**:
   - Setiap Server Action **wajib memvalidasi input** menggunakan schema **Zod** [cite: 18].
   - Kembalikan respon ber-tipe presisi (misal: `{ success: true, data: T }` atau `{ success: false, error: string }`) [cite: 18].

3. **Autentikasi & Otorisasi Server**:
   - Jangan pernah mengandalkan `user_id` yang dikirim langsung dari form/client.
   - Selalu ambil dan validasi ulang identitas user di dalam Server Action menggunakan `supabase.auth.getUser()` melalui `@supabase/ssr`.

---

## 3. Data Fetching & Caching Strategy

1. **Data Fetching di Server Components**:
   - Lakukan pemanggilan data langsung di Server Component menggunakan Supabase Client (`lib/supabase/server.ts`) [cite: 18].
   - Hindari penggunaan `useEffect` + `fetch` di Client Component untuk pengambilan data awal halaman [cite: 18].

2. **Revalidasi Cache**:
   - Panggil `revalidatePath('/path')` atau `revalidateTag('tag-name')` di dalam Server Action segera setelah mutasi data berhasil dilakukan untuk memperbarui cache UI [cite: 18].

---

## 4. Konvensi Next.js 16 & React 19

1. **Async `params` dan `searchParams`**:
   - Pada `page.tsx`, `layout.tsx`, dan Route Handlers, tipe `params` dan `searchParams` **wajib berupa `Promise`** dan di-`await` sebelum digunakan:
     ```tsx
     export default async function Page({
       params,
     }: {
       params: Promise<{ id: string }>;
     }) {
       const { id } = await params;
       return <div>ID: {id}</div>;
     }
     ```

2. **`ref` Sebagai Prop Biasa (React 19)**:
   - **DILARANG** menggunakan `forwardRef` karena sudah _deprecated_ di React 19.
   - Teruskan `ref` secara langsung sebagai prop standar pada Function Component (`React.ComponentPropsWithRef<'input'>`).

3. **Form State dengan `useActionState`**:
   - Untuk mengelola status pending, error, dan respon dari Server Actions pada form client, gunakan Hook `useActionState` bawaan React 19.

---

## 5. UI & Styling Rules (Tailwind CSS v4 & Shadcn UI)

1. **CSS-First Configuration**:
   - Seluruh kustomisasi tema Tailwind CSS v4 **wajib ditulis di `app/globals.css`** menggunakan direktif `@theme`.
   - **DILARANG** menyarankan atau membuat file `tailwind.config.js`.

2. **Pemanfaatan Utilitas `cn()`**:
   - Selalu gabungkan class Tailwind pada komponen reusable menggunakan helper `cn(...)` dari `@/lib/utils` (berbasis `clsx` + `tailwind-merge`).

3. **Aksesibilitas & Touch Targets**:
   - Semua elemen interaktif (tombol, input, link) wajib memiliki ukuran area sentuh minimum $44 	imes 44	ext{ px}$ (`min-h-[44px]`) untuk memenuhi standar aksesibilitas mobile-first.

---

## 6. Ringkasan Do's and Don'ts

| ❌ DILARANG (Don't)                                        | ✅ WAJIB (Do)                                                            |
| :--------------------------------------------------------- | :----------------------------------------------------------------------- |
| Menandai file `page.tsx` dengan `'use client'` [cite: 18]. | Biarkan `page.tsx` tetap sebagai Server Component (RSC) [cite: 18].      |
| Mengakses `params.id` secara synchronous.                  | `await params` pada Server Component Next.js 16.                         |
| Memakai `forwardRef` untuk komponen input.                 | Passing `ref` sebagai prop biasa di React 19.                            |
| Membuat file `tailwind.config.js`.                         | Gunakan `@theme` di `app/globals.css` untuk Tailwind v4.                 |
| Menggunakan `supabase.auth.getSession()` di server.        | Gunakan `supabase.auth.getUser()` untuk re-validasi token JWT aman.      |
| Membuat API Routes baru untuk mutasi form standar.         | Gunakan **Server Actions** (`'use server'`) + Zod validation [cite: 18]. |
