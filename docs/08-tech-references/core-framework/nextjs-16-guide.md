# Next.js 16 Comprehensive Reference Guide

Panduan teknis mendalam untuk pengembangan aplikasi web modern menggunakan **Next.js 16 (v16.3.0)** dengan arsitektur **App Router**, **React Server Components (RSC)**, **Server Actions**, dan struktur proyek tanpa folder `src/`.

---

## 1. Arsitektur & Struktur Proyek (Tanpa Folder `src/`)

Pada konfigurasi tanpa folder `src/`, seluruh direktori utama seperti `app/`, `components/`, `lib/`, `styles/`, dan `public/` diletakkan langsung di akar (_root_) proyek.

### Struktur Direktori Standar

```text
my-next-app/
├── app/                        # Root App Router directory
│   ├── (auth)/                 # Route Group (Auth flow)
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── register/
│   │       └── page.tsx
│   ├── (dashboard)/            # Route Group (Dashboard flow)
│   │   ├── dashboard/
│   │   │   ├── page.tsx
│   │   │   └── loading.tsx
│   │   └── layout.tsx
│   ├── api/                    # API Route Handlers
│   │   └── v1/
│   │       └── users/
│   │           └── route.ts
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx              # Root Layout
│   ├── loading.tsx             # Root Loading UI
│   ├── error.tsx               # Root Error Boundary
│   ├── not-found.tsx           # Custom 404 Page
│   └── page.tsx                # Landing Page (/)
├── components/                 # UI Components (Server & Client)
│   ├── ui/                     # Reusable atomic UI (Buttons, Cards, Inputs)
│   └── shared/                 # Business logic components (Navbar, Sidebar)
├── lib/                        # Utility functions, DB clients, configurations
│   ├── db.ts                   # Database connection (e.g., Prisma, Supabase)
│   ├── utils.ts                # Helper functions (cn, formatters)
│   └── actions/                # Centralized Server Actions (optional)
├── public/                     # Static assets (Images, SVGs, Fonts)
├── styles/                     # Modular or additional custom CSS files
├── .env.local                  # Environment variables (private & public)
├── middleware.ts               # Global Middleware
├── next.config.ts              # Next.js Configuration (TypeScript)
├── package.json
└── tsconfig.json
```

---

## 2. Fundamental App Router & Routing Conventions

Next.js 16 App Router menggunakan file system-based routing berbasis folder di dalam direktori `app/`.

### Special File Conventions

| File Name          | Fungsi / Peran                                                                         | Tipe Komponen                     |
| :----------------- | :------------------------------------------------------------------------------------- | :-------------------------------- |
| `page.tsx`         | Menentukan UI unik untuk suatu route path.                                             | RSC (default)                     |
| `layout.tsx`       | Layout persisten yang membungkus child route. State dipertahankan saat navigasi.       | RSC (default)                     |
| `template.tsx`     | Mirip layout, tetapi instance baru dibuat pada setiap navigasi (state tidak disimpan). | RSC / Client                      |
| `loading.tsx`      | Suspense fallback UI otomatis saat data route sedang di-load.                          | RSC                               |
| `error.tsx`        | Error Boundary Client Component untuk menangani runtime error pada route segment.      | Client Component (`'use client'`) |
| `global-error.tsx` | Error Boundary khusus untuk menangkap error pada Root Layout.                          | Client Component                  |
| `not-found.tsx`    | UI untuk penanganan status HTTP 404 atau pemanggilan `notFound()`.                     | RSC                               |
| `route.ts`         | Route Handler untuk membanguan REST / Custom API endpoints.                            | Server-side Handler               |

### Dynamic & Advanced Routing Patterns

1. **Dynamic Segments (`[slug]`)**
   - Folder: `app/posts/[slug]/page.tsx`
   - Props: `params: Promise<{ slug: string }>` (Di Next.js 16, `params` dan `searchParams` bersifat _asynchronous_ / berupa `Promise`).

   ```tsx
   // app/posts/[slug]/page.tsx
   export default async function PostPage({
     params,
   }: {
     params: Promise<{ slug: string }>;
   }) {
     const { slug } = await params;
     return <h1>Post: {slug}</h1>;
   }
   ```

