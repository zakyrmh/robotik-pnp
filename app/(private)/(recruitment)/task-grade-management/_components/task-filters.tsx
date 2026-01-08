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
import { TaskType, TaskStatus } from "@/schemas/tasks";
import { TaskFilters } from "@/lib/firebase/services/task-service";

export interface FilterState extends TaskFilters {
  query: string;
}

interface TaskFilterBarProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  orPeriods: string[];
  className?: string;
}

export function TaskFilterBar({
  filters,
  onFilterChange,
  orPeriods,
  className,
}: TaskFilterBarProps) {
  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, query: e.target.value });
  };

  const handleTypeChange = (value: string) => {
    onFilterChange({
      ...filters,
      taskType: value === "all" ? "all" : (value as TaskType),
    });
  };

  const handleStatusChange = (value: string) => {
    onFilterChange({
      ...filters,
      status: value === "all" ? "all" : (value as TaskStatus),
    });
  };

  const handlePeriodChange = (value: string) => {
    onFilterChange({
      ...filters,
      orPeriod: value === "all" ? undefined : value,
    });
  };

  const resetFilters = () => {
    onFilterChange({
      query: "",
      taskType: "all",
      status: "all",
      orPeriod: "all",
    });
  };

  const hasActiveFilters =
    filters.query ||
    filters.taskType !== "all" ||
    filters.status !== "all" ||
    (filters.orPeriod && filters.orPeriod !== "all");

  return (
    <div
      className={`flex flex-col gap-4 md:flex-row md:items-center ${className}`}
    >
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Cari tugas..."
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
          value={filters.taskType || "all"}
          onValueChange={handleTypeChange}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Tipe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Tipe</SelectItem>
            <SelectItem value="individual">Individu</SelectItem>
            <SelectItem value="group">Kelompok</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={filters.status || "all"}
          onValueChange={handleStatusChange}
        >
          <SelectTrigger className="w-[130px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="published">Terbit</SelectItem>
            <SelectItem value="archived">Diarsipkan</SelectItem>
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
