"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserManagementItem } from "@/lib/types/user-management";
import { UserRoleBadge } from "./user-role-badge";
import {
  MoreHorizontal,
  Edit,
  Eye,
  UserX,
  RotateCcw,
  RefreshCw,
  Phone,
  GraduationCap,
  Archive,
  CheckCircle2,
} from "lucide-react";

interface UserTableProps {
  users: UserManagementItem[];
  currentUserId: string;
  onEdit: (user: UserManagementItem) => void;
  onDetail: (user: UserManagementItem) => void;
  onDelete: (user: UserManagementItem) => void;
  onRestore: (user: UserManagementItem) => void;
  onResetOnboarding: (user: UserManagementItem) => void;
}

export function UserTable({
  users,
  currentUserId,
  onEdit,
  onDetail,
  onDelete,
  onRestore,
  onResetOnboarding,
}: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-neutral-900 border-x border-neutral-200 dark:border-neutral-800">
        <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400 mb-3">
          <Archive className="w-6 h-6" />
        </div>
        <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
          Tidak ada pengguna ditemukan
        </h3>
        <p className="text-xs text-neutral-500 max-w-sm mt-1">
          Coba sesuaikan kata kunci pencarian atau filter role/status yang Anda
          gunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-neutral-900 border-x border-neutral-200 dark:border-neutral-800 overflow-hidden">
      <Table>
        <TableHeader className="bg-neutral-50 dark:bg-neutral-800/50">
          <TableRow>
            <TableHead className="w-[280px] text-xs font-semibold text-neutral-600 dark:text-neutral-400 pl-4">
              Pengguna &amp; Email
            </TableHead>
            <TableHead className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              NIM &amp; Program Studi
            </TableHead>
            <TableHead className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Peran (Role)
            </TableHead>
            <TableHead className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Kontak WA
            </TableHead>
            <TableHead className="text-xs font-semibold text-neutral-600 dark:text-neutral-400">
              Status Akun
            </TableHead>
            <TableHead className="w-[80px] text-right text-xs font-semibold text-neutral-600 dark:text-neutral-400 pr-4">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => {
            const isSelf = currentUserId === user.id;
            const isArchived = Boolean(user.deletedAt);
            const initials = user.fullName
              ? user.fullName
                  .split(" ")
                  .map((n) => n[0])
                  .slice(0, 2)
                  .join("")
                  .toUpperCase()
              : "U";

            return (
              <TableRow
                key={user.id}
                className={
                  isArchived ? "bg-red-50/40 dark:bg-red-950/10 opacity-75" : ""
                }
              >
                {/* User Info Column */}
                <TableCell className="pl-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border border-neutral-200 dark:border-neutral-700 shrink-0">
                      <AvatarImage
                        src={user.avatarUrl || ""}
                        alt={user.fullName || "User"}
                      />
                      <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                          {user.fullName || "Tanpa Nama"}
                        </span>
                        {isSelf && (
                          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded">
                            Anda
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-500 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* NIM & Study Program Column */}
                <TableCell className="py-3">
                  <div className="space-y-0.5">
                    <span className="font-medium text-xs text-neutral-800 dark:text-neutral-200">
                      {user.nim || "-"}
                    </span>
                    <p className="text-[11px] text-neutral-500 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3 shrink-0" />
                      <span className="truncate max-w-[160px]">
                        {user.studyProgramName || "Tidak ada"}
                      </span>
                    </p>
                  </div>
                </TableCell>

                {/* Role Badge Column */}
                <TableCell className="py-3">
                  <UserRoleBadge role={user.role} />
                </TableCell>

                {/* WhatsApp Contact Column */}
                <TableCell className="py-3">
                  {user.phoneNumber ? (
                    <a
                      href={`https://wa.me/${user.phoneNumber.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      <Phone className="w-3 h-3" />
                      <span>{user.phoneNumber}</span>
                    </a>
                  ) : (
                    <span className="text-neutral-400 text-xs">-</span>
                  )}
                </TableCell>

                {/* Account Status Column */}
                <TableCell className="py-3">
                  {isArchived ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300 border border-red-200 dark:border-red-800">
                      <Archive className="w-3 h-3" />
                      <span>Nonaktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Aktif</span>
                    </span>
                  )}
                </TableCell>

                {/* Actions Menu Dropdown */}
                <TableCell className="text-right pr-4 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg"
                      >
                        <MoreHorizontal className="w-4 h-4 text-neutral-500" />
                        <span className="sr-only">Buka Menu Aksi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 rounded-xl p-1 text-xs"
                    >
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase text-neutral-400 px-2 py-1">
                        Aksi Pengguna
                      </DropdownMenuLabel>

                      <DropdownMenuItem
                        onClick={() => onDetail(user)}
                        className="rounded-lg gap-2 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5 text-neutral-500" />
                        <span>Lihat Detail PII</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onEdit(user)}
                        className="rounded-lg gap-2 cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5 text-blue-500" />
                        <span>Edit Peran &amp; Data</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onResetOnboarding(user)}
                        className="rounded-lg gap-2 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-amber-500" />
                        <span>Reset Onboarding</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1" />

                      {isArchived ? (
                        <DropdownMenuItem
                          onClick={() => onRestore(user)}
                          className="rounded-lg gap-2 text-emerald-600 focus:text-emerald-700 cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Pulihkan Akun</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          disabled={isSelf}
                          className="rounded-lg gap-2 text-red-600 focus:text-red-700 cursor-pointer"
                        >
                          <UserX className="w-3.5 h-3.5" />
                          <span>Arsipkan Akun</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
