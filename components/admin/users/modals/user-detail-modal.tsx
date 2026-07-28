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
import {
  User,
  Mail,
  Phone,
  GraduationCap,
  Calendar,
  ShieldCheck,
  AlertCircle,
  FileCheck2,
  Lock,
} from "lucide-react";

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
      <DialogContent className="sm:max-w-lg rounded-2xl p-6">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-neutral-200 dark:border-neutral-700">
              <AvatarImage
                src={user.avatarUrl || ""}
                alt={user.fullName || "Avatar"}
              />
              <AvatarFallback className="bg-blue-100 text-blue-700 font-bold text-sm">
                {initials}
              </AvatarFallback>
            </Avatar>

            <div>
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <span>{user.fullName || "Tanpa Nama"}</span>
                {user.deletedAt && (
                  <span className="px-2 py-0.5 text-[10px] bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 rounded-md font-semibold">
                    Diarsip
                  </span>
                )}
              </DialogTitle>
              <DialogDescription className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                <Mail className="w-3 h-3 shrink-0" />
                <span>{user.email}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Header Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span className="font-semibold text-neutral-700 dark:text-neutral-300">
                Role Sistem:
              </span>
            </div>
            <UserRoleBadge role={user.role} />
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="text-neutral-400 flex items-center gap-1">
                <User className="w-3.5 h-3.5" />
                <span>NIM</span>
              </div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                {user.nim || "Belum diisi"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="text-neutral-400 flex items-center gap-1">
                <Phone className="w-3.5 h-3.5" />
                <span>No. WhatsApp</span>
              </div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                {user.phoneNumber || "Belum diisi"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1 col-span-2">
              <div className="text-neutral-400 flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>Program Studi</span>
              </div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                {user.studyProgramName || "Tidak terafiliasi"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="text-neutral-400 flex items-center gap-1">
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>Status Onboarding</span>
              </div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                {user.isOnboarded
                  ? "✅ Selesai Onboarding"
                  : "⏳ Belum Onboarding"}
              </p>
            </div>

            <div className="p-3 rounded-xl border border-neutral-200 dark:border-neutral-800 space-y-1">
              <div className="text-neutral-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>Tanggal Terdaftar</span>
              </div>
              <p className="font-semibold text-neutral-800 dark:text-neutral-200">
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
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 space-y-1.5">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-300 font-semibold">
                <AlertCircle className="w-4 h-4" />
                <span>Akun Ini Berstatus Nonaktif (Archived)</span>
              </div>
              <p className="text-neutral-600 dark:text-neutral-400 text-[11px]">
                <strong>Alasan Penghapusan:</strong>{" "}
                {user.deleteReason || "Tidak ditentukan"}
              </p>
              <p className="text-neutral-500 text-[10px]">
                Diarsipkan pada:{" "}
                {new Date(user.deletedAt).toLocaleString("id-ID")}
              </p>
            </div>
          )}

          {/* Cybersecurity Notice */}
          <div className="flex items-start gap-2 p-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 text-[11px] text-neutral-500">
            <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-neutral-400" />
            <span>
              Data PII ini bersifat rahasia dan dilindungi oleh UU No. 27 Tahun
              2022 (UU PDP). Penggunaan data di luar kepentingan resmi UKM
              Robotik PNP tidak diperkenankan.
            </span>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            className="h-9 rounded-xl text-xs w-full sm:w-auto"
          >
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
