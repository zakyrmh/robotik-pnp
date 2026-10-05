import { describe, it, expect, vi, beforeEach } from "vitest";
import fc from "fast-check";
import {
  classifyPiketCompliance,
  buildComplianceRows,
  filterPiketLogs,
  filterComplianceRows,
  getPiketMemberHistory,
  type RawComplianceSchedule,
  type RawComplianceLog,
  type PiketHistoryLog,
  type PiketComplianceRow,
} from "./piket";

const { mockRpc, mockCreateClient } = vi.hoisted(() => {
  const mockRpc = vi.fn();
  return { mockRpc, mockCreateClient: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: mockCreateClient,
}));

describe("classifyPiketCompliance", () => {
  it("sudah lapor bila ada log valid", () => {
    expect(classifyPiketCompliance(true, false, true)).toBe("sudah-lapor");
    expect(classifyPiketCompliance(true, true, true)).toBe("sudah-lapor");
  });
  it("magang dikecualikan walau tanpa log", () => {
    expect(classifyPiketCompliance(false, true, true)).toBe("magang");
  });
  it("alpha bila pekan berakhir tanpa log & bukan magang", () => {
    expect(classifyPiketCompliance(false, false, true)).toBe("alpha");
  });
  it("berlangsung bila pekan belum berakhir", () => {
    expect(classifyPiketCompliance(false, false, false)).toBe("berlangsung");
  });
});
describe("buildComplianceRows", () => {
  const schedules: RawComplianceSchedule[] = [
    {
      id: "sched-1",
      academic_period: "2026/2027",
      week_number: 1,
      room_target: "Workshop",
      piket_members: [
        {
          id: "pm-1",
          profile_id: "p-1",
          profiles: {
            id: "p-1",
            nim: "210109001",
            full_name: "Andi Sudah",
            is_on_internship: false,
            internship_start_date: null,
            internship_end_date: null,
          },
        },
        {
          id: "pm-2",
          profile_id: "p-2",
          profiles: {
            id: "p-2",
            nim: "210109002",
            full_name: "Budi Alpha",
            is_on_internship: false,
            internship_start_date: null,
            internship_end_date: null,
          },
        },
        {
          id: "pm-3",
          profile_id: "p-3",
          profiles: {
            id: "p-3",
            nim: "210109003",
            full_name: "Citra Magang",
            is_on_internship: true,
            internship_start_date: "2026-06-01",
            internship_end_date: "2026-09-30",
          },
        },
      ],
    },
  ];
  const logs: RawComplianceLog[] = [
    {
      schedule_id: "sched-1",
      reported_by: "p-1",
      is_verified: true,
      // duty_date di Pekan 1 Juli 2026 (29 Jun – 5 Jul 2026).
      duty_date: "2026-07-01",
    },
  ];

  it("mengklasifikasi status per penugasan untuk satu bulan siklus", () => {
    // today = 1 Sep 2026 → bulan siklus Juli & Agustus 2026 (keduanya berakhir).
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs,
      today: new Date(2026, 8, 1),
    });

    // Baris bulan Juli 2026 (tempat log berada).
    const julyRows = rows.filter((r) => r.cycleMonthLabel === "Juli 2026");
    const julyByProfile = Object.fromEntries(
      julyRows.map((r) => [r.profileId, r.status]),
    );
    expect(julyByProfile["p-1"]).toBe("sudah-lapor");
    expect(julyByProfile["p-2"]).toBe("alpha");
    expect(julyByProfile["p-3"]).toBe("magang");

    // Pada bulan Agustus 2026, log Juli tidak dihitung → p-1 alpha.
    const augRows = rows.filter((r) => r.cycleMonthLabel === "Agustus 2026");
    expect(augRows.find((r) => r.profileId === "p-1")?.status).toBe("alpha");
  });

  it("menandai berlangsung pada pekan yang belum berakhir", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs: [],
      today: new Date(2026, 8, 3), // 3 Sep 2026, tengah Pekan 1 Sep (31 Agu–6 Sep)
    });
    const septemberRows = rows.filter(
      (r) => r.cycleMonthLabel === "September 2026",
    );
    const current = septemberRows.find((r) => r.profileId === "p-2");
    expect(current?.status).toBe("berlangsung");
  });

  it("mengembalikan array kosong bila tidak ada jadwal", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules: [],
      logs,
    });
    expect(rows).toEqual([]);
  });

  it("mengembalikan array kosong bila periode belum dimulai", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs,
      today: new Date(2026, 4, 1), // 1 Mei 2026, sebelum 1 Juli 2026
    });
    expect(rows).toEqual([]);
  });

  it("log ditolak (is_verified false) tidak membuat status sudah-lapor", () => {
    const rejectedLogs: RawComplianceLog[] = [
      {
        schedule_id: "sched-1",
        reported_by: "p-1",
        is_verified: false,
        duty_date: "2026-07-01",
      },
    ];
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs: rejectedLogs,
      today: new Date(2026, 8, 1),
    });
    const julyRows = rows.filter((r) => r.cycleMonthLabel === "Juli 2026");
    const byProfile = Object.fromEntries(
      julyRows.map((r) => [r.profileId, r.status]),
    );
    expect(byProfile["p-1"]).toBe("alpha");
  });

  // REGRESSION (Finding 1): dengan today = new Date() (tanpa injeksi), anggota
  // tanpa log & bukan magang pada bulan siklus LAMPAU harus "alpha", bukan
  // "berlangsung". Inilah bug: semua pekan terpaku ke Juli tahun ke-2 periode.
  it("alpha untuk bulan siklus lampau dengan today=new Date()", () => {
    const now = new Date();
    const periodStartYear =
      now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    const period = `${periodStartYear}/${periodStartYear + 1}`;

    // Schedule week 1 (template berulang). Anggota p-2 tidak punya log.
    const rows = buildComplianceRows({
      academicPeriod: period,
      schedules: [
        {
          id: "sched-reg",
          academic_period: period,
          week_number: 1,
          room_target: "Workshop",
          piket_members: [
            {
              id: "pm-reg",
              profile_id: "p-reg",
              profiles: {
                id: "p-reg",
                nim: "210109099",
                full_name: "Regresi Alpha",
                is_on_internship: false,
                internship_start_date: null,
                internship_end_date: null,
              },
            },
          ],
        },
      ],
      logs: [],
    });

    const pastRows = rows.filter((r) => r.endIsoDate < formatIso(now));
    expect(pastRows.length).toBeGreaterThan(0);
    expect(pastRows.every((r) => r.status === "alpha")).toBe(true);
  });
});

