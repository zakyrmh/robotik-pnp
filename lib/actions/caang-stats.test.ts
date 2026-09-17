import { describe, it, expect, vi, beforeEach } from "vitest";
import { getCaangDashboardStats } from "./caang-stats";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "admin-id" } },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { role: "super-admin" },
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          is: vi.fn().mockResolvedValue({
            data: [
              {
                id: "p-1",
                created_at: "2026-03-01T08:00:00Z",
                role: "caang",
                registrations: {
                  id: "r-1",
                  full_name: "John Caang",
                  gender: "L",
                  entry_year: 2026,
                  payment_method: "QRIS",
                  status: "verified",
                  created_at: "2026-03-01T09:30:00Z",
                  deleted_at: null,
                  study_programs: {
                    id: "sp-1",
                    name: "Teknik Komputer",
                    degree: "D3",
                    majors: { id: "m-1", name: "Teknologi Informasi" },
                  },
                },
              },
              {
                id: "p-2",
                created_at: "2026-03-02T10:00:00Z",
                role: "caang",
                registrations: {
                  id: "r-2",
                  full_name: "Jane Caang",
                  gender: "P",
                  entry_year: 2026,
                  payment_method: "Transfer",
                  status: "pending",
                  created_at: "2026-03-02T11:00:00Z",
                  deleted_at: null,
                  study_programs: {
                    id: "sp-2",
                    name: "Teknik Elektronika",
                    degree: "D4",
                    majors: { id: "m-2", name: "Teknik Elektro" },
                  },
                },
              },
            ],
            error: null,
          }),
        }),
      }),
    }),
  }),
}));

describe("getCaangDashboardStats", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate summary, daily trend, and distributions correctly", async () => {
    const res = await getCaangDashboardStats();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();

    if (res.data) {
      expect(res.data.summary.totalCaang).toBe(2);
      expect(res.data.summary.verifiedCount).toBe(1);
      expect(res.data.summary.pendingCount).toBe(1);
      expect(res.data.summary.completionRate).toBe(100);
      expect(res.data.dailyTrend.length).toBe(2);
      expect(res.data.studyProgramDistribution.length).toBe(2);
      expect(res.data.genderDistribution.find((g) => g.gender === "L")?.count).toBe(1);
      expect(res.data.genderDistribution.find((g) => g.gender === "P")?.count).toBe(1);
    }
  });
});
