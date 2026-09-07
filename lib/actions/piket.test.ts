import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  submitPiketReport,
  assignPiketMember,
  removePiketMember,
  createPiketPeriod,
} from "./piket";
import { extractExifDateTime } from "@/lib/utils/exif";
import { getPiketWeekInfo } from "@/lib/utils/piket-date";

// Mock next/cache
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock Supabase
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
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      upsert: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi
          .fn()
          .mockResolvedValue({ data: { path: "some-path" }, error: null }),
      },
    },
  };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue(mockSupabase),
}));

// Mock EXIF utility
vi.mock("@/lib/utils/exif", () => ({
  extractExifDateTime: vi.fn(),
}));

// Mock Cloudflare R2 storage
vi.mock("@/lib/storage/r2", () => ({
  uploadToR2: vi.fn().mockResolvedValue("/api/r2/piket-proofs/mock-proof.jpg"),
  getPublicR2Url: vi.fn((key: string) => `/api/r2/${key}`),
}));

// Mock Audit Logger
vi.mock("@/lib/audit", () => ({
  recordAuditLog: vi.fn().mockResolvedValue(undefined),
}));

describe("Piket Date Utility - getPiketWeekInfo", () => {
  it("should calculate correct week info for a cross-month date", () => {
    // Aug 31, 2026 is Monday
    const aug31 = new Date(2026, 7, 31);
    const info = getPiketWeekInfo(aug31);

    expect(info.weekNumber).toBe(1);
    expect(info.cycleMonthName).toBe("September");
    expect(info.startIsoDate).toBe("2026-08-31");
    expect(info.endIsoDate).toBe("2026-09-06");
  });
});

describe("Piket Server Action - createPiketPeriod", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.upsert.mockReturnThis();
  });

  it("should allow admin-kestari to create a new valid period (e.g. 2027/2028)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.upsert.mockResolvedValueOnce({ error: null });

    const res = await createPiketPeriod("2027/2028");
    expect(res.success).toBe(true);
    expect(res.message).toContain("Periode DPH 2027/2028 berhasil dibuat");
  });

  it("should reject invalid period formats", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });

    const res = await createPiketPeriod("invalid-format");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
  });
});

describe("Piket Server Action - submitPiketReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
  });

  it("should reject if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: new Error("No session"),
    });

    const formData = new FormData();
    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("UNAUTHORIZED");
  });

  it("should reject if user is not authorized (wrong role)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

    const formData = new FormData();
    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should reject if schedule week does not match current ISO week of month", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const weekInfo = getPiketWeekInfo(new Date());
    const wrongWeek = (weekInfo.weekNumber % 4) + 1;

    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sched-id",
        week_number: wrongWeek,
        room_target: "workshop_dan_sekretariat",
      },
    }); // schedule

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([], "before.jpg"));
    formData.append("photo_after", new File([], "after.jpg"));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("Pekan ini adalah Pekan");
  });

  it("should reject if user is not assigned to the schedule", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const weekInfo = getPiketWeekInfo(new Date());
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sched-id",
        week_number: weekInfo.weekNumber,
        room_target: "workshop_dan_sekretariat",
      },
    }); // schedule

    // Mock membership check to return null (not a member)
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([], "before.jpg"));
    formData.append("photo_after", new File([], "after.jpg"));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
    expect(res.message).toContain("tidak terdaftar");
  });

  it("should reject if user already submitted a report this week", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const weekInfo = getPiketWeekInfo(new Date());
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sched-id",
        week_number: weekInfo.weekNumber,
        room_target: "workshop_dan_sekretariat",
      },
    }); // schedule

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });

    // Mock existing weekly log exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "existing-log-id" },
      error: null,
    });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([], "before.jpg"));
    formData.append("photo_after", new File([], "after.jpg"));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("sudah mengunggah laporan piket");
  });

  it("should reject if EXIF date does not match today's date", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const weekInfo = getPiketWeekInfo(new Date());
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sched-id",
        week_number: weekInfo.weekNumber,
        room_target: "workshop_dan_sekretariat",
      },
    }); // schedule

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });

    // Mock no existing weekly log
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Mock EXIF date extractor to return a past date (1 week ago)
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    vi.mocked(extractExifDateTime).mockReturnValue(pastDate);

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("before")], "before.jpg", { type: "image/jpeg" }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after")], "after.jpg", { type: "image/jpeg" }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("METADATA_MISMATCH");
    expect(res.message).toContain(
      "Tanggal pengambilan foto (EXIF) tidak cocok",
    );
  });

  it("should successfully upload photos and save report when validations pass", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const weekInfo = getPiketWeekInfo(new Date());
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "sched-id",
        week_number: weekInfo.weekNumber,
        room_target: "workshop_dan_sekretariat",
      },
    }); // schedule

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });

    // Mock no existing weekly log
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Mock EXIF date extractor to return today's date
    vi.mocked(extractExifDateTime).mockReturnValue(new Date());

    // Mock DB insertion
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("before")], "before.jpg", { type: "image/jpeg" }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after")], "after.jpg", { type: "image/jpeg" }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(true);
    expect(res.message).toContain("Laporan piket kebersihan berhasil");
  });
});

describe("Kestari Management Actions - assignPiketMember & removePiketMember", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
  });

  it("should allow admin-kestari to assign a member", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });

    // Mock no existing assignment
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Mock insertion
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    const res = await assignPiketMember("sched-id", "target-profile-id");
    expect(res.success).toBe(true);
    expect(res.message).toContain("Anggota berhasil ditambahkan");
  });

  it("should reject non-kestari users from assigning members", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-komdis" },
    }); // unauthorized role

    const res = await assignPiketMember("sched-id", "target-profile-id");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
    expect(res.message).toContain("Hanya Kestari dan Super Admin");
  });

  it("should allow admin-kestari to remove a member assignment", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });

    // Mock existing member query for audit log
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { profile_id: "target-profile-id", schedule_id: "sched-id" },
      error: null,
    });

    // Mock delete execution chain
    mockSupabase.delete.mockReturnValueOnce({
      eq: vi.fn().mockResolvedValue({ error: null }),
    });

    const res = await removePiketMember("membership-id");
    expect(res.success).toBe(true);
    expect(res.message).toContain("Penugasan piket anggota berhasil dihapus");
  });
});
