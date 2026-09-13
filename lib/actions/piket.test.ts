import { vi, describe, it, expect, beforeEach } from "vitest";
import {
  submitPiketReport,
  assignPiketMember,
  removePiketMember,
  createPiketPeriod,
  reviewPiketLog,
  imposePiketFine,
  markPiketFinePaid,
  voidPiketFine,
} from "./piket";
import { extractExifDateTime } from "@/lib/utils/exif";
import {
  getPiketWeekInfo,
  isDateInPiketWeek,
  isMemberOnInternship,
} from "@/lib/utils/piket-date";

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
      neq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lte: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
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

describe("Piket Date Utility - isMemberOnInternship", () => {
  it("should return false for profile without internship flag", () => {
    expect(isMemberOnInternship({ is_on_internship: false })).toBe(false);
    expect(isMemberOnInternship(null)).toBe(false);
  });

  it("should return true for interning profile without date limits", () => {
    expect(isMemberOnInternship({ is_on_internship: true })).toBe(true);
  });

  it("should validate reference date within internship window", () => {
    const profile = {
      is_on_internship: true,
      internship_start_date: "2026-08-01",
      internship_end_date: "2026-10-31",
    };

    expect(isMemberOnInternship(profile, "2026-09-01")).toBe(true);
    expect(isMemberOnInternship(profile, "2026-07-31")).toBe(false);
    expect(isMemberOnInternship(profile, "2026-11-01")).toBe(false);
  });
});

