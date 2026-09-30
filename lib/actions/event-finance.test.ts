import { vi, describe, it, expect, beforeEach } from "vitest";
import { getEventFinanceSummaryByBankAction } from "./event-finance";

// Hoist mock supabase (admin client) agar urutan inisialisasi Vitest aman.
const { mockRpc } = vi.hoisted(() => {
  return { mockRpc: vi.fn() };
});

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: vi.fn(() => ({ rpc: mockRpc })),
}));

/** Baris mentah seperti yang dikembalikan RPC `get_event_finance_summary_by_bank`. */
type RawRow = {
  account_number: string | null;
  bank_name: string | null;
  account_holder: string | null;
  total_amount: number;
  transaction_count: number;
  is_unassigned: boolean;
};

function raw(over: Partial<RawRow> = {}): RawRow {
  return {
    account_number: "111",
    bank_name: "Bank BRI",
    account_holder: "Zaky",
    total_amount: 400_000,
    transaction_count: 4,
    is_unassigned: false,
    ...over,
  };
}

describe("getEventFinanceSummaryByBankAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("memetakan hasil RPC ke BankAccountFinance dan menandai baris belum ditetapkan", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        raw({
          account_number: "111",
          bank_name: "Bank BRI",
          total_amount: 400_000,
        }),
        raw({
          account_number: null,
          bank_name: null,
          account_holder: null,
          total_amount: 250_000,
          transaction_count: 2,
          is_unassigned: true,
        }),
      ],
      error: null,
    });

    const res = await getEventFinanceSummaryByBankAction();

    expect(mockRpc).toHaveBeenCalledWith("get_event_finance_summary_by_bank");
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data).toHaveLength(2);
    expect(res.data[0]).toMatchObject({
      bank_name: "Bank BRI",
      account_number: "111",
      account_holder: "Zaky",
      total_amount: 400_000,
      transaction_count: 4,
      is_unassigned: false,
    });
    // Baris belum ditetapkan: tanpa rekening, ditandai, dan diletakkan terakhir.
    const last = res.data[res.data.length - 1];
    expect(last.is_unassigned).toBe(true);
    expect(last.account_number).toBe("");
    expect(last.total_amount).toBe(250_000);
  });

  it("mengurutkan rekening abjad dan menaruh baris belum ditetapkan di akhir", async () => {
    mockRpc.mockResolvedValueOnce({
      data: [
        raw({ bank_name: "Mandiri", account_number: "222" }),
        raw({
          account_number: null,
          bank_name: null,
          account_holder: null,
          is_unassigned: true,
          total_amount: 50_000,
        }),
        raw({ bank_name: "Bank BRI", account_number: "111" }),
      ],
      error: null,
    });

    const res = await getEventFinanceSummaryByBankAction();
    expect(res.success).toBe(true);
    if (!res.success) return;

    expect(res.data.map((r) => r.bank_name)).toEqual([
      "Bank BRI",
      "Mandiri",
      "",
    ]);
    expect(res.data[res.data.length - 1].is_unassigned).toBe(true);
  });

  it("mengembalikan array kosong bila tidak ada pendapatan", async () => {
    mockRpc.mockResolvedValueOnce({ data: [], error: null });

    const res = await getEventFinanceSummaryByBankAction();
    expect(res.success).toBe(true);
    if (!res.success) return;
    expect(res.data).toEqual([]);
  });

  it("mengembalikan error yang aman bila RPC gagal", async () => {
    mockRpc.mockResolvedValueOnce({
      data: null,
      error: { message: "boom" },
    });

    const res = await getEventFinanceSummaryByBankAction();
    expect(res.success).toBe(false);
    if (res.success) return;
    expect(res.error).toContain("ringkasan keuangan");
  });
});
