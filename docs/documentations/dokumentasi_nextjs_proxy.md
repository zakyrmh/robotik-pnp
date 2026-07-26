# Dokumentasi Lengkap Next.js Proxy (`proxy.ts` / `proxy.js`)

> **Catatan Versioning**: Mulai Next.js 16, Konvensi `middleware.ts` secara resmi didepresiasi dan digantikan oleh `proxy.ts` / `proxy.js` (Fitur & fungsionalitas tetap selaras, namun penamaan dan penekanan arsitektural diperbarui).

---

## 1. Ikhtisar & Perubahan Arsitektur (Next.js 16+)

`Proxy` adalah mekanisme eksekusi kode di server **sebelum sebuah HTTP Request diselesaikan**. Berada di lapisan terdepan pipeline request Next.js, `Proxy` memungkinkan pengembang untuk mencegat (_intercept_), mengubah (_modify_), mengarahkan (_redirect_), menyalin route (_rewrite_), atau langsung merespons request sebelum halaman/route handler dirender.

### Perubahan Utama dari Middleware ke Proxy:

- **Penamaan File**: `middleware.ts` / `middleware.js` $\rightarrow$ `proxy.ts` / `proxy.js`.
- **Maksud & Tujuan**: Penamaan "Proxy" memperjelas peran utamanya sebagai _Edge/Server Request Gateway & Interceptor_, menghindari kerancuan dengan Express/Redux middleware.
- **Aturan Tunggal**: Hanya **1 file `proxy.ts`** yang diperbolehkan per proyek (terletak di root proyek atau di dalam folder `src/`).

---

## 2. Kasus Penggunaan (Use Cases) & Batasan (Constraints)

### ✅ Kasus Penggunaan yang Tepat (Recommended):

1. **Pemeriksaan Otorisasi Optimistis**: Redirect cepat berdasarkan presensi token/cookie (misal: proteksi `/dashboard`).
2. **Manipulasi Header & Cookie**: Injeksi _Security Headers_ (CSP, HSTS), `x-forwarded-for`, atau _trace-id_ untuk Microservices.
3. **Programmatic Redirects & Rewrites**: Redirect berdasarkan geolocation, AB Testing, atau _locale_ pengguna.
4. **Multi-tenant / Subdomain Routing**: Dynamic rewrite berdasarkan host request (misal: `tenant.domain.com` $\rightarrow$ `/tenants/tenant`).

### ❌ Anti-Pattern & Batasan Ketat (Avoid):

1. **Pengambilan Data Lambat (Slow Data Fetching)**: Jangan melakukan _query_ database berat atau pemanggilan API eksternal yang memicu latensi tinggi.
2. **Manusia/Satu-satunya Lapisan Keamanan (Sole Auth Solution)**: `Proxy` **bukan** pengganti verifikasi di _Server Actions_ atau _Route Handlers_.
   - _Catatan Penting_: Server Functions/Actions dipanggil melalui HTTP POST ke route terkait. Jika matcher `Proxy` mengecualikan route tersebut, pengecekan auth `Proxy` akan dilewati. Selalu verifikasi auth di dalam Server Action itu sendiri.
3. **Penggunaan Options Cache pada `fetch`**: Opsi `cache`, `next.revalidate`, atau `next.tags` pada fungsi `fetch()` **TIDAK memiliki efek** di dalam `Proxy`.
4. **Shared Global State**: `Proxy` dieksekusi secara terisolasi. Jangan bergantung pada variabel global/module state yang dibagikan antar request.

---

## 3. Konvensi Berkas & Lokasi (File Conventions)

- **Nama Berkas**: `proxy.ts` atau `proxy.js` (Atau `proxy.page.ts` jika `pageExtensions` dikustomisasi pada `next.config.js`).
- **Lokasi**: Level akar proyek (`/proxy.ts`) atau di dalam folder `src` (`/src/proxy.ts`). Harus sejajar dengan folder `app` atau `pages`.
- **Modularisasi**: Walaupun hanya ada 1 file `proxy.ts`, logika dapat dipecah menjadi beberapa sub-modul internal dan di-import ke `proxy.ts` utama.

```text
my-app/
├── src/
│   ├── app/
│   ├── lib/
│   │   └── proxy/
│   │       ├── authGuard.ts
│   │       └── headerInjector.ts
│   └── proxy.ts  <-- Entry point tunggal Proxy
└── package.json
```

---

## 4. Spesifikasi API & Export Syntax

File `proxy.ts` harus mengeksport fungsi utama (baik via **Named Export** `proxy` atau **Default Export**) dan opsional meng-export objek `config`.

### Signature Tipe TypeScript:

```typescript
import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent, NextProxy } from "next/server";

// Opsi A: Named Export dengan tipe terpisah
export async function proxy(request: NextRequest, event: NextFetchEvent) {
  // Logika Proxy
  return NextResponse.next();
}

// Opsi B: Menggunakan helper type NextProxy (Infers request & event)
export const proxy: NextProxy = async (request, event) => {
  event.waitUntil(
    // Asynchronous task (misal: logging background)
    Promise.resolve(),
  );
  return NextResponse.next();
};

// Opsi C: Default Export
// export default function proxy(request: NextRequest) { ... }
```

---

## 5. Konfigurasi Matcher (Path Matching)

`matcher` dalam objek `config` menentukan route mana saja yang akan memicu eksekusi `Proxy`.

> **Aturan Wajib**: Nilai `matcher` harus berupa **Konstanta Literal Statis** agar dapat dianalisis saat proses _build-time_. Variabel dinamis tidak didukung.

### 5.1 Syntax String & Regular Expression

