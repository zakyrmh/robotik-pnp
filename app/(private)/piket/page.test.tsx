import { describe, it, expect, vi, beforeEach } from "vitest";
import { render } from "@testing-library/react";

// --- Mocks ---------------------------------------------------------------

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

// Tangkap props yang diterima komponen klien agar kita bisa meng-assert
// bahwa roster (nama petugas) benar-benar sampai ke UI.
const { capturedProps, mockSupabase } = vi.hoisted(() => {
  const state: { props: Record<string, unknown> | null } = { props: null };

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
    capturedProps: state,
    mockSupabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn((table: string) => {
        if (table === "profiles") {
          return makeBuilder({
            id: "user-id",
            email: "member@robotik.pnp",
            role: "anggota",
            is_onboarded: true,
            is_on_internship: false,
            internship_start_date: null,
            internship_end_date: null,
          });
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
        // piket_members (myAssignments), piket_logs, piket_fines → kosong
        return makeBuilder([]);
      }),
      // RPC roster — inti perbaikan: mengembalikan NAMA anggota lain walau
      // RLS profiles memblokir pembacaan langsung.
      rpc: vi.fn((fn: string) => {
        if (fn === "get_piket_roster") {
          return Promise.resolve({
            data: [
              {
                schedule_id: "sched-1",
                academic_period: "2026/2027",
                week_number: 1,
                room_target: "workshop_dan_sekretariat",
                member_id: "m-1",
                profile_id: "profile-1",
                nim: "2401041035",
                full_name: "Aziz Zurahman",
                role: "anggota",
                is_on_internship: false,
                internship_start_date: null,
                internship_end_date: null,
              },
              {
                schedule_id: "sched-1",
                academic_period: "2026/2027",
                week_number: 1,
                room_target: "workshop_dan_sekretariat",
                member_id: "m-2",
                profile_id: "profile-2",
                nim: "2501041020",
                full_name: "Zikra Hafiza Warman",
                role: "anggota",
                is_on_internship: false,
                internship_start_date: null,
                internship_end_date: null,
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

// Ganti komponen klien dengan spy yang merekam props.
vi.mock("@/components/features/piket/piket-report-client", () => ({
  PiketReportClient: (props: Record<string, unknown>) => {
    capturedProps.props = props;
    return null;
  },
}));

import PiketPage from "./page";

interface CapturedScheduleMember {
  member_id: string;
  profile_id: string;
  nim: string;
  name: string;
}

interface CapturedSchedule {
  id: string;
  week_number: number;
  members: CapturedScheduleMember[];
}

function getCapturedSchedules(): CapturedSchedule[] {
  const props = capturedProps.props as {
    schedules?: CapturedSchedule[];
  } | null;
  return props?.schedules ?? [];
}

describe("PiketPage — nama roster piket muncul untuk role anggota (RLS fix)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    capturedProps.props = null;
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "user-id" } },
      error: null,
    });
  });

  it("mengambil roster via RPC get_piket_roster, bukan nested join profiles", async () => {
    await PiketPage();

    expect(mockSupabase.rpc).toHaveBeenCalledWith("get_piket_roster", {
      p_academic_period: null,
    });
  });

  it("meneruskan NAMA anggota lain (bukan fallback 'Anggota') ke komponen klien", async () => {
    // Render elemen <Suspense> hasil RSC agar komponen klien dieksekusi.
    render(await PiketPage());

    const schedules = getCapturedSchedules();
    expect(schedules).toHaveLength(1);

    const members = schedules[0].members;
    expect(members).toHaveLength(2);

    const names = members.map((m) => m.name);
    expect(names).toContain("Aziz Zurahman");
    expect(names).toContain("Zikra Hafiza Warman");
    expect(names).not.toContain("Anggota");

    const aziz = members.find((m) => m.profile_id === "profile-1");
    expect(aziz?.nim).toBe("2401041035");
  });
});
