"use client";

import Image from "next/image";
import { BadgeCheck, Building2, User, QrCode } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MembershipDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: {
    full_name?: string | null;
    nim?: string | null;
    role?: string | null;
    avatar_url?: string | null;
  };
  roleData: {
    caangGroup?: {
      id: string;
      name: string;
      profiles?: { full_name?: string | null } | null;
    } | null;
    orgHistories?: Array<{
      id: string;
      role_name: string;
      sub_section?: string | null;
      departments?: { name: string } | null;
      membership_periods?: { period_name: string } | null;
    }> | null;
  };
}

export function MembershipDetailModal({
  isOpen,
  onClose,
  userProfile,
  roleData,
}: MembershipDetailModalProps) {
  const isCaang = userProfile.role === "caang";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl md:max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100">
        <DialogHeader>
          <div className="flex items-center gap-2 text-blue-900 dark:text-blue-400">
            <BadgeCheck className="w-5 h-5 text-orange-500" />
            <DialogTitle className="text-base font-semibold tracking-tight">
              Detail Kartu Keanggotaan & Peran
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-slate-500 dark:text-slate-400">
            Pratinjau identitas digital resmi UKM Robotik Politeknik Negeri
            Padang.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Card Digital Preview */}
          <div className="p-4 rounded-xl bg-linear-to-br from-blue-950 via-blue-900 to-slate-900 text-white shadow-md border border-blue-800/50 space-y-3 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-xs text-white">
                  PNP
                </div>
                <div>
                  <h4 className="text-white text-xs font-bold tracking-wide uppercase">
                    UKM Robotik PNP
                  </h4>
                  <p className="text-[10px] text-blue-200/80">
                    Kartu Akses Digital
                  </p>
                </div>
              </div>

              <Badge className="bg-orange-500/20 text-orange-300 border-orange-500/30 text-[10px] uppercase font-semibold">
                {userProfile.role || "USER"}
              </Badge>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-orange-400/50 overflow-hidden flex items-center justify-center shrink-0">
                {userProfile.avatar_url ? (
                  <Image
                    src={userProfile.avatar_url}
                    alt="Avatar"
                    width={48}
                    height={48}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-6 h-6 text-slate-400" />
                )}
              </div>

              <div>
                <h3 className="text-sm font-bold text-white">
                  {userProfile.full_name || "Nama Pengguna"}
                </h3>
                <p className="text-xs font-mono text-blue-200/90">
                  NIM: {userProfile.nim || "-"}
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-blue-800/40 flex items-center justify-between text-micro text-blue-200/80">
              <span>Status: AKTIF</span>
              <QrCode className="w-4 h-4 text-orange-400" />
            </div>
          </div>

          {/* Details list */}
          {isCaang ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
              <h5 className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-orange-500" />
                Informasi Kelompok Oprec Caang
              </h5>
              <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                <div>
                  <span className="text-micro text-slate-400 block">
                    Kelompok:
                  </span>
                  <span className="font-medium">
                    {roleData.caangGroup?.name || "Belum Ditentukan"}
                  </span>
                </div>
                <div>
                  <span className="text-micro text-slate-400 block">
                    Mentor:
                  </span>
                  <span className="font-medium">
                    {roleData.caangGroup?.profiles?.full_name || "-"}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <h5 className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Riwayat Kepengurusan Organisasi
              </h5>
              {roleData.orgHistories && roleData.orgHistories.length > 0 ? (
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {roleData.orgHistories.map((h) => (
                    <div
                      key={h.id}
                      className="p-2 bg-slate-50 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-700 text-xs flex justify-between items-center"
                    >
                      <div>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                          {h.role_name}
                        </p>
                        <p className="text-micro text-slate-500 dark:text-slate-400">
                          {h.departments?.name || "Departemen"}
                        </p>
                      </div>
                      <Badge variant="outline" className="text-[10px]">
                        {h.membership_periods?.period_name || "-"}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">
                  Belum ada riwayat kepengurusan terdaftar.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-9 text-xs border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 w-full sm:w-auto"
          >
            Tutup Pratinjau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
