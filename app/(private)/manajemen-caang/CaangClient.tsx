"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Search01Icon,
  EyeIcon,
  Edit02Icon,
  Delete01Icon,
  UserGroupIcon,
  CheckmarkCircle02Icon,
  ArrowDown01Icon,
  AlertCircleIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  deleteCaang,
  updateCaang,
  updateCaangStatus,
} from "@/lib/actions/caang";
import { cn } from "@/lib/utils";
import Image from "next/image";

export interface CaangItem {
  profileId: string;
  email: string;
  nim: string;
  isOnboarded: boolean;
  fullName: string;
  nickname: string;
  gender: string;
  pob: string;
  dob: string;
  phoneNumber: string;
  originAddress: string;
  domicileAddress: string;
  highSchool: string;
  currentClass: string;
  entryYear: number | null;
  motivation: string;
  orgExperience: string;
  achievements: string;
  photoUrl: string;
  ktmUrl: string;
  proofFollowRobotik: string;
  proofFollowMrc: string;
  proofSubYt: string;
  paymentProofUrl: string;
  paymentMethod: string;
  status: string;
  revisionNotes?: string | null;
  studyProgramId: string;
  studyProgramName: string;
  majorName: string;
  deletedAt?: string | null;
  deleteReason?: string | null;
}

interface CaangClientProps {
  initialCaang: CaangItem[];
}

type RegistrationStatusType =
  | "process"
  | "pending"
  | "verified"
  | "rejected"
  | "revision";

interface StatusConfig {
  label: string;
  short: string;
  badgeClass: string;
  dotClass: string;
  bgSoft: string;
  textColor: string;
}

const STATUS_CONFIG: Record<string, StatusConfig> = {
  verified: {
    label: "Terverifikasi / Diterima",
    short: "Diterima",
    badgeClass:
      "bg-emerald-50 text-emerald-700 border-emerald-200/80 hover:bg-emerald-100/70 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/80 dark:hover:bg-emerald-900/50",
    dotClass: "bg-emerald-500",
    bgSoft: "bg-emerald-500",
    textColor: "text-emerald-700 dark:text-emerald-300",
  },
  pending: {
    label: "Menunggu Verifikasi",
    short: "Pending",
    badgeClass:
      "bg-amber-50 text-amber-700 border-amber-200/80 hover:bg-amber-100/70 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/80 dark:hover:bg-amber-900/50",
    dotClass: "bg-amber-500",
    bgSoft: "bg-amber-500",
    textColor: "text-amber-700 dark:text-amber-300",
  },
  revision: {
    label: "Perlu Revisi Berkas",
    short: "Revisi",
    badgeClass:
      "bg-sky-50 text-sky-700 border-sky-200/80 hover:bg-sky-100/70 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/80 dark:hover:bg-sky-900/50",
    dotClass: "bg-sky-500",
    bgSoft: "bg-sky-500",
    textColor: "text-sky-700 dark:text-sky-300",
  },
  process: {
    label: "Sedang Diproses",
    short: "Proses",
    badgeClass:
      "bg-slate-100 text-slate-700 border-slate-200/80 hover:bg-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-750",
    dotClass: "bg-slate-500",
    bgSoft: "bg-slate-500",
    textColor: "text-slate-700 dark:text-slate-300",
  },
  rejected: {
    label: "Ditolak",
    short: "Ditolak",
    badgeClass:
      "bg-rose-50 text-rose-700 border-rose-200/80 hover:bg-rose-100/70 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/80 dark:hover:bg-rose-900/50",
    dotClass: "bg-rose-500",
    bgSoft: "bg-rose-500",
    textColor: "text-rose-700 dark:text-rose-300",
  },
};

const STATUS_OPTIONS: {
  key: RegistrationStatusType;
  label: string;
  desc: string;
}[] = [
  {
    key: "verified",
    label: "Terverifikasi (Diterima)",
    desc: "Setujui pendaftaran dan aktifkan akses akun",
  },
  {
    key: "revision",
    label: "Revisi Data / Berkas",
    desc: "Minta calon anggota memperbaiki berkas pendaftaran",
  },
  {
    key: "pending",
    label: "Pending / Menunggu",
    desc: "Tandai pendaftaran dalam antrean pemeriksaan",
  },
  {
    key: "process",
    label: "Dalam Proses",
    desc: "Status default pendaftaran baru",
  },
  {
    key: "rejected",
    label: "Tolak Pendaftaran",
    desc: "Tolak calon anggota dari penerimaan",
  },
];

const QUICK_REVISION_PRESETS = [
  "Foto KTM tidak jelas atau buram. Mohon unggah scan/foto asli yang terbaca jelas.",
  "Bukti pembayaran pendaftaran tidak valid atau nominal tidak sesuai.",
  "Bukti follow Instagram UKM Robotik PNP & Minangkabau Robot Contest belum lengkap.",
  "Bukti subscribe channel YouTube UKM Robotik PNP belum diunggah.",
  "Data program studi atau kelas tidak sesuai dengan nomor induk mahasiswa (NIM).",
  "Pasfoto formal belum memenuhi kriteria (wajah harus terlihat jelas menghadap depan).",
];

function isValidImageUrl(url: string | null | undefined): url is string {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (
    !trimmed ||
    trimmed === "Belum Diisi" ||
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "-"
  ) {
    return false;
  }
  return (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  );
}

