"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  FileCheck,
  User as UserIcon,
} from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage"; // Asumsi component ini ada
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { useState } from "react";

interface CaangTableProps {
  data: User[];
  registrations: Map<string, Registration>;
  selectedUserIds: Set<string>;
  handleSelectAll: (checked: boolean) => void;
  handleSelectUser: (userId: string, checked: boolean) => void;
  onOpenDetail: (user: User) => void;
  onVerifyRegistration: (regId: string) => void;
}

export default function CaangTable({
  data,
  registrations,
  selectedUserIds,
  handleSelectAll,
  handleSelectUser,
  onOpenDetail,
  onVerifyRegistration,
}: CaangTableProps) {
  // 1. State untuk konfigurasi sort
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  // 2. Handler saat header diklik
  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  // 3. Logika pengurutan data
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;

    const { key, direction } = sortConfig;

    // Ambil data registrasi untuk keperluan sorting status
    const regA = registrations.get(a.id);
    const regB = registrations.get(b.id);

    let valA: string | number | boolean = "";
    let valB: string | number | boolean = "";

    switch (key) {
      case "profile":
        valA = a.profile.fullName.toLowerCase();
        valB = b.profile.fullName.toLowerCase();
        break;
      case "department":
        valA = (a.profile.department || "").toLowerCase();
        valB = (b.profile.department || "").toLowerCase();
        break;
      case "contact":
        valA = a.profile.phone || "";
        valB = b.profile.phone || "";
        break;
      case "formDataStatus":
        // Prioritas: Verified (2) > Pending (1) > Not Submitted (0)
        const getFormDataScore = (r: Registration | undefined) => {
          if (r?.verification?.verified) return 2;
          if (r?.status && r.status !== "draft") return 1; // Sudah submit tapi belum verified
          return 0; // Draft
        };
        valA = getFormDataScore(regA);
        valB = getFormDataScore(regB);
        break;
      case "adminStatus":
        // Prioritas: Verified (3) > Pending (2) > Not Uploaded (1)
        const getScore = (r: Registration | undefined) => {
          if (r?.payment?.verified) return 3;
          if (r?.payment?.proofUrl) return 2;
          return 1;
        };
        valA = getScore(regA);
        valB = getScore(regB);
        break;
      case "selectionStatus":
        // Prioritas: Lolos (3) > Gugur (1) > Blacklist (0)
        if (a.blacklistInfo?.isBlacklisted) valA = 0;
        else if (a.isActive) valA = 3;
        else valA = 1;

        if (b.blacklistInfo?.isBlacklisted) valB = 0;
        else if (b.isActive) valB = 3;
        else valB = 1;
        break;
      default:
        return 0;
    }

    if (valA < valB) return direction === "asc" ? -1 : 1;
    if (valA > valB) return direction === "asc" ? 1 : -1;
    return 0;
  });

  // 4. Helper untuk render icon sort
  const SortIcon = ({ columnKey }: { columnKey: string }) => {
    if (sortConfig?.key !== columnKey)
      return <ArrowUpDown className="ml-2 h-4 w-4 text-muted-foreground" />;
    return sortConfig.direction === "asc" ? (
      <ArrowUp className="ml-2 h-4 w-4 text-primary" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4 text-primary" />
    );
  };

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">
              <Checkbox
                checked={
                  data.length > 0 && selectedUserIds.size === data.length
                }
                onCheckedChange={(c) => handleSelectAll(!!c)}
              />
            </TableHead>

            <TableHead>
              <Button
                variant="ghost"
                className="p-0 hover:bg-transparent font-bold"
                onClick={() => handleSort("profile")}
              >
                Profil Peserta <SortIcon columnKey="profile" />
              </Button>
            </TableHead>

            <TableHead>
              <Button
                variant="ghost"
                className="p-0 hover:bg-transparent font-bold"
                onClick={() => handleSort("department")}
              >
                Prodi / Jurusan <SortIcon columnKey="department" />
              </Button>
            </TableHead>

            <TableHead>
              <Button
                variant="ghost"
                className="p-0 hover:bg-transparent font-bold"
                onClick={() => handleSort("contact")}
              >
                Kontak <SortIcon columnKey="contact" />
              </Button>
            </TableHead>

            <TableHead>
              <span className="font-bold">Status & Verifikasi</span>
            </TableHead>

            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                Tidak ada data yang cocok dengan filter.
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((user) => {
              const reg = registrations.get(user.id);
              const isSelected = selectedUserIds.has(user.id);

              return (
                <TableRow
                  key={user.id}
                  className={isSelected ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(c) => handleSelectUser(user.id, !!c)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
                        {user.profile.photoUrl ? (
                          <FirebaseImage
                            path={user.profile.photoUrl}
                            width={100}
                            height={100}
                            alt={user.profile.fullName}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {user.profile.fullName}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.profile.nim}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-sm">{user.profile.department}</span>
                      <span className="text-xs text-muted-foreground">
                        {user.profile.major}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {user.profile.phone ? (
                      <a
                        href={`https://wa.me/${user.profile.phone
                          .replace(/^0/, "62")
                          .replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        {user.profile.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* Combined Status Column with Verification Buttons */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1">
                          <p className="text-xs text-muted-foreground mb-1">
                            Status Pendaftaran
                          </p>
                          {(() => {
                            if (!reg)
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-gray-500"
                                >
                                  Belum Daftar
                                </Badge>
                              );
                            if (reg.status === "verified")
                              return (
                                <Badge className="bg-green-100 text-green-800 border-green-200">
                                  ✓ Terverifikasi
                                </Badge>
                              );
                            if (reg.status === "rejected")
                              return (
                                <Badge variant="destructive">Ditolak</Badge>
                              );
                            if (reg.status === "submitted")
                              return (
                                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                                  Menunggu Verifikasi
                                </Badge>
                              );
                            return (
                              <Badge variant="outline">{reg.status}</Badge>
                            );
                          })()}
                        </div>
                        {reg &&
                          (reg.status === "submitted" ||
                            reg.status === "form_verified" ||
                            reg.status === "documents_uploaded" ||
                            reg.status === "payment_pending") &&
                          // Note: We include partial statuses just in case legacy data exists,
                          // but ideally only 'submitted' or 'verified' or 'rejected'.
                          // The instruction says "Setelah submit... siap verifikasi".
                          // If status is SUBMITTED, show Verify Button.
                          (reg.status === "submitted" ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs text-blue-600 border-blue-300 hover:bg-blue-50"
                              onClick={() => onVerifyRegistration(reg.id)}
                            >
                              <FileCheck className="h-3 w-3 mr-1" />
                              Verifikasi
                            </Button>
                          ) : null)}
                      </div>

                      {/* 4. Status Seleksi (Info saja, tidak ada tombol verifikasi) */}
                      <div className="pt-1 border-t">
                        <p className="text-xs text-muted-foreground mb-1">
                          Status Akun
                        </p>
                        {user.blacklistInfo?.isBlacklisted ? (
                          <Badge variant="destructive">Blacklist</Badge>
                        ) : user.isActive ? (
                          <Badge
                            variant="secondary"
                            className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                          >
                            Active / Lolos
                          </Badge>
                        ) : (
                          <Badge variant="outline">Gugur</Badge>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenDetail(user)}
                      >
                        Detail
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
