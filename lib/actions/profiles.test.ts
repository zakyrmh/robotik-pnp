import { vi, describe, it, expect, beforeEach } from "vitest";
import { getActiveMemberCountAction } from "./profiles";

// Hoist the mock definition for Vitest
const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => mockSupabase),
}));

describe("Profiles Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return correct count when supabase returns data", async () => {
    mockSupabase.eq.mockResolvedValueOnce({ count: 65, error: null });

    const count = await getActiveMemberCountAction();
    expect(count).toBe(65);
    expect(mockSupabase.from).toHaveBeenCalledWith("organizational_histories");
    expect(mockSupabase.select).toHaveBeenCalledWith(
      "id, membership_periods!inner(is_active)",
      {
        count: "exact",
        head: true,
      },
    );
    expect(mockSupabase.eq).toHaveBeenCalledWith(
      "membership_periods.is_active",
      true,
    );
  });

  it("should throw error when supabase query fails", async () => {
    mockSupabase.eq.mockResolvedValueOnce({
      count: null,
      error: { message: "Database error" },
    });

    await expect(getActiveMemberCountAction()).rejects.toThrow(
      "Database error",
    );
  });
});
