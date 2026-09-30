import { describe, it, expect } from "vitest";
import {
  financePercentage,
  sumFinanceTotal,
  sortFinanceRows,
  UNASSIGNED_BANK_LABEL,
  type FinanceBreakdownRow,
} from "@/lib/event-finance";

/** Baris rekening nyata. */
function bank(
  bank_name: string,
  total_amount: number,
  account_number = "123",
): FinanceBreakdownRow {
  return { bank_name, total_amount, account_number, is_unassigned: false };
}

/** Baris agregat "belum ditetapkan rekening". */
function unassigned(total_amount: number): FinanceBreakdownRow {
  return {
    bank_name: null,
    total_amount,
    account_number: null,
    is_unassigned: true,
  };
}

describe("financePercentage", () => {
  it("menghitung persentase kontribusi dan membulatkan", () => {
    expect(financePercentage(250, 1000)).toBe(25);
    expect(financePercentage(333, 1000)).toBe(33);
    expect(financePercentage(1000, 1000)).toBe(100);
  });

  it("mengembalikan 0 saat total 0 atau tidak valid (tanpa NaN)", () => {
    expect(financePercentage(500, 0)).toBe(0);
    expect(financePercentage(500, -10)).toBe(0);
    expect(financePercentage(Number.NaN, 1000)).toBe(0);
    expect(financePercentage(500, Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe("sumFinanceTotal", () => {
  it("menjumlahkan seluruh baris termasuk baris belum ditetapkan", () => {
    expect(sumFinanceTotal([bank("BRI", 100), unassigned(50)])).toBe(150);
  });

  it("tahan terhadap array kosong", () => {
    expect(sumFinanceTotal([])).toBe(0);
  });
});

describe("sortFinanceRows", () => {
  it("mengurutkan rekening nyata secara abjad dan menaruh 'belum ditetapkan' di akhir", () => {
    const sorted = sortFinanceRows([
      unassigned(50),
      bank("Mandiri", 200),
      bank("Bank BRI", 300),
    ]);

    expect(sorted.map((r) => r.bank_name)).toEqual([
      "Bank BRI",
      "Mandiri",
      null,
    ]);
    expect(sorted[sorted.length - 1].is_unassigned).toBe(true);
  });

  it("tidak mengubah array input (immutability)", () => {
    const input = [unassigned(10), bank("BNI", 20)];
    const snapshot = [...input];
    sortFinanceRows(input);
    expect(input).toEqual(snapshot);
  });

  it("baris belum ditetapkan selalu terakhir walau tanpa rekening lain", () => {
    const sorted = sortFinanceRows([unassigned(75)]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].is_unassigned).toBe(true);
  });
});

describe("rekonsiliasi 100% (perilaku inti perbaikan)", () => {
  it("Σ rincian per rekening + belum ditetapkan == total pendapatan paid", () => {
    // Skenario nyata: 3 rekening + 2 tim paid tanpa rekening.
    const totalIncome = 1_000_000;
    const rows: FinanceBreakdownRow[] = [
      bank("Bank BRI", 400_000, "111"),
      bank("Bank Mandiri", 250_000, "222"),
      bank("BNI", 100_000, "333"),
      unassigned(250_000),
    ];

    // Total baris merekonsiliasi total pendapatan (tidak ada uang hilang).
    expect(sumFinanceTotal(rows)).toBe(totalIncome);

    // Persentase seluruh baris membulatkan ke 100% (toleransi pembulatan).
    const percentSum = rows.reduce(
      (sum, r) => sum + financePercentage(r.total_amount, totalIncome),
      0,
    );
    expect(percentSum).toBeGreaterThanOrEqual(99);
    expect(percentSum).toBeLessThanOrEqual(101);

    // Tanpa perbaikan, 250rb tim tanpa rekening akan hilang => 75%.
    const tanpaUnassigned = sumFinanceTotal(
      rows.filter((r) => !r.is_unassigned),
    );
    expect(tanpaUnassigned).toBe(750_000);
    expect(tanpaUnassigned).not.toBe(totalIncome);
  });

  it("label agregat sesuai ekspektasi UI", () => {
    expect(UNASSIGNED_BANK_LABEL).toBe("Belum ditetapkan rekening");
  });
});