describe("Piket Date Utility - isDateInPiketWeek", () => {
  // Pekan berjalan: Senin 31 Agu – Minggu 6 Sep 2026.
  const week = getPiketWeekInfo(new Date(2026, 8, 2));
  const wednesdayNoon = new Date("2026-09-02T10:00:00Z");

  it("should accept a photo taken on a different day within the same week (Monday photo, Wednesday upload)", () => {
    expect(
      isDateInPiketWeek(new Date("2026-08-31T08:00:00Z"), week, wednesdayNoon),
    ).toBe(true);
  });

  it("should accept a photo taken on the upload day", () => {
    expect(isDateInPiketWeek(wednesdayNoon, week, wednesdayNoon)).toBe(true);
  });

  it("should accept a photo taken on Sunday of the same week", () => {
    const sundayNight = new Date("2026-09-06T23:30:00Z");
    expect(
      isDateInPiketWeek(new Date("2026-09-06T23:00:00Z"), week, sundayNight),
    ).toBe(true);
  });

  it("should accept a Monday 01:00 WIB photo via WIB tolerance (UTC date still Sunday)", () => {
    // Senin 31 Agu 01:00 WIB = Minggu 30 Agu 18:00 UTC (di luar rentang UTC,
    // masuk rentang via kandidat WIB).
    expect(
      isDateInPiketWeek(new Date("2026-08-30T18:00:00Z"), week, wednesdayNoon),
    ).toBe(true);
  });

  it("should reject a photo from the previous week", () => {
    expect(
      isDateInPiketWeek(new Date("2026-08-30T12:00:00Z"), week, wednesdayNoon),
    ).toBe(false);
  });

  it("should reject a photo from the next week", () => {
    expect(
      isDateInPiketWeek(new Date("2026-09-07T00:30:00Z"), week, wednesdayNoon),
    ).toBe(false);
  });

  it("should reject an old photo from weeks ago", () => {
    expect(
      isDateInPiketWeek(new Date("2026-08-15T10:00:00Z"), week, wednesdayNoon),
    ).toBe(false);
  });

  it("should reject a future-dated photo even within the same week", () => {
    expect(
      isDateInPiketWeek(new Date("2026-09-04T10:00:00Z"), week, wednesdayNoon),
    ).toBe(false);
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

  it("should reject if EXIF date is outside the current piket week", async () => {
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

    // Mock EXIF date extractor to return a past date (2 weeks ago)
    const pastDate = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
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

  it("should accept an EXIF photo taken on a different day within the same week", async () => {
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

    // Foto diambil awal pekan berjalan (Senin 00:01 waktu lokal — selalu
    // di masa lalu dan dalam rentang pekan), upload di hari lain
    // dalam pekan yang sama → tetap diterima.
    const earlyInWeek = new Date(weekInfo.monday.getTime() + 60 * 1000);
    vi.mocked(extractExifDateTime).mockReturnValue(earlyInWeek);

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

  it("should accept HEIC-converted photos taken on a different day within the same week", async () => {
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

    // Konversi HEIC menghilangkan EXIF → fallback tanggal file perangkat.
    vi.mocked(extractExifDateTime).mockReturnValue(null);

    // Mock DB insertion
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    const mondayMs = weekInfo.monday.getTime() + 60 * 1000;
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
    formData.append("photo_before_was_heic", "1");
    formData.append("photo_after_was_heic", "1");
    formData.append("photo_before_taken_at", String(mondayMs));
    formData.append("photo_after_taken_at", String(mondayMs));

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(true);
    expect(res.message).toContain("Laporan piket kebersihan berhasil");
  });

  it("should reject identical before and after photos", async () => {
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

    // EXIF valid (today) agar sampai ke pengecekan hash
    vi.mocked(extractExifDateTime).mockReturnValue(new Date());

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("same-bytes")], "before.jpg", {
        type: "image/jpeg",
      }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("same-bytes")], "after.jpg", {
        type: "image/jpeg",
      }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("identik");
  });

  it("should reject a photo hash already used in a previous report", async () => {
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

    vi.mocked(extractExifDateTime).mockReturnValue(new Date());

    // Mock hash reuse ditemukan
    mockSupabase.limit.mockResolvedValueOnce({
      data: [{ id: "old-log-id" }],
      error: null,
    });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("before-bytes")], "before.jpg", {
        type: "image/jpeg",
      }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after-bytes")], "after.jpg", {
        type: "image/jpeg",
      }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("sudah pernah digunakan");
  });

  it("should reject when the after photo predates the before photo", async () => {
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

    // before = Senin +2 mnt, after = Senin +1 mnt (after lebih tua)
    const mondayMs = weekInfo.monday.getTime();
    vi.mocked(extractExifDateTime)
      .mockImplementationOnce(() => new Date(mondayMs + 2 * 60 * 1000))
      .mockImplementationOnce(() => new Date(mondayMs + 60 * 1000));

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("before-bytes")], "before.jpg", {
        type: "image/jpeg",
      }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after-bytes")], "after.jpg", {
        type: "image/jpeg",
      }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("Urutan foto tidak valid");
  });

  it("should reject when weekly upload attempts are exhausted", async () => {
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

    // Mock no valid weekly log (yang ada hanya yang ditolak)
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    // Panggilan lte pertama (cek duplikat) lanjut rantai, kedua (hitung
    // percobaan) mengembalikan count 2 = kuota habis.
    mockSupabase.lte
      .mockReturnValueOnce(mockSupabase)
      .mockResolvedValueOnce({ count: 2, error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab");
    formData.append(
      "photo_before",
      new File([Buffer.from("before-bytes")], "before.jpg", {
        type: "image/jpeg",
      }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after-bytes")], "after.jpg", {
        type: "image/jpeg",
      }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
    expect(res.message).toContain("Kesempatan upload");
  });

  it("should allow re-upload after a rejection (rejected logs do not block)", async () => {
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

    // Mock no VALID weekly log (laporan ditolak dikecualikan query)
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    vi.mocked(extractExifDateTime).mockReturnValue(new Date());

    // Mock DB insertion
    mockSupabase.insert.mockResolvedValueOnce({ error: null });

    const formData = new FormData();
    formData.append("schedule_id", "sched-id");
    formData.append("notes", "cleaned the lab, second try");
    formData.append(
      "photo_before",
      new File([Buffer.from("before-retry")], "before.jpg", {
        type: "image/jpeg",
      }),
    );
    formData.append(
      "photo_after",
      new File([Buffer.from("after-retry")], "after.jpg", {
        type: "image/jpeg",
      }),
    );

    const res = await submitPiketReport(formData);
    expect(res.success).toBe(true);
    expect(res.message).toContain("Laporan piket kebersihan berhasil");
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

describe("Piket Server Action - reviewPiketLog", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
  });

  it("should reject non-kestari users from reviewing logs", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } });

    const res = await reviewPiketLog("log-id", "approve");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should require a reason when rejecting", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });

    const res = await reviewPiketLog("log-id", "reject", "   ");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
  });

  it("should reject review of an already finalized log", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "log-id",
        is_final: true,
        is_verified: true,
        reported_by: "user-id",
        schedule_id: "sched-id",
      },
    });

    const res = await reviewPiketLog("log-id", "approve");
    expect(res.success).toBe(false);
    expect(res.message).toContain("sudah final");
  });

  it("should allow kestari to approve a pending log", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "log-id",
        is_final: false,
        is_verified: true,
        reported_by: "user-id",
        schedule_id: "sched-id",
      },
    });

    const res = await reviewPiketLog("log-id", "approve");
    expect(res.success).toBe(true);
    expect(res.message).toContain("disetujui");
  });

  it("should allow kestari to reject a pending log with a reason", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "log-id",
        is_final: false,
        is_verified: true,
        reported_by: "user-id",
        schedule_id: "sched-id",
      },
    });

    const res = await reviewPiketLog("log-id", "reject", "Foto tidak valid");
    expect(res.success).toBe(true);
    expect(res.message).toContain("ditolak");
  });
});

