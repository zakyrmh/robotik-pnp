import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock server-only module for test environment
vi.mock("server-only", () => ({}));

/**
 * Regresi bug kuota publik basi:
 * Halaman /mrc di-prerender statis (ISR) dan TIDAK pernah di-revalidate oleh
 * jalur pendaftaran, sehingga kategori yang sudah penuh di database tetap
 * tampak memiliki slot di halaman publik.
 *
 * Test ini mengunci perbaikan: setiap mutasi yang mengubah kuota/penahanan
 * slot WAJIB memanggil `revalidatePath("/mrc")`.
 */

// Hoist mock untuk `next/cache` agar bisa diperiksa.
const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

// Mock Supabase admin client: cukup mengembalikan baris ter-update.
const { mockUpdate } = vi.hoisted(() => {
  const queryBuilder: Record<string, unknown> = {};
  queryBuilder.update = vi.fn(() => queryBuilder);
  queryBuilder.eq = vi.fn(() => queryBuilder);
  queryBuilder.select = vi.fn(() => queryBuilder);
  queryBuilder.single = vi.fn(async () => ({
    data: {
      id: "reg-1",
      access_token: "abc",
      team_email: "team@example.com",
      team_name: "Tim Uji",
      registration_code: "MRC-000000-0001",
      category: { name: "Line Follower Umum" },
    },
    error: null,
  }));
  queryBuilder.maybeSingle = vi.fn(async () => ({ data: null, error: null }));
  queryBuilder.order = vi.fn(() => queryBuilder);

  const mockUpdate = vi.fn(() => queryBuilder);
  return { mockUpdate };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({ update: mockUpdate })),
  })),
}));

// Supabase "untyped" helper: teruskan ke client mock.
vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }, table: string) =>
    client.from(table),
  untypedRpc: vi.fn(),
}));

vi.mock("@/lib/services/resend", () => ({
  sendETicketEmail: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/redis", () => ({
  eventRegistrationRateLimiter: {
    limit: vi.fn(async () => ({ success: true })),
  },
  mrcUploadRateLimiter: { limit: vi.fn(async () => ({ success: true })) },
}));

vi.mock("@/lib/turnstile", () => ({
  verifyTurnstileToken: vi.fn(async () => ({ success: true })),
}));

vi.mock("@/lib/services/midtrans", () => ({
  createMidtransSnapTransaction: vi.fn(),
  checkMidtransTransactionStatus: vi.fn(),
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => "127.0.0.1" })),
}));

import { submitManualPaymentProofAction } from "./event-registration";

describe("event-registration revalidation regresi kuota /mrc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("submitManualPaymentProofAction memanggil revalidatePath('/mrc')", async () => {
    // URL publik yang lolos isMrcImageUrl.
    const res = await submitManualPaymentProofAction(
      "access-token-abc",
      "https://abc.supabase.co/storage/v1/object/public/mrc/proof.webp",
    );

    expect(res.success).toBe(true);
    const calledPaths = mockRevalidatePath.mock.calls.map((c) => c[0]);
    expect(calledPaths).toContain("/mrc");
    expect(calledPaths).toContain("/manajemen-event");
  });

  it("tidak memanggil revalidatePath('/mrc') bila token/URL kosong", async () => {
    const res = await submitManualPaymentProofAction("", "");
    expect(res.success).toBe(false);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
