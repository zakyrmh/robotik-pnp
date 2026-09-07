# Cloudflare WAF, Turnstile CAPTCHA & DNS Integration Guide

Panduan teknis integrasi **Cloudflare** untuk pengamanan dan optimasi infrastruktur **Next.js 16 (App Router)** pada **Sistem Informasi Manajemen UKM Robotik PNP**, mencakup konfigurasi DNS, Web Application Firewall (WAF), dan Cloudflare Turnstile CAPTCHA.

---

## 1. Setup DNS & SSL/TLS Encryption

### 1.1. Konfigurasi Proxy Mode (Orange Cloud)

Agar seluruh trafik terlindungi oleh Cloudflare Edge Security (WAF, DDoS Protection, dan CDN), setiap DNS record utama wajib diatur ke mode **Proxied** (Ikon Awan Oranye).

| Type    | Name       | Target / Value             | Proxy Status           | Fungsi / Keterangan                                             |
| :------ | :--------- | :------------------------- | :--------------------- | :-------------------------------------------------------------- |
| `A`     | `@`        | `103.xx.xx.xx` (Server IP) | **Proxied (Oranye)**   | Root domain (`ukmrobotik-pnp.or.id`)                            |
| `CNAME` | `www`      | `ukmrobotik-pnp.or.id`     | **Proxied (Oranye)**   | Subdomain WWW                                                   |
| `CNAME` | `supabase` | `xxxx.supabase.co`         | **DNS Only (Abu-abu)** | Direct API connection (jika menggunakan custom domain Supabase) |

---

### 1.2. Mode Enkripsi SSL/TLS

Navigasi ke **SSL/TLS** $
ightarrow$ **Overview**:

- Pilih mode **Full (Strict)**. Mode ini menjamin enkripsi _end-to-end_ dari browser pengguna ke Cloudflare Edge, dan dari Cloudflare Edge ke Origin Server (wajib memiliki sertifikat SSL yang valid di Origin Server).

---

## 2. Web Application Firewall (WAF) & Security Rules

### 2.1. Managed Rulesets & OWASP Protection

Navigasi ke **Security** $
ightarrow$ **WAF** $
ightarrow$ **Managed Rules**:

1. Aktifkan **Cloudflare Managed Ruleset** (Atur Action ke `Block`).
2. Aktifkan **Cloudflare OWASP Core Ruleset**:
   - Set _Sensitivity Level_ ke `Medium`.
   - Set _Action_ ke `Block` untuk skor ancaman (_anomaly score_) tinggi.

---

### 2.2. Custom WAF Security Rules

#### Rule 1: Proteksi Endpoint Admin / Private Routes dari Luar Indonesia

```text
Expression: (http.request.uri.path contains "/admin" and ip.geoip.country ne "ID")
Action: Block
```

#### Rule 2: Proteksi Endpoint Form submission / Server Actions dari High Threat Score

```text
Expression: (http.request.method eq "POST" and cf.threat_score gt 15)
Action: Managed Challenge
```

---

## 3. Cloudflare Turnstile CAPTCHA Integration

**Cloudflare Turnstile** adalah alternatif CAPTCHA modern dan ramah privasi yang bekerja secara otomatis tanpa mengganggu pengalaman pengguna (_non-interactive smart challenge_).

### 3.1. Konfigurasi Site Key & Secret Key

1. Buka **Cloudflare Dashboard** $
ightarrow$ **Turnstile**.
2. Klik **Add Site**:
   - **Site Name**: `UKM Robotik PNP Website`
   - **Domain**: `localhost`, `ukmrobotik-pnp.or.id`
   - **Widget Mode**: `Managed` (Sangat direkomendasikan).
3. Simpan pasangan kunci ke file `.env.local`:
   - `NEXT_PUBLIC_TURNSTILE_SITE_KEY` (Public - untuk client widget)
   - `TURNSTILE_SECRET` (Private - untuk verifikasi server-side)

---