```typescript
export const config = {
  // Array string route atau pattern regex
  matcher: [
    "/dashboard/:path*",
    "/api/v1/:path*",
    // Negative Matcher Pattern (Exclusion)
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)",
  ],
};
```

#### Modifier Path Parameter:

- `:path` $\rightarrow$ _Single segment_ (mencakup `/about/a`, tapi bukan `/about/a/b`).
- `:path*` $\rightarrow$ _Zero or more segments_ (mencakup `/about`, `/about/a`, `/about/a/b`).
- `:path+` $\rightarrow$ _One or more segments_.
- `:path?` $\rightarrow$ _Zero or one segment_.

### 5.2 Advanced Object Matcher (`has`, `missing`, `locale`)

Mencocokkan request berdasarkan Keberadaan/Ketiadaan Header, Cookie, atau Query Parameter:

```typescript
export const config = {
  matcher: [
    {
      source: "/api/:path*",
      locale: false, // Mengabaikan i18n locale routing
      has: [
        { type: "header", key: "Authorization", value: "Bearer (?<token>.*)" },
        { type: "query", key: "userId", value: "123" },
      ],
      missing: [{ type: "cookie", key: "session", value: "active" }],
    },
  ],
};
```

---

## 6. Urutan Eksekusi (Execution Order Pipeline)

Saat HTTP request masuk, Next.js mengeksekusi tahapan berikut secara berurutan:

1. **`headers`** dari `next.config.js`
2. **`redirects`** dari `next.config.js`
3. **`Proxy`** (`proxy.ts` — rewrites, redirects, header injection)
4. **`beforeFiles`** rewrites dari `next.config.js`
5. **Filesystem Routes** (`public/`, `_next/static/`, `app/`, `pages/`)
6. **`afterFiles`** rewrites dari `next.config.js`
7. **Dynamic Routes** (misal: `/blog/[slug]`)
8. **`fallback`** rewrites dari `next.config.js`

---

## 7. Runtime & Flags Konfigurasi Tingkat Lanjut

### Runtime

- `Proxy` secara default menggunakan **Node.js Runtime**.
- **Peringatan**: Pengaturan `export const runtime` di dalam file `proxy.ts` **tidak didukung** dan akan menyebabkan _build error_.

### Advanced Flags (`next.config.js`)

1. **`skipTrailingSlashRedirect`**:
   Mencegah Next.js melakukan redirect bawaan untuk penambahan/penghapusan _slash_ di akhir URL. Memungkinkan kustomisasi aturan _trailing slash_ di dalam `proxy.ts`.

   ```typescript
   // next.config.ts
   import type { NextConfig } from "next";

   const nextConfig: NextConfig = {
     skipTrailingSlashRedirect: true,
   };
   export default nextConfig;
   ```

2. **`skipProxyUrlNormalize`**:
   Lumpuhkan normalisasi URL otomatis Next.js untuk mempertahankan URL mentah asal pada _client transition_ dan kunjungan langsung.

   ```typescript
   // next.config.ts
   const nextConfig: NextConfig = {
     skipProxyUrlNormalize: true,
   };
   export default nextConfig;
   ```

---

## 8. Pola Implementasi Tingkat Lanjut (Production Patterns)

### Pattern 1: Modular Multi-Handler Proxy

Menjaga `proxy.ts` tetap bersih dengan komposisi sub-handler.

```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handleAuth } from "@/lib/proxy/auth";
import { handleHeaders } from "@/lib/proxy/headers";

export async function proxy(request: NextRequest) {
  // 1. Cek Autentikasi
  const authResponse = await handleAuth(request);
  if (authResponse) return authResponse;

  // 2. Injeksi Header & Lanjutkan
  const response = NextResponse.next();
  return handleHeaders(request, response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

### Pattern 2: Context Passing ke Server Component / Route Handler

Mengirimkan data dari `Proxy` ke aplikasi menggunakan Custom Request Headers (`x-*`).

```typescript
// src/proxy.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);

  // Ambil data tenant/user dari token atau hostname
  const tenantId = request.headers.get("x-tenant-id") || "default-tenant";
  requestHeaders.set("x-tenant-id", tenantId);

  // Teruskan header baru ke App Router / Route Handler
  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

---

## 9. Panduan Khusus untuk AI Agent (LLM / Agent Rules)

Bagi Agent AI yang membaca atau membuat kode berbasis Next.js Proxy, patuhi aturan validasi berikut:

1. **File Naming & Path Check**:
   - Selalu buat/edit file bernama `proxy.ts` atau `proxy.js` di root atau `src/`.
   - **Jangan pernah** menyarankan pembuat file `middleware.ts` untuk Next.js 16+.

2. **Matcher Precision**:
   - Selalu sertakan _Negative Matcher_ untuk mengecualikan `_next/static`, `_next/image`, dan file statis (`favicon.ico`, `*.png`, `*.jpg`, dll.), agar assets tidak terblokir.
   - Pastikan `matcher` didefinisikan sebagai _literal value_ (bukan variabel dinamis/fungsi).

3. **Response Primitives**:
   - Gunakan `NextResponse.redirect(url)` untuk perpindahan URL HTTP 307/308.
   - Gunakan `NextResponse.rewrite(url)` jika ingin mengubah tampilan tanpa mengubah URL di browser.
   - Gunakan `NextResponse.next()` jika hanya menambahkan header/cookie.

4. **Security Notice**:
   - Jangan pernah mengandalkan `proxy.ts` sebagai satu-satunya _guard_ untuk Server Actions (`'use server'`). Ingatkan pengguna untuk selalu memvalidasi autentikasi/otorisasi di dalam Server Action itu sendiri.
