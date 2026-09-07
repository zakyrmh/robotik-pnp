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
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  MoreHorizontalIcon,
  Edit02Icon,
  ViewIcon,
  UserBlock01Icon,
  RotateLeft01Icon,
  ReloadIcon,
  SmartPhone01Icon,
  Mortarboard02Icon,
  ArchiveIcon,
  CheckmarkCircle01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";

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
      <div className="flex flex-col items-center justify-center p-12 text-center bg-card">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground mb-3">
          <HugeiconsIcon icon={UserGroupIcon} size={24} />
        </div>
        <h3 className="text-sm font-semibold text-foreground">
          Tidak ada pengguna ditemukan
        </h3>
        <p className="text-xs text-muted-foreground max-w-sm mt-1">
          Coba sesuaikan kata kunci pencarian atau filter role/status yang Anda
          gunakan.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card overflow-x-auto">
      <Table className="w-full text-left border-collapse min-w-[750px]">
        <TableHeader className="bg-muted/40 dark:bg-muted/20">
          <TableRow className="border-b border-border hover:bg-transparent">
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 pl-5">
              Pengguna &amp; Email
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
              NIM &amp; Program Studi
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
              Peran (Role)
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
              Kontak WA
            </TableHead>
            <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3">
              Status Akun
            </TableHead>
            <TableHead className="w-[80px] text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground py-3 pr-5">
              Aksi
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody className="divide-y divide-border text-sm">
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
                className={`transition-colors hover:bg-muted/30 dark:hover:bg-muted/10 ${
                  isArchived ? "bg-destructive/5 opacity-75" : ""
                }`}
              >
                {/* User Info Column */}
                <TableCell className="pl-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 border border-border shrink-0 shadow-2xs">
                      <AvatarImage
                        src={user.avatarUrl || ""}
                        alt={user.fullName || "User"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-primary-soft text-primary font-bold text-xs">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground truncate">
                          {user.fullName || "Tanpa Nama"}
                        </span>
                        {isSelf && (
                          <Badge
                            variant="secondary"
                            className="px-1.5 py-0 text-[9px] font-bold bg-primary-soft text-primary rounded-md"
                          >
                            Anda
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </TableCell>

                {/* NIM & Study Program Column */}
                <TableCell className="py-3.5">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs text-foreground font-medium">
                      {user.nim || "-"}
                    </span>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <HugeiconsIcon
                        icon={Mortarboard02Icon}
                        size={13}
                        className="shrink-0 text-muted-foreground/80"
                      />
                      <span className="truncate max-w-[170px]">
                        {user.studyProgramName || "Tidak ada"}
                      </span>
                    </p>
                  </div>
                </TableCell>

                {/* Role Badge Column */}
                <TableCell className="py-3.5">
                  <UserRoleBadge role={user.role} />
                </TableCell>

                {/* WhatsApp Contact Column */}
                <TableCell className="py-3.5">
                  {user.phoneNumber ? (
                    <a
                      href={`https://wa.me/${user.phoneNumber.replace(/^0/, "62")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                    >
                      <HugeiconsIcon
                        icon={SmartPhone01Icon}
                        size={14}
                        className="shrink-0"
                      />
                      <span>{user.phoneNumber}</span>
                    </a>
                  ) : (
                    <span className="text-muted-foreground text-xs font-mono">
                      -
                    </span>
                  )}
                </TableCell>

                {/* Account Status Column */}
                <TableCell className="py-3.5">
                  {isArchived ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-destructive/10 text-destructive border border-destructive/20">
                      <HugeiconsIcon icon={ArchiveIcon} size={12} />
                      <span>Nonaktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                      <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} />
                      <span>Aktif</span>
                    </span>
                  )}
                </TableCell>

                {/* Actions Menu Dropdown */}
                <TableCell className="text-right pr-5 py-3.5 whitespace-nowrap">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
                      >
                        <HugeiconsIcon icon={MoreHorizontalIcon} size={16} />
                        <span className="sr-only">Buka Menu Aksi</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-52 rounded-xl p-1 text-xs shadow-lg border border-border"
                    >
                      <DropdownMenuLabel className="text-[10px] font-semibold uppercase text-muted-foreground px-2 py-1">
                        Aksi Pengguna
                      </DropdownMenuLabel>

                      <DropdownMenuItem
                        onClick={() => onDetail(user)}
                        className="rounded-lg gap-2 cursor-pointer py-2"
                      >
                        <HugeiconsIcon
                          icon={ViewIcon}
                          size={15}
                          className="text-muted-foreground"
                        />
                        <span>Lihat Detail PII</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onEdit(user)}
                        className="rounded-lg gap-2 cursor-pointer py-2"
                      >
                        <HugeiconsIcon
                          icon={Edit02Icon}
                          size={15}
                          className="text-primary"
                        />
                        <span>Edit Peran &amp; Data</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => onResetOnboarding(user)}
                        className="rounded-lg gap-2 cursor-pointer py-2"
                      >
                        <HugeiconsIcon
                          icon={ReloadIcon}
                          size={15}
                          className="text-amber-500"
                        />
                        <span>Reset Onboarding</span>
                      </DropdownMenuItem>

                      <DropdownMenuSeparator className="my-1" />

                      {isArchived ? (
                        <DropdownMenuItem
                          onClick={() => onRestore(user)}
                          className="rounded-lg gap-2 text-emerald-600 dark:text-emerald-400 focus:text-emerald-700 cursor-pointer py-2"
                        >
                          <HugeiconsIcon icon={RotateLeft01Icon} size={15} />
                          <span>Pulihkan Akun</span>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => onDelete(user)}
                          disabled={isSelf}
                          className="rounded-lg gap-2 text-destructive focus:text-destructive cursor-pointer py-2"
                        >
                          <HugeiconsIcon icon={UserBlock01Icon} size={15} />
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
