"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  UserAdd01Icon,
  UserRemove01Icon,
  ArrowLeft01Icon,
  Add01Icon,
  Settings02Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  createPiketPeriod,
  assignPiketMember,
  removePiketMember,
} from "@/lib/actions/piket";

interface KelolaPiketClientProps {
  profile: {
    id: string;
    email: string;
    role: string;
    is_onboarded: boolean;
  };
  availablePeriods: string[];
  allSchedules: {
    id: string;
    academic_period: string;
    week_number: number;
    room_target: string;
    members: {
      member_id: string;
      profile_id: string;
      nim: string;
      name: string;
      role: string;
    }[];
  }[];
  activeCandidates: {
    id: string;
    nim: string;
    name: string;
    role: string;
  }[];
}

const PEKAN_NUMBERS = [1, 2, 3, 4] as const;

export function KelolaPiketClient({
  availablePeriods,
  allSchedules,
  activeCandidates,
}: KelolaPiketClientProps) {
  const router = useRouter();

  // Selected period state
  const [selectedPeriod, setSelectedPeriod] = useState<string>(
    availablePeriods[0] || "2026/2027",
  );

  // New period modal states
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [newPeriodInput, setNewPeriodInput] = useState("");
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);

  // Assign member modal states
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [assignScheduleId, setAssignScheduleId] = useState<string>("");
  const [assignTargetWeek, setAssignTargetWeek] = useState<number>(1);
  const [selectedCandidateId, setSelectedCandidateId] = useState<string>("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState<string | null>(null);

  // Filter schedules for currently selected period
  const periodSchedules = allSchedules.filter(
    (s) => s.academic_period === selectedPeriod,
  );

  // Handler: Create new period
  const handleCreatePeriod = async () => {
    if (!newPeriodInput.trim()) {
      toast.error("Masukkan nama periode DPH (contoh: 2027/2028).");
      return;
    }

    setIsCreatingPeriod(true);
    const loadToast = toast.loading("Membuat periode DPH baru...");

    try {
      const res = await createPiketPeriod(newPeriodInput);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setSelectedPeriod(newPeriodInput.trim());
        setNewPeriodInput("");
        setIsNewPeriodModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal membuat periode.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan: " + errMsg);
    } finally {
      setIsCreatingPeriod(false);
    }
  };

  // Handler: Assign member to schedule
  const openAssignModal = (schedId: string, weekNum: number) => {
    setAssignScheduleId(schedId);
    setAssignTargetWeek(weekNum);
    setSelectedCandidateId("");
    setIsAssignModalOpen(true);
  };

  const handleSaveMemberAssignment = async () => {
    if (!assignScheduleId || !selectedCandidateId) {
      toast.error("Pilih nama anggota terlebih dahulu.");
      return;
    }

    setIsAssigning(true);
    const loadToast = toast.loading("Menambahkan anggota ke jadwal...");

    try {
      const res = await assignPiketMember(
        assignScheduleId,
        selectedCandidateId,
      );
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        setIsAssignModalOpen(false);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mengeset jadwal.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan: " + errMsg);
    } finally {
      setIsAssigning(false);
    }
  };

  // Handler: Delete member assignment
  const handleDeleteMemberAssignment = async (memberId: string) => {
    setIsDeletingMember(memberId);
    const loadToast = toast.loading("Menghapus penugasan piket...");

    try {
      const res = await removePiketMember(memberId);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal menghapus penugasan.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan: " + errMsg);
    } finally {
      setIsDeletingMember(null);
    }
  };

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto px-2 sm:px-4 lg:px-6">
      {/* Back Navigation Link */}
      <div>
        <Link
          href="/piket"
          className="inline-flex items-center gap-1.5 text-xs font-mono font-medium text-slate-600 dark:text-slate-400 hover:text-[#1e3a8a] dark:hover:text-blue-400 transition-colors"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Kembali ke Halaman Piket
        </Link>
      </div>

      {/* Header Panel */}
      <div className="relative border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-xl shadow-xs overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316]" />

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-[#0a192f] dark:text-slate-100 font-display flex items-center gap-2.5">
              <HugeiconsIcon
                icon={Settings02Icon}
                size={24}
                className="text-[#1e3a8a] dark:text-blue-400 shrink-0"
              />
              Kelola Penjadwalan Piket Kebersihan Kesekretariatan &amp; Workshop
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mt-1">
              Penataan Anggota Piket Kebersihan Ruang Kesekretariatan &amp;
              Workshop DPH UKM Robotik PNP
            </p>
          </div>

          <Badge className="bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 px-3 py-1.5 rounded-full font-mono text-[11px] uppercase tracking-wider">
            KHUSUS ADMIN KESTARI / SUPER ADMIN
          </Badge>
        </div>
      </div>

      {/* Period Selection Bar */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-[#1e3a8a] dark:text-blue-400 rounded-lg shrink-0">
              <HugeiconsIcon icon={Calendar03Icon} size={20} />
            </div>
            <div className="space-y-1 w-full sm:w-auto">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Pilih Periode Kepengurusan DPH
              </Label>
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full sm:w-64 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 text-xs font-mono font-semibold text-[#0a192f] dark:text-slate-100 focus:ring-2 focus:ring-[#1e3a8a] outline-none cursor-pointer"
              >
                {availablePeriods.map((p) => (
                  <option key={p} value={p}>
                    Periode DPH {p}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Button
            type="button"
            onClick={() => setIsNewPeriodModalOpen(true)}
            className="w-full sm:w-auto bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-mono font-medium rounded-lg h-9 px-4 cursor-pointer"
          >
            <HugeiconsIcon icon={Add01Icon} size={16} className="mr-1.5" />+
            Buat Periode DPH Baru
          </Button>
        </CardContent>
      </Card>

      {/* Grid 4 Columns: Pekan 1 s.d. 4 Member Allocations */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PEKAN_NUMBERS.map((weekNum) => {
          const sched = periodSchedules.find((s) => s.week_number === weekNum);
          const members = sched?.members || [];

          return (
            <Card
              key={weekNum}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs flex flex-col justify-between"
            >
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 rounded-t-xl">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-sm font-display font-medium text-[#0a192f] dark:text-slate-100 flex items-center gap-1.5">
                    <HugeiconsIcon
                      icon={UserGroupIcon}
                      size={16}
                      className="text-[#1e3a8a] dark:text-blue-400"
                    />
                    Pekan {weekNum}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                  >
                    {members.length} Anggota
                  </Badge>
                </div>
                <CardDescription className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                  Giliran Pekan Ke-{weekNum} ({selectedPeriod})
                </CardDescription>
              </CardHeader>

              <CardContent className="p-3 space-y-2 grow min-h-[180px]">
                {members.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center p-4">
                    <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                      Belum ada anggota di Pekan {weekNum}.
                    </p>
                  </div>
                ) : (
                  members.map((member) => (
                    <div
                      key={member.member_id}
                      className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between text-xs transition-colors hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <div className="truncate max-w-[130px]">
                        <span className="font-display font-medium block truncate text-[#0a192f] dark:text-slate-100">
                          {member.name}
                        </span>
                        <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400 block">
                          {member.nim || member.role}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={isDeletingMember === member.member_id}
                        onClick={() =>
                          handleDeleteMemberAssignment(member.member_id)
                        }
                        className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-md transition-colors cursor-pointer shrink-0"
                        title="Hapus Dari Penugasan Pekan Ini"
                      >
                        <HugeiconsIcon icon={UserRemove01Icon} size={15} />
                      </button>
                    </div>
                  ))
                )}
              </CardContent>

              <div className="p-3 border-t border-slate-100 dark:border-slate-800">
                {sched ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => openAssignModal(sched.id, weekNum)}
                    className="w-full border-dashed border-slate-300 dark:border-slate-700 text-[#1e3a8a] dark:text-blue-400 text-xs font-mono font-medium h-8"
                  >
                    <HugeiconsIcon
                      icon={UserAdd01Icon}
                      size={14}
                      className="mr-1"
                    />
                    + Tambah Anggota
                  </Button>
                ) : (
                  <p className="text-[10px] font-mono text-slate-400 text-center">
                    Jadwal belum diinisialisasi
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Modal: Create New Period */}
      <Dialog
        open={isNewPeriodModalOpen}
        onOpenChange={(open) => !open && setIsNewPeriodModalOpen(false)}
      >
        <DialogContent className="sm:max-w-[420px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={Add01Icon}
                size={18}
                className="text-[#1e3a8a] dark:text-blue-400"
              />
              Buat Periode DPH Baru
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 my-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Masukkan nama periode kepengurusan DPH baru (contoh:{" "}
              <code className="font-mono font-bold text-slate-700 dark:text-slate-300">
                2027/2028
              </code>
              ). Sistem akan otomatis menyiapkan master 4 pekan untuk periode
              tersebut.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300">
                Nama Periode DPH (YYYY/YYYY)
              </Label>
              <input
                type="text"
                placeholder="Contoh: 2027/2028"
                value={newPeriodInput}
                onChange={(e) => setNewPeriodInput(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-[#0a192f] dark:text-slate-100 font-mono focus:ring-2 focus:ring-[#1e3a8a] outline-none"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsNewPeriodModalOpen(false)}
              className="text-xs font-mono"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isCreatingPeriod || !newPeriodInput.trim()}
              onClick={handleCreatePeriod}
              className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-mono"
            >
              {isCreatingPeriod ? "Membuat..." : "Simpan Periode"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal: Assign Member */}
      <Dialog
        open={isAssignModalOpen}
        onOpenChange={(open) => !open && setIsAssignModalOpen(false)}
      >
        <DialogContent className="sm:max-w-[450px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6">
          <DialogHeader>
            <DialogTitle className="text-base font-display font-medium text-[#0a192f] dark:text-slate-100 flex items-center gap-2">
              <HugeiconsIcon
                icon={UserAdd01Icon}
                size={18}
                className="text-[#1e3a8a] dark:text-blue-400"
              />
              Penugasan Anggota Pekan {assignTargetWeek} ({selectedPeriod})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 my-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-body">
              Pilih nama pengurus / anggota aktif DPH untuk ditugaskan ke
              **Pekan {assignTargetWeek}** pada Periode **{selectedPeriod}**.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold font-mono text-slate-700 dark:text-slate-300">
                Pilih Nama Pengurus / Anggota
              </Label>
              <select
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs text-[#0a192f] dark:text-slate-100 font-body focus:ring-2 focus:ring-[#1e3a8a] outline-none cursor-pointer"
              >
                <option value="">-- Pilih Nama Anggota --</option>
                {activeCandidates.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.nim || c.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsAssignModalOpen(false)}
              className="text-xs font-mono"
            >
              Batal
            </Button>
            <Button
              type="button"
              disabled={isAssigning || !selectedCandidateId}
              onClick={handleSaveMemberAssignment}
              className="bg-[#1e3a8a] hover:bg-[#1e40af] text-white text-xs font-mono"
            >
              {isAssigning ? "Menyimpan..." : "Simpan Penugasan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
