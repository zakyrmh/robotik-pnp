# Supabase Auth SSR Guide (Next.js App Router)

Panduan teknis penanganan autentikasi **Supabase Authentication** menggunakan package `@supabase/ssr` pada **Next.js 16 (App Router)** dengan arsitektur tanpa folder `src/`.

---

## 1. Instalasi Packages

Instal SDK Supabase dan package SSR resmi untuk Next.js:

```bash
npm install @supabase/supabase-js @supabase/ssr
```

---

## 2. Struktur File & Utilitas Supabase Client

Di lingkungan Server Server Components (SSR) dan Server Actions, pembacaan serta penulisan cookie HTTP-only sangat krusial untuk menjaga sinkronisasi session user.

### 2.1. Server Client (`lib/supabase/server.ts`)

Digunakan pada **Server Components**, **Server Actions**, dan **Route Handlers**.

```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Error ini bisa diabaikan jika dipanggil dari Server Component murni
            // (karena Server Components tidak bisa mengubah cookie secara langsung).
          }
        },
      },
    },
  );
}
```

### 2.2. Client Component Client (`lib/supabase/client.ts`)

Digunakan khusus pada **Client Components** (`'use client'`).

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

### 2.3. Middleware Client & Token Refreshing (`lib/supabase/middleware.ts`)

Digunakan oleh Next.js Middleware untuk memperbarui token auth secara otomatis sebelum halaman dirender.

```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // PENTING: Gunakan getUser() alih-alih getSession() untuk validasi keamanan server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteksi Route
  if (
    !user &&
    !request.nextUrl.pathname.startsWith("/login") &&
    !request.nextUrl.pathname.startsWith("/auth")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

---

## 3. Integrasi Middleware di Root Proyek

Buat atau perbarui file `middleware.ts` di akar (_root_) proyek:

```typescript
// middleware.ts
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Images/assets public (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## 4. Implementasi pada Server Components & Server Actions

### 4.1. Membaca Session User di Server Component (SSR)

```tsx
// app/dashboard/page.tsx
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = await createClient();

  // Ambil data user yang tervalidasi
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Selamat Datang, {user.email}</h1>
      <p className="text-gray-600">ID User: {user.id}</p>
    </div>
  );
}
```

### 4.2. Auth Actions dengan Server Actions

```typescript
// lib/actions/auth.ts
"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function loginAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

export async function logoutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  redirect("/login");
}
```

---

## 5. Keamanan & Best Practices

1. **Gunakan `supabase.auth.getUser()` untuk Akses Server**:
   Selalu utamakan `getUser()` dibandingkan `getSession()` pada Server Components / Middleware. `getUser()` melakukan verifikasi ulang token JWT ke server Supabase, mencegah pemalsuan token di sisi client.
2. **Jangan Simpan State Sensitive di LocalStorage**:
   Dengan `@supabase/ssr`, cookie HTTP-only otomatis digunakan. Hal ini melindungi aplikasi dari kerentanan _Cross-Site Scripting_ (XSS).
3. **Penanganan Revalidasi Cache**:
   Setelah proses `signInWithPassword` atau `signOut`, selalu panggil `revalidatePath('/', 'layout')` untuk memastikan data cache pada Next.js App Router dibersihkan dan di-refresh.
