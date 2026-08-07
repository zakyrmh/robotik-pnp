# Prompt Library for Debugging & Troubleshooting Guide

Dokumen ini berisi koleksi **template prompt efektif** yang dapat digunakan oleh tim pengembang maupun diintegrasikan sebagai konteks bagi **AI Agent** saat melakukan _debugging_, _error handling_, dan optimasi arsitektur pada aplikasi **Sistem Informasi Manajemen UKM Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## Template 1: Systematic Error Diagnosis

```markdown
Saya mengalami error di Next.js 16 dengan detail berikut:

**Error Message:**
[Paste error message lengkap di sini, termasuk stack trace]

**Konteks:**

- Versi Next.js: 16.x.x
- Versi React: 19.x
- Runtime: [Node.js / Edge Runtime / Serverless]
- Mode: [Development / Production / Static Export]

**File yang Terkait:**

- File path: [e.g., app/page.tsx]
- Route type: [Server Component / Client Component / API Route / Middleware]
- Data fetching: [fetch / Server Action / TanStack Query / SWR / Supabase SSR]

**Langkah yang Sudah Dicoba:**

1. [e.g., Restart dev server]
2. [e.g., Clear .next cache]
3. [e.g., Check environment variables]

**Kode Relevan:**
[Paste kode minimal yang mereproduksi error]

Bantu saya:

1. Identifikasi root cause error ini
2. Berikan solusi spesifik dengan kode yang sudah diperbaiki
3. Jelaskan mengapa error terjadi di Next.js 16 (perubahan dari versi sebelumnya jika relevan)
4. Sarankan pencegahan agar tidak terulang
```

---

## Template 2: Performance & Architecture Debugging

```markdown
Saya perlu mengoptimalkan/debug aplikasi Next.js 16 dengan masalah berikut:

**Masalah:**
[Deskripsikan masalah: slow loading, hydration error, memory leak, build failure, dll]

**Arsitektur Aplikasi:**

- App Router atau Pages Router: App Router (Tanpa folder src/)
- Rendering strategy: [SSR / SSG / ISR / CSR / Streaming]
- State management: [Zustand / Redux / Context API / Jotai / React 19 State]
- Styling: [Tailwind CSS v4 / Shadcn UI]
- Database/ORM: [Supabase PostgreSQL / Drizzle / Prisma / Raw SQL]

**Konfigurasi:**

- next.config.ts: [Paste konfigurasi relevan]
- middleware.ts: [Jika ada]
- Instrumentation: [Jika menggunakan Sentry / OpenTelemetry]

**Metrik/Log:**

- Build time: [e.g., 5 menit+]
- Bundle size: [e.g., 500KB+ first load]
- Lighthouse score: [Jika ada]
- Error log: [Paste log dari console atau Vercel/deployment platform]

**Ekspektasi:**
[Apa yang ingin dicapai? e.g., TTFB < 200ms, eliminate hydration mismatch, reduce bundle size]

Bantu saya:

1. Analisis bottleneck dengan pendekatan systematic
2. Berikan rekomendasi optimasi spesifik untuk Next.js 16
3. Tunjukkan refactor kode jika diperlukan
4. Sarankan tooling untuk monitoring dan debugging ke depannya (e.g., Next.js DevTools, Sentry, Vercel Speed Insights)
```

---

## Template 3: Supabase & Authentication Debugging

```markdown
Saya mengalami kendala pada integrasi Supabase / Auth di Next.js 16 dengan detail berikut:

**Masalah:**
[Deskripsikan kendala: RLS policy blocking, JWT session expired, cookie desync, RLS bypass error, dll]

**Konteks Backend:**

- Auth SDK: @supabase/ssr
- Environment: [Server Component / Server Action / Middleware / Route Handler]
- Client Type: [createServerClient / createBrowserClient]

**Kode Relevan & Policy RLS:**
[Paste kode instansiasi Supabase dan SQL RLS policy terkait]

Bantu saya:

1. Mendiagnosis penyebab kegagalan autentikasi/otorisasi
2. Berikan perbaikan pada Server Action / Middleware / RLS Policy
3. Pastikan tidak ada kebocoran token JWT dan mengikuti best practice @supabase/ssr
```

---

## 💡 Tips Penggunaan Prompt:

1. **Selalu Sertakan Stack Trace Lengkap**: Next.js 16 memberikan error message yang jauh lebih spesifik dibanding versi sebelumnya. Jangan memotong baris stack trace.
2. **Spesifikasikan App Router vs Pages Router**: Penanganan error dan siklus render berbeda secara fundamental antara keduanya.
3. **Cantumkan React 19 Context**: Next.js 16 secara native menggunakan React 19, yang memiliki perilaku khusus pada Server Components, `useActionState`, dan ketiadaan `forwardRef`.
4. **Gunakan Minimal Reproducible Code**: Kirim hanya potongan kode yang secara langsung menyebabkan masalah alih-alih seluruh file kompleks.
