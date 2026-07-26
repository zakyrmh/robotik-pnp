# 🛡️ ARCHITECTURE & SECURITY SPECIFICATION: NEXT.JS 16 + SUPABASE AUTH

Dokumen ini berisi keputusan arsitektur, panduan implementasi, dan standar keamanan jaringan/kode untuk fitur autentikasi. **AI Agent WAJIB mematuhi seluruh spesifikasi di dokumen ini tanpa membuat asumsi baru.**

---

## 1. KEPUTUSAN ARSITEKTUR & STACK (TECH STACK)

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript (`strict: true`)
- **Auth Engine:** Supabase Auth (Email & Password)
- **ORM:** **TIDAK Menggunakan ORM (No Prisma/Drizzle)**. Semua query data menggunakan Supabase Client JS Bawaan (`@supabase/ssr` & `@supabase/supabase-js`).
- **Validation:** `zod`
- **Bot Protection:** `@marsidev/react-turnstile` (Cloudflare Turnstile)
- **Hosting / Deployment:** Vercel

---

## 2. KODE ETIK & KEAMANAN SIBER (HARD SECURITY RULES)

Setiap AI Agent yang menulis kode untuk repositori ini WAJIB mematuhi 8 prinsip keamanan utama berikut:

### Rule #1: Wajib Mengaktifkan RLS (Row Level Security)

Semua tabel di PostgreSQL Supabase WAJIB memiliki aturan RLS yang aktif. Jangan pernah mengizinkan tabel terbuka tanpa _policy_.

- Gunakan fungsi `auth.uid()` pada SQL Policy untuk mencocokkan kredensial JWT.

### Rule #2: Selalu Gunakan `auth.getUser()`, DILARANG `auth.getSession()` di Server

- ❌ `supabase.auth.getSession()` **TIDAK BOLEH** digunakan di Server Components, Server Actions, atau Route Handlers karena hanya membaca payload Cookie yang berpotensi ditiru/dimanipulasi.
- ✅ **Gunakan `supabase.auth.getUser()`** yang selalu memverifikasi ulang token JWT secara kriptografis ke server Supabase Auth.

### Rule #3: Isolasi Ketat `SUPABASE_SERVICE_ROLE_KEY`

- `SUPABASE_SERVICE_ROLE_KEY` mem-bypass seluruh RLS.
- DILARANG mengekspos key ini ke Client Side (Jangan tambahkan prefix `NEXT_PUBLIC_`).
- Hanya boleh digunakan pada modul internal khusus server (misal: webhook internal) dengan validasi role/otentikasi yang sangat ketat.

### Rule #4: Mencegah BOLA / IDOR (Broken Object Level Authorization)

- DILARANG mengambil `userId` dari parameter input client (`req.json()` atau argumen Server Action) untuk operasi mutasi (Create/Update/Delete).
- Identity `userId` WAJIB didapatkan dari `auth.getUser()` terverifikasi di server.

### Rule #5: Penggunaan Convention Proxy `proxy.ts` (Next.js 16)

- Konvensi `middleware.ts` sudah dipensiunkan (_deprecated_) pada Next.js 16 dan digantikan oleh **`proxy.ts`** di _root_.
- Fungsi ekspor dinamai `proxy` (bukan `middleware`).

### Rule #6: Strict Environment Variable Scoping

- Hanya `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, dan `NEXT_PUBLIC_TURNSTILE_SITE_KEY` yang boleh ber-prefix `NEXT_PUBLIC_`.

### Rule #7: Security Headers & CORS

- Konfigurasi Security Headers di `next.config.mjs` untuk memblokir Clickjacking, MIME sniffing, dan Cross-Site Scripting.

### Rule #8: Bot Protection & Rate Limiting Lapis Pertama

- Setiap form pendaftaran dan login WAJIB dilengkapi token Cloudflare Turnstile (`@marsidev/react-turnstile`) untuk mencegah _credential stuffing_ / _bot automation_.

---

## 3. IMPLEMENTASI KODING (CODEBASE IMPLEMENTATION)

### 3.1. Database Setup & RLS Policy (`schema.sql`)

```sql
-- ==============================================================================
-- 1. SETUP ENUM TYPE, TABEL PROFILES, & TRIGGER UPDATED_AT
-- ==============================================================================

-- Buat Type ENUM user_role jika belum ada di database
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'super-admin',
            'admin-komdis',
            'admin-or',
            'admin-kestari',
            'admin-divisi',
            'anggota',
            'caang',
            'alumni'
        );
    END IF;
END $$;

-- Buat Tabel Profiles (Sudah mencakup denormalisasi full_name & avatar_url)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL,
    email TEXT NOT NULL,
    full_name TEXT NULL,
    avatar_url TEXT NULL,
    nim TEXT NULL,
    role public.user_role NOT NULL DEFAULT 'caang'::public.user_role,
    is_onboarded BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_nim_key UNIQUE (nim),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Index B-Tree untuk mempercepat query pencarian/filter berdasarkan role
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles USING btree (role);

