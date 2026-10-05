import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// --- Mocks ---------------------------------------------------------------

// RSC redirect: Next's `redirect` throws a special error to unwind rendering.
// We emulate that contract with a sentinel so the test can assert on it.
class RedirectError extends Error {
  constructor(public readonly destination: string) {
    super(`REDIRECT:${destination}`);
    this.name = "RedirectError";
  }
}

vi.mock("next/navigation", () => ({
  redirect: vi.fn((destination: string) => {
    throw new RedirectError(destination);
  }),
}));

// Tangkap props yang diterima komponen klien (untuk assert nama ter-resolve).
const { capturedProps, mockSupabase, currentRole } = vi.hoisted(() => {
  const state = { role: "anggota" as string, props: null as unknown };

  const makeBuilder = (payload: unknown) => {
    const builder: Record<string, unknown> = {};
    const chain = () => builder;
    for (const method of [
      "select",
      "eq",
      "neq",
      "in",
      "order",
      "limit",
      "is",
      "lt",
      "gte",
      "lte",
    ]) {
      builder[method] = vi.fn(chain);
    }
    builder.single = vi.fn(() =>
      Promise.resolve({ data: payload, error: null }),
    );
    builder.maybeSingle = vi.fn(() =>
      Promise.resolve({ data: payload, error: null }),
    );
    (builder as { then?: unknown }).then = (
      resolve: (value: unknown) => unknown,
    ) => resolve({ data: payload, error: null });
    return builder;
  };

  const logRow = {
    id: "log-1",
    duty_date: "2026-09-10",
    notes: "bersih",
    proof_image_url: "after.jpg",
    proof_image_before_url: "before.jpg",
    is_verified: true,
    is_final: false,
    rejection_reason: null,
    verified_at: null,
    schedule_id: "sched-1",
    piket_schedules: {
      id: "sched-1",
      academic_period: "2026/2027",
      week_number: 1,
      room_target: "workshop_dan_sekretariat",
    },
    // Pelapor = super-admin (role yang TIDAK bisa dibaca admin-kestari via RLS).
    reported_by: "super-admin-id",
    verified_by: null,
  };

  return {
    currentRole: state,
    capturedProps: state,
    mockSupabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return makeBuilder({
            id: "user-id",
            email: "user@robotik.pnp",
            role: state.role,
            is_onboarded: true,
          });
        }
        if (table === "piket_logs") {
          return makeBuilder([logRow]);
        }
        if (table === "piket_schedules") {
          return makeBuilder([
            {
              id: "sched-1",
              academic_period: "2026/2027",
              week_number: 1,
              room_target: "workshop_dan_sekretariat",
            },
          ]);
        }
        return makeBuilder([]);
      }),
      // RPC: get_piket_person_names → nama pengurus; get_piket_roster → kosong.
      rpc: vi.fn((fn: string) => {
        if (fn === "get_piket_person_names") {
          return Promise.resolve({
            data: [
              {
                id: "super-admin-id",
                nim: "2411082024",
                full_name: "Zaky Ramadhan",
              },
            ],
            error: null,
          });
        }
        return Promise.resolve({ data: [], error: null });
      }),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

vi.mock("@/lib/actions/piket", () => ({
  finalizeExpiredPiketReviews: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock("@/lib/repositories/piket", () => ({
  getPiketComplianceReport: vi.fn().mockResolvedValue([]),
}));

// Ganti komponen klien dengan spy yang merekam props.
vi.mock("@/components/features/piket/piket-verification-client", () => ({
  PiketVerificationClient: (props: Record<string, unknown>) => {
    capturedProps.props = props;
    return null;
  },
}));

import PiketVerifikasiPage from "./page";
import { redirect } from "next/navigation";

function renderPage() {
  // The RSC is an async component; awaiting it runs the guard + data fetch.
  return PiketVerifikasiPage();
}

describe("PiketVerifikasiPage — RBAC guard (Finding 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.props = null;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
  });

  it.each(["anggota", "admin-or", "admin-komdis", "admin-divisi"])(
    "redirects role %s to /piket",
    async (role) => {
      currentRole.role = role;
      await expect(renderPage()).rejects.toThrow("REDIRECT:/piket");
      expect(redirect).toHaveBeenCalledWith("/piket");
    },
  );

  it.each(["super-admin", "admin-kestari"])(
    "does NOT redirect role %s",
    async (role) => {
      currentRole.role = role;
      // Rendering the page (which returns a Suspense element) must resolve
      // without throwing a redirect.
      await expect(renderPage()).resolves.toBeTruthy();
      expect(redirect).not.toHaveBeenCalled();
    },
  );
});

describe("PiketVerifikasiPage — nama pengurus untuk admin-kestari (RLS fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.props = null;
    currentRole.role = "admin-kestari";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
  });

  it("resolve reporter_name via RPC get_piket_person_names (bukan 'Anggota')", async () => {
    render(await renderPage());

    const props = capturedProps.props as {
      logs?: { reporter_name: string; reporter_nim: string }[];
    };
    expect(props?.logs).toHaveLength(1);
    expect(props?.logs?.[0].reporter_name).toBe("Zaky Ramadhan");
    expect(props?.logs?.[0].reporter_nim).toBe("2411082024");

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_piket_person_names", {
      p_ids: ["super-admin-id"],
    });
  });
});
