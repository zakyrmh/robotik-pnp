# Mobile-First Responsive Design System Guide

Panduan teknis mendalam mengenai perancangan **Responsive Design System** modern berbasis pendekatan **Mobile-First**, penetapan standar breakpoint **Tailwind CSS v4**, fluid typography, layouting dinamis, dan penanganan aksesibilitas sentuhan (_touch ergonomics_).

---

## 1. Filosofi & Prinsip Utama Mobile-First Design

Pendekatan **Mobile-First** berlandaskan prinsip _progressive enhancement_ (peningkatan bertahap): merancang antarmuka dan pengalaman pengguna untuk layar terkecil terlebih dahulu (Mobile), lalu secara bertahap memperkaya tata letak dan fitur saat area pandang (_viewport_) membesar (Tablet, Desktop, Ultra-wide).

### Mengapa Mobile-First?

1. **Performa & Payload Efisien**: Menghindari pemuatan style dan aset desktop berlebih di perangkat seluler yang menggunakan jaringan seluler terbatas.
2. **Arsitektur CSS Lebih Bersih**: Menggunakan kueri media berbasis `min-width` (_unbounded upward_). Style dasar tanpa prefix breakpoint berlaku untuk mobile, sehingga mengurangi _rule overrides_ berulang.
3. **Fokus pada Konten Esensial**: Memaksa perancang untuk memprioritaskan fungsi utama aplikasi sebelum menambahkan elemen dekoratif pada layar lebar.

```css
/* BURUK (Desktop-First / Graceful Degradation dengan max-width) */
.card {
  padding: 32px;
  font-size: 18px;
}
@media (max-width: 768px) {
  .card {
    padding: 16px;
    font-size: 14px;
  } /* Overriding berulang */
}

/* BAIK (Mobile-First / Progressive Enhancement dengan min-width) */
.card {
  padding: 16px;
  font-size: 14px;
} /* Base: Mobile */
@media (min-width: 768px) {
  .card {
    padding: 32px;
    font-size: 18px;
  } /* Enhanced: Tablet/Desktop */
}
```

---

## 2. Standard Breakpoint System (Tailwind CSS v4)

Tailwind CSS v4 menyediakan lima breakpoint standar berbasis `min-width` dengan satuan `rem` untuk mendukung fleksibilitas zoom teks browser.

### 2.1. Tabel Breakpoint Standar

| Breakpoint Prefix | Min-Width (rem) | Equivalent (px) | Target Perangkat / Target Viewport           |
| :---------------- | :-------------- | :-------------- | :------------------------------------------- |
| _(default)_       | `0px`           | `< 640px`       | Smartphone Portrait (iPhone, Android)        |
| `sm`              | `40rem`         | `640px`         | Smartphone Landscape, Small Phablets         |
| `md`              | `48rem`         | `768px`         | Tablet Portrait (iPad Mini, Android Tablets) |
| `lg`              | `64rem`         | `1024px`        | Tablet Landscape, Laptop Kecil / iPad Pro    |
| `xl`              | `80rem`         | `1280px`        | Desktop / Laptop Standar (1080p Monitor)     |
| `2xl`             | `96rem`         | `1536px`        | Monitor Desktop Lebar / QHD Displays         |

---

### 2.2. Kustomisasi Breakpoint via `@theme` (Tailwind v4 CSS-First)

Jika proyek memerlukan penyesuaian breakpoint spesifik (misal: menambahkan breakpoint `xs` atau `3xl`), konfigurasikan langsung di `app/globals.css`:

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* Menambahkan breakpoint ekstra kecil */
  --breakpoint-xs: 30rem; /* 480px */

  /* Menyesuaikan breakpoint bawaan jika diperlukan */
  --breakpoint-sm: 40rem; /* 640px */
  --breakpoint-md: 48rem; /* 768px */
  --breakpoint-lg: 64rem; /* 1024px */
  --breakpoint-xl: 80rem; /* 1280px */
  --breakpoint-2xl: 96rem; /* 1536px */

  /* Menambahkan breakpoint ultra-wide */
  --breakpoint-3xl: 120rem; /* 1920px */
}
```

---

## 3. Fluid Typography, Spacing, & Container Queries

### 3.1. Fluid Typography dengan CSS `clamp()`

Daripada mengubah ukuran font secara patah-patah di setiap breakpoint, manfaatkan fungsi `clamp(MIN, VAL, MAX)` agar ukuran teks bertransformasi secara mulus sesuai lebar viewport.

```css
/* app/globals.css */
@layer utilities {
  .text-fluid-h1 {
    /* Font berkisar antara 2rem (32px) hingga 3.75rem (60px) secara linier */
    font-size: clamp(2rem, 5vw + 1rem, 3.75rem);
    line-height: 1.1;
  }

  .text-fluid-body {
    /* Font berkisar antara 0.95rem (15px) hingga 1.125rem (18px) */
    font-size: clamp(0.95rem, 1vw + 0.75rem, 1.125rem);
    line-height: 1.6;
  }
}
```

---

### 3.2. Native Container Queries di Tailwind CSS v4

Container Queries memungkinkan elemen menyesuaikan tampilannya berdasarkan **lebar parent container-nya**, bukan lebar viewport seluruh layar. Di Tailwind CSS v4, fitur ini sudah tersedia secara **native** tanpa plugin eksternal.

```tsx
// Komponen Card yang responsif terhadap ukuran kontainer tempat ia diletakkan
export function ResponsiveArticleCard() {
  return (
    // Deklarasikan elemen induk sebagai kontainer
    <div className="@container border rounded-xl p-4 shadow-sm">
      <div className="flex flex-col @md:flex-row gap-4 items-center">
        <div className="w-full @md:w-1/3 aspect-video bg-slate-200 rounded-lg" />
        <div className="w-full @md:w-2/3">
          <h3 className="font-bold text-lg @lg:text-2xl">Judul Artikel</h3>
          <p className="text-slate-600 text-sm mt-2">
            Deskripsi artikel yang secara otomatis beralih dari layout tumpuk
            (column) menjadi menyamping (row) saat lebar kontainer melebihi
            breakpoint @md.
          </p>
        </div>
      </div>
    </div>
  );
}
```

| Container Breakpoint | Min-Width       |
| :------------------- | :-------------- |
| `@3xl`               | `48rem` (768px) |
| `@2xl`               | `42rem` (672px) |
| `@xl`                | `36rem` (576px) |
| `@lg`                | `32rem` (512px) |
| `@md`                | `28rem` (448px) |
| `@sm`                | `24rem` (384px) |
| `@xs`                | `20rem` (320px) |

---

## 4. Touch Ergonomics, Safe Area Insets, & Aksesibilitas Mobile

### 4.1. Ukuran Target Sentuhan Minimum (Touch Target Size)

Berdasarkan pedoman aksesibilitas **WCAG 2.1 (Success Criterion 2.5.5)** dan Google Material Design:

- **Ukuran Minimum Interaktif**: Semua elemen interaktif (Button, Link, Checkbox, Icon Trigger) wajib memiliki area sentuh minimum **$44 	imes 44	ext{ px}$** atau **$48 	imes 48	ext{ px}$**.
- **Jarak Antar Elemen Sentuh**: Berikan jarak minimal **8px** antar elemen interaktif terdekat untuk mencegah salah tekan (_fat-finger errors_).

```tsx
// Menggunakan p-3 atau min-h-[44px] untuk memastikan touch target memenuhi standar WCAG
<button
  type="button"
  className="min-h-[44px] min-w-[44px] px-4 py-2 flex items-center justify-center rounded-lg bg-blue-600 text-white"
