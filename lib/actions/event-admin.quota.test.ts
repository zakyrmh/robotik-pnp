import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Regresi over-booking kuota pada verifikasi admin:
 * Menyetujui pembayaran menandai pendaftaran menahan slot PERMANEN. Dulu update
 * ke 'paid' dilakukan polos tanpa cek kuota, sehingga jumlah lunas bisa melebihi
 * kuota. Test ini mengunci bahwa `verifyManualPaymentAction` aksi "approve"
 * memakai RPC atomik `verify_payment_with_quota` dan menolak saat `quota_full`.
 */

const { mockRevalidatePath, mockRpc } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockRpc: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn(async () => {}),
}));

vi.mock("@/lib/services/resend", () => ({
  sendETicketEmail: vi.fn(async () => ({ success: true })),
}));

const state = vi.hoisted(() => ({
  user: { id: "admin-1" } as { id: string } | null,
  profile: { role: "super-admin", role_event: "panitia-pendaftaran" } as {
    role: string;
    role_event: string | null;
  } | null,
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: { getUser: vi.fn(async () => ({ data: { user: state.user } })) },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn(async () => ({ data: state.profile, error: null })),
        }),
      }),
    }),
  })),
  createAdminClient: vi.fn(() => ({
    from: () => {
      const b: Record<string, unknown> = {};
      const chain = () => b;
      b.select = vi.fn(chain);
      b.eq = vi.fn(chain);
      b.update = vi.fn(chain);
      b.single = vi.fn(async () => ({
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
      return b;
    },
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }) => client.from("t"),
  untypedRpc: (client: { rpc: unknown }, fn: string, args: unknown) =>
    (client.rpc as (fn: string, a: unknown) => unknown)(fn, args),
}));

import { verifyManualPaymentAction } from "./event-admin";

const REG_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("event-admin: verifikasi pembayaran menegakkan kuota", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: "admin-1" };
    state.profile = { role: "super-admin", role_event: "panitia-pendaftaran" };
  });

  it("approve memakai RPC atomik verify_payment_with_quota", async () => {
    mockRpc.mockResolvedValueOnce({ data: null, error: null });

    const res = await verifyManualPaymentAction(REG_ID, "approve");

    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith("verify_payment_with_quota", {
      p_registration_id: REG_ID,
    });
  });

  it("approve ditolak (blokir total) saat RPC melempar quota_full", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "quota_full" },
    });

    const res = await verifyManualPaymentAction(REG_ID, "approve");

    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error.toLowerCase()).toContain("kuota");
    }
  });

  it("reject mewajibkan alasan", async () => {
    const res = await verifyManualPaymentAction(REG_ID, "reject", "");
    expect(res.success).toBe(false);
    expect(mockRpc).not.toHaveBeenCalled();
  });
});