2. **Catch-all Segments (`[...slug]`) & Optional Catch-all (`[[...slug]]`)**
   - `app/docs/[...slug]/page.tsx` menangkap `/docs/a`, `/docs/a/b`, dst.

3. **Route Groups `(groupName)`**
   - Mengelompokkan route tanpa memengaruhi struktur URL path. Contoh: `app/(auth)/login/page.tsx` diakses via `/login`.

4. **Parallel Routes (`@slot`) & Intercepting Routes (`(.)folder`)**
   - Digunakan untuk modal, dashboard multi-pane, dan navigasi kompleks tanpa mengubah konteks halaman utama.

---

## 3. React Server Components (RSC) vs Client Components

Di Next.js 16, semua komponen di dalam folder `app/` secara default adalah **React Server Components (RSC)**.

### Perbandingan & Kapan Menggunakan

| Karakteristik / Fitur                           | Server Component (RSC)          | Client Component (`'use client'`)      |
| :---------------------------------------------- | :------------------------------ | :------------------------------------- |
| **Eksekusi Code**                               | Hanya di Server                 | Browser + Server (Prerender)           |
| **Akses Database / FS**                         | Ya (Langsung tanpa API Layer)   | Tidak                                  |
| **Sensitif Keys / Tokens**                      | Aman (Tidak terkirim ke Client) | Harus terekspos jika dipakai di Client |
| **Interaktivitas (onClick, onChange)**          | Tidak Boleh                     | Ya                                     |
| **State & Lifecycle (`useState`, `useEffect`)** | Tidak Boleh                     | Ya                                     |
| **Browser APIs (`window`, `localStorage`)**     | Tidak Boleh                     | Ya (setelah mount)                     |
| **Bundle Size Impact**                          | 0 KB JavaScript ke Client       | Menambah Bundle Size                   |

### Pola Integrasi Interleaving (Children Pattern)

Untuk memasukkan Server Component ke dalam Client Component tanpa merubah Server Component menjadi Client Component, gunakan pola `children` atau props slot.

```tsx
// components/ClientWrapper.tsx
"use client";

import { useState } from "react";

export default function ClientWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border p-4">
      <button onClick={() => setIsOpen(!isOpen)}>
        Toggle Content ({isOpen ? "Open" : "Closed"})
      </button>
      {isOpen && <div className="mt-2">{children}</div>}
    </div>
  );
}
```

---

## 4. Server Actions & Mutasi Data

Server Actions adalah fungsi _asynchronous_ yang dieksekusi di server, dapat dipanggil dari Server maupun Client Components untuk menangani mutasi data, form submission, dan interaksi backend.

### 1. Definisi Server Action dalam File Terpisah

```ts
// lib/actions/user.ts
"use server";

import { revalidatePath } from "next/cache";

export async function updateUserProfile(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name || !email) {
    return { success: false, error: "Nama dan Email wajib diisi." };
  }

  // Lakukan update ke Database
  // await db.user.update(...)

  // Revalidasi cache pada halaman terkait
  revalidatePath("/dashboard/profile");

  return { success: true, error: null };
}
```

### 2. Penggunaan dengan Form & `useActionState` (React 19 / Next.js 16)

```tsx
// app/dashboard/profile/page.tsx
"use client";

import { useActionState } from "react";
import { updateUserProfile } from "@/lib/actions/user";

const initialState = {
  success: false,
  error: null,
};

export default function ProfileForm() {
  const [state, formAction, isPending] = useActionState(
    updateUserProfile,
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4 max-w-md">
      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nama
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="w-full border p-2 rounded"
        />
      </div>

      {state.error && <p className="text-red-500 text-sm">{state.error}</p>}
      {state.success && (
        <p className="text-green-500 text-sm">Profil berhasil diperbarui!</p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Perubahan"}
      </button>
    </form>
  );
}
```

---

## 5. Data Fetching, Caching, & Partial Prerendering (PPR)

### Fetching di Server Components

Next.js memelihara standar `fetch` Web API yang diperluas dengan opsi caching terintegrasi.

