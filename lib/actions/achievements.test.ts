import { vi, describe, it, expect, beforeEach } from "vitest";
import { getAchievementCountAction } from "./achievements";

// Hoist the mock definition for Vitest
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabase),
}));

describe("Achievements Server Actions & Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct count when supabase returns data", async () => {
    mockSupabase.select.mockResolvedValueOnce({ count: 42, error: null });

    const count = await getAchievementCountAction();
    expect(count).toBe(42);
    expect(mockSupabase.from).toHaveBeenCalledWith("achievements");
    expect(mockSupabase.select).toHaveBeenCalledWith("*", {
      count: "exact",
      head: true,
    });
  });

  it("should throw error when supabase query fails", async () => {
    mockSupabase.select.mockResolvedValueOnce({
      count: null,
      error: { message: "Database error" },
    });

    await expect(getAchievementCountAction()).rejects.toThrow("Database error");
  });
});
