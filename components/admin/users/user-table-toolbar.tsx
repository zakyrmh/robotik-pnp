"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
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
  Search01Icon,
  RotateLeft01Icon,
  SecurityCheckIcon,
  ArchiveIcon,
  UserCheck01Icon,
} from "@hugeicons/core-free-icons";

interface UserTableToolbarProps {
  search: string;
  role: string;
  status: string;
  onSearchChange: (value: string) => void;
  onRoleChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onReset: () => void;
  totalCount: number;
}

export function UserTableToolbar({
  search,
  role,
  status,
  onSearchChange,
  onRoleChange,
  onStatusChange,
  onReset,
  totalCount,
}: UserTableToolbarProps) {
  const [searchValue, setSearchValue] = useState(search);
  const [prevSearch, setPrevSearch] = useState(search);

  // Sync internal search input state when search prop changes from parent
  if (prevSearch !== search) {
    setPrevSearch(search);
    setSearchValue(search);
  }

  // Debounced search handler (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchValue !== search) {
        onSearchChange(searchValue);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchValue, search, onSearchChange]);

  const hasActiveFilters = Boolean(
    search || (role && role !== "all") || (status && status !== "all"),
  );

  return (
    <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between p-4 sm:p-5 bg-surface/30 dark:bg-card border-b border-border">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <HugeiconsIcon
          icon={Search01Icon}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
        />
        <Input
          placeholder="Cari Nama, NIM, atau Email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 min-h-[44px] rounded-lg border-border bg-background text-sm focus-visible:ring-2 focus-visible:ring-primary/20"
        />
        {searchValue && (
          <button
            type="button"
            onClick={() => {
              setSearchValue("");
              onSearchChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground hover:text-foreground p-1 rounded"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Filter Options & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Role Filter Dropdown */}
        <Select
          value={role || "all"}
          onValueChange={(val) => onRoleChange(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-full sm:w-[170px] min-h-[44px] rounded-lg border-border bg-background text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <HugeiconsIcon
                icon={SecurityCheckIcon}
                size={15}
                className="text-muted-foreground shrink-0"
              />
              <SelectValue placeholder="Semua Role" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value="super-admin">Super Admin</SelectItem>
            <SelectItem value="admin-or">Admin OR</SelectItem>
            <SelectItem value="admin-komdis">Admin Komdis</SelectItem>
            <SelectItem value="admin-kestari">Admin Kestari</SelectItem>
            <SelectItem value="admin-divisi">Admin Divisi</SelectItem>
            <SelectItem value="anggota">Anggota Aktif</SelectItem>
            <SelectItem value="caang">Calon Anggota</SelectItem>
            <SelectItem value="alumni">Alumni</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter Dropdown */}
        <Select
          value={status || "all"}
          onValueChange={(val) => onStatusChange(val)}
        >
          <SelectTrigger className="w-full sm:w-[160px] min-h-[44px] rounded-lg border-border bg-background text-xs">
            <div className="flex items-center gap-1.5 truncate">
              <HugeiconsIcon
                icon={ArchiveIcon}
                size={15}
                className="text-muted-foreground shrink-0"
              />
              <SelectValue placeholder="Status Akun" />
            </div>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="archived">Diarsip (Nonaktif)</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset Filter Button */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearchValue("");
              onReset();
            }}
            className="min-h-[44px] px-3.5 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted gap-1.5"
          >
            <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
            <span>Reset</span>
          </Button>
        )}

        {/* Total Badge */}
        <div className="hidden xl:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-muted/60 dark:bg-muted/30 text-xs text-muted-foreground font-medium ml-auto border border-border">
          <HugeiconsIcon
            icon={UserCheck01Icon}
            size={15}
            className="text-primary"
          />
          <span>
            Total:{" "}
            <strong className="text-foreground font-semibold">
              {totalCount}
            </strong>{" "}
            Pengguna
          </span>
        </div>
      </div>
    </div>
  );
}
