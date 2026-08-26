"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  ArrowLeftDoubleIcon,
  ArrowRightDoubleIcon,
} from "@hugeicons/core-free-icons";

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
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-5 bg-surface/30 dark:bg-card border-t border-border text-xs text-muted-foreground">
      {/* Information text */}
      <div className="flex items-center gap-1.5 text-center sm:text-left">
        <span>
          Menampilkan{" "}
          <strong className="text-foreground font-semibold">{from}</strong> –{" "}
          <strong className="text-foreground font-semibold">{to}</strong> dari{" "}
          <strong className="text-foreground font-semibold">
            {totalCount}
          </strong>{" "}
          pengguna
        </span>
      </div>

      {/* Pagination controls & Per Page selector */}
      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Per page selector */}
        <div className="flex items-center gap-1.5">
          <span>Baris:</span>
          <Select
            value={String(perPage)}
            onValueChange={(val) => onPerPageChange(Number(val))}
          >
            <SelectTrigger className="w-[75px] min-h-[38px] text-xs rounded-lg bg-background border-border">
              <SelectValue placeholder="10" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
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
            className="w-9 h-9 rounded-lg border-border bg-background hover:bg-muted"
            title="Halaman Pertama"
            aria-label="Halaman Pertama"
          >
            <HugeiconsIcon icon={ArrowLeftDoubleIcon} size={15} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="w-9 h-9 rounded-lg border-border bg-background hover:bg-muted"
            title="Halaman Sebelumnya"
            aria-label="Halaman Sebelumnya"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={15} />
          </Button>

          <span className="px-2.5 font-medium text-foreground whitespace-nowrap">
            {page} / {totalPages || 1}
          </span>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages || totalPages === 0}
            className="w-9 h-9 rounded-lg border-border bg-background hover:bg-muted"
            title="Halaman Selanjutnya"
            aria-label="Halaman Selanjutnya"
          >
            <HugeiconsIcon icon={ArrowRight01Icon} size={15} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={page >= totalPages || totalPages === 0}
            className="w-9 h-9 rounded-lg border-border bg-background hover:bg-muted"
            title="Halaman Terakhir"
            aria-label="Halaman Terakhir"
          >
            <HugeiconsIcon icon={ArrowRightDoubleIcon} size={15} />
          </Button>
        </div>
      </div>
    </div>
  );
}
