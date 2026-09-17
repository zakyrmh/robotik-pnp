"use client";

import { useState, useTransition } from "react";
import { CaangDashboardStats, CaangStatsFilter, getCaangDashboardStats } from "@/lib/actions/caang-stats";
import { CaangStatCards } from "./caang-stat-cards";
import { CaangDashboardFilter } from "./caang-dashboard-filter";
import { CaangChartsView } from "./caang-charts-view";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowRight01Icon, UserGroupIcon } from "@hugeicons/core-free-icons";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface CaangDashboardClientProps {
  initialStats: CaangDashboardStats;
}

export function CaangDashboardClient({ initialStats }: CaangDashboardClientProps) {
  const [stats, setStats] = useState<CaangDashboardStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  const [filter, setFilter] = useState<CaangStatsFilter>({
    startDate: "",
    endDate: "",
    status: "all",
  });

  const fetchStats = (newFilter: CaangStatsFilter) => {
    startTransition(async () => {
      const res = await getCaangDashboardStats(newFilter);
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        toast.error(res.error || "Gagal memuat data statistik terbaru.");
      }
    });
  };

  const handleFilterChange = (newFilters: { startDate: string; endDate: string; status: string }) => {
    setFilter(newFilters);
    fetchStats(newFilters);
  };

  const handleRefresh = () => {
    fetchStats(filter);
  };

  return (
    <div className="space-y-6 w-full max-w-6xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border border-border p-4 sm:p-6 rounded-2xl shadow-xs">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground block">
            STATISTIK REKRUTMEN CAANG
          </span>
          <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-foreground font-display mt-0.5">
            Dashboard Pendaftaran Caang
          </h1>
          <p className="text-xs text-muted-foreground mt-1 font-mono">
            Analisis interaktif statistik calon anggota UKM Robotik PNP.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          asChild
          className="text-xs font-mono border-border min-h-[40px] px-3.5 rounded-xl shrink-0"
        >
          <Link href="/manajemen-caang" className="flex items-center gap-1.5">
            <HugeiconsIcon icon={UserGroupIcon} size={16} />
            <span>Tabel Data Caang</span>
            <HugeiconsIcon icon={ArrowRight01Icon} size={14} />
          </Link>
        </Button>
      </div>

      {/* Filter Section */}
      <CaangDashboardFilter
        startDate={filter.startDate || ""}
        endDate={filter.endDate || ""}
        status={filter.status || "all"}
        onFilterChange={handleFilterChange}
        onRefresh={handleRefresh}
        loading={isPending}
      />

      {/* KPI Cards */}
      <CaangStatCards summary={stats.summary} />

      {/* Visual Charts */}
      <CaangChartsView stats={stats} />
    </div>
  );
}