>
  Kirim Pesan
</button>
```

---

### 4.2. Safe Area Insets (Pencegahan Notched Display & Bottom Nav Overlay)

Perangkat modern seperti iPhone (dengan Dynamic Island / Notch) dan perangkat Android dengan navigation bar transparan memerlukan penyesuaian padding menggunakan CSS `env(safe-area-inset-*)`.

```css
/* app/globals.css */
.pb-safe {
  padding-bottom: env(safe-area-inset-bottom, 16px);
}

.pt-safe {
  padding-top: env(safe-area-inset-top, 16px);
}
```

```tsx
// Fixed Bottom Action Bar di Mobile dengan Safe Area Padding
export function MobileBottomNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-4 pb-safe md:hidden z-50">
      <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold min-h-[48px]">
        Beli Sekarang
      </button>
    </div>
  );
}
```

---

## 5. Implementasi Komponen Navigation Responsif (Next.js 16 + React 19)

Contoh komponen navigasi hybrid: _Drawer / Mobile Sheet_ untuk layar seluler dan _Horizontal Links_ untuk layar desktop.

```tsx
"use client";

import { useState } from "react";
import Link from "next/link";

const NAV_LINKS = [
  { href: "/", label: "Beranda" },
  { href: "/products", label: "Produk" },
  { href: "/about", label: "Tentang Kami" },
  { href: "/contact", label: "Kontak" },
];

export function ResponsiveNavbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="text-xl font-bold text-slate-900">
          MyApp<span className="text-blue-600">.</span>
        </Link>

        {/* Desktop Navigation Links (Disembunyikan di Mobile, Tampak di md+) */}
        <nav className="hidden md:flex md:items-center md:gap-6">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Hamburger Trigger (Tampak di Mobile, Disembunyikan di md+) */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Navigation Menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg border text-slate-700 md:hidden hover:bg-slate-100"
        >
          <svg
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            {isOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Navigation Drawer Menu */}
      {isOpen && (
        <div className="border-b bg-white px-4 pb-6 pt-2 md:hidden">
          <nav className="flex flex-col gap-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="flex min-h-[44px] items-center rounded-md px-3 text-base font-medium text-slate-700 hover:bg-slate-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      )}
    </header>
  );
}
```

---

## 6. QA & Testing Checklist untuk Responsive Design

Gunakan daftar periksa berikut saat melakukan pengujian UI di berbagai ukuran layar:

- [ ] **No Horizontal Scrollbar (Overflow-X)**: Pastikan tidak ada elemen yang meluap secara horizontal di layar $320	ext{px} - 375	ext{px}$ (`overflow-x: hidden` pada root wrapper).
- [ ] **Touch Target Compliance**: Semua tombol dan elemen yang dapat diklik memiliki tinggi/lebar minimal $44	ext{px}$.
- [ ] **Readable Text Sizes**: Tidak ada teks yang berukuran lebih kecil dari $12	ext{px}$ pada layar perangkat seluler.
- [ ] **Form Input Auto-Zoom Prevention**: Input teks di iOS Safari memiliki `font-size` minimal $16	ext{px}$ untuk mencegah browser melakukan auto-zoom otomatis saat input diklik.
- [ ] **Safe Area Alignment**: Elemen _fixed bottom nav_ atau _floating action button_ tidak tertutup oleh bar navigasi iOS/Android.
- [ ] **Image & Media Responsiveness**: Semua gambar menggunakan `max-width: 100%` atau komponen `<Image fill />` dari Next.js untuk mencegah distorsi layout.
