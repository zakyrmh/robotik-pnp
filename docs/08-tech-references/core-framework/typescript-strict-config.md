# TypeScript Strict Configuration & Type Safety Guide

Panduan teknis mendalam mengenai konfigurasi `tsconfig.json` berbasis **Strict Mode**, _type-safety best practices_, serta integrasi TypeScript modern pada arsitektur **Next.js 16** dan **React 19**.

---

## 1. Rekomendasi `tsconfig.json` (Next.js 16 + React 19 Strict Setup)

Konfigurasi berikut dirancang khusus untuk proyek tanpa folder `src/` (menggunakan root path alias `@/*`) dengan standar keamanan tipe (_type safety_) tertinggi.

```json
{
  "compilerOptions": {
    /* Target & Environment */
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,

    /* Strict Type-Checking Options */
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,

    /* Additional Linter / Quality Checks */
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "allowUnreachableCode": false,
    "allowUnusedLabels": false,

    /* Module Resolution & Path Aliases (Tanpa src/) */
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"]
    },

    /* Next.js Plugin Support */
    "plugins": [
      {
        "name": "next"
      }
    ]
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", ".next", "out", "build"]
}
```

---

## 2. Penjelasan Flag Strict & Quality Rules Utama

### 2.1. Flag `strict: true`

Mengaktifkan sekelompok pemeriksaan ketat secara otomatis. Aturan turunan utamanya meliputi:

- **`noImplicitAny`**: Menolak tipe variabel/parameter yang secara implisit terdeteksi sebagai `any`.
- **`strictNullChecks`**: Memastikan `null` dan `undefined` tidak dapat di-assign ke tipe data lain tanpa explicit union.
- **`strictFunctionTypes`**: Mencegah penanganan tipe parameter fungsi yang kurang spesifik (_contravariance check_).
- **`strictPropertyInitialization`**: Mengirim error jika ada properti class yang belum diinisialisasi di constructor.

### 2.2. Flag Ekstra Sangat Direkomendasikan

#### `noUncheckedIndexedAccess`

Menganggap hasil pengaksesan elemen array atau objek dinamis (_indexer_) sebagai `Type | undefined`.

```typescript
type UserMap = Record<string, string>;
const users: UserMap = { admin: "Zaky" };

// Tanpa noUncheckedIndexedAccess: name bertipe 'string' (dapat menyebabkan runtime crash)
// Dengan noUncheckedIndexedAccess: name bertipe 'string | undefined'
const name = users["guest"];

if (name !== undefined) {
  console.log(name.toUpperCase()); // Safe
}
```

#### `noImplicitOverride`

Mewajibkan penggunaan keyword `override` saat melakukan _override_ method dari _parent class_.

```typescript
class BaseService {
  fetchData() {}
}

class UserService extends BaseService {
  override fetchData() {
    // Memastikan method ini secara eksplisit melakukan override
  }
}
```

---

## 3. Pattern & Type Safety untuk Next.js 16 & React 19

### 3.1. Asynchronous `params` dan `searchParams` di Next.js 16

Di Next.js 16 App Router, `params` dan `searchParams` diproses secara _asynchronous_ (mengembalikan `Promise`).

```tsx
// app/blog/[slug]/page.tsx

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BlogPostPage({
  params,
  searchParams,
}: PageProps) {
  const { slug } = await params;
  const { page, sort } = await searchParams;

  return (
    <article>
      <h1>Post Slug: {slug}</h1>
      <p>
        Page: {page ?? "1"}, Sort: {Array.isArray(sort) ? sort.join(",") : sort}
      </p>
    </article>
  );
}
```

### 3.2. Server Actions Type-Safety Pattern

Menggunakan Zod atau library validasi untuk menjamin tipe input pada Server Actions:

```typescript
// lib/actions/schema.ts
import { z } from "zod";

export const CreateUserSchema = z.object({
  name: z.string().min(3, "Nama minimal 3 karakter"),
  email: z.string().email("Format email tidak valid"),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
```

```typescript
// lib/actions/user-action.ts
"use server";

import { CreateUserSchema } from "./schema";

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; errors: Record<string, string[]> };

export async function createUserAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<{ id: string }>> {
  const rawData = Object.fromEntries(formData.entries());
  const validated = CreateUserSchema.safeParse(rawData);

  if (!validated.success) {
    return {
      success: false,
      errors: validated.error.flatten().fieldErrors,
    };
  }

  // Proses simpan data (validated.data aman & bertipe presisi)
  return {
    success: true,
    data: { id: "usr_123" },
  };
}
```

### 3.3. React 19 Props & Ref Typing

Di React 19, `ref` diteruskan sebagai prop biasa tanpa wrapper `forwardRef`.

```tsx
import type { ComponentPropsWithRef } from "react";

// Mengambil seluruh props standar HTML Input beserta ref-nya
type InputProps = ComponentPropsWithRef<"input"> & {
  label: string;
};

export function FormInput({ label, ref, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium">{label}</label>
      <input ref={ref} {...props} className="border p-2 rounded" />
    </div>
  );
}
```

---

## 4. Best Practices & Pitfalls to Avoid

1. **Hindari Penggunaan `any` (Gunakan `unknown`)**:
   `unknown` memaksa pengembang melakukan _type narrowing_ (seperti `typeof`, `instanceof`, atau `zod`) sebelum menggunakan variabel tersebut.
2. **Gunakan Path Alias `@/*`**:
   Sesuai struktur proyek tanpa folder `src/`, atur `"@/*": ["./*"]` agar pemanggilan modul seragam (`import { db } from '@/lib/db'`).
3. **Selalu Manfaatkan `satisfies` Operator**:
   Operator `satisfies` memungkinkan pencocokan tipe tanpa merusak presisi inferred type.

```typescript
type RouteConfig = Record<string, { path: string; protected: boolean }>;

const routes = {
  home: { path: "/", protected: false },
  dashboard: { path: "/dashboard", protected: true },
} satisfies RouteConfig;

// Presisi tipe tetap terjaga: routes.home.path diketahui bertipe string
```
