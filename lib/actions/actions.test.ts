import { vi, describe, it, expect, beforeEach } from "vitest";
import { encryptToken, decryptToken } from "@/lib/utils/crypto";
import { extractExifDateTime } from "@/lib/utils/exif";
import { generateAttendanceQR, scanAttendanceQR, manualOverrideAttendance } from "./attendance";

// Hoist the mock definition to prevent initialization ordering errors in Vitest
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
      maybeSingle: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

describe("Symmetric Crypto Helper", () => {
  it("should encrypt and decrypt a payload correctly", () => {
    const payload = { userId: "test-user-id", role: "caang", timestamp: Date.now() };
    const token = encryptToken(payload);
    expect(token).toBeTypeOf("string");
    expect(token.includes("-")).toBe(true);

    const decrypted = decryptToken(token);
    expect(decrypted).toEqual(payload);
  });

  it("should throw an error for an invalid token format", () => {
    expect(() => decryptToken("invalidtoken")).toThrow("Invalid token format");
  });
});

describe("EXIF JPEG DateTimeOriginal Parser", () => {
  it("should return null for non-JPEG buffers", () => {
    const fakeBuffer = Buffer.from([1, 2, 3, 4, 5]);
    const date = extractExifDateTime(fakeBuffer);
    expect(date).toBeNull();
  });

  it("should parse DateTimeOriginal from a custom Big-Endian EXIF JPEG buffer", () => {
    // Construct a minimal valid JPEG buffer with APP1 EXIF segment (Big Endian)
    const soi = [0xff, 0xd8];
    const app1Marker = [0xff, 0xe1];
    const app1Length = [0x00, 0x36];
    const exifHeader = [0x45, 0x78, 0x69, 0x66, 0x00, 0x00];
    const tiffHeader = [0x4d, 0x4d, 0x00, 0x2a, 0x00, 0x00, 0x00, 0x08];

    const ifd0 = [
      0x00, 0x01,
      0x87, 0x69,
      0x00, 0x04,
      0x00, 0x00, 0x00, 0x01,
      0x00, 0x00, 0x00, 0x1a,
      0x00, 0x00, 0x00, 0x00,
    ];

    const exifIfd = [
      0x00, 0x01,
      0x90, 0x03,
      0x00, 0x02,
      0x00, 0x00, 0x00, 0x14,
      0x00, 0x00, 0x00, 0x2c,
      0x00, 0x00, 0x00, 0x00,
    ];

    const dateStr = Array.from(Buffer.from("2026:05:27 12:00:00\0", "utf8"));

    const fullArray = [
      ...soi,
      ...app1Marker,
      ...app1Length,
      ...exifHeader,
      ...tiffHeader,
      ...ifd0,
      ...exifIfd,
      ...dateStr,
    ];
    const buffer = Buffer.from(fullArray);

    const date = extractExifDateTime(buffer);
    expect(date).not.toBeNull();
    expect(date?.getFullYear()).toBe(2026);
    expect(date?.getMonth()).toBe(4);
    expect(date?.getDate()).toBe(27);
    expect(date?.getHours()).toBe(12);
  });
});

describe("Attendance Server Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("generateAttendanceQR", () => {
    it("should reject if the user is not authenticated", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("No session") });

      const res = await generateAttendanceQR("activity-id");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("UNAUTHORIZED");
    });

    it("should reject if user role is not authorized", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-or" } });

      const res = await generateAttendanceQR("activity-id");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should reject if activity time window has not started yet", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const futureStart = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 120 * 60 * 1000).toISOString();
      mockSupabase.single.mockResolvedValueOnce({ data: { start_date: futureStart, end_date: futureEnd } });

      const res = await generateAttendanceQR("activity-id");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("belum dibuka");
    });

    it("should reject if activity time window has already ended", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const pastStart = new Date(Date.now() - 120 * 60 * 1000).toISOString();
      const pastEnd = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      mockSupabase.single.mockResolvedValueOnce({ data: { start_date: pastStart, end_date: pastEnd } });

      const res = await generateAttendanceQR("activity-id");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("sudah ditutup");
    });

    it("should succeed and return encrypted token if user is authorized and time window is open", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const pastStart = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const futureEnd = new Date(Date.now() + 60 * 60 * 1000).toISOString();
      mockSupabase.single.mockResolvedValueOnce({ data: { start_date: pastStart, end_date: futureEnd } });

      const res = await generateAttendanceQR("activity-id", { lat: -0.9, lng: 100.3 });
      expect(res.success).toBe(true);
      expect(res.data?.qrString).toBeTypeOf("string");
      expect(res.data?.expiresAt).toBeTypeOf("string");
    });
  });

  describe("scanAttendanceQR", () => {
    it("should reject if scanning user is not an admin", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

      const res = await scanAttendanceQR("fake-qr-string");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("FORBIDDEN");
    });

    it("should reject if the QR token is expired", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-komdis" } });

      const oldPayload = { profile_id: "student-id", activity_id: "activity-id", generated_at: Date.now() - 10 * 60 * 1000 };
      const expiredQrStr = encryptToken(oldPayload);

      const res = await scanAttendanceQR(expiredQrStr);
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("TOKEN_EXPIRED");
      expect(res.message).toBe("QR Code Expired.");
    });
  });

  describe("manualOverrideAttendance", () => {
    it("should reject if admin notes are empty", async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "admin-id" } } });
      mockSupabase.from.mockReturnThis();
      mockSupabase.select.mockReturnThis();
      mockSupabase.eq.mockReturnThis();
      mockSupabase.single.mockResolvedValueOnce({ data: { role: "admin-komdis" } });

      const res = await manualOverrideAttendance("attendance-id", "hadir", "  ");
      expect(res.success).toBe(false);
      expect(res.error?.code).toBe("BAD_REQUEST");
      expect(res.message).toContain("Catatan penyesuaian wajib diisi");
    });
  });
});
