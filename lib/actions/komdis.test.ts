/**
 * Unit Tests untuk Server Actions Komdis Attendance
 * File: lib/actions/komdis.ts
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { encryptToken } from "@/lib/utils/crypto";

// Valid UUIDs conforming to Zod RFC 4122
const VALID_UUID_1 = "00000000-0000-0000-0000-000000000000";
const VALID_UUID_2 = "ffffffff-ffff-ffff-ffff-ffffffffffff";

// -----------------------------------------------------------------------
// Mock State Variables
// -----------------------------------------------------------------------
let mockUser: { id: string } | null = { id: "komdis-user-id" };
let mockProfileRole = "admin-komdis";
let mockInsertError: { message: string } | null = null;
let mockUpsertError: { message: string } | null = null;
let mockUpdateError: { message: string } | null = null;
let mockRpcData: Array<{ profile_id: string }> | null = [
  { profile_id: VALID_UUID_1 },
  { profile_id: VALID_UUID_2 },
];
let mockRpcError: { message: string } | null = null;
let mockActivityData: {
  start_date: string;
  late_tolerance_minutes: number;
} | null = {
  start_date: new Date(Date.now() - 5 * 60000).toISOString(),
  late_tolerance_minutes: 15,
};

// -----------------------------------------------------------------------
// Mocks
// -----------------------------------------------------------------------
vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: vi.fn(async () => ({
        data: { user: mockUser },
        error: mockUser ? null : { message: "No session" },
      })),
    },
    from: vi.fn((table: string) => {
      if (table === "profiles") {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { role: mockProfileRole },
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "activities") {
        return {
          insert: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: { id: VALID_UUID_1, title: "Rapat Komdis" },
                error: mockInsertError,
              })),
            })),
          })),
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(async () => ({
                data: mockActivityData,
                error: null,
              })),
            })),
          })),
        };
      }
      if (table === "attendances") {
        return {
          upsert: vi.fn(async () => ({ error: mockUpsertError })),
          update: vi.fn(() => ({
            eq: vi.fn(async () => ({ error: mockUpdateError })),
          })),
          insert: vi.fn(async () => ({ error: mockInsertError })),
        };
      }
      if (table === "discipline_point_logs" || table === "sanctions") {
        return {
          insert: vi.fn(async () => ({ error: mockInsertError })),
        };
      }
      return {};
    }),
    rpc: vi.fn(async () => ({
      data: mockRpcData,
      error: mockRpcError,
    })),
  })),
}));

import {
  createKomdisActivity,
  scanAttendanceQRByAdmin,
  reviewLeaveRequest,
  batchMarkAlfa,
  logPointReduction,
  issueSanction,
  recordManualAttendance,
} from "@/lib/actions/komdis";

describe("Modul Server Actions Komdis Attendance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUser = { id: "komdis-user-id" };
    mockProfileRole = "admin-komdis";
    mockInsertError = null;
    mockUpsertError = null;
    mockUpdateError = null;
    mockRpcData = [{ profile_id: VALID_UUID_1 }, { profile_id: VALID_UUID_2 }];
    mockRpcError = null;
    mockActivityData = {
      start_date: new Date(Date.now() - 5 * 60000).toISOString(),
      late_tolerance_minutes: 15,
    };
  });

  // --- Test 1: createKomdisActivity ---
  describe("createKomdisActivity", () => {
    it("harus sukses membuat kegiatan komdis saat role admin-komdis", async () => {
      const input = {
        title: "Rapat Eval Komdis",
        description: "Rapat rutin",
        start_date: "2026-08-01T10:00:00Z",
        end_date: "2026-08-01T12:00:00Z",
        location: "Sekretariat UKM",
        checkin_open_at: "2026-08-01T09:30:00Z",
        checkin_close_at: "2026-08-01T10:30:00Z",
        late_tolerance_minutes: 15,
      };

      const result = await createKomdisActivity(input);
      expect(result.success).toBe(true);
      expect(result.data.id).toBe(VALID_UUID_1);
    });

    it("harus gagal jika role bukan admin-komdis atau super-admin", async () => {
      mockProfileRole = "anggota";
      const input = {
        title: "Rapat Eval Komdis",
        start_date: "2026-08-01T10:00:00Z",
        end_date: "2026-08-01T12:00:00Z",
        location: "Sekretariat UKM",
        checkin_open_at: "2026-08-01T09:30:00Z",
        checkin_close_at: "2026-08-01T10:30:00Z",
        late_tolerance_minutes: 15,
      };

      await expect(createKomdisActivity(input)).rejects.toThrow("Forbidden");
    });
  });

  // --- Test 2: scanAttendanceQRByAdmin ---
  describe("scanAttendanceQRByAdmin", () => {
    it("harus sukses memindai QR Code valid tepat waktu (status: hadir)", async () => {
      const activityId = VALID_UUID_1;
      const profileId = VALID_UUID_2;
      const token = encryptToken({
        profile_id: profileId,
        activity_id: activityId,
        generated_at: Date.now(),
      });

      const res = await scanAttendanceQRByAdmin(activityId, token);
      expect(res.success).toBe(true);
      expect(res.status).toBe("hadir");
    });

    it("harus menolak jika QR Code sudah kadaluarsa > 5 menit", async () => {
      const activityId = VALID_UUID_1;
      const profileId = VALID_UUID_2;
      const expiredToken = encryptToken({
        profile_id: profileId,
        activity_id: activityId,
        generated_at: Date.now() - 6 * 60 * 1000,
      });

      const res = await scanAttendanceQRByAdmin(activityId, expiredToken);
      expect(res.success).toBe(false);
      expect(res.message).toContain("kadaluarsa");
    });

    it("harus menolak jika activity_id pada token berbeda", async () => {
      const token = encryptToken({
        profile_id: VALID_UUID_2,
        activity_id: VALID_UUID_2,
        generated_at: Date.now(),
      });

      const res = await scanAttendanceQRByAdmin(VALID_UUID_1, token);
      expect(res.success).toBe(false);
      expect(res.message).toContain("salah kegiatan");
    });
  });

  // --- Test 3: reviewLeaveRequest ---
  describe("reviewLeaveRequest", () => {
    it("harus sukses menyetujui perizinan dan menetapkan poin sanksi", async () => {
      const res = await reviewLeaveRequest({
        attendanceId: VALID_UUID_1,
        approvalStatus: "approved",
        pointsAwarded: 5,
      });

      expect(res.success).toBe(true);
    });
  });

  // --- Test 4: batchMarkAlfa ---
  describe("batchMarkAlfa", () => {
    it("harus sukses menandai anggota unrecorded sebagai alfa massal", async () => {
      const res = await batchMarkAlfa(VALID_UUID_1);
      expect(res.success).toBe(true);
      expect(res.count).toBe(2);
    });
  });

  // --- Test 5: logPointReduction ---
  describe("logPointReduction", () => {
    it("harus sukses mencatat pemutihan poin sanksi Goro (poin negatif)", async () => {
      const res = await logPointReduction({
        profileId: VALID_UUID_1,
        category: "goro_sp1",
        points: -10,
        description: "Telah melaksanakan sanksi Goro SP1",
      });

      expect(res.success).toBe(true);
    });

    it("harus gagal jika poin bernilai positif pada pemutihan", async () => {
      await expect(
        logPointReduction({
          profileId: VALID_UUID_1,
          category: "goro_sp1",
          points: 10,
          description: "Deskripsi pemutihan",
        }),
      ).rejects.toThrow();
    });
  });

  // --- Test 6: issueSanction ---
  describe("issueSanction", () => {
    it("harus sukses menerbitkan Surat Peringatan (SP1/SP2/SP3)", async () => {
      const res = await issueSanction({
        profileId: VALID_UUID_1,
        spLevel: 1,
        pointsAtIssuance: 32,
        notes: "Mencapai 32 poin sanksi",
      });

      expect(res.success).toBe(true);
    });
  });

  // --- Test 7: recordManualAttendance ---
  describe("recordManualAttendance", () => {
    it("harus sukses mengabsenkan peserta secara manual", async () => {
      const res = await recordManualAttendance({
        activityId: VALID_UUID_1,
        profileId: VALID_UUID_2,
        status: "telat",
        pointsAwarded: 5,
        notes: "Terlambat > 1 jam dengan izin",
      });

      expect(res.success).toBe(true);
    });
  });
});
