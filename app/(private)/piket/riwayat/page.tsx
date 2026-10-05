import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getPiketHistoryLogs,
  getPiketHistoryCompliance,
  filterPiketLogs,
  filterComplianceRows,
} from "@/lib/repositories/piket";
import { PiketHistoryClient } from "@/components/features/piket/piket-history-client";
import { Skeleton } from "@/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Riwayat Piket | UKM Robotik PNP",
  description:
    "Riwayat kepatuhan piket dan log laporan kebersihan laboratorium UKM Robotik PNP per periode, tahun, bulan, dan pekan",
};

/** Periode akademik default bila `piket_schedules` belum berisi data. */
const FALLBACK_PERIOD = "2026/2027";

interface PiketRiwayatSearchParams {
  period?: string;
  year?: string;
  month?: string;
  week?: string;
  tab?: string;
}

/** Baris ringan untuk derivasi `availablePeriods` dari `piket_schedules`. */
interface RawPeriodRow {
  academic_period: string | null;
}

/**
 * Parse string pencarian menjadi bilangan bulat valid; `undefined` bila
 * kosong, non-numerik, atau di luar `[min, max]`. Nilai yang tak valid
 * diperlakukan sebagai "tanpa filter" (bukan error).
 */
function parseBoundedInt(
  value: string | undefined,
  min: number,
  max: number,
): number | undefined {
  if (value == null || value.trim() === "") return undefined;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return undefined;
  if (parsed < min || parsed > max) return undefined;
  return parsed;
}

export default async function PiketRiwayatPage({
  searchParams,
}: {
  searchParams: Promise<PiketRiwayatSearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, role, is_onboarded")
    .eq("id", user.id)
    .single();

  if (!profile) {
    redirect("/login");
  }

  // RBAC guard: hanya super-admin & admin-kestari yang boleh mengakses
  // halaman riwayat. Guard dijalankan SEBELUM fetch data apa pun agar role
  // lain tidak pernah menyentuh data histori seluruh anggota.
  if (profile.role !== "super-admin" && profile.role !== "admin-kestari") {
    redirect("/piket");
  }

  // 1. Derive availablePeriods dari periode akademik distinct pada
  //    piket_schedules, fallback ke periode default bila kosong.
  const { data: periodRows, error: periodError } = await supabase
    .from("piket_schedules")
    .select("academic_period")
    .order("academic_period", { ascending: false });

  if (periodError) {
    console.error("[PIKET_RIWAYAT_ERROR] Periods query error:", periodError);
  }

  const periodSet = new Set<string>();
  for (const row of (periodRows ?? []) as RawPeriodRow[]) {
    if (row.academic_period) periodSet.add(row.academic_period);
  }
  if (periodSet.size === 0) periodSet.add(FALLBACK_PERIOD);
  const availablePeriods = Array.from(periodSet).sort().reverse();

  // 2. Tentukan periode aktif: dari searchParams bila valid, jika tidak
  //    default ke periode paling baru (indeks pertama).
  const requestedPeriod = sp.period?.trim();
  const period =
    requestedPeriod && availablePeriods.includes(requestedPeriod)
      ? requestedPeriod
      : availablePeriods[0];

  // 3. Parse filter tahun/bulan/pekan. `month` di URL 1–12 → monthIndex0.
  const year = parseBoundedInt(sp.year, 1970, 9999);
  const monthIndex0 = (() => {
    const month = parseBoundedInt(sp.month, 1, 12);
    return month == null ? undefined : month - 1;
  })();
  const weekNumber = parseBoundedInt(sp.week, 1, 4);

  const activeFilter: {
    academicPeriod: string;
    year: number | null;
    monthIndex0: number | null;
    weekNumber: number | null;
  } = {
    academicPeriod: period,
    year: year ?? null,
    monthIndex0: monthIndex0 ?? null,
    weekNumber: weekNumber ?? null,
  };

  // 4. Ambil data via repository (RPC SECURITY DEFINER). Kegagalan fetch
  //    ditangani lunak agar halaman tetap dapat dirender.
  let rawLogs = [] as Awaited<ReturnType<typeof getPiketHistoryLogs>>;
  let rawCompliance = [] as Awaited<
    ReturnType<typeof getPiketHistoryCompliance>
  >;
  try {
    rawLogs = await getPiketHistoryLogs(period);
  } catch (err: unknown) {
    console.error("[PIKET_RIWAYAT_ERROR] Logs fetch error:", err);
  }
  try {
    rawCompliance = await getPiketHistoryCompliance(period);
  } catch (err: unknown) {
    console.error("[PIKET_RIWAYAT_ERROR] Compliance fetch error:", err);
  }

  // 5. Terapkan filter tahun/bulan/pekan (murni), seragam untuk kedua sumber.
  const logs = filterPiketLogs(rawLogs, activeFilter);
  const compliance = filterComplianceRows(rawCompliance, activeFilter);

  const initialTab: "kepatuhan" | "log" =
    sp.tab === "log" ? "log" : "kepatuhan";

  return (
    <Suspense fallback={<HistorySkeleton />}>
      <PiketHistoryClient
        profile={{
          id: profile.id,
          email: profile.email,
          role: profile.role,
          is_onboarded: profile.is_onboarded,
        }}
        availablePeriods={availablePeriods}
        logs={logs}
        compliance={compliance}
        initialTab={initialTab}
        activeFilter={activeFilter}
      />
    </Suspense>
  );
}

function HistorySkeleton() {
  return (
    <div className="w-full max-w-6xl mx-auto space-y-6 px-2 sm:px-4 lg:px-6">
      <Skeleton className="h-24 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
    </div>
  );
}
