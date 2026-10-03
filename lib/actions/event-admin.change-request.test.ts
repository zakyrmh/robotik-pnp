import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const { mockRevalidatePath, mockRecordAuditLog, mockRpc } = vi.hoisted(() => ({
  mockRevalidatePath: vi.fn(),
  mockRecordAuditLog: vi.fn(async () => {}),
  mockRpc: vi.fn(async () => "reg-1"),
}));

vi.mock("next/cache", () => ({
  revalidatePath: mockRevalidatePath,
  updateTag: vi.fn(),
  unstable_cache: (fn: unknown) => fn,
}));

vi.mock("@/lib/audit", () => ({
  recordAuditLog: mockRecordAuditLog,
}));

vi.mock("@/lib/services/resend", () => ({
  sendETicketEmail: vi.fn(async () => ({ success: true })),
}));

// Kontrol: user & request.
const state = vi.hoisted(() => ({
  user: { id: "admin-1" } as { id: string } | null,
  profile: { role: "super-admin", role_event: "panitia-pendaftaran" } as {
    role: string;
    role_event: string | null;
  } | null,
  request: null as Record<string, unknown> | null,
  rejectError: null as unknown,
  pendingRows: [] as { registration_id: string }[],
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
      b.order = vi.fn(chain);
      b.update = vi.fn(chain);
      b.maybeSingle = vi.fn(async () => ({ data: state.request, error: null }));
      b.then = (resolve: (v: unknown) => void) =>
        resolve({
          data: state.request ?? state.pendingRows,
          error: state.rejectError,
        });
      return b;
    },
    rpc: mockRpc,
  })),
}));

vi.mock("@/lib/supabase/untyped", () => ({
  untypedFrom: (client: { from: (t: string) => unknown }) => client.from("t"),
  untypedRpc: (client: { rpc: unknown }, _fn: string, args: unknown) =>
    (client.rpc as (a: unknown) => unknown)(args),
}));

import {
  reviewRegistrationChangeRequestAction,
  getPendingChangeRequestMapAction,
} from "./event-admin";

const REQ_ID = "550e8400-e29b-41d4-a716-446655440000";

describe("reviewRegistrationChangeRequestAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: "admin-1" };
    state.profile = { role: "super-admin", role_event: "panitia-pendaftaran" };
    state.request = {
      id: REQ_ID,
      registration_id: "reg-1",
      status: "pending",
      requested_data: { team: {}, members: [] },
    };
    state.rejectError = null;
    mockRpc.mockResolvedValue("reg-1");
  });

  it("menolak bila belum login", async () => {
    state.user = null;
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "approve",
    });
    expect(res.success).toBe(false);
  });

  it("menolak bila role tidak berwenang", async () => {
    state.profile = { role: "anggota", role_event: null };
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "approve",
    });
    expect(res.success).toBe(false);
  });

  it("reject tanpa catatan ditolak", async () => {
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "reject",
    });
    expect(res.success).toBe(false);
  });

  it("menolak bila permohonan sudah ditinjau", async () => {
    state.request = {
      id: REQ_ID,
      registration_id: "reg-1",
      status: "approved",
    };
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "approve",
    });
    expect(res.success).toBe(false);
  });

  it("approve memanggil RPC + audit log", async () => {
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "approve",
    });
    expect(res.success).toBe(true);
    expect(mockRpc).toHaveBeenCalled();
    expect(mockRecordAuditLog).toHaveBeenCalled();
    expect(mockRevalidatePath).toHaveBeenCalled();
  });

  it("reject menyimpan catatan + audit log", async () => {
    const res = await reviewRegistrationChangeRequestAction({
      request_id: REQ_ID,
      action: "reject",
      note: "Nomor WA tidak valid",
    });
    expect(res.success).toBe(true);
    expect(mockRecordAuditLog).toHaveBeenCalled();
  });
});

describe("getPendingChangeRequestMapAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    state.user = { id: "admin-1" };
    state.profile = { role: "super-admin", role_event: "panitia-pendaftaran" };
    state.request = null;
    state.pendingRows = [];
  });

  it("menolak bila role tidak berwenang", async () => {
    state.profile = { role: "anggota", role_event: null };
    const res = await getPendingChangeRequestMapAction();
    expect(res.success).toBe(false);
  });

  it("menghitung registrasi unik dengan permohonan pending", async () => {
    state.pendingRows = [
      { registration_id: "reg-1" },
      { registration_id: "reg-2" },
      { registration_id: "reg-1" }, // duplikat → tetap 2 unik
    ];
    const res = await getPendingChangeRequestMapAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.count).toBe(2);
      expect(res.data.ids.sort()).toEqual(["reg-1", "reg-2"]);
    }
  });

  it("mengembalikan 0 bila tidak ada permohonan pending", async () => {
    state.pendingRows = [];
    const res = await getPendingChangeRequestMapAction();
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.count).toBe(0);
      expect(res.data.ids).toEqual([]);
    }
  });
});
