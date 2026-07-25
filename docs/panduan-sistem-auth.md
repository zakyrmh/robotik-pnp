Berikut panduan lengkap membangun sistem autentikasi yang **aman, cepat, dan robust** dengan **Next.js 16** dan **Supabase**, mengikuti alur yang kamu tentukan.

---

## 🏗️ Arsitektur & Stack

| Layer          | Teknologi                                 | Fungsi                                             |
| -------------- | ----------------------------------------- | -------------------------------------------------- |
| **Framework**  | Next.js 16 (App Router)                   | UI, Server Actions, Middleware                     |
| **Backend/DB** | Supabase                                  | Auth, PostgreSQL, Row Level Security               |
| **Email**      | Supabase Auth / Resend / SendGrid         | Kirim email verifikasi & reset password            |
| **State**      | Next.js Server Actions + Cookies          | Session management tanpa client-side token storage |
| **Validasi**   | Zod                                       | Schema validation                                  |
| **Password**   | bcrypt.js (opsional, Supabase sudah hash) | Extra layer jika perlu                             |

---

## 1️⃣ Setup Project & Konfigurasi

### Install Dependencies

```bash
npx create-next-app@latest my-auth-app --typescript --tailwind --eslint --app --src-dir
cd my-auth-app
npm install @supabase/supabase-js @supabase/ssr zod bcryptjs
npm install -D @types/bcryptjs
```

### Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Supabase Client (`src/lib/supabase.ts`)

```typescript
import { createBrowserClient } from "@supabase/ssr";

export const createClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
```

### Server Client (`src/lib/supabase-server.ts`)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: "", ...options });
        },
      },
    },
  );
}
```

### Proxy (`proxy.ts`)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: "", ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Proteksi route dashboard
  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated user dari auth pages
  if (
    user &&
    (request.nextUrl.pathname === "/login" ||
      request.nextUrl.pathname === "/register")
  ) {
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

## 2️⃣ Alur Register dengan Email Verification

### Schema Validasi (`src/lib/schemas.ts`)

```typescript
import { z } from "zod";

export const registerSchema = z
  .object({
    email: z.string().email("Email tidak valid"),
    password: z.string().min(8, "Password minimal 8 karakter"),
    confirmPassword: z.string(),
    nim: z.string().min(5, "NIM wajib diisi"), // untuk keperluan lupa password
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password wajib diisi"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
  nim: z.string().min(5, "NIM wajib diisi"),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Password tidak cocok",
    path: ["confirmPassword"],
  });
```

### Server Action Register (`src/app/register/actions.ts`)

```typescript
"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { registerSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

export async function register(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
    nim: formData.get("nim") as string,
  };

  const validated = registerSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createServerSupabaseClient();

  // Cek apakah NIM sudah terdaftar
  const { data: existingUser } = await supabase
    .from("profiles")
    .select("nim")
    .eq("nim", rawData.nim)
    .single();

  if (existingUser) {
    return { error: "NIM sudah terdaftar" };
  }

  // Register dengan Supabase Auth
  const { data, error } = await supabase.auth.signUp({
    email: rawData.email,
    password: rawData.password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/login`,
      data: {
        nim: rawData.nim,
      },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Simpan NIM ke tabel profiles untuk keperluan lupa password
  if (data.user) {
    await supabase.from("profiles").insert({
      id: data.user.id,
      email: rawData.email,
      nim: rawData.nim,
    });
  }

  redirect("/register/waiting");
}
```

### Halaman Register (`src/app/register/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { register } from './actions'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await register(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Register</h1>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">NIM</label>
          <input name="nim" type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required minLength={8} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Confirm Password</label>
          <input name="confirmPassword" type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Register'}
        </button>
      </form>
    </div>
  )
}
```

### Halaman Waiting (`src/app/register/waiting/page.tsx`)

```typescript
export default function WaitingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Cek Email Kamu!</h1>
        <p className="text-gray-600">
          Kami telah mengirimkan link verifikasi ke emailmu. Klik link tersebut untuk mengaktifkan akunmu.
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Tidak menerima email? Cek folder spam atau coba register ulang.
        </p>
      </div>
    </div>
  )
}
```

### Auth Callback Handler (`src/app/auth/callback/route.ts`)

```typescript
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: CookieOptions) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: CookieOptions) {
            response.cookies.set({ name, value: "", ...options });
          },
        },
      },
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
```

---

## 3️⃣ Alur Login

### Server Action Login (`src/app/login/actions.ts`)

```typescript
"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { loginSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

export async function login(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const validated = loginSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase.auth.signInWithPassword({
    email: rawData.email,
    password: rawData.password,
  });

  if (error) {
    return { error: "Email atau password salah" };
  }

  // Cek apakah email sudah terverifikasi
  if (!data.user?.email_confirmed_at) {
    await supabase.auth.signOut();
    return { error: "Email belum terverifikasi. Silakan cek inbox emailmu." };
  }

  redirect("/dashboard");
}

export async function logout() {
  const supabase = await createServerSupabaseClient();
  await supabase.auth.signOut();
  redirect("/login");
}
```

### Halaman Login (`src/app/login/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { login } from './actions'
import Link from 'next/link'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await login(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input name="password" type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Login'}
        </button>

        <div className="text-center space-y-2 text-sm">
          <Link href="/forgot-password" className="text-blue-600 hover:underline">
            Lupa password?
          </Link>
          <p className="text-gray-600">
            Belum punya akun?{' '}
            <Link href="/register" className="text-blue-600 hover:underline">
              Register
            </Link>
          </p>
        </div>
      </form>
    </div>
  )
}
```

---

## 4️⃣ Alur Lupa Password (dengan Verifikasi NIM)

### Server Action Forgot Password (`src/app/forgot-password/actions.ts`)

```typescript
"use server";

