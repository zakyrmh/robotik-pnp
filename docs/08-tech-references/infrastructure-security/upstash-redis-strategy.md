# Upstash Redis Caching & Rate Limiting Strategy Guide

Panduan teknis mengenai penerapan **Upstash Redis** pada aplikasi **Next.js 16** (Sistem Informasi Manajemen UKM Robotik PNP), mencakup pola penamaan kunci (_key naming conventions_), strategi _caching_, dan proteksi _rate limiting_ berbasis HTTP/REST client.

---

## 1. Arsitektur Upstash Redis di Serverless & Edge

Upstash Redis dirancang khusus untuk arsitektur _serverless_ dan _edge computing_ (Next.js App Router, Server Actions, dan Edge Functions). Berbeda dari Redis tradisional berbasis TCP persistent connection, `@upstash/redis` menggunakan **HTTP/REST protocol** yang memiliki keuntungan:

- **Zero Connection Overhead**: Bebas dari masalah kehabisan koneksi (_connection exhaustion_) saat terjadi lonjakan _serverless cold start_.
- **Edge Compatible**: Dapat berjalan secara _native_ di V8 Edge Runtime, Middleware, dan Node.js runtime.

### Instalasi Packages

```bash
npm install @upstash/redis @upstash/ratelimit
```

---

## 2. Konvensi Penamaan Key (Key Naming Pattern)

Penggunaan penamaan _key_ terstruktur menggunakan pemisah titik dua (`:`) memudahkan pengelompokan (_namespacing_), pembacaan metrics, serta pembersihan cache (_cache invalidation/flushing_).

### Standar Pola Namespace UKM Robotik PNP

```text
ukmrobotik:<environment>:<domain>:<entity>:<identifier>
```

| Tipe Key              | Pattern Format                                  | Contoh Real                                 | TTL Direkomendasikan             |
| :-------------------- | :---------------------------------------------- | :------------------------------------------ | :------------------------------- |
| **Data Cache (Item)** | `ukmrobotik:cache:<entity>:<id>`                | `ukmrobotik:cache:inventory:inv_102`        | 300 - 3600 detik (5m - 1j)       |
| **Data Cache (List)** | `ukmrobotik:cache:<entity>:list`                | `ukmrobotik:cache:members:active_list`      | 600 detik (10m)                  |
| **Rate Limit IP**     | `ukmrobotik:ratelimit:<action>:ip:<ip_address>` | `ukmrobotik:ratelimit:login:ip:103.20.14.2` | Sesuai Sliding Window (1m - 10m) |
| **Rate Limit User**   | `ukmrobotik:ratelimit:<action>:user:<user_id>`  | `ukmrobotik:ratelimit:borrow:user:usr_882`  | Sesuai Sliding Window (1j - 24j) |
| **Session / Token**   | `ukmrobotik:session:<user_id>`                  | `ukmrobotik:session:usr_882`                | 86400 detik (24j)                |

---

## 3. Strategi Caching Data

### 3.1. Inisialisasi Redis Client (`lib/redis.ts`)

```typescript
import { Redis } from "@upstash/redis";

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});
```

---

### 3.2. Pola Cache-Aside (Read-Through)

Pola ini memeriksa ketersediaan data di Upstash Redis terlebih dahulu. Jika _cache miss_, data diambil dari Supabase PostgreSQL, disimpan ke Redis dengan TTL (Time To Live), lalu dikembalikan ke pemanggil.

```typescript
// lib/data/inventory.ts
import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";

export type InventoryItem = {
  id: string;
  name: string;
  stock: number;
  condition: "good" | "damaged" | "maintenance";
};

export async function getInventoryList(): Promise<InventoryItem[]> {
  const cacheKey = "ukmrobotik:cache:inventory:list";
  const CACHE_TTL_SECONDS = 600; // 10 menit

  // 1. Cek Cache di Redis
  const cachedData = await redis.get<InventoryItem[]>(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  // 2. Cache Miss -> Query ke Supabase Database
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("inventory")
    .select("id, name, stock, condition")
    .order("name");

  if (error || !data) {
    throw new Error("Gagal mengambil data inventaris peralatan");
  }

  // 3. Simpan Hasil Query ke Redis dengan TTL
  await redis.set(cacheKey, JSON.stringify(data), { ex: CACHE_TTL_SECONDS });

  return data as InventoryItem[];
}
```

---

### 3.3. Invalidasi Cache saat Mutasi Data (Server Action)

Setiap kali data diubah (_insert/update/delete_), key cache terkait harus dihapus (_eviction_) agar data di UI tetap konsisten.

```typescript
// lib/actions/inventory.ts
"use server";

import { redis } from "@/lib/redis";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateItemStock(itemId: string, newStock: number) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("inventory")
    .update({ stock: newStock })
    .eq("id", itemId);

  if (error) {
    return { success: false, message: error.message };
  }

  // Invalidasi Cache Redis Terkait
  await redis.del("ukmrobotik:cache:inventory:list");
  await redis.del(`ukmrobotik:cache:inventory:${itemId}`);

  revalidatePath("/inventory");
  return { success: true };
}
```

---

## 4. Strategi Rate Limiting (Proteksi Anti-Abuse & DDoS)

Menggunakan package `@upstash/ratelimit` yang mendukung algoritma **Sliding Window**, **Fixed Window**, dan **Token Bucket**.

### 4.1. Inisialisasi Rate Limiter (`lib/ratelimit.ts`)

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "./redis";

// 1. Limiter Form Publik / Registration (Maksimal 5 request per 10 menit per IP)
export const publicFormRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, "10 m"),
  analytics: true,
  prefix: "ukmrobotik:ratelimit:form",
});

// 2. Limiter API / Server Actions Interaktif (Maksimal 30 request per 1 menit per User)
export const apiActionRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(30, "1 m"),
  analytics: true,
  prefix: "ukmrobotik:ratelimit:api",
});
```

---

### 4.2. Penerapan Rate Limiting pada Next.js Server Action

```typescript
// lib/actions/member-registration.ts
"use server";

import { publicFormRatelimit } from "@/lib/ratelimit";
import { headers } from "next/headers";

export async function registerMemberAction(formData: FormData) {
  // Ambil IP pengunjung dari Request Headers
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0] || "127.0.0.1";

  // Jalankan Penilaian Rate Limit
  const { success, limit, remaining, reset } =
    await publicFormRatelimit.limit(clientIp);

  if (!success) {
    const retryAfterSeconds = Math.ceil((reset - Date.now()) / 1000);
    return {
      success: false,
      error: `Batas percobaan pendaftaran terlampaui. Silakan coba lagi dalam ${retryAfterSeconds} detik.`,
    };
  }

  // Lanjutkan proses pendaftaran...
  return { success: true, message: "Pendaftaran berhasil dikirim!" };
}
```

---

## 5. Ringkasan Best Practices

1. **Gunakan Algoritma Sliding Window**: Mencegah _traffic spike_ pada titik pergantian jendela waktu (_window boundary_).
2. **Kunci Pemisahan Environment**: Sertakan prefix nama proyek `ukmrobotik:` agar tidak bentrok jika Redis instance dipakai bersama oleh aplikasi lain.
3. **Wajib Menentukan TTL pada Cache**: Jangan menyimpan cache tanpa batas waktu (_infinite TTL_) untuk menghindari masalah memori dan data usang (_stale data_).
4. **Strategi Identifikasi**: Gunakan `x-forwarded-for` / IP address untuk pengguna _unauthenticated_, dan `user_id` untuk pengguna terautentikasi.
