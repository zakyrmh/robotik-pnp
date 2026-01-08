"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SubGroupFilterState {
  query: string;
}

interface SubGroupFilterBarProps {
  filters: SubGroupFilterState;
  onFilterChange: (filters: SubGroupFilterState) => void;
  className?: string;
}

export function SubGroupFilterBar({
  filters,
  onFilterChange,
  className,
}: SubGroupFilterBarProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, query: e.target.value });
  };

  const resetFilters = () => {
    onFilterChange({
      query: "",
    });
  };

  const hasActiveFilters = filters.query;

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center ${className}`}
    >
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari sub-kelompok atau anggota..."
          value={filters.query}
          onChange={handleQueryChange}
          className="pl-9"
        />
      </div>

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
  );
}
