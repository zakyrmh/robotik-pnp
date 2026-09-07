# Panduan Pemantauan Kesehatan Aplikasi Waktu-Nyata (Real-Time Monitoring & Application Health Setup Guide)

**Sistem Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                                   |
| :------------------------------------ | :-------------------------------------------------------------------------------------- |
| **ID Dokumen**                        | `DOC-TST-MON-01`                                                                        |
| **Versi Dokumen**                     | `v2.0.0` (Operational Production-Ready Release)                                         |
| **Tanggal Efektif**                   | 9 Agustus 2026                                                                          |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas)                                 |
| **Induk Kebijakan (_Master Policy_)** | _System Maintenance & Operational Continuity Policy_ (Bagian dari ISMS UKM Robotik PNP) |
| **Pemilik Dokumen (_Owner_)**         | Tim IT & Software Architecture UKM Robotik PNP                                          |
| **Penyetuju Dokumen (_Approver_)**    | Ketua Umum & Pembina UKM Robotik PNP                                                    |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                            |

### Riwayat Perubahan Dokumen (_Change History_)

|  Versi   |  Tanggal   | Penulis         | Ringkasan Perubahan                                                            |
| :------: | :--------: | :-------------- | :----------------------------------------------------------------------------- |
| `v1.0.0` | 02/08/2026 | DevOps Engineer | Draf awal panduan monitoring Sentry, Supabase Logs, dan Cloudflare WAF.        |
| `v2.0.0` | 09/08/2026 | System Analyst  | Revisi: Penambahan Document Control, standardisasi format, dan penutup formal. |

---

## 1. Pendahuluan & Ruang Lingkup

Dokumen ini berisi panduan teknis konfigurasi pemantauan kesehatan aplikasi (_application health monitoring_), pelacakan _error real-time_ menggunakan **Sentry**, analisis log performa/API di **Supabase Logs**, serta deteksi serangan bot dan mitigasi ancaman pada **Cloudflare WAF** untuk **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 2. Real-Time Error Tracking dengan Sentry (`@sentry/nextjs`)

Sentry digunakan untuk menangkap _unhandled exceptions_, kegagalan Server Actions, dan _performance spans_ secara otomatis baik di sisi client maupun server.

### 2.1. Konfigurasi Sentry pada Next.js 16 (`instrumentation.ts`)

File `instrumentation.ts` di-hook pada Next.js App Router untuk menangkap error di level runtime:

```typescript
// instrumentation.ts
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: false,
      environment: process.env.NODE_ENV,
    });
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      environment: process.env.NODE_ENV,
    });
  }
}

export const onRequestError = Sentry.captureRequestError;
```

---

### 2.2. Penangkapan Error Manual pada Server Actions

Setiap Server Action kritis (seperti `submitAttendanceAction` atau `registerCaangAction`) dikelilingi blok `try-catch` dengan integrasi capture Sentry:

```typescript
// Example: Capturing Server Action Exceptions
"use server";

import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/server";

export async function submitAttendanceAction(payload: unknown) {
  try {
    const supabase = await createClient();
    // ... Database query logic
  } catch (error) {
    // 1. Kirim Error Context & Stack Trace ke Sentry Dashboard
    Sentry.captureException(error, {
      extra: {
        action: "submitAttendanceAction",
        payload,
      },
    });

    return {
      success: false,
      error:
        "Terjadi kesalahan sistem internal. Tim pengembang telah dinotifikasi.",
    };
  }
}
```

---

## 3. Pemantauan Database & API via Supabase Logs

Supabase Dashboard menyediakan _Real-time Log Explorer_ berbasis kueri SQL/LQL untuk memantau aktivitas PostgREST API, autentikasi, dan PostgreSQL database engine.

### 3.1. Memantau Error Autentikasi & RLS Violation (Log Explorer Queries)

Gunakan query berikut pada **Supabase Dashboard** $\rightarrow$ **Logs** $\rightarrow$ **Postgres / API Logs**:

#### Query 1: Mendeteksi Pelanggaran RLS (Error Code 42501)

```sql
-- Mencari percobaan query yang diblokir oleh RLS Policy
select
  timestamp,
  event_message,
  parsed.error_severity,
  parsed.user_name
from
  postgres_logs
where
  event_message like '%row-level security%'
order by
  timestamp desc
limit 50;
```

#### Query 2: Mendeteksi API Request Berlatensi Tinggi (> 500ms)

```sql
-- Memantau endpoint PostgREST yang mengalami penurunan performa
select
  timestamp,
  event_message,
  parsed.request.method,
  parsed.request.path,
  parsed.response.status_code
from
  api_logs
where
  parsed.response.status_code >= 400
order by
  timestamp desc
limit 50;
```

---

## 4. Analisis Log Cloudflare untuk Deteksi Serangan Bot & Brute Force

Cloudflare bertindak sebagai benteng pertahanan terdepan (WAF & DDoS Protection) untuk domain `ukmrobotik-pnp.or.id`.

### 4.1. Membaca Metric Security Events (Cloudflare Dashboard)

1. Navigasi ke **Cloudflare Dashboard** $\rightarrow$ **Security** $\rightarrow$ **Events**.
2. Filter tampilan berdasarkan **Action Taken**: `Block`, `Managed Challenge`, `JS Challenge`.

---

### 4.2. Indikator Serangan Bot & Anomali Trafik

| Indikator Anomali                  | Pola Log Cloudflare                                                   | Potensi Ancaman                                | Tindakan Mitigasi Otomatis                               |
| ---------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------- | -------------------------------------------------------- |
| **High Threat Score (> 20)**       | `cf.threat_score > 20`                                                | Botnet Automated Scanner / Vulnerability Probe | Memicu **Managed Challenge** (Turnstile Captcha).        |
| **Lonjakan Request POST Berulang** | $> 100\text{ req/menit}$ dari IP tunggal ke `/login` atau `/register` | Brute Force Attack / Credential Stuffing       | Ditahan oleh **Upstash Rate Limiting** + WAF Rule Block. |
| **Akses Luar Wilayah Indonesia**   | `ip.geoip.country ne "ID"` pada path `/admin/*`                       | Unauthorized Cross-Border Access               | WAF Custom Rule **Block** otomatis.                      |

---

### 4.3. Menambahkan Custom WAF Rate Limiting Rule

Jika terdeteksi lonjakan bot pada endpoint presensi:

```text
Expression: (http.request.uri.path contains "/kegiatan-absensi-caang/scan" and http.request.method eq "POST")
Action: Rate Limit (Maksimal 10 requests per 1 menit per Client IP)
Response: Block dengan HTTP Status 429 Too Many Requests
```

---

## 5. Operational Maintenance Checklist

1. **[ ] Harian**: Periksa **Sentry Unhandled Issues** (Target: 0 new critical bugs).
2. **[ ] Mingguan**: Periksa **Supabase Slow Queries** dan atasi query yang membutuhkan indexing.
3. **[ ] Bulanan**: Review **Cloudflare Security Threat Matrix** untuk penyesuaian aturan WAF.

---

_Dokumen ini diterbitkan sebagai standar panduan pemantauan kesehatan aplikasi & deteksi ancaman resmi untuk UKM Robotik Politeknik Negeri Padang._
