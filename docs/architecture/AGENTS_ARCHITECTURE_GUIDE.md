# 🏗️ AI AGENT GUIDELINE: SERVER-CLIENT SEPARATION & COMPONENT-DRIVEN ARCHITECTURE (NEXT.JS 16 APP ROUTER - NO `src/`)

Dokumen ini berisi standar arsitektur dan aturan pengkodean (_coding standards_) untuk memisahkan **Backend (Server-Side)** dan **Frontend (Client-Side)** secara disiplin pada proyek Next.js 16 App Router tanpa folder `src/`. **Seluruh AI Agent / Copilot WAJIB mematuhi struktur dan aturan di bawah ini.**

---

## 1. STRUKTUR DIREKTORI PROYEK (NO `src/`)

Proyek ini tidak menggunakan direktori `src/`. Seluruh folder utama berada langsung di tingkat akar (_root directory_):

```text
.
├── app/                      # Next.js 16 App Router (Routing, Pages, Layouts, API Routes)
│   ├── (auth)/               # Route Group Auth (login, register)
│   │   ├── login/
│   │   │   └── page.tsx      # Server Component Page (Renders Client Component)
│   │   └── layout.tsx
│   ├── dashboard/
│   │   └── page.tsx          # Server Component Page
│   ├── api/                  # Route Handlers (Pure REST API Server-Side)
│   │   └── v1/
│   ├── layout.tsx            # Root Layout (Server Component)
│   ├── page.tsx              # Landing Page
│   └── global.css
├── actions/                  # Server Actions (Pure Server-Side Mutations & Queries)
│   ├── auth.ts
│   └── user.ts
├── components/               # FRONTEND LAYER (Component-Driven Architecture)
│   ├── ui/                   # Primitive/Base UI Components (Button, Input, Card, Modal)
│   ├── features/             # Feature-based Interactive Components
│   │   ├── auth/             # Form Login, Form Register, Password Strength Widget
│   │   └── profile/          # User Avatar Uploader, Profile Form Widget
│   └── layouts/              # Client-side Layout Wrappers (Sidebar, Navbar)
├── lib/                      # Backend & Shared Utilities
│   ├── supabase/             # Supabase Clients (server.ts, client.ts)
│   ├── schemas/              # Zod Validation Schemas
│   └── utils.ts              # Helper functions (clsx, tailwind-merge)
├── types/                    # TypeScript Type Definitions & Database Interfaces
├── proxy.ts                  # Next.js 16 Request Interception / Proxy (Replacing middleware.ts)
├── next.config.mjs
├── tailwind.config.ts
└── package.json

```

---

## 2. ATURAN BATASTAN SERVER vs CLIENT (THE HARD BOUNDARY)

### 🛡️ Layer Server-Side (Backend)

1. **Lokasi:** File di dalam `app/` (Pages/Layouts), `actions/`, `app/api/`, dan `lib/supabase/server.ts`.
2. **Tanggung Jawab:**

- Direct Database Access & Query execution.
- Eksekusi `auth.getUser()` untuk validasi identitas terverifikasi.
- Pengolahan rahasia sistem (Secret Keys, Private APIs).
- Validasi skema input akhir menggunakan `zod`.

3. **Aturan Wajib:**

- Tambahkan `import 'server-only'` di bagian paling atas file library backend agar tidak sengaja ter-import ke Client.
- DILARANG menggunakan React Client Hooks (`useState`, `useEffect`, `useRouter`, `useFormStatus`) di file Server.

### 🎨 Layer Client-Side (Frontend)

1. **Lokasi:** File di dalam folder `components/`.
2. **Tanggung Jawab:**

- Rendisi antarmuka pengguna (UI) dan interaktivitas (_event listeners_ seperti `onClick`, `onChange`).
- Manajemen _Client State_ (`useState`, `useReducer`, `useContext`).
- _Form Handling_ & Feedback UI (_Toast_, _Loading Spinner_, _Validation Errors_).

3. **Aturan Wajib:**

- Wajib mencantumkan direktif `'use client';` di baris pertama file komponen interaktif.
- DILARANG mengimpor library server-only (seperti `SUPABASE_SERVICE_ROLE_KEY`, `node:fs`, atau fungsi backend langsung).

---

## 3. PANDUAN FRONTEND: COMPONENT-DRIVEN ARCHITECTURE

Untuk menjaga komponen frontend modular, dapat diuji (_testable_), dan mudah dirawat:

### A. Aturan _Leaf Node Directive_ (`'use client'`)

- **DILARANG** menaruh `'use client'` pada file Halaman/Route Router (`app/**/page.tsx`).
- `page.tsx` harus selalu berupa **Server Component** yang bertindak sebagai _Assembler_ (perakit data) dan memanggil Client Component dari folder `components/features/`.
- Dorong direktif `'use client'` ke bagian paling daun (_leaf node_) dari pohon komponen untuk memaksimalkan performa _Server-Side Rendering (SSR)_.

