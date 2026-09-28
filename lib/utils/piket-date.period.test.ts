import { describe, it, expect } from "vitest";
import { getPiketWeekInfo, getPiketWeeksForMonth } from "./piket-date";

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
