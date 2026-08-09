# Supabase Edge Functions Guide

Panduan teknis mendalam mengenai arsitektur, pengembangan, autentikasi, dan pengintegrasian **Supabase Edge Functions** berbasis runtime **Deno** dan **TypeScript**.

---

## 1. Arsitektur & Lingkungan Runtime (Deno Engine)

Supabase Edge Functions adalah fungsi serverless berbasis runtime **Deno** yang dieksekusi secara terdistribusi global di jaringan edge (dekat dengan pengguna) untuk latency minimum dan _cold-start_ hampir nol.

### Karakteristik Utama Deno Runtime

- **TypeScript First**: Dukungan native TypeScript tanpa perlu konfigurasi build atau transpiler tambahan (`tsconfig`).
- **Web Standard APIs**: Menggunakan standar Web API seperti `fetch`, `Request`, `Response`, `Web Crypto`, dan `URL`.
- **Import Modules**: Menggunakan URL import (misal: `https://esm.sh/...`) atau spesifikasi NPM (`npm:@supabase/supabase-js@2`).

### Struktur Direktori Standar

```text
my-project/
├── supabase/
│   ├── config.toml
│   └── functions/
│       ├── _shared/             # Helper / modul bersama (CORS, DB Client)
│       │   ├── cors.ts
│       │   └── supabase-client.ts
│       ├── process-payment/     # Endpoint: /functions/v1/process-payment
│       │   └── index.ts
│       └── send-email/          # Endpoint: /functions/v1/send-email
│           └── index.ts

```

---

## 2. Implementasi Dasar & Penanganan CORS

Setiap Edge Function dieksekusi menggunakan handler `Deno.serve()`. Karena Edge Functions sering dipanggil dari browser, penanganan **CORS (Cross-Origin Resource Sharing)** dan request `OPTIONS` (preflight) wajib dikonfigurasi.

### 2.1. Helper CORS (`supabase/functions/_shared/cors.ts`)

```typescript
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS, PUT, DELETE",
};
```

### 2.2. Template Edge Function (`supabase/functions/process-payment/index.ts`)

