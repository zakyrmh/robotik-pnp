import { vi, describe, it, expect, beforeEach } from "vitest";
import { getActiveMemberCountAction } from "./profiles";

// Hoist the mock definition for Vitest
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe("Profiles Server Actions & Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct count when supabase returns data", async () => {
    mockSupabase.in.mockResolvedValueOnce({ count: 65, error: null });

    const count = await getActiveMemberCountAction();
    expect(count).toBe(65);
    expect(mockSupabase.from).toHaveBeenCalledWith("profiles");
    expect(mockSupabase.select).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
    expect(mockSupabase.in).toHaveBeenCalledWith("role", [
      "anggota",
      "super-admin",
      "admin-or",
      "admin-komdis",
    ]);
  });

  it("should throw error when supabase query fails", async () => {
    mockSupabase.in.mockResolvedValueOnce({
      count: null,
      error: { message: "Database error" },
    });

    await expect(getActiveMemberCountAction()).rejects.toThrow(
      "Database error",
    );
  });
});
