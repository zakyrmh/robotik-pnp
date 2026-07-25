/**
 * Unit Tests untuk Server Actions Autentikasi
 * File: lib/actions/auth.ts
 *
 * Strategi Mock:
 * - `@/lib/supabase/server` di-mock agar `createClient()` mengembalikan
 *   klien palsu yang dapat dikontrol per-test.
 * - `next/cache` dan `next/navigation` di-mock agar `revalidatePath()` dan
 *   `redirect()` tidak benar-benar melempar error NEXT_REDIRECT saat happy path.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// Env stubs — aksi auth membutuhkan variabel ini agar tidak short-circuit.
process.env.NEXT_PUBLIC_SITE_URL = "http://localhost:3000";

// Variabel mock yang dapat dikontrol dinamis di setiap test block.
// Nama HARUS diawali "mock" agar bisa diakses di dalam factory vi.mock() yang di-hoist.
let mockSignUpResult: { error: { message: string } | null } = { error: null };
let mockSignInResult: { error: { message: string } | null } = { error: null };
let mockRedirectCalled = false;
let mockRedirectTarget = "";
let mockProfileResult: {
  data: Record<string, unknown> | null;
  error: { message: string } | null;
} = { data: null, error: null };
let mockGetUserResult: {
  data: { user: Record<string, unknown> | null };
  error: { message: string } | null;
} = { data: { user: null }, error: null };
let mockResetPasswordResult: { error: { message: string } | null } = {
  error: null,
};
let mockUpdateUserResult: { error: { message: string } | null } = {
  error: null,
};

// -----------------------------------------------------------------------
// Mock: next/cache
// -----------------------------------------------------------------------
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// -----------------------------------------------------------------------
// Mock: next/navigation
// `redirect()` pada Server Action di-mock agar tidak melempar NEXT_REDIRECT.
// Kita tetap mencatat ke mana redirect seharusnya dilakukan.
// -----------------------------------------------------------------------
vi.mock("next/navigation", () => ({
  redirect: vi.fn((path: string) => {
    mockRedirectCalled = true;
    mockRedirectTarget = path;
  }),
}));

// -----------------------------------------------------------------------
// Mock: @/lib/supabase/server
// Mengembalikan klien palsu dengan auth methods yang dikontrol via mock.
// -----------------------------------------------------------------------
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      signUp: vi.fn(async () => mockSignUpResult),
      signInWithPassword: vi.fn(async () => mockSignInResult),
      exchangeCodeForSession: vi.fn(async () => ({ error: null })),
      signOut: vi.fn(async () => {}),
      getUser: vi.fn(async () => mockGetUserResult),
      updateUser: vi.fn(async () => mockUpdateUserResult),
      resetPasswordForEmail: vi.fn(async () => mockResetPasswordResult),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => mockProfileResult),
          maybeSingle: vi.fn(async () => mockProfileResult),
        })),
      })),
    })),
  })),
  createAdminClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail: vi.fn(async () => mockResetPasswordResult),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(async () => mockProfileResult),
          maybeSingle: vi.fn(async () => mockProfileResult),
        })),
      })),
    })),
  })),
}));

// -----------------------------------------------------------------------
// Helper: Membuat objek FormData untuk keperluan test
// -----------------------------------------------------------------------
function createFormData(fields: Record<string, string>): FormData {
  const fd = new FormData();
  Object.entries(fields).map(([key, val]) => fd.append(key, val));
  return fd;
}

// -----------------------------------------------------------------------
// Import Server Actions setelah semua mock terdefinisi
// -----------------------------------------------------------------------
import {
  register,
  login,
  forgotPassword,
  updatePassword,
} from "@/lib/actions/auth";

// =======================================================================
// A. MODUL REGISTRASI
// =======================================================================
describe("A. Server Action: register()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUpResult = { error: null };
    mockSignInResult = { error: null };
    mockRedirectCalled = false;
    mockRedirectTarget = "";
  });

  // --- Test Case 1: Happy Path ---
  it("[TC-R1] Happy Path: email valid + password cocok → signUp sukses, redirect ke /verify-email", async () => {
    const fd = createFormData({
      email: "zaky@robotik.org",
      password: "Rahasia123",
      confirmPassword: "Rahasia123",
    });

    const result = await register(null, fd);

    // Tidak boleh ada pesan error
    expect(result?.error).toBeUndefined();
    // Seharusnya redirect ke halaman verifikasi email
    expect(mockRedirectCalled).toBe(true);
    expect(mockRedirectTarget).toBe("/verify-email");
  });

  // --- Test Case 2: Password Mismatch ---
  it("[TC-R2] Password Mismatch: konfirmasi berbeda → validasi gagal sebelum memanggil API Supabase", async () => {
    const fd = createFormData({
      email: "zaky@robotik.org",
      password: "Rahasia123",
      confirmPassword: "Rahasia321",
    });

    const result = await register(null, fd);

    expect(result?.error).toBe("Password tidak cocok.");
    // Pastikan Supabase TIDAK dipanggil
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case 3: Email Invalid ---
  it("[TC-R3] Email Invalid: format email salah → validasi skema menolak request", async () => {
    const fd = createFormData({
      email: "zaky-bukan-email",
      password: "Rahasia123",
      confirmPassword: "Rahasia123",
    });

    const result = await register(null, fd);

    expect(result?.error).toBe("Format email tidak valid.");
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case 4: User Already Exists ---
  it('[TC-R4] User Already Exists: Supabase returns "already registered" → error ditangkap dengan aman', async () => {
    mockSignUpResult = { error: { message: "User already registered" } };

    const fd = createFormData({
      email: "existing@robotik.org",
      password: "Rahasia123",
      confirmPassword: "Rahasia123",
    });

    const result = await register(null, fd);

    expect(result?.error).toBe("Email sudah terdaftar. Silahkan login.");
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case Bonus: Empty Fields ---
  it("[TC-R5] Empty Fields: field email kosong → validasi memblokir request", async () => {
    const fd = createFormData({
      email: "",
      password: "Rahasia123",
      confirmPassword: "Rahasia123",
    });

    const result = await register(null, fd);

    expect(result?.error).toBe("Semua field harus diisi.");
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case Bonus: Password terlalu pendek ---
  it("[TC-R6] Short Password: password kurang dari 8 karakter → validasi menolak", async () => {
    const fd = createFormData({
      email: "zaky@robotik.org",
      password: "abc",
      confirmPassword: "abc",
    });

    const result = await register(null, fd);

    expect(result?.error).toBe("Password minimal 8 karakter.");
    expect(mockRedirectCalled).toBe(false);
  });
});

// =======================================================================
// B. MODUL LOGIN
// =======================================================================
describe("B. Server Action: login()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignUpResult = { error: null };
    mockSignInResult = { error: null };
    mockRedirectCalled = false;
    mockRedirectTarget = "";
  });

  // --- Test Case 1: Happy Path ---
  it("[TC-L1] Happy Path: kredensial valid → signIn sukses, redirect ke /dashboard", async () => {
    const fd = createFormData({
      email: "zaky@robotik.org",
      password: "Rahasia123",
    });

    const result = await login(null, fd);

    expect(result?.error).toBeUndefined();
    expect(mockRedirectCalled).toBe(true);
    expect(mockRedirectTarget).toBe("/dashboard");
  });

  // --- Test Case 2: Invalid Credentials ---
  it("[TC-L2] Invalid Credentials: password salah → Supabase returns error, fungsi handle dengan aman", async () => {
    mockSignInResult = {
      error: { message: "Invalid login credentials" },
    };

    const fd = createFormData({
      email: "zaky@robotik.org",
      password: "SalahPassword!",
    });

    const result = await login(null, fd);

    expect(result?.error).toBe("Email atau password salah.");
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case 3: Empty Fields ---
  it("[TC-L3] Empty Fields: email atau password kosong → validasi memblokir request", async () => {
    const fdEmpty = createFormData({ email: "", password: "" });
    const result = await login(null, fdEmpty);

    expect(result?.error).toBe("Email dan password wajib diisi.");
    expect(mockRedirectCalled).toBe(false);
  });

  it("[TC-L4] Empty Password saja: email ada tapi password kosong → validasi memblokir", async () => {
    const fd = createFormData({ email: "zaky@robotik.org", password: "" });
    const result = await login(null, fd);

    expect(result?.error).toBe("Email dan password wajib diisi.");
    expect(mockRedirectCalled).toBe(false);
  });

  // --- Test Case Bonus: Email not confirmed ---
  it("[TC-L5] Email Not Confirmed: Supabase mengembalikan error konfirmasi email", async () => {
    mockSignInResult = {
      error: { message: "Email not confirmed" },
    };

    const fd = createFormData({
      email: "belumkonfirmasi@robotik.org",
      password: "Rahasia123",
    });

    const result = await login(null, fd);

    expect(result?.error).toBe(
      "Email Anda belum dikonfirmasi. Silahkan cek inbox Anda.",
    );
    expect(mockRedirectCalled).toBe(false);
  });
});

// =======================================================================
// C. MODUL FORGOT PASSWORD & UPDATE PASSWORD
// =======================================================================
describe("C. Server Actions: forgotPassword() & updatePassword()", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedirectCalled = false;
    mockRedirectTarget = "";
    mockProfileResult = { data: null, error: null };
    mockGetUserResult = { data: { user: null }, error: null };
    mockResetPasswordResult = { error: null };
    mockUpdateUserResult = { error: null };
  });

  it("[TC-FP1] NIM atau Email kosong → return error validation", async () => {
    const fd = createFormData({ nim: "", email: "" });
    const res = await forgotPassword(null, fd);
    expect(res?.error).toBe("NIM dan Email wajib diisi.");
  });

  it("[TC-FP2] Format email tidak valid → return error validation", async () => {
    const fd = createFormData({ nim: "2301091001", email: "bukan-email" });
    const res = await forgotPassword(null, fd);
    expect(res?.error).toBe("Format email tidak valid.");
  });

  it("[TC-FP3] NIM tidak ditemukan → return error NIM tidak ditemukan", async () => {
    mockProfileResult = { data: null, error: { message: "Not found" } };
    const fd = createFormData({ nim: "999999", email: "user@pnp.ac.id" });
    const res = await forgotPassword(null, fd);
    expect(res?.error).toBe("NIM tidak ditemukan.");
  });

  it("[TC-FP4] NIM ditemukan tetapi email tidak cocok → return error email tidak cocok", async () => {
    mockProfileResult = {
      data: { id: "user-1", email: "asli@pnp.ac.id", nim: "2301091001" },
      error: null,
    };
    const fd = createFormData({ nim: "2301091001", email: "salah@pnp.ac.id" });
    const res = await forgotPassword(null, fd);
    expect(res?.error).toBe(
      "Email tidak terdaftar atau tidak cocok dengan NIM.",
    );
  });

  it("[TC-FP5] Happy path forgotPassword → resetPasswordForEmail dipanggil & redirect ke /forgot-password/waiting", async () => {
    mockProfileResult = {
      data: { id: "user-1", email: "user@pnp.ac.id", nim: "2301091001" },
      error: null,
    };
    const fd = createFormData({ nim: "2301091001", email: "USER@pnp.ac.id" });
    const res = await forgotPassword(null, fd);
    expect(res?.error).toBeUndefined();
    expect(mockRedirectCalled).toBe(true);
    expect(mockRedirectTarget).toBe("/forgot-password/waiting");
  });

  it("[TC-UP1] Sesi tidak valid saat updatePassword → return error", async () => {
    mockGetUserResult = { data: { user: null }, error: null };
    const fd = createFormData({
      password: "PasswordBaru123",
      confirmPassword: "PasswordBaru123",
    });
    const res = await updatePassword(null, fd);
    expect(res?.error).toContain("Sesi reset password tidak valid");
  });

  it("[TC-UP2] Password mismatch saat updatePassword → return error", async () => {
    mockGetUserResult = { data: { user: { id: "user-1" } }, error: null };
    const fd = createFormData({
      password: "PasswordBaru123",
      confirmPassword: "BedaPassword123",
    });
    const res = await updatePassword(null, fd);
    expect(res?.error).toBe("Password tidak cocok.");
  });

  it("[TC-UP3] Happy path updatePassword → updateUser dipanggil, signOut, redirect ke /login", async () => {
    mockGetUserResult = { data: { user: { id: "user-1" } }, error: null };
    const fd = createFormData({
      password: "PasswordBaru123",
      confirmPassword: "PasswordBaru123",
    });
    const res = await updatePassword(null, fd);
    expect(res?.error).toBeUndefined();
    expect(mockRedirectCalled).toBe(true);
    expect(mockRedirectTarget).toContain("/login?message=");
  });
});