```typescript
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  // 1. Tangani Request Preflight CORS (OPTIONS)
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. Parse Body Request
    const { orderId, amount } = await req.json();

    if (!orderId || !amount) {
      return new Response(
        JSON.stringify({ error: "orderId dan amount wajib diisi." }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 3. Logika Bisnis / Integrasi Third-Party (misal: Midtrans / Stripe)
    const result = { success: true, transactionId: `trx_${Date.now()}` };

    // 4. Kirim Response
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

---

## 3. Autentikasi & Otorisasi Pengguna

Secara default, Supabase Edge Functions memverifikasi header `Authorization: Bearer <JWT_TOKEN>`.

### 3.1. Membaca Identity User Terautentikasi

Untuk menjalankan kueri database sesuai identitas dan aturan RLS pengguna yang memanggil fungsi:

```typescript
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 1. Ambil JWT dari Header Authorization
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }

  // 2. Inisialisasi Supabase Client dengan token user (Menerapkan RLS)
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } },
  );

  // 3. Dapatkan data user tervalidasi
  const {
    data: { user },
    error: userError,
  } = await supabaseClient.auth.getUser();

  if (userError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized user token" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // 4. Eksekusi query berbasis user (terikat RLS)
  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return new Response(
    JSON.stringify({ message: `Hello ${profile?.full_name}` }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
```

### 3.2. Menggunakan Service Role Key (Bypass RLS)

Untuk tugas administratif khusus (seperti migrasi data internal atau sinkronisasi webhook):

```typescript
// PENTING: Gunakan hanya untuk operasi internal tepercaya!
const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);
```

---

## 4. Environment Variables & Secrets Management

Supabase menyediakan beberapa variabel lingkungan bawaan secara otomatis:

- `SUPABASE_URL`: Endpoint API proyek Supabase.
- `SUPABASE_ANON_KEY`: Kunci anonim publik.
- `SUPABASE_SERVICE_ROLE_KEY`: Kunci rahasia administratif.
- `SUPABASE_DB_URL`: Connection string PostgreSQL.

### Mengelola Custom Secrets via Supabase CLI

```bash
# 1. Menambahkan / memperbarui Secret di Cloud
supabase secrets set MIDTRANS_SERVER_KEY="SB-Mid-server-xxxx" RESEND_API_KEY="re_12345"

# 2. Melihat daftar Secrets yang terdaftar
supabase secrets list

# 3. Mengakses Secret di dalam Edge Function (TypeScript)
const apiKey = Deno.env.get('RESEND_API_KEY');

```

---

## 5. Pola Integrasi Pemanggilan (Invocation Patterns)

### 5.1. Pemanggilan dari Next.js Client Component / SDK

```typescript
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

async function handlePayment() {
  const { data, error } = await supabase.functions.invoke("process-payment", {
    body: { orderId: "ord_999", amount: 150000 },
  });

  if (error) {
    console.error("Edge Function Error:", error.message);
    return;
  }

  console.log("Function Result:", data);
}
```

### 5.2. Pemanggilan dari Next.js Server Action / Server Component

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";

export async function triggerEmailNotification(userId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.functions.invoke("send-email", {
    body: { userId, template: "welcome" },
  });

  if (error) throw new Error(`Gagal mengirim email: ${error.message}`);
  return data;
}
```

### 5.3. Pemanggilan via Database Webhook (PostgreSQL Trigger)

Edge Functions dapat dipicu secara otomatis dari event perubahan data tabel PostgreSQL (`INSERT`, `UPDATE`, `DELETE`).

1. Masuk ke **Supabase Dashboard** $\rightarrow$ **Database** $\rightarrow$ **Webhooks**.
2. Buat Webhook baru:

- **Table**: `public.orders`
- **Events**: `INSERT`
- **Type**: `Supabase Edge Functions`
- **Edge Function**: `process-payment`

---

## 6. Best Practices & Limitasi

1. **Versikan Impor Modul External**: Selalu kunci versi modul impor external (misal: `https://esm.sh/lodash-es@4.17.21`).
2. **Batas Waktu Eksekusi (Timeout)**: Edge Functions dirancang untuk eksekusi cepat (maksimal **150 detik** runtime). Untuk _heavy background processing_, pertimbangkan sistem antrean.
3. **Penyimpanan Memori & Ukuran Payload**: Batas memori default adalah **256 MB**. Hindari memproses file binary raksasa langsung di memori Edge Function.
4. **Verifikasi JWT Publik**: Jika Edge Function dimaksudkan publik tanpa login (misal: webhook callback dari payment gateway), aktifkan flag `--no-verify-jwt` saat deployment CLI.

```

### Ringkasan Isi File `docs/08-tech-references/backend-services/edge-functions-guide.md`:

1. **Arsitektur Deno & Structure**: Penjelasan Deno engine, *zero cold-start*, native TypeScript support, dan struktur folder `supabase/functions/`.
2. **CORS & Handler Setup**: Konfigurasi header CORS dan penanganan preflight `OPTIONS` request.
3. **Auth & RLS Context**:
   - Membaca user JWT via `Authorization` header agar kueri database mengikuti Row Level Security (RLS).
   - Penggunaan `SUPABASE_SERVICE_ROLE_KEY` untuk operasi bypass RLS internal.
4. **Secrets & Env Vars**: Pengelolaan variabel lingkungan dan perintah Supabase CLI `secrets set`.
5. **Invocation Patterns**:
   - Pemanggilan via Next.js Client Component (`supabase.functions.invoke`).
   - Pemanggilan via Server Action (`'use server'`).
   - Integrasi otomatis via Database Webhooks.
6. **Best Practices & Limits**: Penjelasan timeout, memory limits, dan verifikasi JWT.
```
