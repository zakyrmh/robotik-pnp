"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface UserTablePaginationProps {
  page: number;
  perPage: number;
  totalCount: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onPerPageChange: (perPage: number) => void;
}

export function UserTablePagination({
  page,
  perPage,
  totalCount,
  totalPages,
  onPageChange,
  onPerPageChange,
}: UserTablePaginationProps) {
  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalCount);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-800 rounded-b-xl text-xs text-neutral-500">
      {/* Information text */}
      <div className="flex items-center gap-2">
        <span>
          Menampilkan{" "}
          <strong className="text-neutral-900 dark:text-neutral-100">
            {from}
          </strong>{" "}
          -{" "}
          <strong className="text-neutral-900 dark:text-neutral-100">
            {to}
          </strong>{" "}
          dari{" "}
          <strong className="text-neutral-900 dark:text-neutral-100">
            {totalCount}
          </strong>{" "}
          pengguna
        </span>
      </div>

      {/* Pagination controls & Per Page selector */}
      <div className="flex items-center gap-4">
        {/* Per page selector */}
        <div className="flex items-center gap-1.5">
          <span>Baris:</span>
          <Select
            value={String(perPage)}
            onValueChange={(val) => onPerPageChange(Number(val))}
          >
            <SelectTrigger className="w-[70px] h-8 text-xs rounded-lg bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Page navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg"
            title="Halaman Pertama"
          >
            <ChevronsLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-8 h-8 rounded-lg"
            title="Halaman Sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <span className="px-2 font-medium text-neutral-700 dark:text-neutral-300">
            Halaman {page} dari {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || totalPages === 0}
            className="w-8 h-8 rounded-lg"
            title="Halaman Selanjutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || totalPages === 0}
            className="w-8 h-8 rounded-lg"
            title="Halaman Terakhir"
          >
            <ChevronsRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
