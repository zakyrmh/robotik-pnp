# Induk Referensi Teknis & Standar Rekayasa Perangkat Lunak (Technical Architecture & Engineering Standards)

**Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang**

---

## 📄 Pengendalian Informasi Terdokumentasi (_Document Control_)

| Parameter Dokumen                     | Spesifikasi Kebijakan                                                         |
| :------------------------------------ | :---------------------------------------------------------------------------- |
| **ID Dokumen Master**                 | `DOC-TEC-MST-00`                                                              |
| **Versi Dokumen**                     | `v2.0.0` (Production-Grade Engineering Release)                               |
| **Tanggal Efektif**                   | 3 Agustus 2026                                                                |
| **Klasifikasi Dokumen**               | **Internal Organisasi** (Dapat dipublikasikan terbatas bagi Tim Dev/AI Agent) |
| **Sistem Induk (_Master Framework_)** | **Technical Architecture & Engineering Standards (TAES)**                     |
| **Pemilik Dokumen (_Owner_)**         | Tim Software Architecture & Lead Developer UKM Robotik PNP                    |
| **Penyetuju Dokumen (_Approver_)**    | Pembina UKM & Ketua Umum UKM Robotik PNP                                      |
| **Jadwal Peninjauan Berkala**         | Setiap 6 (enam) bulan sekali                                                  |

---

## 1. Pendahuluan & Ringkasan Eksekutif

Folder `08-tech-references` merupakan **Pusat Standar Rekayasa Perangkat Lunak, Referensi Arsitektur Teknis, dan Kontextual AI Agent (TAES Master Directory)** pada Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.

Direktori ini dirancang khusus untuk memandu pengembang manusia (_human developers_) dan agen kecerdasan buatan (_AI Agents_) dalam membangun, memelihara, dan mengembangkan aplikasi SaaS berbasis **Next.js 16 (App Router)**, **React 19**, **Supabase Backend**, **Tailwind CSS v4**, dan **TypeScript Strict Mode**.

Seluruh panduan teknis dibagi secara sistematis ke dalam **6 (enam) pilar arsitektur utama**:

1. **Kerangka Kerja Utama** (`core-framework/`): Fondasi Next.js 16 App Router, React 19, & TypeScript strict.
2. **Layanan Backend & Basis Data** (`backend-services/`): Skema PostgreSQL, RLS Policy, Supabase Auth SSR, Storage, & Edge Functions.
3. **Desain Interface & Styling** (`ui-styling/`): Tailwind CSS v4, Shadcn UI customization, & Mobile-First Responsive System.
4. **Infrastruktur & Keamanan** (`infrastructure-security/`): Integrasi Cloudflare WAF, Upstash Redis strategy, & Zod Environment Variables.
5. **Pengujian & Kualitas Perangkat Lunak** (`testing-quality/`): Vitest Unit Setup, Playwright E2E Flows, & Supabase Mocking.
6. **Konteks & Konvensi AI Agent** (`ai-agent-context/`): Code generation rules, prompt library, stack versions, & anti-pattern common pitfalls.

---

## 2. Peta Arsitektur Teknologi & Pilar Standar Rekayasa

Sistem dibangun di atas stack modern terkonsolidasi dengan pembagian tanggung jawab teknis sebagai berikut:

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 ┌                      ARSITEKTURA STACK & TEKNOLOGI UTAMA                         │
 ├──────────────────────────┬───────────────────────────┬───────────────────────────┤
 │ Core Framework           │ Backend & Database        │ UI & User Experience      │
 ├──────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • Next.js 16 App Router  │ • PostgreSQL & Supabase   │ • Tailwind CSS v4         │
 │ • React 19 (Server Act)  │ • Row Level Security (RLS)│ • Shadcn UI + Radix       │
 │ • TypeScript (Strict)    │ • Edge Functions (Deno)   │ • Lucide Icons + Fluid UI │
 ├──────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ Infra & Security         │ Testing & Quality         │ AI Agent Integration      │
 ├──────────────────────────┼───────────────────────────┼───────────────────────────┤
 │ • Cloudflare WAF & DNS   │ • Vitest (Unit / 70% Cov) │ • Strict AGENTS.md Rules  │
 │ • Upstash Redis Rate Lim │ • Playwright (E2E Flow)   │ • Automated Prompt Lib    │
 │ • Zod Secret Validation  │ • Supabase Mock Testing   │ • Zero 'any' Code Gen     │
 └──────────────────────────┴───────────────────────────┴───────────────────────────┘
