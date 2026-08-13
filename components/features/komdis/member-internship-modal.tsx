"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { updateMemberInternshipStatus } from "@/lib/actions/komdis";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Briefcase01Icon,
  Calendar03Icon,
  Loading01Icon,
} from "@hugeicons/core-free-icons";

interface MemberInternshipModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: {
    profileId: string;
    fullName: string;
    nim: string;
    isOnInternship: boolean;
    internshipStartDate: string | null;
    internshipEndDate: string | null;
  } | null;
}

export function MemberInternshipModal({
  isOpen,
  onClose,
  member,
}: MemberInternshipModalProps) {
  const router = useRouter();
  const [isOnInternship, setIsOnInternship] = useState(
    member?.isOnInternship ?? false,
  );
  const [startDate, setStartDate] = useState(
    member?.internshipStartDate ? member.internshipStartDate.split("T")[0] : "",
  );
  const [endDate, setEndDate] = useState(
    member?.internshipEndDate ? member.internshipEndDate.split("T")[0] : "",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sync state when member prop changes
  const handleOpenChange = (open: boolean) => {
    if (open && member) {
      setIsOnInternship(member.isOnInternship);
      setStartDate(
        member.internshipStartDate
          ? member.internshipStartDate.split("T")[0]
          : "",
      );
      setEndDate(
        member.internshipEndDate ? member.internshipEndDate.split("T")[0] : "",
      );
      setErrorMsg(null);
      setSuccessMsg(null);
    } else {
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!member) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await updateMemberInternshipStatus({
        profileId: member.profileId,
        isOnInternship,
        internshipStartDate: isOnInternship && startDate ? startDate : null,
        internshipEndDate: isOnInternship && endDate ? endDate : null,
      });

      if (res.success) {
        setSuccessMsg("Status magang anggota berhasil diperbarui.");
        router.refresh();
        setTimeout(() => {
          onClose();
        }, 1000);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl">
        <DialogHeader className="space-y-1">
          <div className="flex items-center gap-2 text-[#1e3a8a] dark:text-blue-400">
            <HugeiconsIcon icon={Briefcase01Icon} size={20} />
            <DialogTitle className="font-display text-lg font-bold text-[#0a192f] dark:text-slate-100">
              Pengaturan Magang / PKL
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs font-mono text-slate-500 dark:text-slate-400">
            Atur status dispensasi magang untuk anggota{" "}
            <span className="font-bold text-[#0a192f] dark:text-slate-200">
              {member.fullName}
            </span>{" "}
            ({member.nim || "Tanpa NIM"}).
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {errorMsg && (
            <div className="p-3 bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 font-mono text-xs rounded-lg">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 font-mono text-xs rounded-lg">
              {successMsg}
            </div>
          )}

          {/* Toggle Switch */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl">
            <div className="space-y-0.5">
              <Label className="text-xs font-mono uppercase tracking-wider font-semibold text-[#0a192f] dark:text-slate-100 cursor-pointer">
                Status Sedang Magang / PKL
              </Label>
              <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
                Anggota magang otomatis berstatus Izin (0 Poin Sanksi) saat
                presensi.
              </p>
            </div>
            <Switch
              checked={isOnInternship}
              onCheckedChange={setIsOnInternship}
            />
          </div>

          {/* Date Picker Fields */}
          {isOnInternship && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} /> Tanggal
                  Mulai
                </Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-mono text-slate-600 dark:text-slate-300 flex items-center gap-1">
                  <HugeiconsIcon icon={Calendar03Icon} size={14} /> Tanggal
                  Selesai
                </Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono text-xs text-[#0a192f] dark:text-slate-100"
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="font-mono text-xs uppercase"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#1e3a8a] dark:bg-blue-600 hover:bg-[#1e40af] dark:hover:bg-blue-500 text-white font-mono text-xs uppercase"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-1.5">
                  <HugeiconsIcon
                    icon={Loading01Icon}
                    className="animate-spin"
                    size={14}
                  />
                  Menyimpan...
                </span>
              ) : (
                "Simpan Perubahan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
