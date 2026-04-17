"use client";

/**
 * PelanggarManager — Kelola daftar pelanggar piket & generate denda.
 *
 * Fitur:
 * - Generate denda otomatis per bulan
 * - Filter status denda & bulan
 * - Tabel pelanggar dengan badge status
 */

import { useState, useTransition } from "react";
import {
  Loader2,
  Filter,
  Zap,
  CalendarDays,
  Banknote,
  CheckCircle2,
  Clock,
  Ban,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
  generateFinesForMonth,
  getPiketFines,
} from "@/app/actions/kestari.action";
import type {
  PiketPeriod,
  PiketFineWithUser,
  PiketFineStatus,
} from "@/lib/db/schema/kestari";
import { PIKET_FINE_STATUS_LABELS } from "@/lib/db/schema/kestari";

// ═══════════════════════════════════════════════

interface Props {
  period: PiketPeriod;
  initialFines: PiketFineWithUser[];
}

const STATUS_COLORS: Record<PiketFineStatus, string> = {
  unpaid: "bg-red-500/15 text-red-600 border-red-500/25",
  pending_verification: "bg-amber-500/15 text-amber-600 border-amber-500/25",
  paid: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  waived: "bg-zinc-500/15 text-zinc-500 border-zinc-500/25",
};

const STATUS_ICONS: Record<
  PiketFineStatus,
  React.ComponentType<{ className?: string }>
> = {
  unpaid: Banknote,
  pending_verification: Clock,
  paid: CheckCircle2,
  waived: Ban,
};

export function PelanggarManager({ period, initialFines }: Props) {
  const [isPending, startTransition] = useTransition();
  const [fines, setFines] = useState(initialFines);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterMonth, setFilterMonth] = useState("");
  const [generateMonth, setGenerateMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    msg: string;
  } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  const reload = () => {
    startTransition(async () => {
      const filters: { status?: PiketFineStatus; monthYear?: string } = {};
      if (filterStatus !== "all")
        filters.status = filterStatus as PiketFineStatus;
      if (filterMonth && filterMonth !== "all") filters.monthYear = filterMonth;
      const result = await getPiketFines(period.id, filters);
      setFines(result.data ?? []);
    });
  };

  const handleGenerate = () => {
    startTransition(async () => {
      const result = await generateFinesForMonth({ periodId: period.id, monthYear: generateMonth });
      if (result.error) {
        showFeedback("error", result.error);
      } else {
        showFeedback(
          "success",
          `${result.data?.created} denda baru dibuat, ${result.data?.skipped} sudah piket/terkena denda.`,
        );
        reload();
      }
    });
  };

  const handleFilter = () => reload();

  // Bulan options
  const monthOptions: string[] = [];
  const now = new Date();
  for (let i = -6; i <= 1; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
    monthOptions.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    );
  }

  // Stats
  const totalUnpaid = fines.filter((f) => f.status === "unpaid").length;
  const totalAmount = fines
    .filter((f) => f.status === "unpaid")
    .reduce((s, f) => s + f.amount, 0);

  return (
    <div className="space-y-4">
      {/* Generate denda */}
      <div className="rounded-xl border bg-card p-4 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <Zap className="size-4 text-orange-500" />
          <Label className="text-sm font-semibold">
            Generate Denda Otomatis
          </Label>
        </div>
        <p className="text-xs text-muted-foreground">
          Buat denda untuk anggota yang belum piket di bulan tertentu. Anggota
          yang sudah approve piketnya tidak akan terkena denda.
        </p>
        <div className="flex flex-wrap items-end gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Bulan</Label>
            <Select value={generateMonth} onValueChange={setGenerateMonth}>
              <SelectTrigger className="w-[150px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {monthOptions.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="cursor-pointer bg-orange-600 hover:bg-orange-700">
                <Zap className="size-4" /> Generate Denda
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Generate Denda untuk {generateMonth}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Denda Rp {period.fine_amount.toLocaleString("id-ID")} akan
                  dibuat untuk anggota yang belum submit atau piketnya ditolak
                  di bulan {generateMonth}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <Button
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="cursor-pointer bg-orange-600 hover:bg-orange-700"
                >
                  {isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Zap className="size-4" />
                  )}
                  Generate
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Stats */}
      {totalUnpaid > 0 && (
        <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 px-4 py-3 text-sm text-orange-700 dark:text-orange-400">
          <strong>{totalUnpaid}</strong> pelanggar belum bayar &middot; Total:{" "}
          <strong>Rp {totalAmount.toLocaleString("id-ID")}</strong>
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <Filter className="size-3" /> Status
          </Label>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="unpaid">Belum Bayar</SelectItem>
              <SelectItem value="pending_verification">
                Menunggu Verifikasi
              </SelectItem>
              <SelectItem value="paid">Lunas</SelectItem>
              <SelectItem value="waived">Dibebaskan</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground flex items-center gap-1">
            <CalendarDays className="size-3" /> Bulan
          </Label>
          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Semua" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua</SelectItem>
              {monthOptions.map((m) => (
                <SelectItem key={m} value={m}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          size="sm"
          onClick={handleFilter}
          disabled={isPending}
          className="cursor-pointer"
        >
          {isPending ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            <Filter className="size-3" />
          )}
          Filter
        </Button>
      </div>

      {/* Tabel */}
      {fines.length === 0 ? (
        <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <CheckCircle2 className="size-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-sm font-medium">Tidak ada pelanggar</p>
          <p className="text-xs text-muted-foreground">
            Semua anggota sudah melaksanakan piket 🎉
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="px-4 py-2.5 text-left font-medium text-xs">
                  Anggota
                </th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">
                  Bulan
                </th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">
                  Denda
                </th>
                <th className="px-3 py-2.5 text-center font-medium text-xs">
                  Status
                </th>
                <th className="px-3 py-2.5 text-left font-medium text-xs">
                  Alasan
                </th>
              </tr>
            </thead>
            <tbody>
              {fines.map((f) => {
                const StatusIcon = STATUS_ICONS[f.status];
                return (
                  <tr
                    key={f.id}
                    className="border-b last:border-0 hover:bg-accent/30 transition-colors"
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="size-7 rounded-full bg-accent flex items-center justify-center text-[10px] font-bold shrink-0">
                          {(f.full_name || "?").charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium truncate max-w-[160px]">
                          {f.full_name}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-muted-foreground">
                      {f.month_year}
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs font-medium">
                      Rp {f.amount.toLocaleString("id-ID")}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <Badge
                        variant="outline"
                        className={`text-[10px] gap-1 ${STATUS_COLORS[f.status]}`}
                      >
                        <StatusIcon className="size-3" />
                        {PIKET_FINE_STATUS_LABELS[f.status]}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted-foreground truncate max-w-[200px]">
                      {f.reason}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Feedback */}
      {feedback && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 ${
            feedback.type === "error"
              ? "border-destructive/30 bg-destructive/10 text-destructive"
              : "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          }`}
        >
          {feedback.msg}
        </div>
      )}
    </div>
  );
}

export function PelanggarSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-28 rounded-xl" />
      <div className="flex gap-3">
        <Skeleton className="h-9 w-[180px] rounded-md" />
        <Skeleton className="h-9 w-[150px] rounded-md" />
        <Skeleton className="h-8 w-16 rounded-md" />
      </div>
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
