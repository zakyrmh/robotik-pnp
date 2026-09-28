import { describe, it, expect, vi, beforeEach } from "vitest";

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

const { mockSupabase, currentRole } = vi.hoisted(() => {
  const state = { role: "anggota" as string };

  // A generic thenable query builder: every chained method returns itself and
  // `single` / `order` / `maybeSingle` resolve with the seeded payloads.
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
    // Make the builder awaitable (for `.order(...).order(...)` chains).
    (builder as { then?: unknown }).then = (
      resolve: (value: unknown) => unknown,
    ) => resolve({ data: payload, error: null });
    return builder;
  };

  return {
    currentRole: state,
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
        return makeBuilder([]);
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

import PiketVerifikasiPage from "./page";
import { redirect } from "next/navigation";

function renderPage() {
  // The RSC is an async component; awaiting it runs the guard + data fetch.
  return PiketVerifikasiPage();
}

describe("PiketVerifikasiPage — RBAC guard (Finding 4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
