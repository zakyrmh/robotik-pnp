"use client";

import { useState, useEffect, useMemo } from "react";
import { Timestamp } from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

// --- SERVICES & TYPES ---
import { RecruitmentService } from "@/lib/firebase/services/recruitmentService";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { RegistrationStatus } from "@/types/enum";

// --- COMPONENTS ---
import StatsOverview from "./_components/StatsOverview";
import FilterToolbar from "./_components/FilterToolbar";
import CaangTable from "./_components/CaangTable";
import CaangDetailModal from "./_components/CaangDetailModal";
import BlacklistDialog from "./_components/BlacklistDialog";

// Tambahan Import UI untuk Konfirmasi
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";

export default function CaangManagementPage() {
  const { user: currentUser } = useAuth();

  // --- STATE: DATA ---
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, Registration>>(new Map());
  const [loading, setLoading] = useState(true);

  // --- STATE: FILTERS ---
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<string[]>([]);

  // --- STATE: SELECTION & MODALS ---
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(new Set());
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- STATE: BLACKLIST (Single & Bulk) ---
  const [isBlacklistConfirmOpen, setIsBlacklistConfirmOpen] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);
  const [isBulkBlacklistMode, setIsBulkBlacklistMode] = useState(false); // Penanda mode

  // --- STATE: BULK VERIFY ---
  const [isBulkVerifyOpen, setIsBulkVerifyOpen] = useState(false);
  const [isBulkVerifyLoading, setIsBulkVerifyLoading] = useState(false);

  // --- 1. FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await RecruitmentService.getCaangUsers();
        const registrationIds = fetchedUsers.map((u) => u.registrationId).filter((id): id is string => !!id);
        const regMap = await RecruitmentService.getRegistrations(registrationIds);

        setUsers(fetchedUsers);
        setRegistrations(regMap);

        const uniqueDepts = Array.from(new Set(fetchedUsers.map((u) => u.profile.department).filter(Boolean))).sort();
        setDepartments(uniqueDepts);
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data caang.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // --- 2. FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const reg = user.registrationId ? registrations.get(user.registrationId) : null;
      
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = user.profile.fullName.toLowerCase().includes(searchLower) || user.profile.nim.toLowerCase().includes(searchLower);
      const matchesDept = selectedDepartment === "all" || user.profile.department === selectedDepartment;
      
      let matchesAdmin = true;
      if (adminStatusFilter !== "all") {
        if (!reg) matchesAdmin = false;
        else {
          if (adminStatusFilter === "pending") matchesAdmin = !reg.payment.verified && !!reg.payment.proofUrl;
          if (adminStatusFilter === "verified") matchesAdmin = reg.payment.verified;
          if (adminStatusFilter === "rejected") matchesAdmin = reg.status === "rejected";
          if (adminStatusFilter === "not_uploaded") matchesAdmin = !reg.payment.proofUrl;
        }
      }
      return matchesSearch && matchesDept && matchesAdmin;
    });
  }, [users, registrations, searchQuery, selectedDepartment, adminStatusFilter]);

  // --- 3. STATISTICS LOGIC ---
  const stats = useMemo(() => {
    const total = users.length;
    let pendingVerification = 0;
    let activeLolos = 0;
    let blacklisted = 0;

    users.forEach((user) => {
      const reg = user.registrationId ? registrations.get(user.registrationId) : null;
      if (reg && reg.payment.proofUrl && !reg.payment.verified) pendingVerification++;
      if (user.isActive) activeLolos++;
      if (user.blacklistInfo?.isBlacklisted) blacklisted++;
    });

    return { total, pendingVerification, activeLolos, blacklisted };
  }, [users, registrations]);

  // --- 4. ACTION HANDLERS (SINGLE) ---
  const handleOpenDetail = (user: User) => {
    setSelectedUserForDetail(user);
    setIsDetailOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedUserIds(new Set(filteredData.map((u) => u.id)));
    else setSelectedUserIds(new Set());
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds);
    if (checked) newSet.add(userId);
    else newSet.delete(userId);
    setSelectedUserIds(newSet);
  };

  const handleVerifyPayment = async (regId: string) => {
    if (!confirm("Konfirmasi pembayaran ini valid?")) return;
    try {
      await RecruitmentService.verifyPayment(regId);
      setRegistrations((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(regId);
        if (current) {
          newMap.set(regId, { ...current, payment: { ...current.payment, verified: true }, status: RegistrationStatus.VERIFIED });
        }
        return newMap;
      });
      toast.success("Pembayaran berhasil diverifikasi");
    } catch (e) {
      console.error(e);
      toast.error("Gagal verifikasi");
    }
  };

  // --- 5. BULK ACTIONS HANDLERS ---

  // A. BULK VERIFY
  const handleBulkVerifyClick = () => {
    if (selectedUserIds.size === 0) {
      toast.warning("Pilih peserta terlebih dahulu.");
      return;
    }
    setIsBulkVerifyOpen(true);
  };

  const handleBulkVerifyConfirm = async () => {
    try {
      setIsBulkVerifyLoading(true);

      // Kumpulkan Registration ID dari user yang dipilih
      const regIdsToVerify: string[] = [];
      const userIds = Array.from(selectedUserIds);

      userIds.forEach(userId => {
        const user = users.find(u => u.id === userId);
        if (user && user.registrationId) {
          const reg = registrations.get(user.registrationId);
          // Hanya verify yg belum verified dan sudah upload
          if (reg && reg.payment.proofUrl && !reg.payment.verified) {
             regIdsToVerify.push(reg.id);
          }
        }
      });

      if (regIdsToVerify.length === 0) {
        toast.info("Tidak ada user terpilih yang perlu diverifikasi (mungkin sudah verified atau belum upload).");
        setIsBulkVerifyOpen(false);
        return;
      }

      await RecruitmentService.bulkVerifyPayments(regIdsToVerify);

      // Update Local State
      setRegistrations((prev) => {
        const newMap = new Map(prev);
        regIdsToVerify.forEach(regId => {
            const current = newMap.get(regId);
            if(current) {
                newMap.set(regId, { 
                    ...current, 
                    payment: { ...current.payment, verified: true }, 
                    status: RegistrationStatus.VERIFIED 
                });
            }
        });
        return newMap;
      });

      toast.success(`Berhasil memverifikasi ${regIdsToVerify.length} pembayaran.`);
      setSelectedUserIds(new Set()); // Reset selection
    } catch (error) {
      console.error("Bulk verify error:", error);
      toast.error("Gagal melakukan verifikasi massal.");
    } finally {
      setIsBulkVerifyLoading(false);
      setIsBulkVerifyOpen(false);
    }
  };

  // B. BULK BLACKLIST
  const handleBulkBlacklistClick = () => {
     if (selectedUserIds.size === 0) {
      toast.warning("Pilih peserta terlebih dahulu.");
      return;
    }
    setIsBulkBlacklistMode(true); // Set mode ke bulk
    setIsBlacklistConfirmOpen(true); // Buka dialog blacklist yang sama
  };

  // C. UNIFIED BLACKLIST SUBMIT (Single & Bulk)
  const handleBlacklistSubmit = async () => {
    if (!currentUser) return;
    if (!blacklistReason.trim()) {
      toast.error("Harap isi alasan blacklist.");
      return;
    }

    setIsBlacklistLoading(true);
    try {
      const period = "2024/2025"; // Idealnya ambil dari config global / data registrasi pertama

      if (isBulkBlacklistMode) {
        // --- LOGIC BULK ---
        const userIds = Array.from(selectedUserIds);
        await RecruitmentService.bulkBlacklistUsers(userIds, currentUser.uid, blacklistReason, period);

        // Update Local State for Bulk
        setUsers((prevUsers) =>
           prevUsers.map((u) => {
             if (userIds.includes(u.id)) {
               return {
                 ...u,
                 isActive: false,
                 blacklistInfo: {
                   isBlacklisted: true,
                   reason: blacklistReason,
                   bannedAt: Timestamp.now(),
                   bannedBy: currentUser.uid,
                   period: period,
                 },
               };
             }
             return u;
           })
        );
        toast.success(`${userIds.length} user berhasil di-blacklist.`);
        setSelectedUserIds(new Set()); // Reset selection

      } else {
        // --- LOGIC SINGLE ---
        if (!selectedUserForDetail) return;
        
        const blacklistData = {
          isActive: false,
          blacklistInfo: {
            isBlacklisted: true,
            reason: blacklistReason,
            bannedAt: Timestamp.now(),
            bannedBy: currentUser.uid,
            period: period, // Ambil dari reg user detail jika ada
          },
        };
        
        await RecruitmentService.blacklistUser(selectedUserForDetail.id, currentUser.uid, blacklistReason, period);
        
        setUsers((prev) => prev.map(u => u.id === selectedUserForDetail.id ? { ...u, ...blacklistData } : u));
        toast.success(`User berhasil di-blacklist.`);
        setIsDetailOpen(false);
      }

      // Reset Form & Close Modal
      setBlacklistReason("");
      setIsBlacklistConfirmOpen(false);
      setIsBulkBlacklistMode(false); // Reset mode

    } catch (error) {
      console.error("Error blacklisting:", error);
      toast.error("Gagal melakukan blacklist.");
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  // Function helper untuk menutup dialog blacklist dan reset mode
  const handleCloseBlacklistDialog = () => {
    setIsBlacklistConfirmOpen(false);
    setIsBulkBlacklistMode(false);
    setBlacklistReason("");
  }


  // --- EXPORT CSV (Sama seperti sebelumnya) ---
  const handleExportCSV = () => { /* ... kode export csv tetap sama ... */ };

  return (
    <div className="space-y-6 p-6 pb-20">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Manajemen Caang</h1>
        <p className="text-muted-foreground">Monitoring dan pengelolaan data peserta Open Recruitment.</p>
      </div>

      <StatsOverview stats={stats} />

      <FilterToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        adminStatusFilter={adminStatusFilter}
        setAdminStatusFilter={setAdminStatusFilter}
        departments={departments}
        handleExportCSV={handleExportCSV}
        selectedCount={selectedUserIds.size}
        // Pasang handler bulk disini
        onBulkVerify={handleBulkVerifyClick} 
        onBulkBlacklist={handleBulkBlacklistClick}
      />

      {loading ? (
        <div className="flex h-64 w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <CaangTable
          data={filteredData}
          registrations={registrations}
          selectedUserIds={selectedUserIds}
          handleSelectAll={handleSelectAll}
          handleSelectUser={handleSelectUser}
          onOpenDetail={handleOpenDetail}
          onVerifyPayment={handleVerifyPayment}
        />
      )}

      {/* COMPONENT: DETAIL MODAL (Single) */}
      <CaangDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        user={selectedUserForDetail}
        registration={selectedUserForDetail?.registrationId ? registrations.get(selectedUserForDetail.registrationId) : null}
        onVerifyPayment={handleVerifyPayment}
        onOpenBlacklist={() => {
            setIsBulkBlacklistMode(false); // Pastikan mode single
            setIsBlacklistConfirmOpen(true);
        }}
      />

      {/* COMPONENT: BLACKLIST DIALOG (Reused for Single & Bulk) */}
      <BlacklistDialog
        isOpen={isBlacklistConfirmOpen}
        onClose={handleCloseBlacklistDialog}
        loading={isBlacklistLoading}
        reason={blacklistReason}
        setReason={setBlacklistReason}
        onSubmit={handleBlacklistSubmit}
        // Kondisional rendering nama
        userName={isBulkBlacklistMode ? `${selectedUserIds.size} Peserta Terpilih` : selectedUserForDetail?.profile.fullName}
        period={isBulkBlacklistMode ? "Periode Saat Ini" : (selectedUserForDetail?.registrationId ? registrations.get(selectedUserForDetail.registrationId)?.orPeriod : "-")}
      />

      {/* COMPONENT: BULK VERIFY CONFIRMATION */}
      <AlertDialog open={isBulkVerifyOpen} onOpenChange={setIsBulkVerifyOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Verifikasi Pembayaran Massal?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan memverifikasi pembayaran untuk <strong>{selectedUserIds.size} peserta</strong> yang dipilih. 
              Sistem hanya akan memproses peserta yang sudah upload bukti bayar namun belum diverifikasi.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkVerifyLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction 
                onClick={(e) => {
                    e.preventDefault(); // Mencegah auto-close dialog
                    handleBulkVerifyConfirm();
                }} 
                disabled={isBulkVerifyLoading}
                className="bg-green-600 hover:bg-green-700"
            >
              {isBulkVerifyLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : "Ya, Verifikasi Semua"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}