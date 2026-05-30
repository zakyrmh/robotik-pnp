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
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { deleteCaang, updateCaang } from "@/lib/actions/caang";
import Image from "next/image";

interface CaangItem {
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
  studyProgramId: string;
  studyProgramName: string;
  majorName: string;
}

interface CaangClientProps {
  initialCaang: CaangItem[];
}

export function CaangClient({ initialCaang }: CaangClientProps) {
  const router = useRouter();

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
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

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
    status: "",
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
      const matchSearch =
        item.fullName.toLowerCase().includes(search.toLowerCase()) ||
        item.nim.toLowerCase().includes(search.toLowerCase()) ||
        item.email.toLowerCase().includes(search.toLowerCase());

      const matchMajor = selectedMajor === "all" || item.majorName === selectedMajor;
      const matchStatus = selectedStatus === "all" || item.status === selectedStatus;

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
      const res = await updateCaang(editingCaang.profileId, editForm);
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

  const handleDeleteConfirm = async () => {
    if (!deletingCaangId) return;

    const toastId = toast.loading("Menghapus akun Caang...");
    try {
      const res = await deleteCaang(deletingCaangId);
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        setDeletingCaangId(null);
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
      `Apakah Anda yakin ingin menghapus ${selectedIds.length} Caang terpilih? Tindakan ini tidak dapat dibatalkan.`
    );
    if (!confirmed) return;

    setIsBulkDeleting(true);
    const toastId = toast.loading(`Menghapus ${selectedIds.length} akun Caang...`);

    let successCount = 0;
    let failCount = 0;

    for (const id of selectedIds) {
      try {
        const res = await deleteCaang(id);
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

  // Helper status badge color
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "verified":
        return (
          <Badge className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5">
            VERIFIED
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-[#e22718]/15 text-[#e22718] border border-[#e22718]/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5 shadow-[0_0_8px_rgba(226,39,24,0.1)]">
            REJECTED
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5">
            PENDING
          </Badge>
        );
      default:
        return (
          <Badge className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 font-mono text-[9px] rounded-none px-2 uppercase py-0.5">
            PROCESS
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-6 w-full max-w-7xl mx-auto px-1 lg:px-4">
      {/* Header Banner */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor Tech Stripe at Top */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon icon={UserGroupIcon} size={22} className="text-[#1c69d4] dark:text-[#0066b1]" />
              Manajemen Calon Anggota (Caang)
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Data Penerimaan Anggota Baru UKM Robotik Politeknik Negeri Padang
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && (
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isBulkDeleting}
                className="rounded-none border border-[#e22718] font-mono text-xs uppercase tracking-wider px-4 py-2 hover:bg-[#e22718]/10 transition-colors h-9"
              >
                <HugeiconsIcon icon={Delete01Icon} size={16} className="mr-2" />
                Hapus Terpilih ({selectedIds.length})
              </Button>
            )}
            
            <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider">
              TOTAL CAANG: {initialCaang.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Filter Controls Panel */}
      <div className="flex flex-col sm:flex-row gap-3 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none">
        {/* Search */}
        <div className="relative flex-1">
          <HugeiconsIcon
            icon={Search01Icon}
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
          />
          <Input
            placeholder="Cari Nama / NIM..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 pl-10 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
          />
        </div>

        {/* Filter Major */}
        <div className="w-full sm:w-48">
          <select
            value={selectedMajor}
            onChange={(e) => setSelectedMajor(e.target.value)}
            className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 px-3 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
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
        <div className="w-full sm:w-44">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 w-full bg-zinc-50/50 dark:bg-zinc-900/30 px-3 rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
          >
            <option value="all">Semua Status</option>
            <option value="process">Process</option>
            <option value="pending">Pending</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {filteredCaang.length === 0 ? (
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center rounded-none">
          <HugeiconsIcon icon={UserGroupIcon} size={40} className="mx-auto text-zinc-400 dark:text-zinc-600 mb-3" />
          <p className="font-mono text-xs uppercase tracking-widest text-zinc-600 dark:text-zinc-400">
            Tidak ada data Calon Anggota ditemukan.
          </p>
        </div>
      ) : (
        <>
          {/* =======================================================
              DESKTOP VIEW: HTML table
              ======================================================= */}
          <div className="hidden md:block overflow-x-auto border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none">
            <table className="w-full min-w-[900px] border-collapse text-left">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/50">
                  {/* Chekbox Header */}
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 rounded-none accent-[#1c69d4] cursor-pointer"
                    />
                  </th>
                  {/* Foto/Avatar Header */}
                  <th className="p-4 w-16 text-center font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Foto
                  </th>
                  {/* Nama & NIM Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Nama / NIM
                  </th>
                  {/* Kontak Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Email / No. HP
                  </th>
                  {/* Prodi & Jurusan Header */}
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Prodi / Jurusan
                  </th>
                  {/* Status Header */}
                  <th className="p-4 w-28 font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Status
                  </th>
                  {/* Aksi Header */}
                  <th className="p-4 w-36 text-center font-mono text-[10px] uppercase tracking-wider font-bold text-zinc-600 dark:text-zinc-400">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {filteredCaang.map((item) => {
                  const isChecked = selectedIds.includes(item.profileId);
                  return (
                    <tr
                      key={item.profileId}
                      className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors"
                    >
                      {/* Checkbox Cell */}
                      <td className="p-4 text-center align-middle">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => handleSelectRow(item.profileId, e.target.checked)}
                          className="h-4 w-4 rounded-none accent-[#1c69d4] cursor-pointer"
                        />
                      </td>

                      {/* Avatar Cell */}
                      <td className="p-4 align-middle text-center">
                        <div className="relative h-10 w-10 mx-auto rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                          {item.photoUrl ? (
                            <Image
                              src={item.photoUrl}
                              alt={item.fullName}
                              width={40}
                              height={40}
                              className="object-cover h-full w-full"
                              unoptimized
                            />
                          ) : (
                            <span className="font-mono text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                              {item.fullName.charAt(0)}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name / NIM Cell */}
                      <td className="p-4 align-middle">
                        <div className="font-semibold text-zinc-900 dark:text-zinc-100 truncate max-w-[200px]" title={item.fullName}>
                          {item.fullName}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5 tracking-wider">
                          {item.nim || "NIM TIDAK ADA"}
                        </div>
                      </td>

                      {/* Email / No HP Cell */}
                      <td className="p-4 align-middle">
                        <div className="text-zinc-800 dark:text-zinc-300 text-xs truncate max-w-[200px]" title={item.email}>
                          {item.email}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5">
                          {item.phoneNumber || "NO HP TIDAK ADA"}
                        </div>
                      </td>

                      {/* Prodi / Jurusan Cell */}
                      <td className="p-4 align-middle">
                        <div className="text-zinc-800 dark:text-zinc-300 text-xs truncate max-w-[200px]" title={item.studyProgramName}>
                          {item.studyProgramName || "BELUM MEMILIH"}
                        </div>
                        <div className="font-mono text-[10px] text-zinc-500 mt-0.5 uppercase tracking-wider">
                          {item.majorName || "BELUM MEMILIH"}
                        </div>
                      </td>

                      {/* Status Cell */}
                      <td className="p-4 align-middle">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Actions Cell */}
                      <td className="p-4 align-middle text-center">
                        <div className="flex justify-center items-center gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Lihat Detail"
                            onClick={() => setViewingCaang(item)}
                            className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 hover:dark:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <HugeiconsIcon icon={EyeIcon} size={16} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Edit Data"
                            onClick={() => openEditModal(item)}
                            className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 text-[#1c69d4] dark:text-[#0066b1] hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <HugeiconsIcon icon={Edit02Icon} size={16} />
                          </Button>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Hapus Akun"
                            onClick={() => setDeletingCaangId(item.profileId)}
                            className="h-8 w-8 rounded-none border border-zinc-200 dark:border-zinc-800 text-[#e22718] hover:bg-zinc-100 dark:hover:bg-zinc-900"
                          >
                            <HugeiconsIcon icon={Delete01Icon} size={16} />
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
          <div className="block md:hidden space-y-4">
            {filteredCaang.map((item) => {
              const isChecked = selectedIds.includes(item.profileId);
              return (
                <div
                  key={item.profileId}
                  className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 rounded-none space-y-3 relative shadow-xs"
                >
                  {/* Card Header: Checkbox, Avatar, Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => handleSelectRow(item.profileId, e.target.checked)}
                        className="h-4 w-4 rounded-none accent-[#1c69d4] cursor-pointer"
                      />
                      <div className="relative h-10 w-10 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={item.fullName}
                            width={40}
                            height={40}
                            className="object-cover h-full w-full"
                            unoptimized
                          />
                        ) : (
                          <span className="font-mono text-sm font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                            {item.fullName.charAt(0)}
                          </span>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  {/* Card Content: Details resembling desktop columns */}
                  <div className="space-y-2 pt-1 font-sans">
                    {/* Nama & NIM */}
                    <div>
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Nama / NIM</span>
                      <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{item.fullName}</span>
                      <span className="font-mono text-[10px] text-zinc-500 ml-2">({item.nim || "NIM -"})</span>
                    </div>

                    {/* Email & No. HP */}
                    <div className="grid grid-cols-2 gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-2">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Email</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 break-all">{item.email}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">No. HP</span>
                        <span className="text-xs text-zinc-700 dark:text-zinc-300 font-mono">{item.phoneNumber || "-"}</span>
                      </div>
                    </div>

                    {/* Prodi & Jurusan */}
                    <div className="border-t border-zinc-100 dark:border-zinc-900 pt-2">
                      <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Prodi / Jurusan</span>
                      <span className="text-xs text-zinc-700 dark:text-zinc-300">{item.studyProgramName || "Belum Memilih"}</span>
                      <span className="font-mono text-[10px] text-zinc-500 block uppercase mt-0.5">{item.majorName || "Belum Memilih"}</span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="flex items-center justify-end gap-2 border-t border-zinc-100 dark:border-zinc-900 pt-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingCaang(item)}
                      className="rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 font-mono text-[10px] uppercase tracking-wider px-3 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <HugeiconsIcon icon={EyeIcon} size={14} className="mr-1.5" />
                      Detail
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(item)}
                      className="rounded-none border border-zinc-200 dark:border-zinc-800 text-[#1c69d4] dark:text-[#0066b1] font-mono text-[10px] uppercase tracking-wider px-3 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <HugeiconsIcon icon={Edit02Icon} size={14} className="mr-1.5" />
                      Edit
                    </Button>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingCaangId(item.profileId)}
                      className="rounded-none border border-zinc-200 dark:border-zinc-800 text-[#e22718] font-mono text-[10px] uppercase tracking-wider px-3 h-8 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                    >
                      <HugeiconsIcon icon={Delete01Icon} size={14} className="mr-1.5" />
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
          MODAL: VIEW CAANG DETAIL
          ======================================================= */}
      <Dialog open={!!viewingCaang} onOpenChange={(open) => !open && setViewingCaang(null)}>
        <DialogContent className="rounded-none max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[90vh]">
          {viewingCaang && (
            <>
              <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3 relative">
                <DialogTitle className="font-sans text-base font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Detail Calon Anggota
                </DialogTitle>
                <DialogDescription className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  Profil Lengkap & Dokumen Pendaftaran
                </DialogDescription>
              </DialogHeader>

              {/* Detail Content Grid */}
              <div className="space-y-6 py-4">
                {/* Section 1: Utama & Foto */}
                <div className="flex flex-col sm:flex-row gap-4 items-start pb-4 border-b border-zinc-100 dark:border-zinc-900">
                  <div className="relative h-28 w-24 shrink-0 rounded-none border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 overflow-hidden flex items-center justify-center">
                    {viewingCaang.photoUrl ? (
                      <Image
                        src={viewingCaang.photoUrl}
                        alt={viewingCaang.fullName}
                        width={96}
                        height={112}
                        className="object-cover h-full w-full"
                        unoptimized
                      />
                    ) : (
                      <span className="font-mono text-2xl font-bold text-zinc-400 dark:text-zinc-500 uppercase">
                        {viewingCaang.fullName.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-zinc-900 dark:text-zinc-50 tracking-tight leading-none uppercase">
                      {viewingCaang.fullName}
                    </h3>
                    <p className="text-xs font-mono font-bold text-zinc-500">
                      NIM: <span className="text-[#1c69d4] dark:text-[#0066b1]">{viewingCaang.nim || "NIM TIDAK ADA"}</span>
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      Panggilan: {viewingCaang.nickname || "-"} | Gender: {viewingCaang.gender === "L" ? "Laki-laki" : viewingCaang.gender === "P" ? "Perempuan" : "-"}
                    </p>
                    <p className="text-xs text-zinc-600 dark:text-zinc-400">
                      TTL: {viewingCaang.pob || "-"}, {viewingCaang.dob || "-"}
                    </p>
                    <p className="pt-1.5">{getStatusBadge(viewingCaang.status)}</p>
                  </div>
                </div>

                {/* Section 2: Informasi Akademik */}
                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Informasi Akademik
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Program Studi</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{viewingCaang.studyProgramName || "Belum Memilih"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Jurusan</span>
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{viewingCaang.majorName || "Belum Memilih"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Sekolah Asal</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200">{viewingCaang.highSchool || "-"}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Kelas Sekarang</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200">{viewingCaang.currentClass || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Section 3: Kontak & Alamat */}
                <div className="space-y-2">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Kontak & Alamat
                  </h4>
                  <div className="grid grid-cols-2 gap-4 bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Email</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200 break-all">{viewingCaang.email}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">No. Telepon / WA</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200 font-mono">{viewingCaang.phoneNumber || "-"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Alamat Asal</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200">{viewingCaang.originAddress || "-"}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Alamat Domisili</span>
                      <span className="text-xs text-zinc-800 dark:text-zinc-200">{viewingCaang.domicileAddress || "-"}</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Narasi Pendaftaran */}
                <div className="space-y-3">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Naratif & Pengalaman
                  </h4>
                  <div className="space-y-3">
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Motivasi</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap">{viewingCaang.motivation || "Tidak diisi"}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Pengalaman Organisasi</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap">{viewingCaang.orgExperience || "Tidak ada"}</p>
                    </div>
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900">
                      <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Prestasi / Penghargaan</span>
                      <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1 whitespace-pre-wrap">{viewingCaang.achievements || "Tidak ada"}</p>
                    </div>
                  </div>
                </div>

                {/* Section 5: Bukti Administrasi & Pembayaran */}
                <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Berkas Pendukung & Pembayaran
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* KTM */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Bukti KTM / Identitas</span>
                        {viewingCaang.ktmUrl ? (
                          <div className="relative h-32 w-full mt-2 border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            <Image
                              src={viewingCaang.ktmUrl}
                              alt="KTM"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">Tidak diunggah</p>
                        )}
                      </div>
                      {viewingCaang.ktmUrl && (
                        <a
                          href={viewingCaang.ktmUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center font-mono text-[10px] font-bold uppercase text-[#1c69d4] hover:underline"
                        >
                          Buka Gambar Penuh
                        </a>
                      )}
                    </div>

                    {/* Bukti Bayar */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Bukti Pembayaran</span>
                        <p className="text-[10px] text-zinc-500 mt-1 font-mono uppercase">Metode: {viewingCaang.paymentMethod || "Tidak diketahui"}</p>
                        {viewingCaang.paymentProofUrl ? (
                          <div className="relative h-32 w-full mt-2 border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            <Image
                              src={viewingCaang.paymentProofUrl}
                              alt="Bukti Pembayaran"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">Tidak diunggah</p>
                        )}
                      </div>
                      {viewingCaang.paymentProofUrl && (
                        <a
                          href={viewingCaang.paymentProofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center font-mono text-[10px] font-bold uppercase text-[#1c69d4] hover:underline"
                        >
                          Buka Gambar Penuh 
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Section 6: Bukti Follow & Subscribe Media Sosial */}
                <div className="space-y-3 border-t border-zinc-200 dark:border-zinc-800 pt-4">
                  <h4 className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    Bukti Media Sosial
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Follow Robotik PNP */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Follow IG Robotik PNP</span>
                        {viewingCaang.proofFollowRobotik ? (
                          <div className="relative h-32 w-full mt-2 border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            <Image
                              src={viewingCaang.proofFollowRobotik}
                              alt="Bukti Follow Instagram Robotik"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">Tidak diunggah</p>
                        )}
                      </div>
                      {viewingCaang.proofFollowRobotik && (
                        <a
                          href={viewingCaang.proofFollowRobotik}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center font-mono text-[10px] font-bold uppercase text-[#1c69d4] hover:underline"
                        >
                          Buka Gambar Penuh
                        </a>
                      )}
                    </div>

                    {/* Follow MRC */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Follow IG Minangkabau Robo</span>
                        {viewingCaang.proofFollowMrc ? (
                          <div className="relative h-32 w-full mt-2 border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            <Image
                              src={viewingCaang.proofFollowMrc}
                              alt="Bukti Follow Instagram MRC"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">Tidak diunggah</p>
                        )}
                      </div>
                      {viewingCaang.proofFollowMrc && (
                        <a
                          href={viewingCaang.proofFollowMrc}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center font-mono text-[10px] font-bold uppercase text-[#1c69d4] hover:underline"
                        >
                          Buka Gambar Penuh
                        </a>
                      )}
                    </div>

                    {/* Subscribe YouTube */}
                    <div className="bg-zinc-50 dark:bg-zinc-900/30 p-3 border border-zinc-150 dark:border-zinc-900 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest block font-mono">Subscribe YouTube UKM</span>
                        {viewingCaang.proofSubYt ? (
                          <div className="relative h-32 w-full mt-2 border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            <Image
                              src={viewingCaang.proofSubYt}
                              alt="Bukti Subscribe YouTube"
                              fill
                              className="object-contain"
                              unoptimized
                            />
                          </div>
                        ) : (
                          <p className="text-xs text-zinc-500 italic mt-2">Tidak diunggah</p>
                        )}
                      </div>
                      {viewingCaang.proofSubYt && (
                        <a
                          href={viewingCaang.proofSubYt}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 block text-center font-mono text-[10px] font-bold uppercase text-[#1c69d4] hover:underline"
                        >
                          Buka Gambar Penuh
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <Button
                  onClick={() => setViewingCaang(null)}
                  className="rounded-none bg-zinc-900 hover:bg-zinc-800 text-white font-mono text-xs uppercase tracking-wider py-4"
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
      <Dialog open={!!editingCaang} onOpenChange={(open) => !open && setEditingCaang(null)}>
        <DialogContent className="rounded-none max-w-2xl bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 overflow-y-auto max-h-[90vh]">
          {editingCaang && (
            <form onSubmit={handleEditSubmit}>
              <DialogHeader className="border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <DialogTitle className="font-sans text-base font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                  Edit Data Caang
                </DialogTitle>
                <DialogDescription className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  Perbarui Informasi Profil Dasar Pendaftar
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 font-sans">
                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-name" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Nama Lengkap *</Label>
                  <Input
                    id="edit-name"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, fullName: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Nickname */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-nickname" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Nama Panggilan *</Label>
                  <Input
                    id="edit-nickname"
                    value={editForm.nickname}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, nickname: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-gender" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Jenis Kelamin *</Label>
                  <select
                    id="edit-gender"
                    value={editForm.gender}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, gender: e.target.value }))}
                    className="h-10 w-full bg-transparent px-3 rounded-none border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                  >
                    <option value="" disabled className="dark:bg-zinc-950">Pilih Jenis Kelamin</option>
                    <option value="L" className="dark:bg-zinc-950">Laki-laki (L)</option>
                    <option value="P" className="dark:bg-zinc-950">Perempuan (P)</option>
                  </select>
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-phone" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">No. Telepon / WA *</Label>
                  <Input
                    id="edit-phone"
                    value={editForm.phoneNumber}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 font-mono focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Tempat Lahir */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-pob" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Tempat Lahir *</Label>
                  <Input
                    id="edit-pob"
                    value={editForm.pob}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, pob: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Tanggal Lahir */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-dob" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Tanggal Lahir *</Label>
                  <Input
                    id="edit-dob"
                    type="date"
                    value={editForm.dob}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, dob: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 font-mono focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Sekolah Asal */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-highschool" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Sekolah Asal</Label>
                  <Input
                    id="edit-highschool"
                    value={editForm.highSchool}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, highSchool: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Kelas Sekarang */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-class" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Kelas Sekarang</Label>
                  <Input
                    id="edit-class"
                    value={editForm.currentClass}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, currentClass: e.target.value }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* entry_year */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-entryyear" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Tahun Masuk *</Label>
                  <Input
                    id="edit-entryyear"
                    type="number"
                    value={editForm.entryYear || ""}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, entryYear: e.target.value ? parseInt(e.target.value) : 0 }))}
                    className="rounded-none border border-zinc-200 dark:border-zinc-800 text-sm h-10 font-mono focus-visible:ring-1 focus-visible:ring-zinc-400 dark:focus-visible:ring-zinc-600"
                  />
                </div>

                {/* Status */}
                <div className="space-y-1.5">
                  <Label htmlFor="edit-status" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Status Pendaftaran *</Label>
                  <select
                    id="edit-status"
                    value={editForm.status}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="h-10 w-full bg-transparent px-3 rounded-none border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                  >
                    <option value="process" className="dark:bg-zinc-950">PROCESS</option>
                    <option value="pending" className="dark:bg-zinc-950">PENDING</option>
                    <option value="verified" className="dark:bg-zinc-950">VERIFIED</option>
                    <option value="rejected" className="dark:bg-zinc-950">REJECTED</option>
                  </select>
                </div>

                {/* Alamat Asal */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-origin" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Alamat Asal *</Label>
                  <textarea
                    id="edit-origin"
                    value={editForm.originAddress}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, originAddress: e.target.value }))}
                    rows={2}
                    className="w-full bg-transparent p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>

                {/* Alamat Domisili */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="edit-domicile" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">Alamat Domisili *</Label>
                  <textarea
                    id="edit-domicile"
                    value={editForm.domicileAddress}
                    onChange={(e) => setEditForm((prev) => ({ ...prev, domicileAddress: e.target.value }))}
                    rows={2}
                    className="w-full bg-transparent p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600"
                  />
                </div>
              </div>

              <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-3">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setEditingCaang(null)}
                  className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-10 px-4"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmittingEdit}
                  className="rounded-none bg-[#1c69d4] hover:bg-[#1059b0] text-white font-mono text-xs uppercase tracking-wider h-10 px-4"
                >
                  {isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* =======================================================
          MODAL: DELETE CONFIRMATION
          ======================================================= */}
      <Dialog open={!!deletingCaangId} onOpenChange={(open) => !open && setDeletingCaangId(null)}>
        <DialogContent className="rounded-none max-w-sm bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800">
          <DialogHeader>
            <DialogTitle className="font-sans text-base font-bold uppercase tracking-widest text-[#e22718]">
              Hapus Akun Caang
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 text-xs text-zinc-600 dark:text-zinc-400 font-sans space-y-2">
            <p>Apakah Anda yakin ingin menghapus akun Calon Anggota ini?</p>
            <p className="font-bold text-[#e22718]">
              Perhatian: Tindakan ini bersifat permanen dan akan menghapus seluruh data rekrutmen serta akun login pengguna yang bersangkutan.
            </p>
          </div>

          <DialogFooter className="border-t border-zinc-200 dark:border-zinc-800 pt-3 mt-4">
            <Button
              variant="ghost"
              onClick={() => setDeletingCaangId(null)}
              className="rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-xs uppercase tracking-wider h-9 px-4"
            >
              Batal
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              className="rounded-none bg-[#e22718] hover:bg-[#c81e12] text-white font-mono text-xs uppercase tracking-wider h-9 px-4 shadow-[0_0_8px_rgba(226,39,24,0.2)]"
            >
              Hapus Permanen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
