import { describe, it, expect } from "vitest";
import {
  classifyPiketCompliance,
  buildComplianceRows,
  type RawComplianceSchedule,
  type RawComplianceLog,
} from "./piket";

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
            internship_start_date: "2027-06-01",
            internship_end_date: "2027-08-31",
          },
        },
      ],
    },
  ];
  const logs: RawComplianceLog[] = [
    { schedule_id: "sched-1", reported_by: "p-1", is_verified: true },
  ];

  it("mengklasifikasi status per penugasan", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs,
      today: new Date(2027, 8, 1), // 1 Sep 2027, setelah pekan 1 Juli berakhir
    });
    const byProfile = Object.fromEntries(
      rows.map((r) => [r.profileId, r.status]),
    );
    expect(byProfile["p-1"]).toBe("sudah-lapor");
    expect(byProfile["p-2"]).toBe("alpha");
    expect(byProfile["p-3"]).toBe("magang");
  });

  it("menandai berlangsung pada pekan yang belum berakhir", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs: [],
      today: new Date(2027, 6, 1), // di tengah pekan 1 Juli 2027 (Sen 28 Jun - Min 4 Jul)
    });
    expect(rows.find((r) => r.profileId === "p-2")?.status).toBe("berlangsung");
  });

  it("mengembalikan array kosong bila tidak ada jadwal", () => {
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules: [],
      logs,
    });
    expect(rows).toEqual([]);
  });

  it("log ditolak (is_verified false) tidak membuat status sudah-lapor", () => {
    const rejectedLogs: RawComplianceLog[] = [
      { schedule_id: "sched-1", reported_by: "p-1", is_verified: false },
    ];
    const rows = buildComplianceRows({
      academicPeriod: "2026/2027",
      schedules,
      logs: rejectedLogs,
      today: new Date(2027, 8, 1), // setelah pekan 1 berakhir
    });
    const byProfile = Object.fromEntries(
      rows.map((r) => [r.profileId, r.status]),
    );
    expect(byProfile["p-1"]).toBe("alpha");
  });
});
