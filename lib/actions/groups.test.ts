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

  it("should successfully generate groups with 32 Caangs distributed evenly into 4 groups (TS-ALG-01)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });

    // Setup 32 mock caangs
    const mockCaangs = Array.from({ length: 32 }, (_, i) => ({ id: `caang-${i + 1}` }));
    
    // Create random grades (some high, some low)
    const mockSubmissions = mockCaangs.map((c, i) => ({
      profile_id: c.id,
      grade: 50 + (i % 5) * 10,
    }));

    const mockAttendances = mockCaangs.map((c) => ({
      profile_id: c.id,
      status: "hadir",
    }));

    const mockInsertedGroups = Array.from({ length: 4 }, (_, i) => ({
      id: `group-${i + 1}-id`,
      name: `Kelompok ${i + 1}`,
    }));

    // Setup dynamic mocks
    let selectCallCount = 0;
    mockSupabase.select = vi.fn().mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1 || selectCallCount === 2) {
        return mockSupabase;
      }
      if (selectCallCount === 3) {
        return Promise.resolve({ data: mockSubmissions });
      }
      if (selectCallCount === 4) {
        return Promise.resolve({ data: mockAttendances });
      }
      return Promise.resolve({ data: mockInsertedGroups });
    });

    let insertCallCount = 0;
    let insertedMembers: { group_id: string; profile_id: string }[] = [];
    mockSupabase.insert = vi.fn().mockImplementation((data) => {
      insertCallCount++;
      if (insertCallCount === 1) {
        return mockSupabase;
      }
      insertedMembers = data;
      return Promise.resolve({ error: null });
    });

    let eqCallCount = 0;
    mockSupabase.eq = vi.fn().mockImplementation(() => {
      eqCallCount++;
      if (eqCallCount === 1) {
        return mockSupabase;
      }
      return Promise.resolve({ data: mockCaangs });
    });

    mockSupabase.single = vi.fn().mockResolvedValue({ data: { role: "admin-or" } });
    mockSupabase.neq = vi.fn().mockResolvedValue({ error: null });
    mockSupabase.delete = vi.fn().mockReturnThis();

    const res = await generateGroupsAlgorithmic(4, "score");
    console.log("Groups 32 Generation Result: ", JSON.stringify(res, null, 2));
    expect(res.success).toBe(true);
    expect(res.message).toContain("32 Caang secara merata ke dalam 4 kelompok");

    // Ensure all 32 members were inserted and groups have 8 members each
    expect(insertedMembers.length).toBe(32);
    
    const counts: Record<string, number> = {};
    insertedMembers.forEach((m) => {
      counts[m.group_id] = (counts[m.group_id] || 0) + 1;
    });

    expect(counts["group-1-id"]).toBe(8);
    expect(counts["group-2-id"]).toBe(8);
    expect(counts["group-3-id"]).toBe(8);
    expect(counts["group-4-id"]).toBe(8);
  });
});
