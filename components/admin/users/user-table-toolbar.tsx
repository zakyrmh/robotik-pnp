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
import { Search, RotateCcw, UserCheck, Shield, Archive } from "lucide-react";

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
    <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between p-4 bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 rounded-t-xl">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
        <Input
          placeholder="Cari Nama, NIM, atau Email..."
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          className="pl-9 h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-sm focus-visible:ring-blue-500"
        />
        {searchValue && (
          <button
            onClick={() => {
              setSearchValue("");
              onSearchChange("");
            }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Filter Options & Action Buttons */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Role Filter Dropdown */}
        <Select
          value={role || "all"}
          onValueChange={(val) => onRoleChange(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-[160px] h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-xs">
            <Shield className="w-3.5 h-3.5 mr-1.5 text-neutral-500 shrink-0" />
            <SelectValue placeholder="Semua Role" />
          </SelectTrigger>
          <SelectContent>
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
          <SelectTrigger className="w-[150px] h-10 rounded-xl bg-neutral-50 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-xs">
            <Archive className="w-3.5 h-3.5 mr-1.5 text-neutral-500 shrink-0" />
            <SelectValue placeholder="Status Akun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="active">Aktif</SelectItem>
            <SelectItem value="archived">Diarsip (Soft Delete)</SelectItem>
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
            className="h-10 px-3 rounded-xl text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </Button>
        )}

        {/* Total Badge */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-xs text-neutral-600 dark:text-neutral-400 font-medium ml-auto">
          <UserCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
          <span>
            Total: <strong>{totalCount}</strong> Pengguna
          </span>
        </div>
      </div>
    </div>
  );
}