```

---

## 3. Peta Navigasi & Indeks Dokumen Terstruktur

Pengelolaan referensi teknis dibagi ke dalam **6 (enam) subfolder utama** dengan total **20 modul dokumen terstandarisasi**:

```
docs/08-tech-references/
├── README.md                                   # Induk Referensi Teknis & Central Index (Dokumen Ini)
├── core-framework/                             # Subfolder 1: Kerangka Kerja Utama Aplikasi
│   ├── nextjs-16-guide.md                      # Panduan Arsitektur Next.js 16 App Router & RSC
│   ├── react-19-patterns.md                    # Pola Pengembangan React 19, Actions & Hooks Modern
│   └── typescript-strict-config.md             # Konfigurasi Strict TypeScript & Aturan Type Safety
├── backend-services/                           # Subfolder 2: Layanan Backend & Basis Data
│   ├── postgresql-schema-rules.md              # Aturan Desain Skema PostgreSQL, Migrasi & RLS Policy
│   ├── supabase-auth-ssr.md                    # Integrasi Supabase Auth dengan SSR (@supabase/ssr)
│   ├── supabase-storage-policy.md              # Pengelolaan Bucket Storage, Kebijakan RLS & Media
│   └── edge-functions-guide.md                 # Panduan Pengembangan Supabase Edge Functions (Deno)
├── ui-styling/                                 # Subfolder 3: Sistem Tampilan & Styling UI
│   ├── tailwind-v4-migration.md                # Arsitektur Tailwind CSS v4 & Migrasi Engine Oxide
│   ├── shadcn-ui-customization.md              # Kustomisasi Komponen Shadcn UI & Extending Theme
│   └── responsive-design-system.md             # Panduan Desain Mobile-First, Breakpoint & Fluid UI
├── infrastructure-security/                    # Subfolder 4: Infrastruktur & Keamanan Akses
│   ├── cloudflare-integration.md               # Integrasi Cloudflare WAF, Turnstile & DNS Management
│   ├── environment-variables.md                # Manajemen & Validasi Variable Lingkungan (Zod Schema)
│   └── upstash-redis-strategy.md               # Strategi Caching, Session & Rate Limiting Upstash Redis
├── testing-quality/                            # Subfolder 5: Pengujian & Kualitas Perangkat Lunak
│   ├── vitest-unit-setup.md                    # Konfigurasi Unit Testing Vitest & Targets Coverage
│   ├── playwright-e2e-flows.md                 # Alur Pengujian End-to-End (E2E) Playwright
│   └── mocking-supabase.md                     # Teknik Mocking Supabase Client untuk Pengujian
└── ai-agent-context/                           # Subfolder 6: Konteks & Konvensi AI Agent
    ├── current-stack-versions.md               # Daftar Versi Spesifik Stack Teknologi Produksi
    ├── code-generation-rules.md                # Aturan Generasi Kode Otomatis AI Agent
    ├── prompt-library.md                       # Pustaka Prompt Standar Pengembangan & Debugging
    └── common-pitfalls.md                      # Anti-Pattern & Penanganan Kesalahan Umum (Pitfalls)
