# Shadcn UI Customization & Component Override Guide

Panduan teknis mengenai arsitektur, kustomisasi tema, dan strategi override komponen **Shadcn UI** yang disesuaikan dengan arsitektur **Next.js 16**, **React 19**, **Tailwind CSS v4**, dan struktur proyek tanpa folder `src/`.

---

## 1. Arsitektur Shadcn UI (Ownership Model)

Berbeda dengan library komponen UI tradisional yang diinstal sebagai dependensi pihak ketiga di `node_modules`, **Shadcn UI** mengusung pendekatan _Code Ownership_. Komponen disalin langsung ke dalam repositori proyek (`components/ui/`), memberikan kendali penuh 100% atas markup, style, dan logika komponen.

### Pilar Utama Shadcn UI

1. **Radix UI Primitives**: Menyediakan fondasi headless accessibility (A11y), keyboard navigation, dan state management.
2. **Tailwind CSS v4**: Menyediakan styling utility-first.
3. **Class Variance Authority (`cva`)**: Mengelola varian komponen (`variant`, `size`) secara deklaratif.
4. **`tailwind-merge` + `clsx` (`cn` Utility)**: Menggabungkan dan menangani konflik class Tailwind CSS secara dinamis.

### Struktur Direktori Komponen

```text
my-project/
├── app/
│   └── globals.css          # Definisi CSS Variables & @theme Tailwind v4
├── components/
│   ├── ui/                  # Komponen Atomic Shadcn (Button, Dialog, Card)
│   │   ├── button.tsx
│   │   ├── dialog.tsx
│   │   └── card.tsx
│   └── shared/              # Komponen bisnis hasil komposisi
├── lib/
│   └── utils.ts             # Fungsi helper cn()

```

---

## 2. Kustomisasi Tema & CSS Variables (Integrasi Tailwind CSS v4)

Shadcn UI menggunakan CSS Variables (HSL/OKLCH) untuk mengelola tema (_Light/Dark mode_). Pada Tailwind CSS v4, variabel ini dipetakan secara deklaratif di dalam `@theme`.

### 2.1. Konfigurasi `app/globals.css`

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;

    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;

    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;

    --primary: 222.2 47.4% 11.2%;
    --primary-foreground: 210 40% 98%;

    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;

    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;

    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;

    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 222.2 84% 4.9%;

    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;

    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;

    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;

    --primary: 210 40% 98%;
    --primary-foreground: 222.2 47.4% 11.2%;

    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;

    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;

    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;

    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;

    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 212.7 26.8% 83.9%;
  }
}

@theme {
  --color-background: hsl(var(--background));
  --color-foreground: hsl(var(--foreground));
  --color-card: hsl(var(--card));
  --color-card-foreground: hsl(var(--card-foreground));
  --color-primary: hsl(var(--primary));
  --color-primary-foreground: hsl(var(--primary-foreground));
  --color-secondary: hsl(var(--secondary));
  --color-secondary-foreground: hsl(var(--secondary-foreground));
  --color-muted: hsl(var(--muted));
  --color-muted-foreground: hsl(var(--muted-foreground));
  --color-accent: hsl(var(--accent));
  --color-accent-foreground: hsl(var(--accent-foreground));
  --color-destructive: hsl(var(--destructive));
  --color-destructive-foreground: hsl(var(--destructive-foreground));
  --color-border: hsl(var(--border));
  --color-input: hsl(var(--input));
  --color-ring: hsl(var(--ring));

  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
}
```

---

## 3. Utilitas Penggabung Class (`lib/utils.ts`)

Seluruh komponen Shadcn menggunakan helper `cn()` untuk memastikan class override dari consumer component mengalahkan class bawaan tanpa bentrok.

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 4. Modifikasi Varian Komponen (`cva`)

Untuk menambahkan varian baru (misalnya varian `gradient` atau ukuran `xl` pada `Button`), edit langsung definisi `cva` pada file komponen terkait.

### Contoh: Menambahkan Custom Variant pada `components/ui/button.tsx`

```tsx
// components/ui/button.tsx
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90',
        outline: 'border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',

        /* VARIAN KUSTOM BARU */
        gradient: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow hover:from-blue-700 hover:to-indigo-700',
        glass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        xl: 'h-12 rounded-lg px-10 text-base font-semibold', /* UKURAN BARU */
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className ref="{ref}" size, variant, {...props} }))}/>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };

```

---

## 5. Pola Dynamic Override & Extension

### 5.1. Class Name Override (Ad-hoc Styling)

Karena menggunakan `twMerge`, Class Tailwind yang dikirim via prop `className` akan menimpa style internal komponen:

```tsx
// Menimpa warna latar belakang bawaan varian 'default' menjadi emerald
<Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
  Simpan Data
</Button>
```

### 5.2. Pola Polimorfisme dengan `asChild` (Radix Slot)

Prop `asChild` menginstruksikan komponen untuk melempar atribut & event handler ke elemen anak langsung tanpa merender elemen HTML pembungkus ekstra (mencegah _invalid DOM nesting_).

```tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function NavigationLink() {
  return (
    // Button merender tag <a> dari Next.js Link tanpa merender tag <button>
    <Button asChild variant="outline">
      <Link href="/dashboard">Ke Dashboard</Link>
    </Button>
  );
}
```

---

## 6. Integrasi Dark Mode (`next-themes`)

Untuk mendukung _Dark Mode toggle_ di Next.js App Router:

### Langkah 1: Buat Provider (`components/theme-provider.tsx`)

```tsx
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

### Langkah 2: Bungkus Root Layout (`app/layout.tsx`)

```tsx
// app/layout.tsx
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          disableTransitionOnChange
          enableSystem
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## 7. Best Practices Kustomisasi

1. **Jaga Konsistensi Tema via CSS Variables**: Jangan melakukan _hardcode_ kode warna HEX (`#1e40af`) langsung di dalam komponen UI. Manfaatkan token tema seperti `bg-primary`, `text-muted-foreground`, atau `border-input`.
2. **Pisahkan Komponen Atomic vs Business**: Jangan memasukkan logika fetch API atau state aplikasi kompleks ke dalam file `components/ui/`. Buat komponen pembungkus di `components/shared/` atau `components/features/`.
3. **Manfaatkan `cva` untuk Varian Terulang**: Jika kombinasi styling tertentu digunakan lebih dari 3 kali di halaman berbeda, daftarkan sebagai varian baru di `buttonVariants` / `cardVariants` daripada menyalin string `className` secara manual.

```

---

### Ringkasan Isi File `docs/08-tech-references/ui-styling/shadcn-ui-customization.md`:

1. **Arsitektur Shadcn UI**:
   - Penjelasan filosofi *Code Ownership* (`components/ui/`), Radix UI Primitives, `cva`, dan `cn` helper.
2. **Kustomisasi Tema & CSS Variables**:
   - Pemetaan token tema HSL di `app/globals.css` dengan direktif `@theme` Tailwind CSS v4.
3. **Utilitas `cn` Helper**:
   - Fungsi kombinasi `clsx` + `tailwind-merge` untuk menangani konflik class secara otomatis.
4. **Modifikasi Varian (`cva`)**:
   - Tutorial menambahkan varian kustom (`gradient`, `glass`) dan ukuran baru (`xl`) pada `components/ui/button.tsx`.
5. **Dynamic Override & Polymorphism**:
   - Teknik *ad-hoc class override* via `className`.
   - Penggunaan prop `asChild` (Radix Slot) untuk integrasi dengan `next/link`.
6. **Dark Mode Integration**:
   - Setup `next-themes` Provider di Server Component Root Layout (`app/layout.tsx`).
7. **Best Practices Kustomisasi**:
   - Penggunaan token tema vs hardcoded color, pemisahan komponen atomic dan bisnis, serta efisiensi `cva`.
```
