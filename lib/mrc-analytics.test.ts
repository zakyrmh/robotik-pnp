import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  toWibDateKey,
  formatDateLabel,
  buildDateRange,
  todayWibKey,
  filterByRange,
  bucketByDay,
  summarize,
  categoryColor,
  CATEGORY_PALETTE_FALLBACK,
  type TrendRegistration,
} from "@/lib/mrc-analytics";

/** Membuat baris registrasi tiruan dengan timestamp UTC (ISO). */
function reg(
  createdAtUtc: string,
  over: Partial<TrendRegistration> = {},
): TrendRegistration {
  return {
    created_at: createdAtUtc,
    payment_status: "unpaid",
    category_id: "cat-1",
    registration_batch: null,
    category: undefined,
    ...over,
  };
}

describe("toWibDateKey — konversi UTC → WIB (+7)", () => {
  it("memetakan 00:00 WIB ke tanggal WIB yang benar", () => {
    // 2026-09-15T17:00:00Z == 2026-09-16T00:00 WIB
    expect(toWibDateKey("2026-09-15T17:00:00Z")).toBe("2026-09-16");
  });

  it("memetakan 06:59 WIB masih tanggal lokal yang sama (bukan hari UTC sebelumnya)", () => {
    // 2026-09-15T23:59:00Z == 2026-09-16T06:59 WIB
    expect(toWibDateKey("2026-09-15T23:59:00Z")).toBe("2026-09-16");
  });

  it("memetakan tengah malam UTC ke pagi WIB tanggal yang sama", () => {
    // 2026-09-16T00:00:00Z == 2026-09-16T07:00 WIB
    expect(toWibDateKey("2026-09-16T00:00:00Z")).toBe("2026-09-16");
  });

  it("menolak tanggal tidak valid dengan null", () => {
    expect(toWibDateKey("bukan-tanggal")).toBeNull();
  });
});

describe("formatDateLabel", () => {
  it("memformat kunci tanggal menjadi `DD Mmm` Indonesia", () => {
    expect(formatDateLabel("2026-09-16")).toBe("16 Sep");
    expect(formatDateLabel("2026-01-05")).toBe("5 Jan");
    expect(formatDateLabel("2026-12-31")).toBe("31 Des");
  });
});

describe("buildDateRange — semua tanggal dalam rentang (isi gap)", () => {
  it("mengembalikan setiap tanggal inklusif", () => {
    expect(buildDateRange("2026-09-14", "2026-09-17")).toEqual([
      "2026-09-14",
      "2026-09-15",
      "2026-09-16",
      "2026-09-17",
    ]);
  });

  it("mengembalikan satu tanggal bila sama", () => {
    expect(buildDateRange("2026-09-16", "2026-09-16")).toEqual(["2026-09-16"]);
  });

  it("mengembalikan array kosong bila rentang terbalik", () => {
    expect(buildDateRange("2026-09-17", "2026-09-14")).toEqual([]);
  });
});

describe("todayWibKey", () => {
  it("menghitung kunci hari ini dari ISO UTC yang diberikan", () => {
    // 2026-09-15T20:00:00Z == 2026-09-16T03:00 WIB
    expect(todayWibKey("2026-09-15T20:00:00Z")).toBe("2026-09-16");
  });
});

describe("filterByRange", () => {
  const today = "2026-09-20";
  const rows = [
    reg("2026-09-20T02:00:00Z"), // 2026-09-20 WIB (hari ini)
    reg("2026-09-18T02:00:00Z"), // 2026-09-18 WIB
    reg("2026-09-01T02:00:00Z"), // 2026-09-01 WIB
    reg("2026-08-01T02:00:00Z"), // lama
  ];

  it("'all' mengembalikan seluruh baris", () => {
    expect(filterByRange(rows, "all", today)).toHaveLength(4);
  });

  it("'7d' memuat 7 hari terakhir inklusif hari ini", () => {
    const out = filterByRange(rows, "7d", today);
    // cutoff = 2026-09-14 → hanya 09-20 & 09-18 yang lolos
    expect(out.map((r) => toWibDateKey(r.created_at))).toEqual([
      "2026-09-20",
      "2026-09-18",
    ]);
  });

  it("'30d' memuat 30 hari terakhir inklusif hari ini", () => {
    const out = filterByRange(rows, "30d", today);
    expect(out).toHaveLength(3); // 09-20, 09-18, 09-01 ; 08-01 tersaring
  });

  it("mengabaikan baris dengan tanggal tidak valid", () => {
    const withBad = [reg("invalid"), reg("2026-09-20T02:00:00Z")];
    expect(filterByRange(withBad, "7d", today)).toHaveLength(1);
  });
});