describe("Piket Server Action - piket fines", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.from.mockReturnThis();
    mockSupabase.select.mockReturnThis();
    mockSupabase.eq.mockReturnThis();
    mockSupabase.delete.mockReturnThis();
  });

  it("should reject non-kestari users from imposing fines", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "user-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({ data: { role: "anggota" } });

    const res = await imposePiketFine("target-id", "sched-id");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("FORBIDDEN");
  });

  it("should block fines for interning members", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    // Target adalah anggota jadwal
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });
    // Target profile berstatus magang
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "target-id",
        is_on_internship: true,
        internship_start_date: null,
        internship_end_date: null,
      },
      error: null,
    });

    const res = await imposePiketFine("target-id", "sched-id");
    expect(res.success).toBe(false);
    expect(res.message).toContain("Magang Luar / PKL");
  });

  it("should block fines for members with a valid report", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    // Target adalah anggota jadwal
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });
    // Target profile bukan magang
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "target-id",
        is_on_internship: false,
      },
      error: null,
    });
    // Target sudah punya laporan valid
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "valid-log-id" },
      error: null,
    });

    const res = await imposePiketFine("target-id", "sched-id");
    expect(res.success).toBe(false);
    expect(res.message).toContain("laporan valid");
  });

  it("should allow kestari to impose a fine", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "membership-id" },
      error: null,
    });
    // Profile bukan magang
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: { id: "target-id", is_on_internship: false },
      error: null,
    });
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });
    mockSupabase.maybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const res = await imposePiketFine("target-id", "sched-id", 10000, "Alpha");
    expect(res.success).toBe(true);
    expect(res.message).toContain("Rp10.000");
  });

  it("should allow kestari to mark a fine as paid", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "fine-id",
        status: "belum_lunas",
        profile_id: "target-id",
        schedule_id: "sched-id",
        amount: 10000,
      },
    });

    const res = await markPiketFinePaid("fine-id");
    expect(res.success).toBe(true);
    expect(res.message).toContain("lunas");
  });

  it("should reject marking an already paid fine", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: {
        id: "fine-id",
        status: "lunas",
        profile_id: "target-id",
        schedule_id: "sched-id",
        amount: 10000,
      },
    });

    const res = await markPiketFinePaid("fine-id");
    expect(res.success).toBe(false);
    expect(res.error?.code).toBe("BAD_REQUEST");
  });

  it("should allow kestari to void a fine", async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: "kestari-id" } },
    });
    mockSupabase.single.mockResolvedValueOnce({
      data: { role: "admin-kestari" },
    });
    mockSupabase.maybeSingle.mockResolvedValueOnce({
      data: {
        id: "fine-id",
        profile_id: "target-id",
        schedule_id: "sched-id",
        amount: 10000,
        status: "belum_lunas",
      },
      error: null,
    });

    const res = await voidPiketFine("fine-id");
    expect(res.success).toBe(true);
    expect(res.message).toContain("dibatalkan");
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