```tsx
// app/products/page.tsx
type Product = { id: string; name: string; price: number };

async function getProducts(): Promise<Product[]> {
  const res = await fetch("https://api.example.com/products", {
    // Strategy 1: Force Cache (SSG style)
    // cache: 'force-cache',

    // Strategy 2: Time-based Revalidation (ISR style)
    next: { revalidate: 3600 }, // Revalidate setiap 1 jam

    // Strategy 3: Dynamic / No Store (SSR style)
    // cache: 'no-store'
  });

  if (!res.ok) throw new Error("Gagal mengambil data produk");
  return res.json();
}

export default async function ProductsPage() {
  const products = await getProducts();

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">Daftar Produk</h1>
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p) => (
          <li key={p.id} className="border p-4 rounded shadow-sm">
            <h2 className="font-semibold">{p.name}</h2>
            <p className="text-gray-600">
              Rp {p.price.toLocaleString("id-ID")}
            </p>
          </li>
        ))}
      </ul>
    </main>
  );
}
```

### Strategic Revalidation

- **`revalidatePath(path: string)`**: Memicu pembaharuan cache untuk route path tertentu.
- **`revalidateTag(tag: string)`**: Memicu pembaharuan cache berdasarkan tag data `fetch({ next: { tags: ['products'] } })`.

---

## 6. Metadata API & SEO Optimization

Next.js 16 menyediakan API Metadata deklaratif untuk mengelola `<head>` elemen seperti `title`, `description`, `openGraph`, dan `twitter`.

### Static Metadata

```tsx
// app/layout.tsx atau app/about/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "Aplikasi Web Utama",
    template: "%s | Aplikasi Web Utama",
  },
  description:
    "Sistem platform modern dibangun dengan Next.js 16 dan App Router.",
  openGraph: {
    title: "Aplikasi Web Utama",
    description: "Sistem platform modern dibangun dengan Next.js 16.",
    url: "https://example.com",
    siteName: "WebUtama",
    locale: "id_ID",
    type: "website",
  },
};
```

### Dynamic Metadata

```tsx
// app/posts/[slug]/page.tsx
import type { Metadata } from "next";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  // Ambil data spesifik post dari DB / API
  // const post = await getPost(slug);

  return {
    title: `Artikel: ${slug}`,
    description: `Baca pembahasan lengkap mengenai ${slug} di platform kami.`,
  };
}
```

---

## 7. Middleware & Keamanan

File `middleware.ts` diletakkan di akar (_root_) proyek (sejajar dengan folder `app/`). Middleware berjalan di V8 Edge Runtime sebelum sebuah request diproses oleh route handler atau halaman.

### Contoh Implementasi Middleware Auth & Route Protection

```typescript
// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("session_token")?.value;
  const { pathname } = request.nextUrl;

  // Proteksi rute /dashboard
  if (pathname.startsWith("/dashboard") && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect user terautentikasi keluar dari halaman auth
  if ((pathname === "/login" || pathname === "/register") && token) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

// Konfigurasi Matcher
export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
```

---

## 8. Checklist Praktik Terbaik (Best Practices)

1. **Jaga Server Components Tetap murni RSC**: Jangan tambahkan `'use client'` di level atas halaman jika hanya bagian kecil (misal: tombol) yang membutuhkan interaktivitas. Ekstrak tombol tersebut menjadi Client Component terpisah.
2. **Gunakan Async Params/SearchParams**: Di Next.js 16, selalu `await` objek `params` dan `searchParams` di Server Components / Route Handlers.
3. **Optimasi Gambar dengan `next/image`**: Selalu tentukan `width` dan `height` atau gunakan prop `fill` bersamaan dengan `sizes` untuk mencegah Layout Shift (CLS).
4. **Environment Variables Security**:
   - Variabel tanpa prefix `NEXT_PUBLIC_` bersifat rahasia dan hanya dapat diakses di Server (RSC, Server Actions, Route Handlers, Middleware).
   - Gunakan prefix `NEXT_PUBLIC_` hanya untuk variabel yang memang aman dikirim ke browser client.
