import { describe, it, expect } from "vitest";
import {
  calculateAgeOnDate,
  validateJuniorBirthDate,
  MRC_EVENT_DATE,
} from "./mrc-rules";

describe("calculateAgeOnDate", () => {
  it("calculates exact age correctly on event date (31 Oct 2026)", () => {
    // Exactly 19 years old on event date (born 31 Oct 2007)
    expect(calculateAgeOnDate("2007-10-31", MRC_EVENT_DATE)).toBe(19);

    // 19 years old (born 1 Nov 2006 -> turns 20 on 1 Nov 2026, so 19 on 31 Oct 2026)
    expect(calculateAgeOnDate("2006-11-01", MRC_EVENT_DATE)).toBe(19);

    // 20 years old (born 31 Oct 2006 -> turns 20 on 31 Oct 2026)
    expect(calculateAgeOnDate("2006-10-31", MRC_EVENT_DATE)).toBe(20);

    // 20 years old (born 30 Oct 2006)
    expect(calculateAgeOnDate("2006-10-30", MRC_EVENT_DATE)).toBe(20);

    // 18 years old (born 1 Nov 2007)
    expect(calculateAgeOnDate("2007-11-01", MRC_EVENT_DATE)).toBe(18);

    // 16 years old (born 15 Jan 2010)
    expect(calculateAgeOnDate("2010-01-15", MRC_EVENT_DATE)).toBe(16);
  });

  it("returns null for invalid inputs", () => {
    expect(calculateAgeOnDate("")).toBeNull();
    expect(calculateAgeOnDate("invalid-date")).toBeNull();
    expect(calculateAgeOnDate(null)).toBeNull();
    expect(calculateAgeOnDate(undefined)).toBeNull();
    expect(calculateAgeOnDate("1899-12-31")).toBeNull();
    expect(calculateAgeOnDate("2008-13-01")).toBeNull();
  });
});

describe("validateJuniorBirthDate", () => {
  it("accepts participants aged <= 19 on event date", () => {
    // 19 years old
    const res1 = validateJuniorBirthDate("2007-10-31");
    expect(res1.valid).toBe(true);
    expect(res1.age).toBe(19);

    // 19 years old (born 2006-11-01)
    const res2 = validateJuniorBirthDate("2006-11-01");
    expect(res2.valid).toBe(true);
    expect(res2.age).toBe(19);

    // 17 years old (born 2009-04-10)
    const res3 = validateJuniorBirthDate("2009-04-10");
    expect(res3.valid).toBe(true);
    expect(res3.age).toBe(17);
  });

  it("rejects participants older than 19 on event date", () => {
    // 20 years old on event day (born 2006-10-31)
    const res1 = validateJuniorBirthDate("2006-10-31");
    expect(res1.valid).toBe(false);
    expect(res1.age).toBe(20);
    expect(res1.error).toContain("melebihi batas maksimal 19 tahun");

    // 20 years old (born 2006-05-15)
    const res2 = validateJuniorBirthDate("2006-05-15");
    expect(res2.valid).toBe(false);
    expect(res2.age).toBe(20);
    expect(res2.error).toContain("20 tahun");

    // 25 years old (born 2001-01-01)
    const res3 = validateJuniorBirthDate("2001-01-01");
    expect(res3.valid).toBe(false);
    expect(res3.age).toBe(25);
  });

  it("rejects empty or future birth dates", () => {
    const resEmpty = validateJuniorBirthDate("");
    expect(resEmpty.valid).toBe(false);
    expect(resEmpty.error).toContain("wajib diisi");

    const resFuture = validateJuniorBirthDate("2026-11-05");
    expect(resFuture.valid).toBe(false);
    expect(resFuture.error).toContain("melewati tanggal pelaksanaan event");
  });
});