export function CaangClient({ initialCaang }: CaangClientProps) {
  const router = useRouter();

  // Calculate statistics from initialCaang
  const stats = useMemo(() => {
    let male = 0;
    let female = 0;
    const majors: Record<string, number> = {};
    const statusCounts: Record<string, number> = {
      verified: 0,
      revision: 0,
      process: 0,
      pending: 0,
      rejected: 0,
    };

    initialCaang.forEach((item) => {
      // 1. Gender
      if (item.gender === "L") male++;
      else if (item.gender === "P") female++;

      // 2. Jurusan
      const major = item.majorName || "Belum Memilih";
      majors[major] = (majors[major] || 0) + 1;

      // 3. Status
      const statusKey = item.status || "process";
      if (statusKey in statusCounts) {
        statusCounts[statusKey]++;
      } else {
        statusCounts.process++;
      }
    });

    const total = initialCaang.length;

    return {
      male,
      female,
      majors: Object.entries(majors).sort((a, b) => b[1] - a[1]),
      status: statusCounts,
      total,
    };
  }, [initialCaang]);

  // Search & Filter state
  const [search, setSearch] = useState("");
  const [selectedMajor, setSelectedMajor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Dialog states
  const [viewingCaang, setViewingCaang] = useState<CaangItem | null>(null);
  const [editingCaang, setEditingCaang] = useState<CaangItem | null>(null);
  const [deletingCaangId, setDeletingCaangId] = useState<string | null>(null);
  const [deleteReasonText, setDeleteReasonText] = useState("");
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  // Status Change / Revision Modal state
  const [revisionModalCaang, setRevisionModalCaang] =
    useState<CaangItem | null>(null);
  const [revisionNotesInput, setRevisionNotesInput] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Edit form state
  const [editForm, setEditForm] = useState({
    fullName: "",
    nickname: "",
    gender: "",
    pob: "",
    dob: "",
    phoneNumber: "",
    originAddress: "",
    domicileAddress: "",
    highSchool: "",
    currentClass: "",
    entryYear: 0,
    status: "process",
    revisionNotes: "",
  });
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Retrieve unique majors for filter dropdown
  const uniqueMajors = useMemo(() => {
    const majors = new Set<string>();
    initialCaang.forEach((item) => {
      if (item.majorName) majors.add(item.majorName);
    });
    return Array.from(majors).sort();
  }, [initialCaang]);

  // Filtered Caang list
  const filteredCaang = useMemo(() => {
    return initialCaang.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.fullName.toLowerCase().includes(q) ||
        item.nim.toLowerCase().includes(q) ||
        item.email.toLowerCase().includes(q) ||
        item.phoneNumber.toLowerCase().includes(q);

      const matchMajor =
        selectedMajor === "all" || item.majorName === selectedMajor;
      const matchStatus =
        selectedStatus === "all" || item.status === selectedStatus;

      return matchSearch && matchMajor && matchStatus;
    });
  }, [initialCaang, search, selectedMajor, selectedStatus]);

  // Row selection logic
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredCaang.map((item) => item.profileId));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((item) => item !== id));
    }
  };

  const isAllSelected =
    filteredCaang.length > 0 && selectedIds.length === filteredCaang.length;

  // Quick Status Change handler
  const handleQuickStatusChange = async (
    item: CaangItem,
    newStatus: RegistrationStatusType,
  ) => {
    if (item.status === newStatus) return;

    // If changing to 'revision', open modal for revision notes input
    if (newStatus === "revision") {
      setRevisionModalCaang(item);
      setRevisionNotesInput(item.revisionNotes || "");
      return;
    }

    setIsSubmittingStatus(true);
    const toastId = toast.loading(
      `Mengubah status menjadi ${newStatus.toUpperCase()}...`,
    );

    try {
      const res = await updateCaangStatus(item.profileId, newStatus);
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal mengubah status.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan: " + errMsg);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Submit Revision status with notes
  const handleRevisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revisionModalCaang) return;

    if (!revisionNotesInput.trim()) {
      toast.error(
        "Catatan revisi wajib diisi agar calon anggota mengetahui perbaikan yang diperlukan.",
      );
      return;
    }

    setIsSubmittingStatus(true);
    const toastId = toast.loading("Menyimpan status revisi & catatan...");

    try {
      const res = await updateCaangStatus(
        revisionModalCaang.profileId,
        "revision",
        revisionNotesInput.trim(),
      );
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(
          "Status berhasil diubah menjadi REVISI beserta catatan perbaikan.",
        );
        setRevisionModalCaang(null);
        setRevisionNotesInput("");
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui status revisi.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan: " + errMsg);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Actions
  const openEditModal = (item: CaangItem) => {
    setEditingCaang(item);
    setEditForm({
      fullName: item.fullName,
      nickname: item.nickname,
      gender: item.gender,
      pob: item.pob,
      dob: item.dob,
      phoneNumber: item.phoneNumber,
      originAddress: item.originAddress,
      domicileAddress: item.domicileAddress,
      highSchool: item.highSchool,
      currentClass: item.currentClass,
      entryYear: item.entryYear || 0,
      status: item.status,
      revisionNotes: item.revisionNotes || "",
    });
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCaang) return;

    if (
      !editForm.fullName ||
      !editForm.nickname ||
      !editForm.gender ||
      !editForm.pob ||
      !editForm.dob ||
      !editForm.phoneNumber ||
      !editForm.originAddress ||
      !editForm.domicileAddress ||
      !editForm.entryYear ||
      !editForm.status
    ) {
      toast.error("Kolom bertanda bintang / wajib diisi tidak boleh kosong.");
      return;
    }

    setIsSubmittingEdit(true);
    const toastId = toast.loading("Memperbarui data Caang...");

    try {
      const res = await updateCaang(editingCaang.profileId, {
        ...editForm,
        revisionNotes:
          editForm.status === "revision" ? editForm.revisionNotes : null,
      });
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        setEditingCaang(null);
        router.refresh();
      } else {
        toast.error(res.error || "Gagal memperbarui data.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan koneksi: " + errMsg);
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleDeleteConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deletingCaangId) return;

    if (!deleteReasonText.trim()) {
      toast.error("Alasan menghapus wajib diisi.");
      return;
    }

    const toastId = toast.loading("Menghapus data Caang...");
    try {
      const res = await deleteCaang(deletingCaangId, deleteReasonText.trim());
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        setDeletingCaangId(null);
        setDeleteReasonText("");
        setSelectedIds((prev) => prev.filter((id) => id !== deletingCaangId));
        router.refresh();
      } else {
        toast.error(res.error || "Gagal menghapus data.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan koneksi: " + errMsg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    const confirmed = confirm(
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} Caang terpilih? Tindakan ini tidak dapat dibatalkan.`,
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    const toastId = toast.loading(
      `Menghapus ${selectedIds.length} akun Caang...`,
    );

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await deleteCaang(id, "Penghapusan massal oleh admin");
        if (res.success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch {
        failCount++;
      }
    }

    toast.dismiss(toastId);
    if (successCount > 0) {
      toast.success(`${successCount} Caang berhasil dihapus.`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} Caang gagal dihapus.`);
    }

    setSelectedIds([]);
    setIsBulkDeleting(false);
    router.refresh();
  };

  // Status Selector Component for Table and Mobile Cards
  const renderStatusDropdown = (item: CaangItem) => {
    const statusCfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.process;

    return (
      <div className="inline-flex items-center gap-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              disabled={isSubmittingStatus}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 cursor-pointer shadow-2xs hover:shadow-xs active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40",
                statusCfg.badgeClass,
              )}
              title="Klik untuk mengubah status registrasi calon anggota"
            >
              <span
                className={cn(
                  "w-2 h-2 rounded-full shrink-0",
                  statusCfg.dotClass,
                )}
              />
              <span className="font-semibold">{statusCfg.short}</span>
              <HugeiconsIcon
                icon={ArrowDown01Icon}
                size={12}
                className="opacity-70 ml-0.5 shrink-0"
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="start"
            sideOffset={6}
            className="w-64 p-1.5 rounded-xl border border-border bg-popover shadow-lg"
          >
            <DropdownMenuLabel className="px-2.5 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Ubah Status Pendaftaran
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="my-1" />
            {STATUS_OPTIONS.map((opt) => {
              const cfg = STATUS_CONFIG[opt.key];
              const isCurrent = item.status === opt.key;
              return (
                <DropdownMenuItem
                  key={opt.key}
                  onClick={() => handleQuickStatusChange(item, opt.key)}
                  className={cn(
                    "flex flex-col items-start px-2.5 py-2 rounded-lg cursor-pointer transition-colors text-left",
                    isCurrent
                      ? "bg-secondary text-foreground font-semibold"
                      : "hover:bg-muted text-foreground",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="flex items-center gap-2 text-xs font-medium">
                      <span
                        className={cn("w-2 h-2 rounded-full", cfg.dotClass)}
                      />
                      <span>{opt.label}</span>
                    </span>
                    {isCurrent && (
                      <HugeiconsIcon
                        icon={CheckmarkCircle02Icon}
                        size={14}
                        className="text-primary"
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-0.5 pl-4">
                    {opt.desc}
                  </span>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Small warning badge if candidate is in revision */}
        {item.status === "revision" && item.revisionNotes && (
          <button
            type="button"
            onClick={() => {
              setRevisionModalCaang(item);
              setRevisionNotesInput(item.revisionNotes || "");
            }}
            title={`Catatan revisi: ${item.revisionNotes}`}
            className="p-1 rounded-full text-sky-600 hover:text-sky-800 hover:bg-sky-100 dark:text-sky-400 dark:hover:bg-sky-950/60 transition-colors cursor-pointer"
          >
            <HugeiconsIcon icon={AlertCircleIcon} size={15} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
      {/* Header Banner */}
      <div className="relative border border-border bg-card rounded-2xl p-6 sm:p-7 shadow-xs overflow-hidden">
        {/* Subtle Decorative Gradient Header Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-primary via-primary-hover to-accent-strong" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-primary-soft text-primary border border-primary/10">
                <HugeiconsIcon icon={UserGroupIcon} size={22} />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-heading font-bold text-foreground tracking-tight">
                  Manajemen Calon Anggota (Caang)
                </h1>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Kelola verifikasi berkas, status penerimaan, dan data
                  pendaftaran anggota baru UKM Robotik PNP.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-lg text-xs font-medium px-4 h-10 shadow-xs"
              >
                <HugeiconsIcon
                  icon={Delete01Icon}
                  size={16}
                  className="mr-1.5"
                />
                Hapus Terpilih ({selectedIds.length})
              </Button>
            )}

            <Badge
              variant="outline"
              className="bg-secondary text-foreground border-border px-3.5 py-1.5 rounded-full text-xs font-mono font-semibold"
            >
              Total Caang: {initialCaang.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Card 1: Total pendaftar berdasarkan jenis kelamin */}
        <div className="border border-border bg-card p-5 rounded-xl shadow-xs flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Distribusi Gender
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                Total: {stats.total}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Laki-Laki (L)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-heading text-foreground">
                    {stats.male}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    (
                    {stats.total > 0
                      ? Math.round((stats.male / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] text-muted-foreground block font-medium">
                  Perempuan (P)
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold font-heading text-foreground">
                    {stats.female}
                  </span>
                  <span className="text-xs font-mono text-muted-foreground">
                    (
                    {stats.total > 0
                      ? Math.round((stats.female / stats.total) * 100)
                      : 0}
                    %)
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="h-2 w-full bg-secondary rounded-full overflow-hidden flex">
              {stats.male > 0 && (
                <div
                  className="h-full bg-primary"
                  style={{
                    width: `${stats.total > 0 ? (stats.male / stats.total) * 100 : 0}%`,
                  }}
                />
              )}
              {stats.female > 0 && (
                <div
                  className="h-full bg-accent-strong"
                  style={{
                    width: `${stats.total > 0 ? (stats.female / stats.total) * 100 : 0}%`,
                  }}
                />
              )}
            </div>
            <div className="flex justify-between text-[11px] font-mono text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-primary" /> Laki-laki
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-accent-strong" />{" "}
                Perempuan
              </span>
            </div>
          </div>
        </div>

        {/* Card 2: Total pendaftar berdasarkan jurusan */}
        <div className="border border-border bg-card p-5 rounded-xl shadow-xs flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Distribusi Jurusan
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                {stats.majors.length} Jurusan
              </span>
            </div>

            <div className="space-y-2.5 max-h-[120px] overflow-y-auto pr-1">
              {stats.majors.length === 0 ? (
                <p className="text-xs text-muted-foreground py-2 italic">
                  Belum ada data jurusan pendaftar
                </p>
              ) : (
                stats.majors.map(([major, count]) => {
                  const percentage =
                    stats.total > 0 ? (count / stats.total) * 100 : 0;
                  return (
                    <div key={major} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="truncate max-w-[180px] text-foreground font-medium">
                          {major}
                        </span>
                        <span className="font-mono text-muted-foreground font-semibold">
                          {count} ({Math.round(percentage)}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/70 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Chart pendaftar berdasarkan status */}
        <div className="border border-border bg-card p-5 rounded-xl shadow-xs flex flex-col justify-between min-h-[170px]">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Status Verifikasi
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                {stats.total} Berkas
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="h-2.5 w-full bg-secondary rounded-full overflow-hidden flex gap-0.5">
              {stats.total > 0 ? (
                <>
                  {stats.status.verified > 0 && (
                    <div
                      className="h-full bg-emerald-500"
                      style={{
                        width: `${(stats.status.verified / stats.total) * 100}%`,
                      }}
                      title={`Terverifikasi: ${stats.status.verified}`}
                    />
                  )}
                  {stats.status.revision > 0 && (
                    <div
                      className="h-full bg-sky-500"
                      style={{
                        width: `${(stats.status.revision / stats.total) * 100}%`,
                      }}
                      title={`Revisi: ${stats.status.revision}`}
                    />
                  )}
                  {stats.status.pending > 0 && (
                    <div
                      className="h-full bg-amber-500"
                      style={{
                        width: `${(stats.status.pending / stats.total) * 100}%`,
                      }}
                      title={`Pending: ${stats.status.pending}`}
                    />
                  )}
                  {stats.status.process > 0 && (
                    <div
                      className="h-full bg-slate-400 dark:bg-slate-600"
                      style={{
                        width: `${(stats.status.process / stats.total) * 100}%`,
                      }}
                      title={`Proses: ${stats.status.process}`}
                    />
                  )}
                  {stats.status.rejected > 0 && (
                    <div
                      className="h-full bg-rose-500"
                      style={{
                        width: `${(stats.status.rejected / stats.total) * 100}%`,
                      }}
                      title={`Ditolak: ${stats.status.rejected}`}
                    />
                  )}
                </>
              ) : (
                <div className="h-full w-full bg-muted" />
              )}
            </div>

            {/* Legend Grid */}
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  Diterima
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {stats.status.verified}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                  Revisi
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {stats.status.revision || 0}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                  Pending
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {stats.status.pending}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                  Proses
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {stats.status.process}
                </span>
              </div>

              <div className="flex items-center justify-between col-span-2 pt-0.5 border-t border-border/60">
                <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                  <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                  Ditolak
                </span>
                <span className="font-mono font-semibold text-foreground text-xs">
                  {stats.status.rejected}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-3 border border-border bg-card p-4 rounded-xl shadow-xs">
        {/* Search */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari Nama, NIM, No. HP, atau Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-10 w-full bg-background pl-10 rounded-lg border-border text-sm text-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
          />
        </div>

        {/* Filter Major */}
        <div className="w-full sm:w-56">
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="h-10 w-full bg-background px-3.5 rounded-lg border border-border text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">Semua Jurusan</option>
            {uniqueMajors.map((major) => (
              <option key={major} value={major}>
                {major}
              </option>
            ))}
          </select>
        </div>

        {/* Filter Status */}
        <div className="w-full sm:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-10 w-full bg-background px-3.5 rounded-lg border border-border text-xs sm:text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
          >
            <option value="all">Semua Status</option>
            <option value="verified">Diterima (Verified)</option>
            <option value="revision">Perlu Revisi</option>
            <option value="pending">Pending</option>
            <option value="process">Dalam Proses</option>
            <option value="rejected">Ditolak</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredCaang.length === 0 ? (
        <div className="border border-border bg-card p-12 text-center rounded-xl shadow-xs">
          <div className="mx-auto w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
            <HugeiconsIcon
              icon={UserGroupIcon}
              size={24}
              className="text-muted-foreground"
            />
          </div>
          <h3 className="font-heading font-semibold text-base text-foreground">
            Tidak ada data Calon Anggota
          </h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {search || selectedMajor !== "all" || selectedStatus !== "all"
              ? "Coba ubah kata kunci pencarian atau filter yang Anda pilih."
              : "Belum ada calon anggota yang mendaftar pada gelombang ini."}
          </p>
        </div>
      ) : (
        <>
          {/* =======================================================
              DESKTOP VIEW: HTML table
              ======================================================= */}
          <div className="hidden md:block overflow-x-auto border border-border bg-card rounded-xl shadow-xs">
            <table className="w-full min-w-[960px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60 text-muted-foreground">
                  {/* Checkbox Header */}
                  <th className="p-4 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded-sm accent-primary cursor-pointer"
                    />
                  </th>
                  {/* Foto/Avatar Header */}
                  <th className="p-4 w-16 text-center text-xs font-semibold uppercase tracking-wider">
                    Foto
                  </th>
                  {/* Nama & NIM Header */}
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider">
                    Nama / NIM
                  </th>
                  {/* Kontak Header */}
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider">
                    Kontak
                  </th>
                  {/* Prodi & Jurusan Header */}
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider">
                    Program Studi
                  </th>
                  {/* Status Header */}
                  <th className="p-4 w-44 text-xs font-semibold uppercase tracking-wider">
                    Status Pendaftaran
                  </th>
                  {/* Aksi Header */}
                  <th className="p-4 w-32 text-center text-xs font-semibold uppercase tracking-wider">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredCaang.map((item) => {
                  const isChecked = selectedIds.includes(item.profileId);
                  return (
                    <tr
                      key={item.profileId}
                      className={cn(
                        "hover:bg-muted/40 transition-colors",
                        isChecked ? "bg-primary-soft/30" : "",
                      )}
                    >
                      {/* Checkbox Cell */}
                      <td className="p-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) =>
                            handleSelectRow(item.profileId, e.target.checked)
                          }
                          className="h-4 w-4 rounded-sm accent-primary cursor-pointer"
                        />
                      </td>

                      {/* Avatar Cell */}
                      <td className="p-4 align-middle text-center">
                        <div className="relative h-10 w-10 mx-auto rounded-full border border-border bg-secondary overflow-hidden flex items-center justify-center">
                          {isValidImageUrl(item.photoUrl) ? (
                            <Image
                              src={item.photoUrl}
                              alt={item.fullName}
                              width={40}
                              height={40}
                              className="object-cover h-full w-full"
                              unoptimized
                            />
                          ) : (
                            <span className="font-heading text-sm font-bold text-muted-foreground uppercase">
                              {item.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name / NIM Cell */}
                      <td className="p-4 align-middle">
                        <div
                          className="font-semibold text-foreground truncate max-w-[220px]"
                          title={item.fullName}
                        >
                          {item.fullName}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mt-0.5">
                          {item.nim || "NIM TIDAK ADA"}
                        </div>
                      </td>

                      {/* Email / No HP Cell */}
                      <td className="p-4 align-middle">
                        <div
                          className="text-text-secondary text-xs truncate max-w-[200px]"
                          title={item.email}
                        >
                          {item.email}
                        </div>
                        <div className="font-mono text-xs text-muted-foreground mt-0.5">
                          {item.phoneNumber || "-"}
                        </div>
                      </td>

                      {/* Prodi / Jurusan Cell */}
                      <td className="p-4 align-middle">
                        <div
                          className="text-foreground text-xs font-medium truncate max-w-[200px]"
                          title={item.studyProgramName}
                        >
                          {item.studyProgramName || "Belum Memilih"}
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5 uppercase tracking-wide">
                          {item.majorName || "Belum Memilih"}
                        </div>
                      </td>

                      {/* Status Cell - Interactive Dropdown Switcher */}
                      <td className="p-4 align-middle">
                        {renderStatusDropdown(item)}
                      </td>

                      {/* Actions Cell */}
                      <td className="p-4 align-middle text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <Button
                            variant="outline"
                            size="icon"
                            title="Lihat Detail Profil & Berkas"
                            onClick={() => setViewingCaang(item)}
                            className="h-8.5 w-8.5 rounded-lg border-border text-foreground hover:bg-secondary"
                          >
                            <HugeiconsIcon icon={EyeIcon} size={15} />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            title="Edit Data Pendaftaran"
                            onClick={() => openEditModal(item)}
                            className="h-8.5 w-8.5 rounded-lg border-border text-primary hover:bg-primary-soft hover:text-primary"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={15} />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            title="Hapus Data (Soft Delete)"
                            onClick={() => {
                              setDeletingCaangId(item.profileId);
                              setDeleteReasonText("");
                            }}
                            className="h-8.5 w-8.5 rounded-lg border-border text-destructive hover:bg-destructive/10 hover:text-destructive"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={15} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* =======================================================
              MOBILE VIEW: Card layout
              ======================================================= */}
          <div className="block md:hidden space-y-3.5">
            {filteredCaang.map((item) => {
              const isChecked = selectedIds.includes(item.profileId);
              return (
                <div
                  key={item.profileId}
                  className={cn(
                    "border border-border bg-card p-4 rounded-xl space-y-3 relative shadow-xs transition-colors",
                    isChecked
                      ? "ring-2 ring-primary/40 bg-primary-soft/20"
                      : "",
                  )}
                >
                  {/* Card Header: Checkbox, Avatar, Status Dropdown */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          handleSelectRow(item.profileId, e.target.checked)
                        }
                        className="h-4 w-4 rounded-sm accent-primary cursor-pointer shrink-0"
                      />
                      <div className="relative h-10 w-10 rounded-full border border-border bg-secondary overflow-hidden flex items-center justify-center shrink-0">
                        {isValidImageUrl(item.photoUrl) ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.fullName}
                            width={40}
                            height={40}
                            className="object-cover h-full w-full"
                            unoptimized
                          />
                        ) : (
                          <span className="font-heading text-sm font-bold text-muted-foreground uppercase">
                            {item.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-semibold text-foreground truncate block">
                          {item.fullName}
                        </span>
                        <span className="font-mono text-xs text-muted-foreground">
                          {item.nim || "NIM -"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status switcher on mobile */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/60">
                    <span className="text-xs font-medium text-muted-foreground">
                      Status:
                    </span>
                    {renderStatusDropdown(item)}
                  </div>

                  {/* Card Content: Details */}
                  <div className="space-y-2 pt-1 text-xs border-t border-border/60">
                    {/* Email & No. HP */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                          Email
                        </span>
                        <span className="text-xs text-text-secondary truncate block">
                          {item.email}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                          No. HP
                        </span>
                        <span className="text-xs text-text-secondary font-mono">
                          {item.phoneNumber || "-"}
                        </span>
                      </div>
                    </div>

                    {/* Prodi & Jurusan */}
                    <div className="pt-1">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block">
                        Prodi / Jurusan
                      </span>
                      <span className="text-xs text-foreground font-medium block">
                        {item.studyProgramName || "Belum Memilih"}
                      </span>
                      <span className="text-[11px] text-muted-foreground block uppercase">
                        {item.majorName || "Belum Memilih"}
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 border-t border-border/60 pt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setViewingCaang(item)}
                      className="rounded-lg border-border text-xs px-3 h-9"
                    >
                      <HugeiconsIcon
                        icon={EyeIcon}
                        size={14}
                        className="mr-1"
                      />
                      Detail
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      className="rounded-lg border-border text-primary text-xs px-3 h-9 hover:bg-primary-soft hover:text-primary"
                    >
                      <HugeiconsIcon
                        icon={Edit02Icon}
                        size={14}
                        className="mr-1"
                      />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setDeletingCaangId(item.profileId);
                        setDeleteReasonText("");
                      }}
                      className="rounded-lg border-border text-destructive text-xs px-3 h-9 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <HugeiconsIcon
                        icon={Delete01Icon}
                        size={14}
                        className="mr-1"
                      />
                      Hapus
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =======================================================
          MODAL: REVISION NOTES DIALOG (KETIKA ADMIN MEMILIH REVISI)
          ======================================================= */}
      <Dialog
        open={!!revisionModalCaang}
        onOpenChange={(open) => !open && setRevisionModalCaang(null)}
      >
        <DialogContent className="rounded-2xl max-w-lg bg-card border border-border shadow-xl">
          {revisionModalCaang && (
            <form onSubmit={handleRevisionSubmit}>
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="font-heading text-lg font-bold text-foreground flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300">
                    <HugeiconsIcon icon={AlertCircleIcon} size={18} />
                  </div>
                  Catatan Revisi Calon Anggota
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-1">
                  Kirim catatan kepada{" "}
                  <strong className="text-foreground">
                    {revisionModalCaang.fullName}
                  </strong>{" "}
                  ({revisionModalCaang.nim || "Caang"}) mengenai data atau
                  berkas yang perlu diperbaiki.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4 space-y-3.5">
                {/* Quick Presets */}
                <div>
                  <span className="text-xs font-semibold text-foreground block mb-1.5">
                    Pilihan Cepat Catatan Revisi:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_REVISION_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          if (revisionNotesInput) {
                            setRevisionNotesInput(
                              (prev) => `${prev}\n• ${preset}`,
                            );
                          } else {
                            setRevisionNotesInput(preset);
                          }
                        }}
                        className="text-[11px] text-left px-2.5 py-1 rounded-full bg-secondary hover:bg-primary-soft hover:text-primary text-text-secondary border border-border transition-colors cursor-pointer"
                      >
                        + {preset.slice(0, 38)}...
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="revision-notes-text"
                    className="text-xs font-medium text-foreground"
                  >
                    Instruksi / Catatan Revisi *
                  </Label>
                  <textarea
                    id="revision-notes-text"
                    rows={4}
                    value={revisionNotesInput}
                    onChange={(e) => setRevisionNotesInput(e.target.value)}
                    placeholder="Tuliskan dengan spesifik apa yang harus diperbaiki calon anggota..."
                    className="w-full bg-background p-3 rounded-xl border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground placeholder:text-xs leading-relaxed"
                    required
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Catatan ini akan tampil langsung di halaman dashboard /
                    status pendaftaran calon anggota.
                  </p>
                </div>
              </div>

              <DialogFooter className="border-t border-border pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setRevisionModalCaang(null)}
                  className="rounded-lg text-xs h-10 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingStatus || !revisionNotesInput.trim()}
                  className="rounded-lg bg-sky-600 hover:bg-sky-700 text-white text-xs h-10 px-4 font-semibold"
                >
                  {isSubmittingStatus
                    ? "Menyimpan..."
                    : "Kirim Revisi ke Calon Anggota"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          MODAL: VIEW CAANG DETAIL
          ======================================================= */}
      <Dialog
        open={!!viewingCaang}
        onOpenChange={(open) => !open && setViewingCaang(null)}
      >
        <DialogContent className="rounded-2xl max-w-2xl bg-card border border-border shadow-xl overflow-y-auto max-h-[90vh]">
          {viewingCaang && (
            <>
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="font-heading text-lg font-bold text-foreground">
                  Detail Calon Anggota
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Profil Lengkap, Riwayat Pendaftaran, dan Berkas Persyaratan
                </DialogDescription>
              </DialogHeader>

              {/* Detail Content Grid */}
              <div className="space-y-5 py-4">
                {/* Section 1: Utama & Foto */}
                <div className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-border">
                  <div className="relative h-28 w-24 shrink-0 rounded-xl border border-border bg-secondary overflow-hidden flex items-center justify-center">
                    {isValidImageUrl(viewingCaang.photoUrl) ? (
                      <Image
                        src={viewingCaang.photoUrl}
                        alt={viewingCaang.fullName}
                        width={96}
                        height={112}
                        className="object-cover h-full w-full"
                        unoptimized
                      />
                    ) : (
                      <span className="font-heading text-2xl font-bold text-muted-foreground uppercase">
                        {viewingCaang.fullName.charAt(0)}
                      </span>
                    )}
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <h3 className="font-heading font-bold text-lg text-foreground tracking-tight leading-tight">
                        {viewingCaang.fullName}
                      </h3>
                      {renderStatusDropdown(viewingCaang)}
                    </div>
                    <p className="text-xs font-mono font-semibold text-primary">
                      NIM: {viewingCaang.nim || "NIM TIDAK ADA"}
                    </p>
                    <p className="text-xs text-text-secondary">
                      Panggilan: {viewingCaang.nickname || "-"} • Gender:{" "}
                      {viewingCaang.gender === "L"
                        ? "Laki-laki"
                        : viewingCaang.gender === "P"
                          ? "Perempuan"
                          : "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Tempat, Tgl Lahir: {viewingCaang.pob || "-"},{" "}
                      {viewingCaang.dob || "-"}
                    </p>

                    {/* Revision Note preview if any */}
                    {viewingCaang.status === "revision" &&
                      viewingCaang.revisionNotes && (
                        <div className="mt-2 p-2.5 rounded-lg bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-800 dark:text-sky-300">
                          <span className="font-semibold block mb-0.5">
                            Catatan Revisi:
                          </span>
                          <p className="whitespace-pre-wrap">
                            {viewingCaang.revisionNotes}
                          </p>
                        </div>
                      )}
                  </div>
                </div>

                {/* Section 2: Informasi Akademik */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Informasi Akademik
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-secondary/60 p-3.5 rounded-xl border border-border/70 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Program Studi
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {viewingCaang.studyProgramName || "Belum Memilih"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Jurusan
                      </span>
                      <span className="text-xs font-medium text-foreground">
                        {viewingCaang.majorName || "Belum Memilih"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Sekolah Asal
                      </span>
                      <span className="text-xs text-foreground">
                        {viewingCaang.highSchool || "-"}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Kelas Saat Ini
                      </span>
                      <span className="text-xs text-foreground">
                        {viewingCaang.currentClass || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Kontak & Alamat */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Kontak & Alamat
                  </h4>
                  <div className="grid grid-cols-2 gap-3 bg-secondary/60 p-3.5 rounded-xl border border-border/70 text-xs">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Email
                      </span>
                      <span className="text-xs text-foreground break-all font-mono">
                        {viewingCaang.email}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        No. Telepon / WhatsApp
                      </span>
                      <span className="text-xs text-foreground font-mono">
                        {viewingCaang.phoneNumber || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Alamat Asal
                      </span>
                      <span className="text-xs text-foreground">
                        {viewingCaang.originAddress || "-"}
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Alamat Domisili
                      </span>
                      <span className="text-xs text-foreground">
                        {viewingCaang.domicileAddress || "-"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Narasi Pendaftaran */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Naratif & Pengalaman
                  </h4>
                  <div className="space-y-2.5">
                    <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Motivasi Bergabung
                      </span>
                      <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                        {viewingCaang.motivation || "Tidak diisi"}
                      </p>
                    </div>
                    <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Pengalaman Organisasi
                      </span>
                      <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                        {viewingCaang.orgExperience || "Tidak ada"}
                      </p>
                    </div>
                    <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/70">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                        Prestasi / Penghargaan
                      </span>
                      <p className="text-xs text-text-secondary mt-1 whitespace-pre-wrap leading-relaxed">
                        {viewingCaang.achievements || "Tidak ada"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Bukti Administrasi & Pembayaran */}
                <div className="space-y-2.5 border-t border-border pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Berkas Persyaratan & Bukti Pembayaran
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    {/* KTM */}
                    <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/70 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          Bukti KTM / Mahasiswa
                        </span>
                        {viewingCaang.ktmUrl ? (
                          <div className="relative h-32 w-full mt-2 rounded-lg border border-border overflow-hidden bg-background">
                            <Image
                              src={viewingCaang.ktmUrl}
                              alt="KTM"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Tidak diunggah
                          </p>
                        )}
                      </div>
                      {viewingCaang.ktmUrl && (
                        <a
                          href={viewingCaang.ktmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center text-xs font-semibold text-primary hover:underline"
                        >
                          Buka Gambar Penuh ↗
                        </a>
                      )}
                    </div>

                    {/* Bukti Bayar */}
                    <div className="bg-secondary/60 p-3.5 rounded-xl border border-border/70 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          Bukti Pembayaran
                        </span>
                        <p className="text-[11px] text-muted-foreground mt-0.5">
                          Metode:{" "}
                          <strong className="text-foreground">
                            {viewingCaang.paymentMethod || "Manual"}
                          </strong>
                        </p>
                        {viewingCaang.paymentProofUrl ? (
                          <div className="relative h-32 w-full mt-2 rounded-lg border border-border overflow-hidden bg-background">
                            <Image
                              src={viewingCaang.paymentProofUrl}
                              alt="Bukti Bayar"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Tidak diunggah
                          </p>
                        )}
                      </div>
                      {viewingCaang.paymentProofUrl && (
                        <a
                          href={viewingCaang.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center text-xs font-semibold text-primary hover:underline"
                        >
                          Buka Gambar Penuh ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 6: Bukti Media Sosial */}
                <div className="space-y-2.5 border-t border-border pt-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Bukti Follow & Subscribe Media Sosial
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* IG Robotik */}
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/70 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          IG Robotik PNP
                        </span>
                        {viewingCaang.proofFollowRobotik ? (
                          <div className="relative h-28 w-full mt-2 rounded-lg border border-border overflow-hidden bg-background">
                            <Image
                              src={viewingCaang.proofFollowRobotik}
                              alt="IG Robotik"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Tidak ada
                          </p>
                        )}
                      </div>
                      {viewingCaang.proofFollowRobotik && (
                        <a
                          href={viewingCaang.proofFollowRobotik}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block text-center text-[11px] font-semibold text-primary hover:underline"
                        >
                          Buka Penuh ↗
                        </a>
                      )}
                    </div>

                    {/* IG MRC */}
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/70 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          IG Minangkabau RC
                        </span>
                        {viewingCaang.proofFollowMrc ? (
                          <div className="relative h-28 w-full mt-2 rounded-lg border border-border overflow-hidden bg-background">
                            <Image
                              src={viewingCaang.proofFollowMrc}
                              alt="IG MRC"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Tidak ada
                          </p>
                        )}
                      </div>
                      {viewingCaang.proofFollowMrc && (
                        <a
                          href={viewingCaang.proofFollowMrc}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block text-center text-[11px] font-semibold text-primary hover:underline"
                        >
                          Buka Penuh ↗
                        </a>
                      )}
                    </div>

                    {/* YouTube */}
                    <div className="bg-secondary/60 p-3 rounded-xl border border-border/70 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">
                          YouTube UKM
                        </span>
                        {viewingCaang.proofSubYt ? (
                          <div className="relative h-28 w-full mt-2 rounded-lg border border-border overflow-hidden bg-background">
                            <Image
                              src={viewingCaang.proofSubYt}
                              alt="YouTube"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic mt-2">
                            Tidak ada
                          </p>
                        )}
                      </div>
                      {viewingCaang.proofSubYt && (
                        <a
                          href={viewingCaang.proofSubYt}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-2 block text-center text-[11px] font-semibold text-primary hover:underline"
                        >
                          Buka Penuh ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-border pt-3">
                <Button
                  onClick={() => setViewingCaang(null)}
                  className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold px-5 h-10"
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          MODAL: EDIT CAANG
          ======================================================= */}
      <Dialog
        open={!!editingCaang}
        onOpenChange={(open) => !open && setEditingCaang(null)}
      >
        <DialogContent className="rounded-2xl max-w-2xl bg-card border border-border shadow-xl overflow-y-auto max-h-[90vh]">
          {editingCaang && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader className="border-b border-border pb-3">
                <DialogTitle className="font-heading text-lg font-bold text-foreground">
                  Edit Data Calon Anggota
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  Perbarui informasi biodata dasar dan status pendaftaran calon
                  anggota.
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-name"
                    className="text-xs font-semibold text-foreground"
                  >
                    Nama Lengkap *
                  </Label>
                  <Input
                    id="edit-name"
                    value={editForm.fullName}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        fullName: e.target.value,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10"
                  />
                </div>

                {/* Nickname */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-nickname"
                    className="text-xs font-semibold text-foreground"
                  >
                    Nama Panggilan *
                  </Label>
                  <Input
                    id="edit-nickname"
                    value={editForm.nickname}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        nickname: e.target.value,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-gender"
                    className="text-xs font-semibold text-foreground"
                  >
                    Jenis Kelamin *
                  </Label>
                  <select
                    id="edit-gender"
                    value={editForm.gender}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        gender: e.target.value,
                      }))
                    }
                    className="h-10 w-full bg-background px-3.5 rounded-lg border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="" disabled>
                      Pilih Jenis Kelamin
                    </option>
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-phone"
                    className="text-xs font-semibold text-foreground"
                  >
                    No. Telepon / WhatsApp *
                  </Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phoneNumber}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        phoneNumber: e.target.value,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10 font-mono"
                  />
                </div>

                {/* Tempat Lahir */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-pob"
                    className="text-xs font-semibold text-foreground"
                  >
                    Tempat Lahir *
                  </Label>
                  <Input
                    id="edit-pob"
                    value={editForm.pob}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, pob: e.target.value }))
                    }
                    className="rounded-lg border-border text-sm h-10"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-dob"
                    className="text-xs font-semibold text-foreground"
                  >
                    Tanggal Lahir *
                  </Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editForm.dob}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, dob: e.target.value }))
                    }
                    className="rounded-lg border-border text-sm h-10 font-mono"
                  />
                </div>

                {/* Sekolah Asal */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-highschool"
                    className="text-xs font-semibold text-foreground"
                  >
                    Sekolah Asal
                  </Label>
                  <Input
                    id="edit-highschool"
                    value={editForm.highSchool}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        highSchool: e.target.value,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10"
                  />
                </div>

                {/* Kelas Sekarang */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-class"
                    className="text-xs font-semibold text-foreground"
                  >
                    Kelas Sekarang
                  </Label>
                  <Input
                    id="edit-class"
                    value={editForm.currentClass}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        currentClass: e.target.value,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10"
                  />
                </div>

                {/* entry_year */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-entryyear"
                    className="text-xs font-semibold text-foreground"
                  >
                    Tahun Masuk (Angkatan) *
                  </Label>
                  <Input
                    id="edit-entryyear"
                    type="number"
                    value={editForm.entryYear || ""}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        entryYear: e.target.value
                          ? parseInt(e.target.value)
                          : 0,
                      }))
                    }
                    className="rounded-lg border-border text-sm h-10 font-mono"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label
                    htmlFor="edit-status"
                    className="text-xs font-semibold text-foreground"
                  >
                    Status Pendaftaran *
                  </Label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        status: e.target.value,
                      }))
                    }
                    className="h-10 w-full bg-background px-3.5 rounded-lg border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20 cursor-pointer"
                  >
                    <option value="verified">VERIFIED (DITERIMA)</option>
                    <option value="revision">REVISION (PERLU REVISI)</option>
                    <option value="pending">PENDING</option>
                    <option value="process">PROCESS</option>
                    <option value="rejected">REJECTED (DITOLAK)</option>
                  </select>
                </div>

                {/* Revision notes if status is revision */}
                {editForm.status === "revision" && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label
                      htmlFor="edit-revision-notes"
                      className="text-xs font-semibold text-sky-700 dark:text-sky-300"
                    >
                      Catatan Revisi *
                    </Label>
                    <textarea
                      id="edit-revision-notes"
                      value={editForm.revisionNotes}
                      onChange={(e) =>
                        setEditForm((prev) => ({
                          ...prev,
                          revisionNotes: e.target.value,
                        }))
                      }
                      rows={3}
                      placeholder="Tuliskan alasan atau bagian yang perlu direvisi..."
                      className="w-full bg-background p-3 rounded-xl border border-sky-300 dark:border-sky-800 text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-sky-400"
                    />
                  </div>
                )}

                {/* Alamat Asal */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="edit-origin"
                    className="text-xs font-semibold text-foreground"
                  >
                    Alamat Asal *
                  </Label>
                  <textarea
                    id="edit-origin"
                    value={editForm.originAddress}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        originAddress: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full bg-background p-3 rounded-xl border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                {/* Alamat Domisili */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label
                    htmlFor="edit-domicile"
                    className="text-xs font-semibold text-foreground"
                  >
                    Alamat Domisili *
                  </Label>
                  <textarea
                    id="edit-domicile"
                    value={editForm.domicileAddress}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        domicileAddress: e.target.value,
                      }))
                    }
                    rows={2}
                    className="w-full bg-background p-3 rounded-xl border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-border pt-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingCaang(null)}
                  className="rounded-lg text-xs h-10 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold h-10 px-5"
                >
                  {isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          MODAL: DELETE CONFIRMATION (SOFT DELETE)
          ======================================================= */}
      <Dialog
        open={!!deletingCaangId}
        onOpenChange={(open) => !open && setDeletingCaangId(null)}
      >
        <DialogContent className="rounded-2xl max-w-md bg-card border border-border shadow-xl">
          <form onSubmit={handleDeleteConfirm}>
            <DialogHeader className="border-b border-border pb-3">
              <DialogTitle className="font-heading text-lg font-bold text-destructive flex items-center gap-2">
                <HugeiconsIcon icon={Delete01Icon} size={20} />
                Hapus Data Caang (Soft Delete)
              </DialogTitle>
            </DialogHeader>

            <div className="py-4 space-y-3.5 text-xs">
              <p className="text-text-secondary leading-relaxed">
                Apakah Anda yakin ingin menonaktifkan data calon anggota ini?
                Tindakan ini akan menyembunyikan pendaftar dari daftar aktif.
              </p>

              <div className="space-y-1.5">
                <Label
                  htmlFor="delete-reason"
                  className="text-xs font-semibold text-foreground"
                >
                  Alasan Penghapusan *
                </Label>
                <textarea
                  id="delete-reason"
                  placeholder="Contoh: Mengundurkan diri, duplikasi berkas, dll..."
                  value={deleteReasonText}
                  onChange={(e) => setDeleteReasonText(e.target.value)}
                  rows={3}
                  className="w-full bg-background p-3 rounded-xl border border-border text-sm text-foreground focus:outline-hidden focus:ring-2 focus:ring-destructive/20 placeholder:text-muted-foreground placeholder:text-xs"
                  required
                />
              </div>
            </div>

            <DialogFooter className="border-t border-border pt-3 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeletingCaangId(null)}
                className="rounded-lg text-xs h-10 px-4"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={!deleteReasonText.trim()}
                className="rounded-lg bg-destructive hover:bg-destructive/90 text-white text-xs font-semibold h-10 px-5 shadow-xs"
              >
                Konfirmasi Hapus
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
