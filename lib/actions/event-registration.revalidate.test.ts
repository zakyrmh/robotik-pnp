import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock server-only module for test environment
vi.mock("server-only", () => ({}));

/**
 * Regresi kuota MRC:
 *
 * 1. Halaman /mrc di-prerender statis (ISR) dan dulu TIDAK pernah di-revalidate
 *    oleh jalur pendaftaran -> kategori penuh tetap tampak punya slot. Setiap
 *    mutasi yang mengubah penahanan slot WAJIB memanggil `revalidatePath("/mrc")`.
 *
 * 2. Over-booking kuota terjadi karena transisi ke status permanen
 *    ('pending_verification'/'paid') tidak dicek kuota & masa tahan. Test ini
 *    mengunci bahwa `submitManualPaymentProofAction` memakai RPC atomik
 *    `reserve_slot_for_payment` (bukan update polos) dan menerjemahkan error
 *    'quota_full' / 'hold_expired' menjadi pesan yang ramah.
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

// Mock Supabase admin client: `select().eq().single()` mengembalikan baris.
const { mockRpc } = vi.hoisted(() => ({
  mockRpc: vi.fn(),
}));

const queryBuilder: Record<string, unknown> = {};
queryBuilder.select = vi.fn(() => queryBuilder);
queryBuilder.eq = vi.fn(() => queryBuilder);
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

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => queryBuilder),
    rpc: mockRpc,
  })),
}));

// Supabase "untyped" helper: teruskan ke client mock.
vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }, table: string) =>
    client.from(table),
  untypedRpc: (
    client: { rpc: (...a: unknown[]) => unknown },
    fn: string,
    args: unknown,
  ) => client.rpc(fn, args),
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

const PROOF_URL =
  "https://abc.supabase.co/storage/v1/object/public/mrc/proof.webp";

describe("event-registration: penegakan kuota pada upload bukti bayar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    queryBuilder.select = vi.fn(() => queryBuilder);
    queryBuilder.eq = vi.fn(() => queryBuilder);
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
  });

  it("memakai RPC atomik reserve_slot_for_payment (bukan update polos)", async () => {
    mockRpc.mockResolvedValueOnce({ data: "reg-1", error: null });

    const res = await submitManualPaymentProofAction(
      "access-token-abc",
      PROOF_URL,
    );

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("reserve_slot_for_payment", {
      p_access_token: "access-token-abc",
      p_proof_url: PROOF_URL,
    });
  });

  it("memanggil revalidatePath('/mrc') setelah sukses (kuota publik segar)", async () => {
    mockRpc.mockResolvedValueOnce({ data: "reg-1", error: null });

    const res = await submitManualPaymentProofAction(
      "access-token-abc",
      PROOF_URL,
    );

    expect(res.success).toBe(true);
    const calledPaths = mockRevalidatePath.mock.calls.map((c) => c[0]);
    expect(calledPaths).toContain("/mrc");
    expect(calledPaths).toContain("/manajemen-event");
  });

  it("menolak dengan pesan kuota penuh saat RPC melempar quota_full", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "quota_full" },
    });

    const res = await submitManualPaymentProofAction(
      "access-token-abc",
      PROOF_URL,
    );

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.toLowerCase()).toContain("kuota");
    }
    // Tidak menyentuh revalidate karena gagal.
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });

  it("menolak dengan pesan kedaluwarsa saat RPC melempar hold_expired", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "hold_expired" },
    });

    const res = await submitManualPaymentProofAction(
      "access-token-abc",
      PROOF_URL,
    );

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.toLowerCase()).toContain("daftar ulang");
    }
  });

  it("tidak memanggil revalidatePath bila token/URL kosong", async () => {
    const res = await submitManualPaymentProofAction("", "");
    expect(res.success).toBe(false);
    expect(mockRevalidatePath).not.toHaveBeenCalled();
  });
});
