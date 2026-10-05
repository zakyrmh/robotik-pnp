import { describe, it, expect } from "vitest";
import {
  getPiketWeekInfo,
  getPiketWeeksForMonth,
  isMemberOnInternship,
} from "./piket-date";

describe("getPiketWeeksForMonth", () => {
  it("mengembalikan pekan 1..4 dengan rentang Senin–Minggu", () => {
    const weeks = getPiketWeeksForMonth(2026, 6); // Juli 2026
    expect(weeks.map((w) => w.weekNumber)).toEqual([1, 2, 3, 4]);
    for (const w of weeks) {
      const start = new Date(w.startIsoDate + "T00:00:00");
      const end = new Date(w.endIsoDate + "T00:00:00");
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(6);
      expect(start.getDay()).toBe(1); // Senin
      expect(end.getDay()).toBe(0); // Minggu
    }
  });

  it("konsisten dengan getPiketWeekInfo pada tanggal di bulan yang sama", () => {
    // 2026-07-07 (Selasa) berada di Pekan 2 Juli 2026 (6–12 Jul).
    const direct = getPiketWeekInfo(new Date(2026, 6, 7));
    const weeks = getPiketWeeksForMonth(2026, 6);
    const match = weeks.find((w) => w.weekNumber === direct.weekNumber);
    expect(match?.startIsoDate).toBe(direct.startIsoDate);
    expect(match?.endIsoDate).toBe(direct.endIsoDate);
  });

  it("pekan 1 = pekan yang memuat Kamis pertama bulan itu", () => {
    // Kamis pertama September 2026 = 3 September → Pekan 1 mulai 31 Agu.
    const weeks = getPiketWeeksForMonth(2026, 8); // September 2026
    expect(weeks[0].startIsoDate).toBe("2026-08-31");
    expect(weeks[0].endIsoDate).toBe("2026-09-06");
  });
});

describe("isMemberOnInternship", () => {
  const RANGE = {
    is_on_internship: true,
    internship_start_date: "2026-08-03",
    internship_end_date: "2027-02-26",
  };

  it("true bila is_on_internship aktif tanpa tanggal (dianggap magang)", () => {
    expect(
      isMemberOnInternship({
        is_on_internship: true,
        internship_start_date: null,
        internship_end_date: null,
      }),
    ).toBe(true);
  });

  it("true bila tanggal referensi berada dalam rentang magang", () => {
    expect(isMemberOnInternship(RANGE, "2026-09-14")).toBe(true);
  });

  it("false bila tanggal referensi di luar rentang magang", () => {
    expect(isMemberOnInternship(RANGE, "2027-06-01")).toBe(false);
  });

  it("false bila is_on_internship tidak aktif", () => {
    expect(
      isMemberOnInternship({ is_on_internship: false }, "2026-09-14"),
    ).toBe(false);
  });

  it("analog kasus ZERO-DAY (start=end) gagal mendeteksi pekan lain sebagai magang", () => {
    // Data rusak 2027-02-26..2027-02-26 tidak mencakup pekan piket 2026.
    const broken = {
      is_on_internship: true,
      internship_start_date: "2027-02-26",
      internship_end_date: "2027-02-26",
    };
    expect(isMemberOnInternship(broken, "2026-08-31")).toBe(false);
    // Setelah diperbaiki ke rentang benar, terdeteksi magang.
    expect(isMemberOnInternship(RANGE, "2026-08-31")).toBe(true);
  });
});
