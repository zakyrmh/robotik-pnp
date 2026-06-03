import { vi, describe, it, expect, beforeEach } from "vitest";
import { getOrSettings, saveOrSettings } from "./or-settings";

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
      update: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe("OR Settings Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getOrSettings", () => {
    it("should reject if user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("No session") });

      const res = await getOrSettings();
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should successfully retrieve settings", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          periode_recruitment: "OR-21",
          status_pendaftaran: false,
          tanggal_mulai: null,
          tanggal_selesai: null,
          biaya_pendaftaran: 10000,
          rekening_penerima: [],
          kontak_panitia: [],
          link_komunitas: { whatsapp_url: "", discord_url: "" },
          timeline: [],
        },
        error: null,
      });

      const res = await getOrSettings();
      expect(res.success).toBe(true);
      expect(res.data?.periode_recruitment).toBe("OR-21");
    });
  });

  describe("saveOrSettings", () => {
    it("should reject if user is not authorized (role is caang)", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      // First single call: profile role query
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" }, error: null });

      const res = await saveOrSettings({ periode_recruitment: "OR-22" });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should reject if periode_recruitment is empty", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" }, error: null });

      const res = await saveOrSettings({ periode_recruitment: "   " });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("tidak boleh kosong");
    });

    it("should reject if biaya_pendaftaran is negative", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" }, error: null });

      const res = await saveOrSettings({ biaya_pendaftaran: -500 });
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("tidak boleh negatif");
    });

    it("should update settings successfully when user is admin-or", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" }, error: null }); // profile check
      mockSupabase.single.mockResolvedValueOnce({
        data: {
          periode_recruitment: "OR-22",
          status_pendaftaran: true,
          tanggal_mulai: "2026-06-01T00:00:00Z",
          tanggal_selesai: "2026-06-15T00:00:00Z",
          biaya_pendaftaran: 15000,
          rekening_penerima: [],
          kontak_panitia: [],
          link_komunitas: { whatsapp_url: "", discord_url: "" },
          timeline: [],
        },
        error: null,
      }); // update result query

      const res = await saveOrSettings({
        periode_recruitment: "OR-22",
        biaya_pendaftaran: 15000,
      });

      expect(res.success).toBe(true);
      expect(res.data?.periode_recruitment).toBe("OR-22");
      expect(res.data?.biaya_pendaftaran).toBe(15000);
    });
  });
});