function formatIso(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}
describe("classifyPiketCompliance — invariant", () => {
  it("selalu mengembalikan salah satu dari 4 status & tidak pernah alpha saat pekan berlangsung", () => {
    fc.assert(
      fc.property(
        fc.boolean(),
        fc.boolean(),
        fc.boolean(),
        (hasValidLog, onInternship, weekEnded) => {
          const status = classifyPiketCompliance(
            hasValidLog,
            onInternship,
            weekEnded,
          );
          expect(["sudah-lapor", "alpha", "berlangsung", "magang"]).toContain(
            status,
          );
          if (!weekEnded && !hasValidLog && !onInternship) {
            expect(status).toBe("berlangsung");
          }
        },
      ),
    );
  });
});

describe("filterPiketLogs / filterComplianceRows", () => {
  const logs: PiketHistoryLog[] = [
    mkLog("2026-09-19", 3), // Sep 2026, pekan 3
    mkLog("2026-10-03", 1), // Okt 2026, pekan 1
    mkLog("2025-09-19", 3), // Sep 2025
  ];
  function mkLog(dutyDate: string, weekNumber: number): PiketHistoryLog {
    return {
      id: `l-${dutyDate}`,
      scheduleId: "s-1",
      academicPeriod: "2026/2027",
      weekNumber,
      roomTarget: "workshop_dan_sekretariat",
      dutyDate,
      reportedById: "p-1",
      reporterName: "A",
      reporterNim: "1",
      status: "approved",
      rejectionReason: "",
      verifiedAt: "",
      verifierName: "",
      notes: "",
      proofImageUrl: "",
      proofImageBeforeUrl: "",
      createdAt: "",
    };
  }

  it("filter tahun kalender", () => {
    expect(
      filterPiketLogs(logs, { academicPeriod: "2026/2027", year: 2026 }).map(
        (l) => l.dutyDate,
      ),
    ).toEqual(["2026-10-03", "2026-09-19"]);
  });
  it("filter bulan (0-based) & pekan", () => {
    expect(
      filterPiketLogs(logs, {
        academicPeriod: "2026/2027",
        monthIndex0: 8,
        weekNumber: 3,
      }).map((l) => l.id),
    ).toEqual(["l-2026-09-19"]);
  });
  it("null = tanpa filter", () => {
    expect(filterPiketLogs(logs, { academicPeriod: "2026/2027" })).toHaveLength(
      3,
    );
  });
  it("compliance difilter dari bulan siklus (bukan startIsoDate)", () => {
    const rows = [
      {
        profileId: "p1",
        memberName: "A",
        nim: null,
        academicPeriod: "2026/2027",
        weekNumber: 3,
        roomTarget: "x",
        startIsoDate: "2026-09-14",
        endIsoDate: "2026-09-20",
        cycleMonthLabel: "September 2026",
        status: "alpha",
      },
      {
        // Pekan 1 bulan siklus OKTOBER 2026 (start 28 Sep 2026), namun
        // `startIsoDate` berada di bulan kalender September.
        profileId: "p2",
        memberName: "B",
        nim: null,
        academicPeriod: "2026/2027",
        weekNumber: 1,
        roomTarget: "x",
        startIsoDate: "2026-09-28",
        endIsoDate: "2026-10-04",
        cycleMonthLabel: "Oktober 2026",
        status: "sudah-lapor",
      },
    ] as PiketComplianceRow[];
    expect(
      filterComplianceRows(rows, {
        academicPeriod: "2026/2027",
        monthIndex0: 9,
        weekNumber: 1,
      }).map((r) => r.profileId),
    ).toEqual(["p2"]);
  });

  // REGRESSION (off-by-one): pekan 1 bulan siklus September 2026 dimulai pada
  // 2026-08-31 (bulan kalender Agustus), sehingga filter harus memakai bulan
  // SIKLUS, bukan bulan `startIsoDate`.
  it("baris cycleMonthLabel September cocok monthIndex0=8 walau startIsoDate Agustus", () => {
    const rows = [
      {
        profileId: "sep1",
        memberName: "Sep Pekan 1",
        nim: null,
        academicPeriod: "2026/2027",
        weekNumber: 1,
        roomTarget: "x",
        startIsoDate: "2026-08-31",
        endIsoDate: "2026-09-06",
        cycleMonthLabel: "September 2026",
        status: "alpha",
      },
    ] as PiketComplianceRow[];

    expect(
      filterComplianceRows(rows, {
        academicPeriod: "2026/2027",
        year: 2026,
        monthIndex0: 8,
      }).map((r) => r.profileId),
    ).toEqual(["sep1"]);

    expect(
      filterComplianceRows(rows, {
        academicPeriod: "2026/2027",
        year: 2026,
        monthIndex0: 7,
      }),
    ).toEqual([]);
  });
});

