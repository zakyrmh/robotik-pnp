# Current Stack Versions Specification Guide

Dokumen spesifikasi versi _exact_ dependensi dan teknologi utama yang digunakan pada proyek **Sistem Informasi Manajemen Unit Kegiatan Mahasiswa (UKM) Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 1. Ringkasan Eksekutif & Status Rilis

- **Nama Proyek**: Sistem Informasi Manajemen UKM Robotik PNP
- **Versi Proyek**: `0.1.3`
- **Tanggal Rekam Versi**: 7 Agustus 2026
- **Status Referensi Versi Target**: Next.js `16.3.0` & Supabase JS `2.0` (v2.x)

---

## 2. Dependensi Utama (Core Stack & Dependencies)

Tabel berikut mencantumkan versi _exact_ dari pustaka/dependensi runtime yang terinstal di file `package.json` proyek:

| Nama Library / Package      | Versi Terinstal (`package.json`) | Kategori / Peran                                    |
| :-------------------------- | :------------------------------- | :-------------------------------------------------- |
| **`next`**                  | `16.2.5`                         | Core Framework (App Router)                         |
| **`react`**                 | `19.2.4`                         | Core UI Library                                     |
| **`react-dom`**             | `19.2.4`                         | React DOM Renderer                                  |
| **`typescript`**            | `^5`                             | Programming Language                                |
| **`tailwindcss`**           | `^4`                             | Utility-First CSS Framework (v4 Oxide Engine)       |
| **`@tailwindcss/postcss`**  | `^4`                             | PostCSS Plugin untuk Tailwind CSS v4                |
| **`@supabase/supabase-js`** | `^2.105.3`                       | Supabase Client SDK (v2.x)                          |
| **`@supabase/ssr`**         | `^0.10.2`                        | Supabase SSR Utilities untuk Next.js App Router     |
| **`@upstash/redis`**        | `^1.38.0`                        | Upstash Redis HTTP Client                           |
| **`@upstash/ratelimit`**    | `^2.0.8`                         | Rate Limiting SDK                                   |
| **`@sentry/nextjs`**        | `^10.69.0`                       | Application Error Monitoring & Performance Tracking |
| **`zod`**                   | `^4.4.3`                         | Schema Validation & Type Safety                     |

---

## 3. Matriks Lengkap Dependensi Runtime (`dependencies`)

| Library / Package            | Versi Terinstal | Deskripsi / Fungsi                                    |
| :--------------------------- | :-------------- | :---------------------------------------------------- |
| `@hugeicons/core-free-icons` | `^4.1.1`        | Core Icon Set                                         |
| `@hugeicons/react`           | `^1.1.6`        | React Component untuk Hugeicons                       |
| `@marsidev/react-turnstile`  | `^1.5.3`        | Cloudflare Turnstile CAPTCHA Integration              |
| `@vercel/analytics`          | `^2.0.1`        | Vercel Web Analytics                                  |
| `@vercel/speed-insights`     | `^2.0.0`        | Vercel Performance & Core Web Vitals Tracking         |
| `browser-image-compression`  | `^2.0.2`        | Kompresi Gambar di Sisi Browser Client                |
| `class-variance-authority`   | `^0.7.1`        | Pengelolaan Varian Komponen (`cva`)                   |
| `clsx`                       | `^2.1.1`        | Conditional ClassName Construction                    |
| `cmdk`                       | `^1.1.1`        | Unstyled Command Menu Component                       |
| `framer-motion`              | `^12.38.0`      | Animation Engine                                      |
| `html5-qrcode`               | `^2.3.8`        | QR Code / Barcode Scanner untuk Presensi & Inventaris |
| `lucide-react`               | `^1.21.0`       | Icon Library                                          |
| `radix-ui`                   | `^1.4.3`        | Unstyled Primitive UI Components (A11y)               |
| `react-easy-crop`            | `^5.5.7`        | UI Cropping Foto Profil & Aset Media                  |
| `server-only`                | `^0.0.1`        | Memastikan Modul Hanya Dieksekusi di Server Side      |
| `shadcn`                     | `^4.7.0`        | CLI & UI Design System Kit                            |
| `sonner`                     | `^2.0.7`        | Toast Notification System                             |
| `tailwind-merge`             | `^3.5.0`        | Menangani Konflik Class Tailwind CSS                  |
| `tw-animate-css`             | `^1.4.0`        | Helper Animasi CSS                                    |
| `vercel`                     | `^54.13.0`      | Vercel Deployment CLI Tooling                         |

