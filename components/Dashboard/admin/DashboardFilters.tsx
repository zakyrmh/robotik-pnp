"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarIcon, X } from "lucide-react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";

export interface DashboardFilters {
  dateRange?: DateRange;
  orPeriod?: string;
  status?: string;
}

interface DashboardFiltersProps {
  filters: DashboardFilters;
  onFiltersChange: (filters: DashboardFilters) => void;
}

export default function DashboardFiltersComponent({
  filters,
  onFiltersChange,
}: DashboardFiltersProps) {
  const [date, setDate] = useState<DateRange | undefined>(filters.dateRange);

  const handleDateChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    onFiltersChange({ ...filters, dateRange: newDate });
  };

  const handleOrPeriodChange = (value: string) => {
    onFiltersChange({
      ...filters,
      orPeriod: value === "all" ? undefined : value,
    });
  };

  const handleStatusChange = (value: string) => {
    onFiltersChange({
      ...filters,
      status: value === "all" ? undefined : value,
    });
  };

  const clearFilters = () => {
    setDate(undefined);
    onFiltersChange({});
  };

  const hasActiveFilters = filters.dateRange || filters.orPeriod || filters.status;

  return (
    <div className="flex flex-wrap gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Date Range Filter */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className="w-[280px] justify-start text-left font-normal"
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd MMM yyyy")} -{" "}
                  {format(date.to, "dd MMM yyyy")}
                </>
              ) : (
                format(date.from, "dd MMM yyyy")
              )
            ) : (
              <span>Pilih tanggal</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleDateChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>

      {/* OR Period Filter */}
      <Select
        value={filters.orPeriod || "all"}
        onValueChange={handleOrPeriodChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih OR Period" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua OR Period</SelectItem>
          <SelectItem value="OR 21">OR 21</SelectItem>
          <SelectItem value="OR 22">OR 22</SelectItem>
          <SelectItem value="OR 23">OR 23</SelectItem>
          <SelectItem value="OR 24">OR 24</SelectItem>
          <SelectItem value="OR 25">OR 25</SelectItem>
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={filters.status || "all"}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Pilih Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Status</SelectItem>
          <SelectItem value="verified">Verified</SelectItem>
          <SelectItem value="rejected">Rejected</SelectItem>
          <SelectItem value="payment_pending">Payment Pending</SelectItem>
          <SelectItem value="documents_uploaded">Documents Uploaded</SelectItem>
          <SelectItem value="form_submitted">Form Submitted</SelectItem>
          <SelectItem value="draft">Draft</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={clearFilters}
          className="gap-2"
        >
          <X className="h-4 w-4" />
          Clear Filters
        </Button>
      )}
    </div>
  );
}
