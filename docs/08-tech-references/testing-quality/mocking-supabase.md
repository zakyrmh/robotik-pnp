# Mocking Supabase Client in Vitest & Unit Tests

Panduan teknis mengenai strategi _mocking_ **Supabase Client** untuk pengujian unit (_unit testing_) dan komponen pada aplikasi **Sistem Informasi Manajemen UKM Robotik PNP** berbasis **Next.js 16 (App Router)**.

---

## 1. Mengapa Perlu Mem-mock Supabase Client?

Pengujian unit (_unit testing_) bertujuan untuk menguji logika komponen UI, Server Actions, dan fungsi utilitas secara terisolasi cepat tanpa bergantung pada koneksi jaringan atau database sungguhan.

### Keuntungan Utama

- **Kecepatan Eksekusi**: Menghindari latensi jaringan HTTP request ke server Supabase.
- **Isolasi Lingkungan**: Mencegah efek samping mutasi data (_insert_, _update_, _delete_) pada database lokal maupun _production_.
- **Prediktabilitas**: Memungkinkan Anda mensimulasikan berbagai kondisi respon API (seperti _data success_, _error response_, _session expired_, atau _empty state_).

---

## 2. Inisialisasi Pattern Supabase Client di Next.js 16

Pada Next.js 16 App Router, Supabase Client biasanya diinisialisasi melalui utilitas `@supabase/ssr`:

- `lib/supabase/server.ts` (untuk Server Components, Server Actions, dan Route Handlers)
- `lib/supabase/client.ts` (untuk Client Components)

---

## 3. Strategi Mocking dengan Vitest (`vi.mock`)

### 3.1. Reusable Mock Factory (`e2e/mocks/supabase.ts` / `lib/testing/mock-supabase.ts`)

Buat helper mock universal agar mudah digunakan secara konsisten di berbagai file pengujian:

```typescript
import { vi } from "vitest";

export const createMockSupabaseClient = (overrides = {}) => {
  const mockSelect = vi.fn().mockReturnThis();
  const mockInsert = vi.fn().mockReturnThis();
  const mockUpdate = vi.fn().mockReturnThis();
  const mockDelete = vi.fn().mockReturnThis();
  const mockEq = vi.fn().mockReturnThis();
  const mockOrder = vi.fn().mockReturnThis();
  const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

  const mockFrom = vi.fn().mockReturnValue({
    select: mockSelect,
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    eq: mockEq,
    order: mockOrder,
    single: mockSingle,
  });

  const mockAuth = {
    getUser: vi.fn().mockResolvedValue({
      data: { user: { id: "usr_test_123", email: "anggota.test@pnp.ac.id" } },
      error: null,
    }),
    signInWithPassword: vi
      .fn()
      .mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
  };

  const mockStorage = {
    from: vi.fn().mockReturnValue({
      upload: vi
        .fn()
        .mockResolvedValue({ data: { path: "avatars/test.png" }, error: null }),
      getPublicUrl: vi
        .fn()
        .mockReturnValue({
          data: { publicUrl: "https://example.com/avatar.png" },
        }),
      createSignedUrl: vi
        .fn()
        .mockResolvedValue({
          data: { signedUrl: "https://example.com/signed.pdf" },
          error: null,
        }),
    }),
  };

  return {
    from: mockFrom,
    auth: mockAuth,
    storage: mockStorage,
    ...overrides,
  };
};
```

---

## 4. Contoh Implementasi Pengujian Unit

### 4.1. Mocking Supabase pada Server Action (`lib/actions/inventory.test.ts`)

Contoh pengujian Server Action pembaruan stok peralatan inventaris UKM Robotik PNP:

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { updateItemStock } from "./inventory";
import { createClient } from "@/lib/supabase/server";

// 1. Mock module Server Client Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

// 2. Mock revalidatePath dari next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

describe("Inventory Server Action - updateItemStock", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("harus mengembalikan success: true jika update database berhasil", async () => {
    // Setup Mock Implementation
    const mockEq = vi.fn().mockResolvedValue({ error: null });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom,
    } as any);

    const result = await updateItemStock("inv_101", 15);

    expect(mockFrom).toHaveBeenCalledWith("inventory");
    expect(mockUpdate).toHaveBeenCalledWith({ stock: 15 });
    expect(mockEq).toHaveBeenCalledWith("id", "inv_101");
    expect(result).toEqual({ success: true });
  });

  it("harus mengembalikan error jika query database gagal", async () => {
    const mockEq = vi
      .fn()
      .mockResolvedValue({ error: { message: "Database connection failed" } });
    const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });
    const mockFrom = vi.fn().mockReturnValue({ update: mockUpdate });

    vi.mocked(createClient).mockResolvedValue({
      from: mockFrom,
    } as any);

    const result = await updateItemStock("inv_101", 15);

    expect(result).toEqual({
      success: false,
      message: "Database connection failed",
    });
  });
});
```

---

### 4.2. Mocking Auth User State di Server Component (`app/dashboard/page.test.tsx`)

```tsx
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import DashboardPage from "./page";
import { createClient } from "@/lib/supabase/server";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Dashboard Page Component", () => {
  it("harus merender nama email user yang terautentikasi", async () => {
    vi.mocked(createClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: "usr_888", email: "zaky@pnp.ac.id" } },
          error: null,
        }),
      },
    } as any);

    const PageResolved = await DashboardPage();
    render(PageResolved);

    expect(screen.getByText(/zaky@pnp.ac.id/i)).toBeInTheDocument();
  });
});
```

---

## 5. Best Practices & Pitfalls to Avoid

1. **Selalu Bersihkan State Mock (`beforeEach`)**: Gunakan `vi.clearAllMocks()` atau `vi.resetAllMocks()` di dalam `beforeEach` agar histori panggilan `vi.fn()` pada satu skenario tidak mencemari tes lainnya.
2. **Mock Method Chaining Secara Presisi**: Query Builder Supabase bertumpu pada _method chaining_ (`.from().select().eq().single()`). Pastikan fungsi tiruan mengembalikan `this` atau objek chaining berikutnya hingga method terminal (`single()`, `then()`).
3. **Jangan Lupa Cast Types (`as any`)**: Saat mengembalikan mock object parsial pada TypeScript yang ketat, gunakan type assertion seperlunya agar linter TypeScript tidak komplain terhadap method Supabase SDK yang tidak di-implementasikan penuh di mock.
4. **Isolasi Pengujian**: Unit test hanya bertugas menguji logika komponen/fungsi kita. Untuk menguji integritas aktual RLS dan PostgreSQL trigger Supabase, gunakan _Integration/E2E Test_ dengan Supabase Local CLI.
