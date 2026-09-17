"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  FilterIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface DashboardFilterProps {
  startDate: string;
  endDate: string;
  status: string;
  onFilterChange: (filters: { startDate: string; endDate: string; status: string }) => void;
  onRefresh: () => void;
  loading: boolean;
}

export function CaangDashboardFilter({
  startDate,
  endDate,
  status,
  onFilterChange,
  onRefresh,
  loading,
}: DashboardFilterProps) {
  const [localStart, setLocalStart] = useState(startDate);
  const [localEnd, setLocalEnd] = useState(endDate);
  const [localStatus, setLocalStatus] = useState(status);

  const handleApplyFilter = () => {
    onFilterChange({
      startDate: localStart,
      endDate: localEnd,
      status: localStatus,
    });
  };

  const handleReset = () => {
    setLocalStart("");
    setLocalEnd("");
    setLocalStatus("all");
    onFilterChange({
      startDate: "",
      endDate: "",
      status: "all",
    });
  };

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-xs space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HugeiconsIcon icon={FilterIcon} size={18} className="text-primary" />
          <h2 className="text-xs font-display font-semibold text-foreground uppercase tracking-wider">
            Filter Data Pendaftaran
          </h2>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={loading}
          className="h-8 text-xs font-mono text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={RefreshIcon} size={14} className={loading ? "animate-spin" : ""} />
          <span>Muat Ulang</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
        {/* Status Filter */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-muted-foreground block">
            Status Pendaftaran
          </label>
          <Select
            value={localStatus}
            onValueChange={(val) => setLocalStatus(val)}
          >
            <SelectTrigger className="h-9 text-xs font-mono bg-background">
              <SelectValue placeholder="Pilih status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="verified">Verified (Lolos)</SelectItem>
              <SelectItem value="pending">Pending (Review)</SelectItem>
              <SelectItem value="process">Draf (Process)</SelectItem>
              <SelectItem value="revision">Perlu Perbaikan</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Start Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-muted-foreground block">
            Dari Tanggal
          </label>
          <div className="relative">
            <Input
              type="date"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              className="h-9 text-xs font-mono bg-background pr-8"
            />
          </div>
        </div>

        {/* End Date */}
        <div className="space-y-1">
          <label className="text-[11px] font-mono text-muted-foreground block">
            Sampai Tanggal
          </label>
          <Input
            type="date"
            value={localEnd}
            onChange={(e) => setLocalEnd(e.target.value)}
            className="h-9 text-xs font-mono bg-background"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            onClick={handleApplyFilter}
            disabled={loading}
            size="sm"
            className="flex-1 h-9 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-mono rounded-lg"
          >
            Terapkan
          </Button>

          {(localStart || localEnd || localStatus !== "all") && (
            <Button
              onClick={handleReset}
              variant="outline"
              size="sm"
              disabled={loading}
              className="h-9 text-xs font-mono rounded-lg border-border"
            >
              Reset
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