```

---

## 4. Ringkasan Fungsi Berkas per Subfolder

### 4.1 Subfolder `core-framework/` (Kerangka Kerja Utama)

- 📄 **[nextjs-16-guide.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/core-framework/nextjs-16-guide.md)**: Mengatur arsitektur Next.js 16 berbasis App Router, penegakan Server Components (RSC) secara _default_, penggunaan Server Actions untuk mutasi data internal, optimalisasi `next/image`, serta rujukan dokumentasi lokal di `node_modules/next/dist/docs/`.
- 📄 **[react-19-patterns.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/core-framework/react-19-patterns.md)**: Mengatur pola React 19 terbaru seperti `useActionState`, `useFormStatus`, `useOptimistic`, penggunaan Hook `use()` untuk promise/context, penanganan async transition, serta pemisahan tegas antara Server Boundaries dan Client Component Leaves.
- 📄 **[typescript-strict-config.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/core-framework/typescript-strict-config.md)**: Mengatur konfigurasi `tsconfig.json` dengan `strict: true`, penegakan **Zero `any` Policy** (menggunakan `unknown` atau generik), automatisasi tipe data basis data Supabase (`npx supabase gen types typescript`), dan proteksi tipe data runtime.

---

### 4.2 Subfolder `backend-services/` (Layanan Backend & Basis Data)

- 📄 **[postgresql-schema-rules.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/backend-services/postgresql-schema-rules.md)**: Mengatur konvensi desain tabel PostgreSQL, pembuatan migrasi wajib via `supabase/migrations/` (dilarang ubah manual di GUI dashboard), penegakan Row Level Security (RLS) pada **semua** tabel public schema, serta trigger audit trail non-nullable.
- 📄 **[supabase-auth-ssr.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/backend-services/supabase-auth-ssr.md)**: Mengatur integrasi Supabase Auth dengan Next.js Server-Side Rendering (`@supabase/ssr`), otentikasi PKCE Flow, pembatasan ketat instansiasi `createServerClient` (khusus server context/Server Actions) vs `createBrowserClient` (khusus Client Component), serta manajemen cookie HTTP-Only.
- 📄 **[supabase-storage-policy.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/backend-services/supabase-storage-policy.md)**: Mengatur manajemen bucket Supabase Storage untuk media kegiatan, dokumen oprec, dan identitas anggota; penegakan RLS Storage Policy berdasarkan role pengguna; validasi ukuran file & MIME type; serta penggunaan Signed URL TTL 15 menit.
- 📄 **[edge-functions-guide.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/backend-services/edge-functions-guide.md)**: Mengatur arsitektur dan penulisan Supabase Edge Functions berbasis Deno/TypeScript untuk prosedur ber-latency rendah, webhook callback eksternal, dan penanganan pemrosesan background berkinerja tinggi.

---

### 4.3 Subfolder `ui-styling/` (Sistem Tampilan & Styling UI)

- 📄 **[tailwind-v4-migration.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ui-styling/tailwind-v4-migration.md)**: Mengatur konfigurasi Tailwind CSS v4 berbasis Engine Oxide (Rust-powered), migrasi dari JavaScript config ke CSS-First config (`@theme`), penggunaan `@import "tailwindcss";`, serta penyesuaian `@postcss/plugin`.
- 📄 **[shadcn-ui-customization.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ui-styling/shadcn-ui-customization.md)**: Mengatur model kepemilikan kode Shadcn UI, penyesuaian CSS variables pada `app/globals.css`, penggabungan kelas dengan utilitas `cn()` (`clsx` + `tailwind-merge`), kustomisasi varian komponen via `cva`, serta ekstensi tema dark mode berbasis `next-themes`.
- 📄 **[responsive-design-system.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ui-styling/responsive-design-system.md)**: Mengatur standar desain Mobile-First, hierarki breakpoint Tailwind v4 (`sm`, `md`, `lg`, `xl`, `2xl`), tipografi cair dengan CSS `clamp()`, Native Container Queries, safe area insets untuk notching/navigation bar mobile, serta ergonomi area sentuh minimum (44x44px).

---

### 4.4 Subfolder `infrastructure-security/` (Infrastruktur & Keamanan Akses)

- 📄 **[cloudflare-integration.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/infrastructure-security/cloudflare-integration.md)**: Mengatur integrasi Cloudflare sebagai Edge Security WAF, pengelolaan DNS record, proteksi serangan DDoS/Bot dengan Cloudflare Turnstile pada form registrasi, SSL/TLS Strict Mode, dan strategi HTTP caching pada edge.
- 📄 **[environment-variables.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/environment-variables.md)** (atau [infrastructure-security/environment-variables.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/infrastructure-security/environment-variables.md)): Mengatur validasi variabel lingkungan menggunakan skema Zod pada saat _build time_, pemisahan rahasia server vs publik (`NEXT_PUBLIC_`), larangan keras `git commit` file `.env.local` / Service Role Key, dan rotasi secret berkala.
- 📄 **[upstash-redis-strategy.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/infrastructure-security/upstash-redis-strategy.md)**: Mengatur integrasi Upstash Redis SDK untuk distributed rate limiting (mencegah brutforsing auth & Oprec signup), manajemen sesi terdistribusi, caching query data publik yang intensif, dan mekanisme distributed lock.

---

### 4.5 Subfolder `testing-quality/` (Pengujian & Kualitas Perangkat Lunak)

- 📄 **[vitest-unit-setup.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/testing-quality/vitest-unit-setup.md)**: Mengatur konfigurasi Vitest sebagai unit testing engine utama, pembuatan unit test untuk Server Actions, helper utility, dan custom hooks, serta kewajiban memenuhi **Quality Gate Minimum Coverage 70%**.
- 📄 **[playwright-e2e-flows.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/testing-quality/playwright-e2e-flows.md)**: Mengatur alur pengujian End-to-End (E2E) menggunakan Playwright, mencakup skenario pendaftaran Caang, verifikasi alur login per 5 Role RBAC, absensi kegiatan, dan penugasan piket lab.
- 📄 **[mocking-supabase.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/testing-quality/mocking-supabase.md)**: Mengatur strategi mocking Supabase Client (`createServerClient` & `createBrowserClient`) dalam lingkungan pengujian Vitest tanpa melakukan panggilan jaringan riil ke basis data produksi/staging.

---

### 4.6 Subfolder `ai-agent-context/` (Konteks & Konvensi AI Agent)

- 📄 **[current-stack-versions.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ai-agent-context/current-stack-versions.md)**: Mendokumentasikan matriks versi pasti dari seluruh dependensi proyek (Next.js 16, React 19, Tailwind CSS v4, Supabase Auth SSR, TypeScript 5.x, Vitest, Playwright) untuk mencegah terjadinya _dependency drift_.
- 📄 **[code-generation-rules.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ai-agent-context/code-generation-rules.md)**: Mengatur instruksi ketat bagi AI Agent saat menghasilkan kode: Server Components by default, wajib Zod validation di Server Actions, wajib catch error handling, no `any`, dan kewajiban menyelaraskan ID pendaftaran dengan ID user profile.
- 📄 **[prompt-library.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ai-agent-context/prompt-library.md)**: Berisi koleksi prompt terstruktur yang disetujui untuk pemutakhiran kode, refactoring aman, penambahan pengujian unit/E2E, serta pembuatan komponen UI Shadcn secara konsisten.
- 📄 **[common-pitfalls.md](file:///d:/Project/robotik-pnp/docs/08-tech-references/ai-agent-context/common-pitfalls.md)**: Mengidentifikasi jebakan umum (_gotchas_) dan kesalahan anti-pattern yang sering terjadi (misal: mencampur instansiasi Supabase client, melupakan RLS policy, menggunakan `<img>` biasa sebagai pengganti `next/image`, atau membuat folder `pages/`).

---

## 5. Matriks Antar-Komponen & Referensi Silang Stack (_Cross-Reference Architecture Matrix_)

Seluruh modul teknis terhubung secara langsung dengan aturan operasional dan komponen arsitektur proyek:

| Modul Dokumen Referensi Teknis | Komponen Stack Terkait       | Fokus Utama Kebijakan / Implementasi                | Aturan Penegakan Kunci                                                    |
| :----------------------------- | :--------------------------- | :-------------------------------------------------- | :------------------------------------------------------------------------ |
| `nextjs-16-guide.md`           | Next.js App Router           | Server Components (RSC), Layouts, Routing           | Dilarang membuat folder `pages/`, wajib `'use client'` di leaf terluar    |
| `react-19-patterns.md`         | React 19 Engine              | Async Transitions, Actions, Modern Hooks            | Menggunakan `useActionState` & `useFormStatus` untuk mutasi form          |
| `typescript-strict-config.md`  | TypeScript Compiler          | Strict Type Checking & Autogenerated DB Types       | Zero `any` policy, wajib `unknown` jika tipe dinamis                      |
| `postgresql-schema-rules.md`   | PostgreSQL / Supabase DB     | Migration files, Foreign Keys, RLS Enforcement      | RLS wajib aktif di seluruh tabel, no direct DB alter via GUI              |
| `supabase-auth-ssr.md`         | Supabase Auth SSR            | PKCE Auth Flow, Session Cookies, RBAC Auth          | `createServerClient` di Server Context, `createBrowserClient` di Client   |
| `supabase-storage-policy.md`   | Supabase Storage             | File Uploads, Signed URLs, Bucket RLS               | Signed URL TTL 15m, RLS Storage Policy terikat RBAC                       |
| `edge-functions-guide.md`      | Supabase Edge Functions      | Low-latency Webhooks, Deno Serverless Logic         | Meminimalkan overhead HTTP callback eksternal                             |
| `tailwind-v4-migration.md`     | Tailwind CSS v4              | Oxide Engine, `@theme` CSS-first config             | Menggunakan `globals.css` `@import "tailwindcss";`, tanpa tailwind.config |
| `shadcn-ui-customization.md`   | Shadcn UI & Radix Primitives | Ownership Model, `cva`, `cn()` utility, Dark Mode   | Kustomisasi via CSS Variables & `components/ui/`                          |
| `responsive-design-system.md`  | UI Layout System             | Mobile-First Design, Breakpoints, Container Queries | Minimum Touch Target 44x44px, Safe Area Insets                            |
| `cloudflare-integration.md`    | Cloudflare WAF & DNS         | DDoS Mitigation, Turnstile Captcha, DNS Proxy       | Turnstile Captcha pada public forms (Register / Contact)                  |
| `environment-variables.md`     | System Configuration         | Zod Schema Validation, Secret Management            | Dilarang commit `.env.local`, validasi Zod saat build time                |
| `upstash-redis-strategy.md`    | Upstash Redis SDK            | Distributed Rate Limiting, Caching, Session Sync    | Protect sensitive endpoints with Upstash Rate Limiting                    |
| `vitest-unit-setup.md`         | Vitest Engine                | Unit Testing Server Actions & Utilities             | Mandatory local run `npm test`, Quality Gate coverage $\ge 70\%$          |
| `playwright-e2e-flows.md`      | Playwright Framework         | End-to-End User Flow Automation                     | Validasi E2E untuk 5 Role (super-admin, admin-or, komdis, dsb)            |
| `mocking-supabase.md`          | Test Utility                 | Network-isolated Supabase Mocking                   | Mengisolasi pengujian unit tanpa panggilan DB riil                        |
| `current-stack-versions.md`    | Project Meta                 | Stack Version Tracking & Lockfile Parity            | Mengunci versi library utama untuk mencegah dependency drift              |
| `code-generation-rules.md`     | AI Agent Standard            | Strict Code Generation Guidelines                   | Menjalankan aturan `AGENTS.md` & RSC-first pattern                        |
| `prompt-library.md`            | AI Engineering Workflow      | Standardized Prompt Templates                       | Digunakan oleh pengembang/AI untuk tugas kompleks                         |
| `common-pitfalls.md`           | Quality Control              | Anti-Pattern Prevention & Known Bugs List           | Panduan debugging & pencegahan bug berulang                               |

---

## 6. Panduan Penggunaan Bagi Pengembang & AI Agent (_Engineering Workflow Guidelines_)

Untuk menjamin konsistensi kualitas kode di seluruh siklus pengembangan, pengembang dan AI Agent **WAJIB** mengikuti alur kerja berikut:

### 6.1 Alur Kerja Pengembang Manusia (_Human Developer Workflow_)

1. **Membaca Spesifikasi**: Sebelum membuat fitur baru, baca dokumen referensi di subfolder yang relevan (misal: `core-framework/nextjs-16-guide.md` saat membuat halaman baru).
2. **Validasi Tipe Data**: Regenerasi tipe data database setelah melakukan perubahan migrasi SQL melalui perintah:
   ```bash
   npx supabase gen types typescript --local > types/supabase.ts
   ```
3. **Pemeriksaan Pra-Komit (_Pre-flight Checks_)**: Sebelum melakukan commit atau membuat Pull Request, jalankan pengujian lokal:
   ```bash
   npm test
   ```
   Pastikan seluruh test berlalu dan cakupan kode (_code coverage_) mencapai minimal **70%**.

---

### 6.2 Alur Kerja AI Agent (_AI Agent Workflow_)

1. **Pemeriksaan Dokumen Lokal**: Sebelum mengeksekusi perintah kuis/coding Next.js, AI Agent **WAJIB** membaca dokumentasi di `node_modules/next/dist/docs/` dan referensi teknis di folder ini.
2. **Penerapan Aturan Kepatuhan (`AGENTS.md`)**:
   - Utamakan **Server Components (RSC)** secara _default_.
   - Gunakan `createServerClient` di server context dan `createBrowserClient` di client context.
   - Semua mutasi Server Actions wajib divalidasi dengan `zod`.
   - Dilarang keras menggunakan keyword `any` pada TypeScript.
   - Wajib mencatat mutasi administratif ke dalam tabel audit trail.

---

## 7. Prosedur Pembaruan & Kontrol Perubahan Dokumen Referensi Teknis

1. Dokumen di dalam folder `08-tech-references` ditinjau dan diperbarui secara berkala **setiap 6 (enam) bulan sekali** atau seketika terjadi pembaruan versi _major/minor_ pada stack utama (misal: Next.js, React, Tailwind CSS, Supabase).
2. Setiap perubahan atau penambahan modul referensi teknis baru wajib mencantumkan pemutakhiran pada tabel _Document Control_ serta indeks master di `docs/08-tech-references/README.md`.
3. Perubahan dokumen wajib disetujui oleh **Lead Developer / Software Architect** dan **Pembina UKM Robotik PNP**.

---

_Dokumen ini diterbitkan sebagai Buku Induk Referensi Teknis & Standar Rekayasa Perangkat Lunak Resmi UKM Robotik Politeknik Negeri Padang._