import { createServerSupabaseClient } from "@/lib/supabase-server";
import { forgotPasswordSchema } from "@/lib/schemas";
import { redirect } from "next/navigation";

export async function forgotPassword(formData: FormData) {
  const rawData = {
    email: formData.get("email") as string,
    nim: formData.get("nim") as string,
  };

  const validated = forgotPasswordSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.errors[0].message };
  }

  const supabase = await createServerSupabaseClient();

  // Verifikasi kecocokan NIM dan email di database
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, nim")
    .eq("email", rawData.email)
    .eq("nim", rawData.nim)
    .single();

  if (profileError || !profile) {
    return { error: "NIM dan email tidak cocok atau tidak terdaftar" };
  }

  // Kirim email reset password via Supabase
  const { error } = await supabase.auth.resetPasswordForEmail(rawData.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback?next=/reset-password`,
  });

  if (error) {
    return { error: "Gagal mengirim email reset password" };
  }

  redirect("/forgot-password/waiting");
}
```

### Halaman Forgot Password (`src/app/forgot-password/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { forgotPassword } from './actions'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')
    const result = await forgotPassword(formData)
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Lupa Password</h1>
        <p className="text-sm text-gray-600 text-center">
          Masukkan NIM dan email untuk verifikasi identitas
        </p>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">NIM</label>
          <input name="nim" type="text" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input name="email" type="email" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Kirim Link Reset'}
        </button>

        <p className="text-center text-sm">
          <Link href="/login" className="text-blue-600 hover:underline">
            Kembali ke login
          </Link>
        </p>
      </form>
    </div>
  )
}
```

### Halaman Waiting Forgot Password (`src/app/forgot-password/waiting/page.tsx`)

```typescript
export default function ForgotPasswordWaitingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white rounded-xl shadow-lg">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Cek Email Kamu!</h1>
        <p className="text-gray-600">
          Jika NIM dan email cocok, kami telah mengirimkan link untuk membuat password baru.
        </p>
      </div>
    </div>
  )
}
```

### Halaman Reset Password (`src/app/reset-password/page.tsx`)

```typescript
'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ResetPasswordPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(formData: FormData) {
    setLoading(true)
    setError('')

    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    if (password !== confirmPassword) {
      setError('Password tidak cocok')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter')
      setLoading(false)
      return
    }

    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Sign out dan redirect ke login
    await supabase.auth.signOut()
    router.push('/login?message=password_reset_success')
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form action={handleSubmit} className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg">
        <h1 className="text-2xl font-bold text-center">Buat Password Baru</h1>

        {error && <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Password Baru</label>
          <input name="password" type="password" required minLength={8} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Konfirmasi Password</label>
          <input name="confirmPassword" type="password" required className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Simpan Password'}
        </button>
      </form>
    </div>
  )
}
```

---

## 5️⃣ Dashboard & Logout (`src/app/dashboard/page.tsx`)

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { logout } from '../login/actions'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <form action={logout}>
            <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
              Logout
            </button>
          </form>
        </div>
        <div className="bg-white p-6 rounded-xl shadow">
          <p className="text-gray-600">Selamat datang, <strong>{user.email}</strong>!</p>
        </div>
      </div>
    </div>
  )
}
```

---

## 6️⃣ Setup Supabase (Database & Auth)

### Tabel `profiles` (SQL Editor)

```sql
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  nim text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table profiles enable row level security;

-- Policy: Users can only read their own profile
create policy "Users can view own profile"
  on profiles for select
  using (auth.uid() = id);

-- Policy: Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);
```

### Auth Settings (Supabase Dashboard)

1. **Authentication > Providers > Email**: Enable "Confirm email"
2. **Authentication > URL Configuration**:
   - Site URL: `http://localhost:3000`
   - Redirect URLs: `http://localhost:3000/auth/callback`
3. **Authentication > Email Templates**: Custom template jika perlu

---

## 🔒 Best Practices Keamanan

| Aspek                  | Implementasi                                                                 |
| ---------------------- | ---------------------------------------------------------------------------- |
| **Password Hashing**   | Supabase Auth otomatis hash dengan bcrypt                                    |
| **Session**            | HTTP-only cookie via `@supabase/ssr`, **tidak** simpan token di localStorage |
| **CSRF Protection**    | Next.js Server Actions otomatis handle                                       |
| **Rate Limiting**      | Aktifkan di Supabase Dashboard (Auth > Rate Limits)                          |
| **Email Verification** | Wajib verifikasi sebelum login                                               |
| **NIM Verification**   | Extra layer untuk reset password                                             |
| **RLS**                | Row Level Security aktif di semua tabel                                      |
| **HTTPS**              | Wajib di production                                                          |
| **Password Policy**    | Minimal 8 karakter, bisa tambah complexity                                   |
| **Logout**             | Invalidate session di server + client                                        |

---

## ⚡ Tips Performa

1. **Server Actions** untuk semua operasi auth → hindari API route yang tidak perlu
2. **Streaming** dengan Next.js 16 Suspense boundary
3. **Partial Prerendering (PPR)** untuk halaman dashboard
4. **Cache** data user di Server Component dengan `unstable_cache` jika perlu
5. **Edge Functions** Supabase untuk operasi berat (opsional)

---

Sistem ini sudah **production-ready** dengan flow yang kamu minta. Jika ada bagian yang perlu diperjelas atau ditambahkan (misalnya OAuth Google, 2FA, atau role-based access), silakan tanya!
