import { vi, describe, it, expect, beforeEach } from "vitest";
import { getDivisionCountAction } from "./divisions";

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

describe("Divisions Server Actions & Repository", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct count when supabase returns data", async () => {
    mockSupabase.select.mockResolvedValueOnce({ count: 5, error: null });

    const count = await getDivisionCountAction();
    expect(count).toBe(5);
    expect(mockSupabase.from).toHaveBeenCalledWith("divisions");
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

    await expect(getDivisionCountAction()).rejects.toThrow("Database error");
  });
});