-- Function & Trigger Otomatis untuk memperbarui kolom 'updated_at' saat ada perubahan data
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();


-- ==============================================================================
-- 2. AUTOMATIC PROFILE CREATION FROM SUPABASE AUTH
-- ==============================================================================

-- Function untuk menyalin data user baru dari auth.users ke public.profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role, is_onboarded)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
        'caang'::public.user_role,
        FALSE
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Trigger yang terpicu setiap kali ada pendaftaran user baru di Supabase Auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();


-- ==============================================================================
-- 3. HELPER FUNCTION & PROTEKSI ROLE (PREVENT RECURSION & ESCALATION)
-- ==============================================================================

-- Helper Function untuk mengambil role user saat ini tanpa memicu RLS Infinite Recursion
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Trigger Function untuk mencegah pengguna biasa mengubah kolom 'role' mereka sendiri
CREATE OR REPLACE FUNCTION public.protect_profile_role_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Jika ada percobaan perubahan nilai pada kolom role
    IF OLD.role IS DISTINCT FROM NEW.role THEN
        -- Hanya super-admin yang diizinkan mengubah role
        IF public.get_my_role() IS DISTINCT FROM 'super-admin'::public.user_role THEN
            RAISE EXCEPTION 'Akses ditolak: Hanya Super Admin yang dapat mengubah role pengguna.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_profile_role_protection ON public.profiles;
CREATE TRIGGER enforce_profile_role_protection
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_role_update();


-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Cleanup Policy lama agar tidak berbenturan
DROP POLICY IF EXISTS "User read own profile" ON public.profiles;
DROP POLICY IF EXISTS "User update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin select all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin delete profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin Komdis read anggota and caang" ON public.profiles;
DROP POLICY IF EXISTS "Admin Kestari read anggota and caang" ON public.profiles;
DROP POLICY IF EXISTS "Admin OR read caang" ON public.profiles;

--- -----------------------------------------------------------------------------
--- A. SELECT POLICIES (Membaca Profil)
--- -----------------------------------------------------------------------------

-- 1. Pengguna dapat membaca data profil milik mereka sendiri
CREATE POLICY "User read own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- 2. Super Admin dapat membaca SELURUH data profil
CREATE POLICY "Super Admin select all profiles"
ON public.profiles FOR SELECT
USING (public.get_my_role() = 'super-admin'::public.user_role);

-- 3. Admin Komdis dapat membaca data profil 'anggota' dan 'caang'
CREATE POLICY "Admin Komdis read anggota and caang"
ON public.profiles FOR SELECT
USING (
    public.get_my_role() = 'admin-komdis'::public.user_role
    AND role IN ('anggota'::public.user_role, 'caang'::public.user_role)
);

-- 4. Admin Kestari dapat membaca data profil 'anggota', 'caang', dan 'alumni'
CREATE POLICY "Admin Kestari read anggota and caang"
ON public.profiles FOR SELECT
USING (
    public.get_my_role() = 'admin-kestari'::public.user_role
    AND role IN ('anggota'::public.user_role, 'caang'::public.user_role, 'alumni'::public.user_role)
);

-- 5. Admin OR dapat membaca data profil khusus 'caang'
CREATE POLICY "Admin OR read caang"
ON public.profiles FOR SELECT
USING (
    public.get_my_role() = 'admin-or'::public.user_role
    AND role = 'caang'::public.user_role
);

--- -----------------------------------------------------------------------------
--- B. UPDATE POLICIES (Mengedit Profil)
--- -----------------------------------------------------------------------------

-- 1. Pengguna dapat mengedit profil mereka sendiri (Perubahan kolom 'role' dilindungi oleh Trigger)
CREATE POLICY "User update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 2. Super Admin dapat mengedit profil pengguna mana pun
CREATE POLICY "Super Admin update all profiles"
ON public.profiles FOR UPDATE
USING (public.get_my_role() = 'super-admin'::public.user_role);

--- -----------------------------------------------------------------------------
--- C. DELETE POLICIES (Menghapus Profil)
--- -----------------------------------------------------------------------------

-- Hanya Super Admin yang diizinkan menghapus data profil dari DB
CREATE POLICY "Super Admin delete profiles"
ON public.profiles FOR DELETE
USING (public.get_my_role() = 'super-admin'::public.user_role);


-- ==============================================================================
-- 5. DOKUMENTASI SCHEMA (POSTGRESQL NATIVE COMMENTS FOR SUPABASE UI)
-- ==============================================================================

