import { vi, describe, it, expect, beforeEach } from "vitest";
import { getDivisionCountAction, getDivisionsAction } from "./divisions";

// Hoist the mock definition for Vitest
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
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

  describe("getDivisionCountAction", () => {
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

  describe("getDivisionsAction", () => {
    it("should return correct divisions list when supabase returns data", async () => {
      const mockDivisions = [
        {
          id: "1",
          name: "KRAI",
          slug: "krai",
          short_description: "KRAI robot",
          tags: ["Tag 1"],
          sort_order: 1,
        },
      ];
      mockSupabase.order.mockResolvedValueOnce({
        data: mockDivisions,
        error: null,
      });

      const divisions = await getDivisionsAction();
      expect(divisions).toEqual(mockDivisions);
      expect(mockSupabase.from).toHaveBeenCalledWith("divisions");
      expect(mockSupabase.select).toHaveBeenCalledWith("*");
      expect(mockSupabase.eq).toHaveBeenCalledWith("is_active", true);
      expect(mockSupabase.order).toHaveBeenCalledWith("sort_order", {
        ascending: true,
      });
    });

    it("should throw error when supabase query fails", async () => {
      mockSupabase.order.mockResolvedValueOnce({
        data: null,
        error: { message: "Database error" },
      });

      await expect(getDivisionsAction()).rejects.toThrow("Database error");
    });
  });
});
