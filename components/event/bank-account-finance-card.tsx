"use client";

import { Building2, TrendingUp, AlertCircle } from "lucide-react";
import type { BankAccountFinance } from "@/lib/actions/event-finance";
import { financePercentage, UNASSIGNED_BANK_LABEL } from "@/lib/event-finance";

interface BankAccountFinanceCardProps {
  bankFinances: BankAccountFinance[];
  totalIncome: number;
}

export function BankAccountFinanceCard({
  bankFinances,
  totalIncome,
}: BankAccountFinanceCardProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <TrendingUp
          className="size-5 text-primary shrink-0"
          aria-hidden="true"
        />
        <h2 className="font-display text-md font-semibold tracking-tight text-foreground">
          Ringkasan Keuangan Per Rekening
        </h2>
      </div>

      {bankFinances.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Belum ada data pendapatan dari rekening bank.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {bankFinances.map((finance) => {
            const percentage = financePercentage(
              finance.total_amount,
              totalIncome,
            );
            const isUnassigned = finance.is_unassigned;

            return (
              <div
                key={isUnassigned ? "unassigned" : finance.account_number}
                className={
                  isUnassigned
                    ? "rounded-lg border border-warning/30 bg-warning-soft/40 p-4 space-y-3 shadow-xs"
                    : "rounded-lg border border-border bg-card p-4 space-y-3 shadow-xs"
                }
              >
                {/* Header: Bank Name & Icon */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 flex-1">
                    {isUnassigned ? (
                      <AlertCircle
                        className="size-5 text-warning shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    ) : (
                      <Building2
                        className="size-5 text-primary shrink-0 mt-0.5"
                        aria-hidden="true"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display text-sm font-semibold text-foreground block truncate">
                        {isUnassigned
                          ? UNASSIGNED_BANK_LABEL
                          : finance.bank_name}
                      </h3>
                      {!isUnassigned && (
                        <p className="font-mono text-micro text-muted-foreground truncate">
                          a.n. {finance.account_holder}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Nomor rekening tidak relevan untuk baris tanpa rekening. */}
                {!isUnassigned && (
                  <div className="space-y-1 border-t border-border pt-3">
                    <p className="text-micro font-mono text-muted-foreground">
                      Rekening
                    </p>
                    <p className="font-mono text-sm font-semibold text-foreground break-all">
                      {finance.account_number}
                    </p>
                  </div>
                )}

                {/* Total Amount */}
                <div className="space-y-1 border-t border-border pt-3">
                  <p className="text-micro font-mono text-muted-foreground">
                    Total Pendapatan
                  </p>
                  <p className="font-mono text-lg font-bold text-success">
                    Rp{finance.total_amount.toLocaleString("id-ID")}
                  </p>
                </div>

                {/* Progress & Stats */}
                <div className="space-y-2 border-t border-border pt-3">
                  <div className="flex justify-between text-micro">
                    <span className="text-muted-foreground">
                      {finance.transaction_count} transaksi
                    </span>
                    <span className="font-mono font-semibold text-foreground">
                      {percentage}%
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div
                      className={
                        isUnassigned
                          ? "h-full bg-warning transition-all duration-300"
                          : "h-full bg-primary transition-all duration-300"
                      }
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
