import { describe, it, expect } from "vitest";
import { getPiketWeekInfo, getPiketWeekInfoForPeriod } from "./piket-date";

describe("getPiketWeekInfoForPeriod", () => {
  it("mengembalikan rentang Senin–Minggu untuk pekan 1..4", () => {
    for (let w = 1; w <= 4; w++) {
      const info = getPiketWeekInfoForPeriod("2026/2027", w);
      expect(info.weekNumber).toBe(w);
      // start harus Senin, end harus Minggu (selisih 6 hari)
      const start = new Date(info.startIsoDate + "T00:00:00");
      const end = new Date(info.endIsoDate + "T00:00:00");
      const diffDays =
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
      expect(diffDays).toBe(6);
      expect(start.getDay()).toBe(1); // Senin
      expect(end.getDay()).toBe(0); // Minggu
    }
  });

  it("konsisten dengan getPiketWeekInfo pada tanggal tengah pekan yang sama", () => {
    // 2027-07-05 adalah Senin pekan 1 Juli 2027 (siklus 2026/2027)
    const direct = getPiketWeekInfo(new Date(2027, 6, 7)); // Rabu
    const period = getPiketWeekInfoForPeriod("2026/2027", direct.weekNumber);
    expect(period.startIsoDate).toBe(direct.startIsoDate);
    expect(period.endIsoDate).toBe(direct.endIsoDate);
  });

  it("fallback aman untuk format periode tidak dikenal", () => {
    const info = getPiketWeekInfoForPeriod("bogus", 1);
    expect(info.weekNumber).toBe(1);
    expect(info.startIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(info.endIsoDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