COMMENT ON TABLE public.profiles IS 'Tabel profil utama pengguna yang terintegrasi dengan Supabase Auth.';
COMMENT ON COLUMN public.profiles.id IS 'Foreign key merujuk ke auth.users.id.';
COMMENT ON COLUMN public.profiles.role IS 'Role hirarki keanggotaan organisasi.';
COMMENT ON COLUMN public.profiles.is_onboarded IS 'Status apakah pengguna sudah melengkapi data awal onboarding.';
COMMENT ON FUNCTION public.get_my_role() IS 'Helper untuk mengecek role user aktif dengan aman tanpa memicu RLS loop.';
```

---

### 3.2. Configuration Files

#### `next.config.mjs` (Security Headers)

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

#### `.env.local` Example

```env
NEXT_PUBLIC_SUPABASE_URL=[https://your-project.supabase.co](https://your-project.supabase.co)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your-turnstile-site-key

# SERVER ONLY (STRICTLY PRIVATE)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

```

---

### 3.3. Supabase Client Utilities (`@supabase/ssr`)

#### `utils/supabase/server.ts`

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
            // Dipanggil dari Server Component, abaikan jika tidak bisa set cookie
          }
        },
      },
    },
  );
}
```

#### `utils/supabase/client.ts`

```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

---

### 3.4. Next.js 16 Request Interception (`proxy.ts`)

> **Catatan AI Agent:** Menggantikan `middleware.ts` lama. Berfungsi menyegarkan cookie Supabase dan memproteksi rute terautentikasi sebelum request mencapai halaman.

```typescript
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function proxy(request: NextRequest) {
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

  // WAJIB: Gunakan getUser() untuk validasi keamanan server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isAuthRoute =
    request.nextUrl.pathname.startsWith("/login") ||
    request.nextUrl.pathname.startsWith("/register");
  const isProtectedRoute = request.nextUrl.pathname.startsWith("/dashboard");

  // Proteksi Rute: Redirect jika belum login
  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect jika sudah login tetapi membuka halaman login/register
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

### 3.5. Schemas & Actions (Validasi Zod & Auth Handling)

#### `lib/schemas/auth.ts`

```typescript
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid."),
  password: z.string().min(8, "Password minimal 8 karakter."),
  captchaToken: z.string().min(1, "Harap selesaikan verifikasi captcha."),
});

export type LoginInput = z.infer<typeof loginSchema>;
```

#### `app/actions/auth.ts` (Server Action)

```typescript
"use server";

import { createClient } from "@/utils/supabase/server";
import { loginSchema, LoginInput } from "@/lib/schemas/auth";
import { redirect } from "next/navigation";

export async function loginAction(input: LoginInput) {
  // 1. Validasi Input Ketat dengan Zod
  const validation = loginSchema.safeParse(input);
  if (!validation.success) {
    return {
      error: validation.error.errors[0].message,
    };
  }

  const { email, password, captchaToken } = validation.data;
  const supabase = await createClient();

  // 2. Eksekusi Login dengan Turnstile Token (Mencegah Bot / Brute Force)
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
    options: {
      captchaToken,
    },
  });

  if (error) {
    return { error: "Email atau password salah." };
  }

  redirect("/dashboard");
}

// Mencegah BOLA/IDOR: Contoh Mutasi Data
export async function updateProfileName(fullName: string) {
  const supabase = await createClient();

  // 1. Validasi Identitas Pengguna Langsung dari Server Session
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error("Unauthorized");
  }

  // 2. Gunakan user.id hasil verifikasi server, BUKAN dari parameter input client
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", user.id); // <--- BOLA/IDOR Safe

  if (error) {
    return { error: "Gagal memperbarui profil." };
  }

  return { success: true };
}
```

---

### 3.6. Client Component Form Login (`app/login/page.tsx`)

```tsx
'use client';

import { useState } from 'react';
import Turnstile from '@marsidev/react-turnstile';
import { loginAction } from '@/app/actions/auth';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [captchaToken, setCaptchaToken] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    if (!captchaToken) {
      setErrorMsg('Harap selesaikan captcha terlebih dahulu.');
      setLoading(false);
      return;
    }

    const res = await loginAction({ email, password, captchaToken });
    if (res?.error) {
      setErrorMsg(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Login</h1>

      {errorMsg && (
        <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full border p-2 rounded mt-1"
          />
        </div>

        {/* Cloudflare Turnstile Widget */}
        <div className="flex justify-center my-4">
          <Turnstile onSuccess="{(token)" siteKey="{process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!}"> setCaptchaToken(token)}
            onExpire={() => setCaptchaToken('')}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !captchaToken}
          className="w-full bg-blue-600 text-white p-2 rounded disabled:opacity-50"
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>
    </div>
  );
}

```

---

## 4. CHECKLIST SIBER DIBACA OLEH AI AGENT SEBELUM OUTPUT KODE

- [ ] Apakah ada variabel Supabase Service Key yang tidak sengaja bocor/dipanggil di Client Component?
- [ ] Apakah ada Server Action / Route Handler yang memanggil `auth.getSession()` alih-alih `auth.getUser()`?
- [ ] Apakah file middleware menggunakan `proxy.ts` dan fungsi `proxy()` sesuai standar Next.js 16?
- [ ] Apakah ada mutasi database yang menerima `userId` dari argumen function alih-alih `user.id` terverifikasi server?
- [ ] Apakah skema validasi Zod sudah diimplementasikan di semua _entry-point_ data?
- [ ] Apakah ada kueri SQL/Table baru yang belum dibuatkan aturan RLS-nya?
