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
        if (table === "piket_schedules") {
          return makeBuilder([{ academic_period: "2026/2027" }]);
        }
        return makeBuilder([]);
      }),
      rpc: vi.fn(() => Promise.resolve({ data: [], error: null })),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Kedua fetcher Task 2 → [] agar halaman resolve tanpa data. Fungsi filter
// murni diteruskan dari modul asli (importActual) agar perilaku tetap nyata.
vi.mock("@/lib/repositories/piket", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/lib/repositories/piket")>();
  return {
    ...actual,
    getPiketHistoryLogs: vi.fn().mockResolvedValue([]),
    getPiketHistoryCompliance: vi.fn().mockResolvedValue([]),
  };
});

// Komponen klien (Task 6): diganti spy yang merekam props.
vi.mock("@/components/features/piket/piket-history-client", () => ({
  PiketHistoryClient: (props: Record<string, unknown>) => {
    capturedProps.props = props;
    return null;
  },
}));

import PiketRiwayatPage from "./page";
import { redirect } from "next/navigation";
import {
  getPiketHistoryLogs,
  getPiketHistoryCompliance,
} from "@/lib/repositories/piket";

type SearchParams = {
  period?: string;
  year?: string;
  month?: string;
  week?: string;
  tab?: string;
};

function renderPage(searchParams: SearchParams = {}) {
  // The RSC is an async component; awaiting it runs the guard + data fetch.
  // Next 16 passes `searchParams` as a Promise.
  return PiketRiwayatPage({ searchParams: Promise.resolve(searchParams) });
}

describe("PiketRiwayatPage — RBAC guard", () => {
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
      // Guard dijalankan SEBELUM fetch data admin apa pun — role terlarang
      // tidak boleh menyentuh data histori seluruh anggota.
      expect(getPiketHistoryLogs).not.toHaveBeenCalled();
      expect(getPiketHistoryCompliance).not.toHaveBeenCalled();
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

describe("PiketRiwayatPage — periode & parsing filter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.props = null;
    currentRole.role = "admin-kestari";
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
  });

  it("default ke periode paling baru + tab kepatuhan tanpa filter", async () => {
    render(await renderPage());

    const props = capturedProps.props as {
      availablePeriods: string[];
      initialTab: string;
      activeFilter: {
        academicPeriod: string;
        year: number | null;
        monthIndex0: number | null;
        weekNumber: number | null;
      };
    };
    expect(props.availablePeriods).toEqual(["2026/2027"]);
    expect(props.initialTab).toBe("kepatuhan");
    expect(props.activeFilter).toEqual({
      academicPeriod: "2026/2027",
      year: null,
      monthIndex0: null,
      weekNumber: null,
    });
  });

  it("memetakan month (1–12) ke monthIndex0 dan parse year/week + tab=log", async () => {
    render(
      await renderPage({ month: "9", year: "2026", week: "2", tab: "log" }),
    );

    const props = capturedProps.props as {
      initialTab: string;
      activeFilter: {
        year: number | null;
        monthIndex0: number | null;
        weekNumber: number | null;
      };
    };
    expect(props.initialTab).toBe("log");
    expect(props.activeFilter).toEqual({
      academicPeriod: "2026/2027",
      year: 2026,
      monthIndex0: 8,
      weekNumber: 2,
    });
  });

  it("mengabaikan nilai filter tak valid (di luar rentang)", async () => {
    render(await renderPage({ month: "13", week: "9", year: "abc" }));

    const props = capturedProps.props as {
      activeFilter: {
        year: number | null;
        monthIndex0: number | null;
        weekNumber: number | null;
      };
    };
    expect(props.activeFilter.year).toBeNull();
    expect(props.activeFilter.monthIndex0).toBeNull();
    expect(props.activeFilter.weekNumber).toBeNull();
  });
});