---

## 4. Matriks Dependensi Pengujian & Tooling (`devDependencies`)

| Library / Package                     | Versi Terinstal | Deskripsi / Fungsi                         |
| :------------------------------------ | :-------------- | :----------------------------------------- |
| **`vitest`**                          | `^4.1.6`        | Unit & Integration Testing Framework       |
| **`@vitest/ui`**                      | `^4.1.6`        | Visual Interface Runner untuk Vitest       |
| **`@testing-library/react`**          | `^16.3.2`       | React Component Testing Utilities          |
| **`@testing-library/jest-dom`**       | `^6.9.1`        | Custom DOM Element Matchers                |
| **`jsdom`**                           | `^29.1.1`       | DOM Environment untuk Unit Testing         |
| **`fast-check`**                      | `^4.8.0`        | Property-Based Testing                     |
| **`@vitejs/plugin-react`**            | `^6.0.1`        | Vite Plugin untuk React Support di Vitest  |
| **`supabase`**                        | `^2.107.0`      | Supabase Local CLI & Type Generator        |
| **`eslint`**                          | `^9`            | Static Code Analysis                       |
| **`eslint-config-next`**              | `16.2.5`        | Next.js Standard ESLint Configuration      |
| **`prettier`**                        | `^3.8.4`        | Code Formatter                             |
| **`husky`**                           | `^9.1.7`        | Git Hooks Manager                          |
| **`lint-staged`**                     | `^17.0.2`       | Pre-commit Linter Engine                   |
| **`@commitlint/cli`**                 | `^20.5.3`       | Git Commit Message Standard Enforcement    |
| **`@commitlint/config-conventional`** | `^20.5.3`       | Conventional Commit Specification          |
| **`standard-version`**                | `^9.5.0`        | Automated Versioning & CHANGELOG Generator |

---

## 5. Panduan Penggunaan Konteks oleh AI Agent

Saat AI Agent (seperti Gemini, Claude, atau Copilot) membantu proses pengembangan kode, agen harus mematuhi aturan kontekstual berbasis versi stack berikut:

1. **Next.js 16 (v16.2.5 / v16.3.0)**:
   - Gunakan **App Router** tanpa folder `src/`.
   - Objek `params` dan `searchParams` pada Server Components / Route Handlers **wajib di-`await`** (berupa `Promise`).
2. **React 19 (v19.2.4)**:
   - Gunakan React 19 Hooks baru (`useActionState`, `useFormStatus`, `useOptimistic`, `use`).
   - Jangan gunakan `forwardRef` untuk penerusan `ref` pada komponen (gunakan `ref` sebagai prop biasa).
3. **Tailwind CSS v4 (`^4`)**:
   - Gunakan pendekatan **CSS-First Configuration** via `@theme` pada `app/globals.css`.
   - Jangan menyarankan pembentukan file `tailwind.config.js` baru.
4. **Supabase JS v2 (`^2.105.3`) & `@supabase/ssr` (`^0.10.2`)**:
   - Gunakan `createServerClient` dan `createBrowserClient` dari `@supabase/ssr`.
   - Untuk pemeriksaan autentikasi di server/middleware, selalu panggil `supabase.auth.getUser()` alih-alih `getSession()`.
5. **Vitest (`^4.1.6`)**:
   - Tulis pengujian unit menggunakan API Vitest (`describe`, `it`, `expect`, `vi.mock`).
