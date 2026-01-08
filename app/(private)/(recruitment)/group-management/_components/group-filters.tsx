"use client";

import { Search, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GroupFilters } from "@/lib/firebase/services/group-service";

export interface FilterState extends GroupFilters {
  query: string;
}

interface GroupFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  orPeriods: string[];
  className?: string;
}

export function GroupFilterBar({
  filters,
  onFilterChange,
  orPeriods,
  className,
}: GroupFilterBarProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, query: e.target.value });
  };

  const handlePeriodChange = (value: string) => {
    onFilterChange({
      ...filters,
      orPeriod: value === "all" ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      isActive: value === "all" ? "all" : value === "active",
    });
  };

  const resetFilters = () => {
    onFilterChange({
      query: "",
      orPeriod: "all",
      isActive: "all",
    });
  };

  const hasActiveFilters =
    filters.query ||
    (filters.orPeriod && filters.orPeriod !== "all") ||
    (filters.isActive !== undefined && filters.isActive !== "all");

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center ${className}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari kelompok..."
          value={filters.query}
          onChange={handleQueryChange}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
        <Select
          value={filters.orPeriod || "all"}
          onValueChange={handlePeriodChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Periode" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua OR</SelectItem>
            {orPeriods.map((period) => (
              <SelectItem key={period} value={period}>
                {period}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={
            filters.isActive === "all"
              ? "all"
              : filters.isActive
              ? "active"
              : "inactive"
          }
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="inactive">Tidak Aktif</SelectItem>
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="icon"
            onClick={resetFilters}
            className="shrink-0"
            title="Reset Filter"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Reset</span>
          </Button>
        )}
      </div>
    </div>
  );
}