### B. Taksonomi Komponen UI

1. **`components/ui/` (Primitive UI):**

- Komponen presentasional atomik yang fleksibel dan tidak terikat logika bisnis (misal: `button.tsx`, `input.tsx`, `dialog.tsx`, `badge.tsx`).
- Menerima _props_ murni untuk styling dan event dasar.

2. **`components/features/` (Feature/Domain Components):**

- Komponen bisnis interaktif yang merakit beberapa Primitive UI (misal: `components/features/auth/login-form.tsx`).
- Mengelola _form state_, memanggil _Server Action_, dan menangani _feedback UI_.

---

## 4. SKENARIO DAN KODE ACUAN (CODE TEMPLATES)

### A. Server Action (Backend Mutation) — `actions/auth.ts`

```typescript
"use server";

import "server-only";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, type LoginInput } from "@/lib/schemas/auth";

export async function loginAction(input: LoginInput) {
  // 1. Validasi Input di Sisi Server
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return { error: validation.error.errors[0].message };
  }

  const { email, password, captchaToken } = validation.data;

  // 2. Verifikasi Turnstile Captcha (Server-to-Server)
  const captchaRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: process.env.TURNSTILE_SECRET!,
        response: captchaToken,
      }),
    },
  );

  const captchaOutcome = await captchaRes.json();
  if (!captchaOutcome.success) {
    return { error: "Verifikasi captcha gagal." };
  }

  // 3. Eksekusi Auth ke Backend Supabase
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { error: "Email atau password salah." };
  }

  return { success: true };
}
```

---

### B. Client Component (Frontend UI) — `components/features/auth/login-form.tsx`

```tsx
"use client";

import { useState } from "react";
import Turnstile from "@marsidev/react-turnstile";
import { loginAction } from "@/actions/auth";

// Import Primitive UI Components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!captchaToken) {
      setErrorMsg("Selesaikan verifikasi captcha terlebih dahulu.");
      return;
    }

    setLoading(true);
    const result = await loginAction({ email, password, captchaToken });

    if (result?.error) {
      setErrorMsg(result.error);
      setLoading(false);
    } else {
      // Hard redirect atau panggil router
      window.location.href = "/dashboard";
    }
  };

  return (
    <div className="w-full max-w-md p-6 bg-white rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">Form Login</h2>

      {errorMsg && (
        <div className="p-3 mb-4 text-sm text-red-600 bg-red-50 rounded-lg">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="nama@email.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
          />
        </div>

        <div className="flex justify-center my-4">
          <Turnstile
            siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}
            onSuccess={(token) => setCaptchaToken(token)}
            onExpire={() => setCaptchaToken("")}
          />
        </div>

        <Button
          type="submit"
          disabled={loading || !captchaToken}
          className="w-full"
        >
          {loading ? "Memproses..." : "Masuk"}
        </Button>
      </form>
    </div>
  );
}
```

---

### C. Server Component Page (Assembler) — `app/(auth)/login/page.tsx`

```tsx
import { LoginForm } from "@/components/features/auth/login-form";

// Page adalah Server Component murni tanpa 'use client'
export default async function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <LoginForm />
    </main>
  );
}
```

---

### D. Next.js 16 Request Interception — `proxy.ts` (Root Directory)

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

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
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Selalu verifikasi user secara kriptografis menggunakan getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute = request.nextUrl.pathname.startsWith("/login");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  if (!user && isProtectedRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user && isAuthRoute) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## 5. CHECKLIST SIKAP AI AGENT SEBELUM MENGHASILKAN KODE

Sebelum menghasilkan atau mengubah kode, AI Agent WAJIB memeriksa daftar centang berikut:

- [ ] **Struktur Folder:** Apakah file berada di folder root tanpa `src/` (misal: `components/`, `actions/`, `lib/`)?
- [ ] **Aturan Proxy:** Apakah file pencegat request berada di root dengan nama `proxy.ts` dan mengekspor fungsi `proxy` (bukan `middleware.ts`)?
- [ ] **Pemisahan Client Component:** Apakah direktif `'use client'` ditaruh di komponen interaktif dalam folder `components/` dan **BUKAN** di file halaman `app/**/page.tsx`?
- [ ] **Pencegahan Kebocoran Server:** Apakah fungsi mutasi backend ditempatkan di folder `actions/` dan menggunakan direktif `'use server'`?
- [ ] **Verifikasi Identitas:** Apakah pengecekan sesi menggunakan `auth.getUser()` alih-alih `auth.getSession()`?
