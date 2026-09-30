"use server";

import { createAdminClient } from "@/lib/supabase/server";
import type { ActionResult, BankAccount } from "@/types/event-registration";

export interface BankAccountFinance extends BankAccount {
  total_amount: number;
  transaction_count: number;
}

/**
 * Mengagregasi total pendapatan per rekening bank berdasarkan registrasi yang sudah dibayar.
 *
 * Menggunakan SQL function `get_event_finance_summary_by_bank()` untuk aggregation
 * di database level, sehingga lebih efisien untuk Supabase Free Plan:
 * - ✅ Aggregation dilakukan di database (bukan di client)
 * - ✅ Hanya hasil aggregated yang ditransfer
 * - ✅ Hemat bandwidth & rate limit
 * - ✅ Lebih cepat untuk dataset besar
 */
export async function getEventFinanceSummaryByBankAction(): Promise<
  ActionResult<BankAccountFinance[]>
> {
  try {
    const adminSupabase = createAdminClient();

    // Call SQL function yang sudah melakukan aggregation di database
    const { data, error } = await (adminSupabase.rpc(
      "get_event_finance_summary_by_bank",
    ) as unknown as Promise<{
      data: Array<{
        account_number: string;
        bank_name: string;
        account_holder: string;
        total_amount: number;
        transaction_count: number;
      }> | null;
      error: unknown;
    }>);

    if (error) {
      console.error("RPC error:", error);
      return {
        success: false,
        error: "Gagal mengambil ringkasan keuangan per rekening.",
      };
    }

    // Transform hasil dari RPC ke format BankAccountFinance
    const result: BankAccountFinance[] = (data || []).map((item) => ({
      bank_name: item.bank_name || "Tidak diketahui",
      account_number: item.account_number,
      account_holder: item.account_holder || "Tidak diketahui",
      total_amount: item.total_amount || 0,
      transaction_count: item.transaction_count || 0,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("Error in getEventFinanceSummaryByBankAction:", error);
    return {
      success: false,
      error: "Terjadi kesalahan saat mengagregasi data keuangan.",
    };
  }
}
