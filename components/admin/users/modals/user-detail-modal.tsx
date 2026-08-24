"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserManagementItem } from "@/lib/types/user-management";
import { UserRoleBadge } from "../user-role-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserIcon,
  Mail01Icon,
  SmartPhone01Icon,
  Mortarboard02Icon,
  Calendar03Icon,
  SecurityCheckIcon,
  AlertCircleIcon,
  CheckmarkCircle01Icon,
  LockPasswordIcon,
} from "@hugeicons/core-free-icons";

interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserManagementItem | null;
}

export function UserDetailModal({
  isOpen,
  onClose,
  user,
}: UserDetailModalProps) {
  if (!user) return null;

  const initials = user.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "U";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 overflow-hidden border border-border shadow-lg">
        <DialogHeader className="p-5 sm:p-6 border-b border-border bg-card">
          <div className="flex items-center gap-3.5">
            <Avatar className="w-12 h-12 border border-border shrink-0 shadow-2xs">
              <AvatarImage
                src={user.avatarUrl || ""}
                alt={user.fullName || "Avatar"}
                className="object-cover"
              />
              <AvatarFallback className="bg-primary-soft text-primary font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <DialogTitle className="font-display text-base font-semibold tracking-tight text-foreground flex items-center gap-2">
                <span className="truncate">
                  {user.fullName || "Tanpa Nama"}
                </span>
                {user.deletedAt && (
                  <span className="px-2 py-0.5 text-[10px] bg-destructive/10 text-destructive border border-destructive/20 rounded-full font-medium">
                    Diarsip
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5 truncate">
                <HugeiconsIcon
                  icon={Mail01Icon}
                  size={13}
                  className="shrink-0"
                />
                <span>{user.email}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 p-5 sm:p-6 bg-background text-xs max-h-[65vh] overflow-y-auto">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface/50 dark:bg-card border border-border">
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                icon={SecurityCheckIcon}
                size={16}
                className="text-primary"
              />
              <span className="font-semibold text-foreground">
                Role Sistem (RBAC):
              </span>
            </div>
            <UserRoleBadge role={user.role} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={UserIcon} size={14} />
                <span>Nomor Induk Mahasiswa (NIM)</span>
              </div>
              <p className="font-mono font-medium text-foreground text-xs">
                {user.nim || "Belum diisi"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={SmartPhone01Icon} size={14} />
                <span>Kontak WhatsApp</span>
              </div>
              <p className="font-mono font-medium text-foreground text-xs">
                {user.phoneNumber || "Belum diisi"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1 sm:col-span-2">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={Mortarboard02Icon} size={14} />
                <span>Program Studi</span>
              </div>
              <p className="font-medium text-foreground text-xs">
                {user.studyProgramName || "Tidak terafiliasi"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} />
                <span>Status Onboarding</span>
              </div>
              <p className="font-medium text-foreground text-xs">
                {user.isOnboarded
                  ? "✅ Selesai Onboarding"
                  : "⏳ Belum Onboarding"}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-border bg-card space-y-1">
              <div className="text-muted-foreground flex items-center gap-1.5 text-[11px]">
                <HugeiconsIcon icon={Calendar03Icon} size={14} />
                <span>Tanggal Terdaftar</span>
              </div>
              <p className="font-medium text-foreground text-xs">
                {new Date(user.createdAt).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Soft Delete Information if archived */}
          {user.deletedAt && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 text-destructive font-semibold">
                <HugeiconsIcon icon={AlertCircleIcon} size={15} />
                <span>Akun Ini Berstatus Nonaktif (Archived)</span>
              </div>
              <p className="text-muted-foreground text-[11px]">
                <strong>Alasan:</strong>{" "}
                {user.deleteReason || "Tidak ditentukan"}
              </p>
              <p className="text-muted-foreground/80 text-[10px] font-mono">
                Diarsipkan pada:{" "}
                {new Date(user.deletedAt).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {/* Cybersecurity Notice */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/50 dark:bg-card border border-border text-[11px] text-muted-foreground">
            <HugeiconsIcon
              icon={LockPasswordIcon}
              size={16}
              className="shrink-0 mt-0.5 text-muted-foreground"
            />
            <span>
              Data PII ini bersifat rahasia dan dilindungi oleh UU No. 27 Tahun
              2022 (UU PDP). Penggunaan data di luar kepentingan resmi UKM
              Robotik PNP tidak diperkenankan.
            </span>
          </div>
        </div>

        <DialogFooter className="p-4 sm:p-5 border-t border-border bg-surface/40 dark:bg-card">
          <Button
            variant="outline"
            onClick={onClose}
            className="min-h-[44px] rounded-lg text-xs w-full sm:w-auto"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