## 4. Implementasi pada Next.js 16 (Client Widget & Server Verification)

### 4.1. Client Widget Component (`components/shared/turnstile-widget.tsx`)

```tsx
"use client";

import { useEffect, useRef } from "react";

type TurnstileWidgetProps = {
  onVerify: (token: string) => void;
  onError?: () => void;
  onExpire?: () => void;
};

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: string | HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          "error-callback"?: () => void;
          "expired-callback"?: () => void;
          theme?: "light" | "dark" | "auto";
        },
      ) => string;
      reset: (widgetId: string) => void;
    };
  }
}

export function TurnstileWidget({
  onVerify,
  onError,
  onExpire,
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    const scriptId = "cf-turnstile-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src =
        "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const renderWidget = () => {
      if (window.turnstile && containerRef.current && !widgetIdRef.current) {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY!,
          callback: onVerify,
          "error-callback": onError,
          "expired-callback": onExpire,
          theme: "auto",
        });
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      script.addEventListener("load", renderWidget);
    }

    return () => {
      script.removeEventListener("load", renderWidget);
    };
  }, [onVerify, onError, onExpire]);

  return <div ref={containerRef} className="my-4" />;
}
```

---

### 4.2. Server Verification Function (`lib/turnstile.ts`)

Verifikasi token Turnstile di sisi server (Server Actions / Route Handlers) menggunakan endpoint verifikasi Cloudflare:

```typescript
type TurnstileVerifyResponse = {
  success: boolean;
  "error-codes": string[];
  challenge_ts?: string;
  hostname?: string;
};

export async function verifyTurnstileToken(
  token: string,
  clientIp?: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET;

  if (!secretKey) {
    console.error(
      "TURNSTILE_SECRET belum dikonfigurasi di environment variables.",
    );
    return false;
  }

  const formData = new URLSearchParams();
  formData.append("secret", secretKey);
  formData.append("response", token);
  if (clientIp) {
    formData.append("remoteip", clientIp);
  }

  try {
    const res = await fetch(
      "https://challenges.cloudflare.com/turnstile/v0/siteverify",
      {
        method: "POST",
        body: formData,
        headers: {
          "content-type": "application/x-www-form-urlencoded",
        },
      },
    );

    const data: TurnstileVerifyResponse = await res.json();
    return data.success;
  } catch (error) {
    console.error("Turnstile verification request failed:", error);
    return false;
  }
}
```

---

### 4.3. Implementasi pada Next.js 16 Server Action

```tsx
// lib/actions/auth.ts
"use server";

import { verifyTurnstileToken } from "@/lib/turnstile";
import { headers } from "next/headers";

export async function loginWithCaptchaAction(formData: FormData) {
  const token = formData.get("cf-turnstile-response") as string;
  const headerList = await headers();
  const clientIp =
    headerList.get("x-forwarded-for")?.split(",")[0] || undefined;

  if (!token) {
    return { success: false, error: "Token Turnstile tidak ditemukan." };
  }

  // 1. Verifikasi Token Turnstile di Server
  const isValidCaptcha = await verifyTurnstileToken(token, clientIp);
  if (!isValidCaptcha) {
    return {
      success: false,
      error: "Verifikasi keamanan Turnstile gagal atau kedaluwarsa.",
    };
  }

  // 2. Lanjutkan proses otentikasi...
  return { success: true, message: "Verifikasi berhasil!" };
}
```

---

## 5. Security Checklist & Best Practices

1. **Amankan `TURNSTILE_SECRET`**: Jangan pernah membocorkan `TURNSTILE_SECRET` ke client bundle (`NEXT_PUBLIC_`).
2. **One-Time Token**: Token Turnstile hanya berlaku satu kali. Jika verifikasi form gagal, minta widget untuk melakukan reset token.
3. **Defense-in-Depth**: Kombinasikan Cloudflare WAF + Turnstile CAPTCHA + Upstash Rate Limiting untuk perlindungan optimal terhadap serangan brute force dan botnet.
