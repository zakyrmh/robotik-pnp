import { vi, describe, it, expect, beforeEach } from "vitest";
import { generateGroupsAlgorithmic } from "./groups";

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      auth: {
        getUser: vi.fn(),
      },
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      neq: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe("Group Generation Action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject if user is not authorized", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

    const res = await generateGroupsAlgorithmic(4, "score");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should reject if totalGroups is less than or equal to 0", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });

    const res = await generateGroupsAlgorithmic(0, "score");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
  });

  it("should successfully generate groups with Semi-Queue Tiering", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });

    // Setup mock data
    const mockCaangs = Array.from({ length: 8 }, (_, i) => ({ id: `caang-${i + 1}` }));
    const mockSubmissions = [
      { profile_id: "caang-1", grade: 90 },
      { profile_id: "caang-2", grade: 80 },
      { profile_id: "caang-3", grade: 70 },
      { profile_id: "caang-4", grade: 60 },
      { profile_id: "caang-5", grade: 50 },
      { profile_id: "caang-6", grade: 40 },
      { profile_id: "caang-7", grade: 30 },
      { profile_id: "caang-8", grade: 20 },
    ];
    const mockAttendances = [
      { profile_id: "caang-1", status: "hadir" },
      { profile_id: "caang-2", status: "hadir" },
    ];
    const mockInsertedGroups = [
      { id: "group-1-id", name: "Kelompok 1" },
      { id: "group-2-id", name: "Kelompok 2" },
    ];

    // Setup dynamic mocks
    let selectCallCount = 0;
    mockSupabase.select = vi.fn().mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1 || selectCallCount === 2) {
        return mockSupabase; // select("role") or select("id")
      }
      if (selectCallCount === 3) {
        return Promise.resolve({ data: mockSubmissions }); // select("profile_id, grade")
      }
      if (selectCallCount === 4) {
        return Promise.resolve({ data: mockAttendances }); // select("profile_id, status")
      }
      return Promise.resolve({ data: mockInsertedGroups }); // select()
    });

    let insertCallCount = 0;
    mockSupabase.insert = vi.fn().mockImplementation(() => {
      insertCallCount++;
      if (insertCallCount === 1) {
        return mockSupabase; // insert(groupsToInsert)
      }
      return Promise.resolve({ error: null }); // insert(membersToInsert)
    });

    let eqCallCount = 0;
    mockSupabase.eq = vi.fn().mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount === 1) {
        return mockSupabase; // eq("id", adminUser.id)
      }
      return Promise.resolve({ data: mockCaangs }); // eq("role", "caang")
    });

    mockSupabase.single = vi.fn().mockResolvedValue({ data: { role: "admin-or" } });
    mockSupabase.neq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.delete = vi.fn().mockReturnThis();

    const res = await generateGroupsAlgorithmic(2, "score");
    console.log("Groups Generation Result: ", JSON.stringify(res, null, 2));
    expect(res.success).toBe(true);
    expect(res.message).toContain("Semi-Queue Tiering");
  });
});
