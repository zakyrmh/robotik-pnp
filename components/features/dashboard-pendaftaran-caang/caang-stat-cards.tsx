"use client";

import { motion } from "framer-motion";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Task01Icon,
} from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/card";
import { CaangDashboardStats } from "@/lib/actions/caang-stats";

interface StatCardsProps {
  summary: CaangDashboardStats["summary"];
}

export function CaangStatCards({ summary }: StatCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Caang */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-primary min-h-[92px]">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
              TOTAL CAANG TERDAFTAR
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-foreground mt-1 block leading-none">
              {summary.totalCaang}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              Calon Anggota Aktif
            </span>
          </div>
          <div className="p-3 bg-primary-soft text-primary rounded-xl shrink-0 flex items-center justify-center">
            <HugeiconsIcon icon={UserGroupIcon} size={24} />
          </div>
        </Card>
      </motion.div>

      {/* 2. Verified Count */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-emerald-500 min-h-[92px]">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
              VERIFIED / LOLOS
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-1 block leading-none">
              {summary.verifiedCount}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              {summary.completionRate}% Completion Rate
            </span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl shrink-0 flex items-center justify-center">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={24} />
          </div>
        </Card>
      </motion.div>

      {/* 3. Average Registration Time */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-accent min-h-[92px]">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
              RATA-RATA DURASI SUBMIT
            </span>
            <span className="font-display text-xl sm:text-2xl font-bold text-accent-deep mt-1 block leading-none truncate">
              {summary.avgDurationDisplay}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              Dari Buat Akun &rarr; Submit
            </span>
          </div>
          <div className="p-3 bg-accent-soft text-accent-deep rounded-xl shrink-0 flex items-center justify-center">
            <HugeiconsIcon icon={Clock01Icon} size={24} />
          </div>
        </Card>
      </motion.div>

      {/* 4. Pending & Process Approvals */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <Card className="bg-card border border-border rounded-2xl shadow-xs p-4 flex flex-row items-center justify-between border-l-4 border-l-amber-500 min-h-[92px]">
          <div className="flex flex-col justify-center min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground block truncate">
              PENDING &amp; DRAF
            </span>
            <span className="font-display text-2xl sm:text-3xl font-bold text-amber-600 dark:text-amber-400 mt-1 block leading-none">
              {summary.pendingCount + summary.processCount}
            </span>
            <span className="text-[10px] text-muted-foreground mt-1 font-mono">
              {summary.pendingCount} Pending, {summary.processCount} Draf
            </span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 flex items-center justify-center">
            <HugeiconsIcon icon={Task01Icon} size={24} />
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
