# Vitest Unit Testing Setup Guide for Next.js 16

Panduan teknis konfigurasi dan pengujian unit (_unit testing_) menggunakan **Vitest** dan **React Testing Library** pada **Next.js 16 (App Router)** tanpa folder `src/` untuk project **Sistem Informasi Manajemen UKM Robotik PNP**.

---

## 1. Arsitektur & Keunggulan Vitest di Next.js 16

Vitest dipilih sebagai kerangka kerja pengujian unit modern karena menawarkan beberapa keunggulan utama:

- **Instant HMR & Speed**: Menjalankan pengujian berbasis ESM yang terintegrasi secara cepat.
- **Native TypeScript Support**: Mendukung file `.ts` dan `.tsx` secara langsung tanpa _transpilation step_ yang rumit.
- **Compatibility**: API kompatibel dengan Jest (`describe`, `it`, `expect`, `vi.fn()`), memudahkan adopsi dan migrasi.
- **Official Plugin Support**: Menggunakan `@vitejs/plugin-react` dan `vite-tsconfig-paths` untuk resolusi path alias `@/*` mengarah ke root.

---

## 2. Instalasi Packages

Jalankan perintah berikut pada akar (_root_) proyek Anda:

```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths
```

---

## 3. Konfigurasi Utama Vitest (`vitest.config.ts`)

Buat file `vitest.config.ts` di akar proyek (sejajar dengan `package.json` dan `next.config.ts`):

```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.test.{ts,tsx}", "**/*.spec.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        ".next/",
        "vitest.config.ts",
        "vitest.setup.ts",
        "**/*.d.ts",
      ],
    },
  },
});
```

---

## 4. Setup File (`vitest.setup.ts`)

Buat file `vitest.setup.ts` di akar proyek untuk memperluas ekspektasi `matchers` dari `@testing-library/jest-dom` serta melakukan mock pada Web APIs jika diperlukan:

```typescript
import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Next.js Navigation Hooks (useRouter, usePathname, useSearchParams)
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Next.js Image Component
vi.mock('next/image', () => ({
  default: (props: any) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt || ''} />;
  },
}));
```

---

## 5. Menambahkan Script pada `package.json`

Tambahkan script berikut pada bagian `scripts` di `package.json`:

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

---

## 6. Contoh Implementasi Pengujian Unit

### 6.1. Unit Test Komponen UI (`components/ui/button.test.tsx`)

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./button";
import userEvent from "@testing-library/user-event";

describe("Button Component", () => {
  it("harus merender teks tombol dengan benar", () => {
    render(<Button>Simpan Peralatan</Button>);
    expect(
      screen.getByRole("button", { name: /simpan peralatan/i }),
    ).toBeInTheDocument();
  });

  it("harus memanggil event handler onClick saat diklik", async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Kirim</Button>);

    const button = screen.getByRole("button", { name: /kirim/i });
    await userEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("harus memiliki atribut disabled jika prop disabled diberikan", () => {
    render(<Button disabled>Proses...</Button>);
    expect(screen.getByRole("button", { name: /proses.../i })).toBeDisabled();
  });
});
```

### 6.2. Unit Test Fungsi Utilitas (`lib/utils/format.test.ts`)

```typescript
import { describe, it, expect } from "vitest";

// Contoh fungsi helper format rupiah / tanggal
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

describe("formatRupiah Helper", () => {
  it("harus memformat angka menjadi format mata uang Rupiah", () => {
    const result = formatRupiah(150000);
    // Menguji string format IDR
    expect(result).toMatch(/Rp\s?150\.000/);
  });
});
```

---

## 7. Best Practices Pengujian Unit

1. **Gunakan Testing Library Best Practices**: Utamakan pencarian elemen menggunakan `getByRole`, `getByLabelText`, atau `getByText` dibandingkan memilih class/id CSS.
2. **Mock External Services**: Gunakan `vi.fn()` atau `vi.mock()` untuk mengisolasi ketergantungan API luar (seperti Supabase client, Redis, atau Cloudflare Turnstile).
3. **Pemisahan Test File**: Letakkan file pengujian berdekatan dengan komponen/utilitas yang diuji (`component.tsx` $
ightarrow$ `component.test.tsx`) atau dalam folder `__tests__`.
4. **Jaga Pengujian Tetap Murni (Pure Unit Test)**: Jangan melakukan HTTP Request sungguhan ke server/database pada unit test.