describe("bucketByDay", () => {
  const today = "2026-09-20";

  it("mengisi hari tanpa pendaftaran dengan 0 (garis kontinu)", () => {
    const rows = [
      reg("2026-09-18T02:00:00Z", { category_id: "cat-1" }),
      reg("2026-09-20T02:00:00Z", { category_id: "cat-2" }),
    ];
    const buckets = bucketByDay(rows, today);
    expect(buckets.map((b) => b.date)).toEqual([
      "2026-09-18",
      "2026-09-19",
      "2026-09-20",
    ]);
    expect(buckets.map((b) => b.total)).toEqual([1, 0, 1]);
  });

  it("menghitung total, paid, batch, dan per-kategori dengan benar", () => {
    const rows = [
      reg("2026-09-18T02:00:00Z", {
        payment_status: "paid",
        registration_batch: "batch1",
        category_id: "cat-1",
      }),
      reg("2026-09-18T03:00:00Z", {
        payment_status: "unpaid",
        registration_batch: "batch2",
        category_id: "cat-1",
      }),
      reg("2026-09-18T04:00:00Z", {
        payment_status: "paid",
        registration_batch: null,
        category_id: "cat-2",
      }),
    ];
    const [bucket] = bucketByDay(rows, "2026-09-18");
    expect(bucket.total).toBe(3);
    expect(bucket.paid).toBe(2);
    expect(bucket.batch1).toBe(1);
    expect(bucket.batch2).toBe(1);
    expect(bucket.byCategory).toEqual({ "cat-1": 2, "cat-2": 1 });
  });

  it("mengembalikan array kosong bila tidak ada data", () => {
    expect(bucketByDay([], today)).toEqual([]);
  });

  it("memakai bucket WIB: pendaftaran 17:00 UTC masuk hari WIB berikutnya", () => {
    const rows = [reg("2026-09-15T17:00:00Z")];
    const buckets = bucketByDay(rows, "2026-09-15");
    // hanya satu titik tanggal: 2026-09-16 (hari WIB)
    expect(buckets.map((b) => b.date)).toEqual(["2026-09-16"]);
  });
});

describe("summarize", () => {
  it("menghitung total, rata-rata harian, dan puncak", () => {
    const rows = [
      reg("2026-09-18T02:00:00Z"),
      reg("2026-09-18T03:00:00Z"),
      reg("2026-09-20T02:00:00Z"),
    ];
    const buckets = bucketByDay(rows, "2026-09-20"); // 18,19,20 → total 3, avg 1
    const summary = summarize(buckets);
    expect(summary.total).toBe(3);
    expect(summary.avgPerDay).toBe(1);
    expect(summary.peak).toEqual({
      date: "2026-09-18",
      label: "18 Sep",
      count: 2,
    });
  });

  it("menangani input kosong", () => {
    expect(summarize([])).toEqual({ total: 0, avgPerDay: 0, peak: null });
  });
});

describe("categoryColor", () => {
  it("memakai warna hasil resolusi bila tersedia", () => {
    expect(categoryColor(0, ["#abcdef"])).toBe("#abcdef");
    expect(categoryColor(2, ["#abcdef"])).toBe("#abcdef");
  });

  it("jatuh ke palet fallback deterministik saat kosong", () => {
    expect(categoryColor(0, [])).toBe(CATEGORY_PALETTE_FALLBACK[0]);
    expect(categoryColor(CATEGORY_PALETTE_FALLBACK.length, [])).toBe(
      CATEGORY_PALETTE_FALLBACK[0],
    );
  });
});

describe("properti: jumlah total seluruh bucket = jumlah registrasi valid", () => {
  it("berlaku untuk kombinasi tanggal acak", () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 30 }), { maxLength: 40 }),
        (dayOffsets) => {
          const base = Date.parse("2026-09-01T02:00:00Z");
          const rows = dayOffsets.map((offset) =>
            reg(new Date(base + offset * 86400000).toISOString()),
          );
          const buckets = bucketByDay(rows, "2026-09-30");
          const bucketSum = buckets.reduce((sum, b) => sum + b.total, 0);
          return bucketSum === rows.length;
        },
      ),
    );
  });
});
