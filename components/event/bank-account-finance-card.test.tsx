import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { BankAccountFinanceCard } from "./bank-account-finance-card";
import type { BankAccountFinance } from "@/lib/actions/event-finance";
import { UNASSIGNED_BANK_LABEL } from "@/lib/event-finance";

function row(over: Partial<BankAccountFinance>): BankAccountFinance {
  return {
    bank_name: "Bank BRI",
    account_number: "1234567890",
    account_holder: "Zaky",
    total_amount: 0,
    transaction_count: 0,
    is_unassigned: false,
    ...over,
  };
}

describe("BankAccountFinanceCard — tampilan data", () => {
  it("menampilkan rekening nyata dengan format Rp dan persentase yang benar", () => {
    const totalIncome = 1_000_000;
    const finances: BankAccountFinance[] = [
      row({
        bank_name: "Bank BRI",
        account_number: "1234567890",
        account_holder: "Zaky",
        total_amount: 400_000,
        transaction_count: 2,
      }),
      row({
        bank_name: "Belum ditetapkan rekening",
        account_number: "",
        account_holder: "",
        total_amount: 250_000,
        transaction_count: 1,
        is_unassigned: true,
      }),
    ];

    render(
      <BankAccountFinanceCard
        bankFinances={finances}
        totalIncome={totalIncome}
      />,
    );

    // Rekening nyata
    expect(screen.getByText("Bank BRI")).toBeInTheDocument();
    expect(screen.getByText("a.n. Zaky")).toBeInTheDocument();
    expect(screen.getByText("1234567890")).toBeInTheDocument();
    expect(screen.getByText("Rp400.000")).toBeInTheDocument();
    expect(screen.getByText("2 transaksi")).toBeInTheDocument();
    expect(screen.getByText("40%")).toBeInTheDocument();

    // Baris agregat belum ditetapkan: label jelas, tanpa nomor rekening.
    expect(screen.getByText(UNASSIGNED_BANK_LABEL)).toBeInTheDocument();
    expect(screen.getByText("Rp250.000")).toBeInTheDocument();
    expect(screen.getByText("25%")).toBeInTheDocument();
  });

  it("menampilkan empty state ketika belum ada data keuangan", () => {
    render(<BankAccountFinanceCard bankFinances={[]} totalIncome={0} />);
    expect(
      screen.getByText(/Belum ada data pendapatan dari rekening bank/i),
    ).toBeInTheDocument();
  });

  it("tidak menampilkan NaN saat total pendapatan 0", () => {
    render(
      <BankAccountFinanceCard
        bankFinances={[
          row({ total_amount: 0, transaction_count: 0, is_unassigned: true }),
        ]}
        totalIncome={0}
      />,
    );
    expect(screen.queryByText(/NaN/)).not.toBeInTheDocument();
    expect(screen.getByText("0%")).toBeInTheDocument();
  });
});
