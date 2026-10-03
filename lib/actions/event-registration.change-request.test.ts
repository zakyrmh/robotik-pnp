import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

/**
 * Test permohonan perbaikan data peserta:
 * - guard token tidak valid
 * - guard pendaftaran ditutup (batch tidak aktif)
 * - guard permohonan pending menumpuk
 * - happy path menyimpan permohonan pending
 */

const { mockRevalidatePath } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => ({ get: () => "127.0.0.1" })),
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

// Kontrol hasil per query.
const state = vi.hoisted(() => ({
  reg: null as { id: string; team_name: string } | null,
  settings: null as Record<string, unknown> | null,
  pending: null as { id: string } | null,
  inserted: { id: "req-1" } as { id: string } | null,
  insertError: null as unknown,
}));

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({
    from: (table: string) => {
      const builder: Record<string, unknown> = {};
      const chain = () => builder;
      builder.select = vi.fn(chain);
      builder.eq = vi.fn(chain);
      builder.order = vi.fn(chain);
      builder.limit = vi.fn(chain);
      builder.insert = vi.fn(chain);
      builder.maybeSingle = vi.fn(async () => {
        if (table === "event_registrations")
          return { data: state.reg, error: null };
        if (table === "event_settings")
          return { data: state.settings, error: null };
        if (table === "event_registration_change_requests")
          return { data: state.pending, error: null };
        return { data: null, error: null };
      });
      builder.single = vi.fn(async () => ({
        data: state.inserted,
        error: state.insertError,
      }));
      return builder;
    },
  })),
}));

vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }, table: string) =>
    client.from(table),
  untypedRpc: vi.fn(),
}));

import { submitRegistrationChangeRequestAction } from "./event-registration";

const VALID_PAYLOAD = {
  team_name: "Tim Robotik A",
  institution: "SMK Negeri 1 Padang",
  origin_city: "Padang",
  advisor_name: "Pak Dedi",
  team_email: "tim@example.com",
  team_whatsapp: "081234567890",
  members: [
    {
      full_name: "Budi",
      photo_url: "https://abc.supabase.co/x.webp",
      role_in_team: "Ketua",
    },
    {
      full_name: "Ani",
      photo_url: "https://abc.supabase.co/y.webp",
      role_in_team: "Anggota",
    },
  ],
};

// Settings dengan batch 1 aktif sekarang.
const OPEN_SETTINGS = {
  id: 1,
  batch1_start: new Date(Date.now() - 86400000).toISOString(),
  batch1_end: new Date(Date.now() + 86400000).toISOString(),
  batch2_start: null,
  batch2_end: null,
  timeline_release_date: null,
  payment_mode: "manual_bank",
};

describe("submitRegistrationChangeRequestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.reg = { id: "reg-1", team_name: "Tim Robotik A" };
    state.settings = OPEN_SETTINGS;
    state.pending = null;
    state.inserted = { id: "req-1" };
    state.insertError = null;
  });

  it("menolak token kosong", async () => {
    const res = await submitRegistrationChangeRequestAction("", VALID_PAYLOAD);
    expect(res.success).toBe(false);
  });

  it("menolak bila pendaftaran tidak ditemukan", async () => {
    state.reg = null;
    const res = await submitRegistrationChangeRequestAction(
      "tok",
      VALID_PAYLOAD,
    );
    expect(res.success).toBe(false);
  });

  it("menolak bila pendaftaran sudah ditutup (batch tidak aktif)", async () => {
    state.settings = { ...OPEN_SETTINGS, batch1_start: null, batch1_end: null };
    const res = await submitRegistrationChangeRequestAction(
      "tok",
      VALID_PAYLOAD,
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain("ditutup");
  });

  it("menolak bila masih ada permohonan pending", async () => {
    state.pending = { id: "existing" };
    const res = await submitRegistrationChangeRequestAction(
      "tok",
      VALID_PAYLOAD,
    );
    expect(res.success).toBe(false);
    if (!res.success) expect(res.error).toContain("menunggu");
  });

  it("menolak payload tidak valid (anggota < 2)", async () => {
    const res = await submitRegistrationChangeRequestAction("tok", {
      ...VALID_PAYLOAD,
      members: [VALID_PAYLOAD.members[0]],
    } as never);
    expect(res.success).toBe(false);
  });

  it("happy path menyimpan permohonan pending", async () => {
    const res = await submitRegistrationChangeRequestAction(
      "tok",
      VALID_PAYLOAD,
    );
    expect(res.success).toBe(true);
    if (res.success) expect(res.data).toEqual({ requestId: "req-1" });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/mrc/tiket/tok");
  });
});
