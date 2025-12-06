"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Download, CreditCard } from "lucide-react";

interface FilterToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  selectedDepartment: string;
  setSelectedDepartment: (val: string) => void;
  adminStatusFilter: string;
  setAdminStatusFilter: (val: string) => void;
  departments: string[];
  handleExportCSV: () => void;
  // Props untuk Bulk Actions
  selectedCount: number;
  onBulkVerify?: () => void; // Optional: jika nanti diimplementasi
  onBulkBlacklist?: () => void; // Optional: jika nanti diimplementasi
}

export default function FilterToolbar({
  searchQuery,
  setSearchQuery,
  selectedDepartment,
  setSelectedDepartment,
  adminStatusFilter,
  setAdminStatusFilter,
  departments,
  handleExportCSV,
  selectedCount,
  onBulkVerify,
  onBulkBlacklist,
}: FilterToolbarProps) {
  return (
    <Card>
      <CardContent className="p-4 space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          {/* Search */}
          <div className="relative w-full md:w-1/3">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari Nama atau NIM..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <Select
              value={selectedDepartment}
              onValueChange={setSelectedDepartment}
            >
              <SelectTrigger className="w-[180px]">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Semua Prodi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Prodi</SelectItem>
                {departments.map((dept) => (
                  <SelectItem key={dept} value={dept}>
                    {dept}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={adminStatusFilter}
              onValueChange={setAdminStatusFilter}
            >
              <SelectTrigger className="w-[180px]">
                <CreditCard className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status Bayar" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                <SelectItem value="verified">Lunas / Terverifikasi</SelectItem>
                <SelectItem value="not_uploaded">Belum Upload</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {/* Bulk Action Indicator */}
        {selectedCount > 0 && (
          <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm animate-in fade-in">
            <span className="font-semibold">{selectedCount} orang terpilih.</span>
            <Button size="sm" variant="secondary" onClick={onBulkVerify}>
              Verifikasi Massal
            </Button>
            <Button size="sm" variant="destructive" onClick={onBulkBlacklist}>
              Blacklist Massal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}