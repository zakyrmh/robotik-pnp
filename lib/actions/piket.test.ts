import { vi, describe, it, expect, beforeEach } from "vitest";
import { submitPiketReport } from "./piket";
import { extractExifDateTime } from "@/lib/utils/exif";

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
      storage: {
        from: vi.fn().mockReturnThis(),
        upload: vi.fn().mockResolvedValue({ data: { path: "some-path" }, error: null }),
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

describe("Piket Server Action - submitPiketReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should reject if user is not authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: new Error("No session") });

    const formData = new FormData();
    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("UNAUTHORIZED");
  });

  it("should reject if user is not authorized (wrong role)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "caang" } });

    const formData = new FormData();
    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should reject if schedule day does not match today's day (TS-PKT-01)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // user profile role

    // Mock today's day to mismatch schedule day
    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayIndex = new Date().getDay();
    const wrongDay = days[(todayIndex + 1) % 7];

    mockSupabase.single.mockResolvedValueOnce({ data: { day: wrongDay } }); // schedule day mock

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([], "before.jpg"));
    formData.append("photo_after", new File([], "after.jpg"));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("Hari ini adalah");
  });

  it("should reject if user is not assigned to the schedule", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayDayName = days[new Date().getDay()];
    mockSupabase.single.mockResolvedValueOnce({ data: { day: todayDayName } }); // schedule day

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
    expect(res.message).toContain("tidak terdaftar piket");
  });

  it("should reject if user already submitted a report this week (TS-PKT-02)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayDayName = days[new Date().getDay()];
    mockSupabase.single.mockResolvedValueOnce({ data: { day: todayDayName } }); // schedule day

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "membership-id" }, error: null });

    // Mock existing weekly log exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "existing-log-id" }, error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([], "before.jpg"));
    formData.append("photo_after", new File([], "after.jpg"));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("sudah mengunggah laporan piket untuk minggu aktif");
  });

  it("should reject if EXIF date does not match today's date (TS-PKT-03)", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayDayName = days[new Date().getDay()];
    mockSupabase.single.mockResolvedValueOnce({ data: { day: todayDayName } }); // schedule day

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "membership-id" }, error: null });

    // Mock no existing weekly log
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Mock EXIF date extractor to return a past date (1 week ago)
    const pastDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    vi.mocked(extractExifDateTime).mockReturnValue(pastDate);

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([Buffer.from("before")], "before.jpg", { type: "image/jpeg" }));
    formData.append("photo_after", new File([Buffer.from("after")], "after.jpg", { type: "image/jpeg" }));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("METADATA_MISMATCH");
    expect(res.message).toContain("Tanggal pengambilan foto (EXIF) tidak cocok");
  });

  it("should successfully upload photos and save report when validations pass", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: { id: "user-id" } } });
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } }); // profile

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayDayName = days[new Date().getDay()];
    mockSupabase.single.mockResolvedValueOnce({ data: { day: todayDayName } }); // schedule day

    // Mock membership exists
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: { id: "membership-id" }, error: null });

    // Mock no existing weekly log
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Mock EXIF date extractor to return today's date
    vi.mocked(extractExifDateTime).mockReturnValue(new Date());

    // Mock DB insertion
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append("photo_before", new File([Buffer.from("before")], "before.jpg", { type: "image/jpeg" }));
    formData.append("photo_after", new File([Buffer.from("after")], "after.jpg", { type: "image/jpeg" }));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(true);
    expect(res.message).toContain("Laporan piket berhasil");
  });
});
