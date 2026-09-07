# Tailwind CSS v4 Migration & Architecture Guide

Panduan teknis mendalam mengenai arsitektur **Tailwind CSS v4**, perbedaan fundamental dibanding **v3**, implementasi **Oxide Engine** berbasis Rust, serta panduan migrasi ke pendekatan **CSS-first configuration**.

---

## 1. Ikhtisar Tailwind CSS v4 & Engine Oxide

Tailwind CSS v4 merupakan perombakan arsitektur besar-besaran (_major rewrite_) yang dirancang dari nol untuk memanfaatkan fitur-fitur CSS modern dan memberikan performa kompilasi hiper-cepat.

### Engine Oxide (Rust-Powered Architecture)

- **Kinerja Ekstrem**: Ditulis penuh menggunakan bahasa pemrograman **Rust**, menghasilkan kecepatan build hingga **10x lebih cepat** pada proyek skala besar dibanding v3 (Node.js/JavaScript engine).
- **Zero-Dependency Core**: Mengurangi beban `node_modules` secara signifikan karena tidak lagi bergantung pada puluhan package parser CSS pihak ketiga.
- **Pendeteksian Konten Otomatis (Automatic Content Detection)**: Menghentikan kebutuhan pendaftaran manual path file template pada konfigurasi `content: [...]`. Engine Oxide secara otomatis memindai seluruh direktori proyek untuk menemukan class utility secara efisien.

---

## 2. Perubahan Paradigma: Dari JavaScript Config ke CSS-First Config

Salah satu perubahan paling mendasar di Tailwind CSS v4 adalah penghapusan file konfigurasi `tailwind.config.js`. Seluruh kustomisasi tema, plugin, dan variabel kini dikelola secara deklaratif langsung di dalam file CSS utama (`app/globals.css`).

### 2.1. Perbandingan Sintaks Impor Utama

#### Tailwind CSS v3 (Cara Lama):

```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

```javascript
// tailwind.config.js
module.exports = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: "#1e40af",
      },
    },
  },
  plugins: [],
};
```

#### Tailwind CSS v4 (Cara Modern / CSS-First):

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Definisikan variabel warna kustom */
  --color-brand: #1e40af;
  --color-brand-hover: #1e3a8a;

  /* Definisikan font family kustom */
  --font-sans: "Inter", system-ui, sans-serif;

  /* Overriding breakpoints */
  --breakpoint-3xl: 120rem;
}
```

---

## 3. Fitur Utama & Konvensi `@theme` di v4

Sistem `@theme` secara otomatis memetakan variabel CSS ke utility classes Tailwind:

| CSS Variable di `@theme`     | Utility Class Tergenerasi                | Contoh Penggunaan                         |
| :--------------------------- | :--------------------------------------- | :---------------------------------------- |
| `--color-brand: #1e40af;`    | `bg-brand`, `text-brand`, `border-brand` | `<div className="bg-brand text-white">`   |
| `--font-display: 'Poppins';` | `font-display`                           | `<h1 className="font-display font-bold">` |
| `--spacing-128: 32rem;`      | `p-128`, `m-128`, `w-128`, `h-128`       | `<section className="p-128">`             |
| `--radius-xl: 1rem;`         | `rounded-xl`                             | `<button className="rounded-xl">`         |

### Kustomisasi Namespace vs Total Override

- **Secara Default (Extend)**: Menambahkan variabel baru di dalam `@theme` akan menggabungkan (_merge_) nilai tersebut dengan tema standar Tailwind.
- **Total Override**: Jika Anda ingin menghapus tema bawaan dan menggantinya penuh, gunakan sintaks `@theme static`:

```css
/* Menghapus semua warna standar dan hanya menyisakan brand */
@theme static {
  --color-brand: #1e40af;
  --color-white: #ffffff;
  --color-black: #000000;
}
```

---

## 4. Integrasi dengan Next.js 16 (App Router Tanpa Folder `src/`)

Berikut adalah langkah-langkah setup Tailwind CSS v4 pada proyek **Next.js 16**:

### Langkah 1: Instalasi Package PostCSS Tailwind v4

```bash
npm install tailwindcss@next @tailwindcss/postcss@next postcss
```

### Langkah 2: Konfigurasi `postcss.config.mjs`

Pada Tailwind v4, gunakan plugin resmi `@tailwindcss/postcss`:

```javascript
// postcss.config.mjs
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
```

### Langkah 3: Inisialisasi CSS di `app/globals.css`

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-primary: #0f172a;
  --color-accent: #38bdf8;
}
```

### Langkah 4: Impor CSS pada Root Layout (`app/layout.tsx`)

```tsx
// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Next.js 16 + Tailwind CSS v4",
  description: "Aplikasi web modern dengan Tailwind CSS v4",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
```

---

## 5. Breaking Changes & Tabel Komparasi v3 vs v4

### Summary Perubahan Utama

1. **OKLCH Color Space by Default**: Tailwind v4 beralih menggunakan ruang warna **OKLCH** untuk palet warna bawaannya, memberikan persepsi kecerahan (_perceptual uniformity_) yang lebih akurat pada layar modern.
2. **Native Cascade Layers**: Menggunakan sintaks CSS Murni `@layer base`, `@layer components`, dan `@layer utilities`.
3. **Container Query Built-In**: Tidak memerlukan plugin `@tailwindcss/container-queries` eksternal. Utility `@container` dan `@md:` kini tersedia secara native.
4. **Perubahan Opacity Modifier**: Sintaks opacity seperti `bg-black/50` kini memanipulasi nilai alpha warna secara native menggunakan fungsi `color-mix()` CSS murni.

### Tabel Komparasi Fitur

| Fitur / Karakteristik   | Tailwind CSS v3                             | Tailwind CSS v4                       |
| :---------------------- | :------------------------------------------ | :------------------------------------ |
| **Build Engine**        | JavaScript / PostCSS                        | Rust (Oxide Engine)                   |
| **Kecepatan Kompilasi** | Standar (Skala Detik)                       | Hiper-cepat (Skala Milidetik)         |
| **Konfigurasi**         | `tailwind.config.js` / `tailwind.config.ts` | CSS-First via `@theme` di file `.css` |
| **File Import**         | `@tailwind base;`, `@tailwind components;`  | `@import "tailwindcss";`              |
| **Pendeteksian File**   | Manual via array `content: [...]`           | Otomatis dipindai oleh Oxide Engine   |
| **Color Space Default** | RGB / HSL                                   | OKLCH (Sangat presisi)                |
| **Container Queries**   | Wajib Plugin Eksternal                      | Built-in secara Native                |

---

## 6. Panduan Alat Migrasi Otomatis

Tailwind CSS menyediakan alat CLI migrasi otomatis untuk mengonversi proyek v3 ke v4:

```bash
# Jalankan migrator resmi dari akar direktori proyek
npx @tailwindcss/upgrade@next
```

### Tugas yang Dikerjakan Migrator Otomatis:

- Mengonversi `tailwind.config.js` menjadi blok `@theme` di file CSS utama.
- Mengganti direktif `@tailwind` lama dengan `@import "tailwindcss";`.
- Memperbarui nama utility class yang mengalami penyesuaian sintaks.
- Memperbarui `package.json` dan `postcss.config.js` ke plugin `@tailwindcss/postcss`.