describe("getPiketMemberHistory", () => {
  beforeEach(() => {
    mockRpc.mockReset();
    mockCreateClient.mockReset();
    mockCreateClient.mockResolvedValue({ rpc: mockRpc });
  });

  it("memetakan kolom RPC ke PiketMemberHistoryEntry memakai id asli", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        {
          id: "log-real-1",
          schedule_id: "sched-1",
          academic_period: "2026/2027",
          week_number: 2,
          room_target: "workshop_dan_sekretariat",
          duty_date: "2026-09-14",
          is_verified: true,
          is_final: true,
          rejection_reason: null,
          verified_by: "verifier-1",
          verifier_name: "Admin Kestari",
          notes: "bersih",
          proof_image_url: "https://r2/proof.jpg",
          proof_image_before_url: "https://r2/before.jpg",
          created_at: "2026-09-14T10:00:00Z",
        },
      ],
      error: null,
    });

    const entries = await getPiketMemberHistory(
      "00000000-0000-4000-8000-000000000000",
    );

    expect(mockRpc).toHaveBeenCalledWith("get_piket_member_history", {
      p_profile_id: "00000000-0000-4000-8000-000000000000",
    });
    expect(entries).toHaveLength(1);
    // id berasal langsung dari kolom RPC (bukan sintetis scheduleId::createdAt).
    expect(entries[0].id).toBe("log-real-1");
    expect(entries[0].scheduleId).toBe("sched-1");
    expect(entries[0].status).toBe("approved");
    expect(entries[0].verifierName).toBe("Admin Kestari");
  });

  it("melempar PiketHistoryError saat RPC gagal", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });

    await expect(
      getPiketMemberHistory("00000000-0000-4000-8000-000000000000"),
    ).rejects.toThrow(/Gagal memuat histori piket anggota/);
  });
});
