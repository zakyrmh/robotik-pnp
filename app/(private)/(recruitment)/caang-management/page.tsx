"use client";

import { useState, useEffect, useMemo } from "react";
import {
  collection,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { Gender, RegistrationStatus } from "@/types/enum";

// UI Components
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  Loader2,
  Filter,
  Download,
  CheckCircle,
  Ban,
  User as UserIcon,
  CreditCard,
  School,
} from "lucide-react";
import { toast } from "sonner"; // Asumsi menggunakan Sonner atau Toast library lain
import Image from "next/image";
import FirebaseImage from "@/components/FirebaseImage";
import { useAuth } from "@/hooks/useAuth";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

// --- UTILS & HELPER ---
const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

export default function CaangManagementPage() {
  const { user: currentUser } = useAuth();
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState<User[]>([]);
  const [registrations, setRegistrations] = useState<Map<string, Registration>>(
    new Map()
  );
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState<string>("all");
  const [adminStatusFilter, setAdminStatusFilter] = useState<string>("all"); // all, pending, verified, rejected
  const [departments, setDepartments] = useState<string[]>([]);

  // Selection & Modal
  const [selectedUserIds, setSelectedUserIds] = useState<Set<string>>(
    new Set()
  );
  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  // --- STATE BARU UNTUK BLACKLIST ---
  const [isBlacklistConfirmOpen, setIsBlacklistConfirmOpen] = useState(false);
  const [blacklistReason, setBlacklistReason] = useState("");
  const [isBlacklistLoading, setIsBlacklistLoading] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // 1. Fetch Users dengan role CAANG
        // Catatan: Query firebase tidak bisa filter field nested map secara langsung dengan mudah,
        // jadi kita ambil semua users dulu atau gunakan index khusus.
        // Disini kita asumsi ambil collection users_new lalu filter di client atau query 'roles.isCaang' == true jika sudah di index.
        const usersRef = collection(db, "users_new");
        // Gunakan where clause yang sesuai dengan index firebase Anda.
        // Jika roles disimpan sebagai map boolean, query 'roles.isCaang' == true bisa dilakukan.
        const q = query(usersRef, where("roles.isCaang", "==", true));

        const querySnapshot = await getDocs(q);
        const fetchedUsers: User[] = [];
        const registrationIds: string[] = [];

        querySnapshot.forEach((doc) => {
          const data = { id: doc.id, ...doc.data() } as User;
          fetchedUsers.push(data);
          if (data.registrationId) {
            registrationIds.push(data.registrationId);
          }
        });

        // 2. Fetch Registrations
        const regMap = new Map<string, Registration>();
        if (registrationIds.length > 0) {
          // Optimization: Jika data banyak, gunakan pagination atau fetch by batches (chunks of 10).
          // Untuk sekarang kita fetch all registrations (hati-hati jika ribuan data).
          const regRef = collection(db, "registrations");
          const regSnap = await getDocs(regRef);

          regSnap.forEach((doc) => {
            if (registrationIds.includes(doc.id)) {
              regMap.set(doc.id, { id: doc.id, ...doc.data() } as Registration);
            }
          });
        }

        setUsers(fetchedUsers);
        setRegistrations(regMap);

        // Extract departments for filter
        const uniqueDepts = Array.from(
          new Set(fetchedUsers.map((u) => u.profile.department).filter(Boolean))
        ).sort();
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

  // --- FILTERING LOGIC ---
  const filteredData = useMemo(() => {
    return users.filter((user) => {
      const reg = user.registrationId
        ? registrations.get(user.registrationId)
        : null;

      // 1. Search Text
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        user.profile.fullName.toLowerCase().includes(searchLower) ||
        user.profile.nim.toLowerCase().includes(searchLower);

      // 2. Department Filter
      const matchesDept =
        selectedDepartment === "all" ||
        user.profile.department === selectedDepartment;

      // 3. Admin Status Filter (Pembayaran)
      let matchesAdmin = true;
      if (adminStatusFilter !== "all") {
        if (!reg) {
          matchesAdmin = false; // Belum ada registrasi dianggap tidak match jika filter aktif
        } else {
          if (adminStatusFilter === "pending")
            matchesAdmin = !reg.payment.verified && !!reg.payment.proofUrl;
          if (adminStatusFilter === "verified")
            matchesAdmin = reg.payment.verified;
          if (adminStatusFilter === "rejected")
            matchesAdmin = reg.status === "rejected"; // Asumsi status di reg
          if (adminStatusFilter === "not_uploaded")
            matchesAdmin = !reg.payment.proofUrl;
        }
      }

      return matchesSearch && matchesDept && matchesAdmin;
    });
  }, [
    users,
    registrations,
    searchQuery,
    selectedDepartment,
    adminStatusFilter,
  ]);

  // --- STATISTICS LOGIC ---
  const stats = useMemo(() => {
    const total = users.length;
    let pendingVerification = 0;
    let activeLolos = 0;
    let blacklisted = 0;

    users.forEach((user) => {
      const reg = user.registrationId
        ? registrations.get(user.registrationId)
        : null;

      // Menunggu Verifikasi: Sudah upload bukti bayar TAPI verified false
      if (reg && reg.payment.proofUrl && !reg.payment.verified) {
        pendingVerification++;
      }

      // Lolos/Active: User isActive true
      if (user.isActive) {
        activeLolos++;
      }

      // Blacklist
      if (user.blacklistInfo?.isBlacklisted) {
        blacklisted++;
      }
    });

    return { total, pendingVerification, activeLolos, blacklisted };
  }, [users, registrations]);

  // --- ACTIONS ---

  const handleOpenDetail = (user: User) => {
    setSelectedUserForDetail(user);
    setIsDetailOpen(true);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUserIds(new Set(filteredData.map((u) => u.id)));
    } else {
      setSelectedUserIds(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSet = new Set(selectedUserIds);
    if (checked) newSet.add(userId);
    else newSet.delete(userId);
    setSelectedUserIds(newSet);
  };

  const handleExportCSV = () => {
    // Header
    const headers = [
      "Nama Lengkap",
      "NIM",
      "Jurusan",
      "No HP",
      "Status Bayar",
      "Status Seleksi",
    ];

    // Rows
    const rows = filteredData.map((user) => {
      const reg = user.registrationId
        ? registrations.get(user.registrationId)
        : null;
      const paymentStatus = reg?.payment.verified
        ? "Lunas"
        : reg?.payment.proofUrl
          ? "Pending"
          : "Belum Bayar";

      return [
        `"${user.profile.fullName}"`,
        `"${user.profile.nim}"`,
        `"${user.profile.department}"`,
        `'${user.profile.phone}`, // Tanda petik satu agar excel baca sebagai text
        paymentStatus,
        user.isActive ? "Aktif" : "Tidak Aktif",
      ].join(",");
    });

    const csvContent =
      "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `data_caang_${new Date().toISOString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- ACTIONS (MOCKUP / TODO IMPLEMENTATION) ---
  const handleVerifyPayment = async (regId: string) => {
    if (!confirm("Konfirmasi pembayaran ini valid?")) return;

    try {
      // Logic update firebase
      const regRef = doc(db, "registrations", regId);
      await updateDoc(regRef, {
        "payment.verified": true,
        "payment.verifiedAt": Timestamp.now(),
        status: "verified", // Update status global registrasi juga
      });

      // Update local state untuk UI instant feedback
      setRegistrations((prev) => {
        const newMap = new Map(prev);
        const current = newMap.get(regId);
        if (current) {
          newMap.set(regId, {
            ...current,
            payment: { ...current.payment, verified: true },
            status: RegistrationStatus.VERIFIED,
          });
        }
        return newMap;
      });
      toast.success("Pembayaran berhasil diverifikasi");
    } catch (e) {
      console.error(e);
      toast.error("Gagal verifikasi");
    }
  };

  const handleBlacklistSubmit = async () => {
    if (!selectedUserForDetail || !currentUser) {
      toast.error("Terjadi kesalahan: Data user atau admin tidak ditemukan.");
      return;
    }

    if (!blacklistReason.trim()) {
      toast.error("Harap isi alasan blacklist.");
      return;
    }

    // Ambil data registrasi untuk mendapatkan periode (orPeriod)
    const userRegId = selectedUserForDetail.registrationId;
    const userReg = userRegId ? registrations.get(userRegId) : null;

    // Fallback jika data registrasi tidak valid/hilang, set default atau handle error
    const currentPeriod = userReg?.orPeriod || "Unknown";

    try {
      setIsBlacklistLoading(true);
      const userRef = doc(db, "users_new", selectedUserForDetail.id);

      // Siapkan object update sesuai interface BlacklistData & User
      const blacklistUpdate = {
        isActive: false, // 2. Nonaktifkan user
        blacklistInfo: {
          isBlacklisted: true,
          reason: blacklistReason,
          bannedAt: Timestamp.now(),
          bannedBy: currentUser.uid, // UID Admin dari useAuth
          period: currentPeriod,     // Periode dari data registrasi
        },
      };

      await updateDoc(userRef, blacklistUpdate);

      // Update Local State agar UI langsung berubah tanpa refresh
      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === selectedUserForDetail.id) {
            return {
              ...u,
              isActive: false,
              blacklistInfo: {
                bannedAt: Timestamp.now(),
                isBlacklisted: true,
                reason: blacklistReason,
                bannedBy: currentUser.uid,
                period: currentPeriod,
              },
            };
          }
          return u;
        })
      );

      toast.success(`User ${selectedUserForDetail.profile.fullName} berhasil di-blacklist.`);

      // Reset & Close Modals
      setIsBlacklistConfirmOpen(false); // Tutup popup konfirmasi
      setIsDetailOpen(false);           // Tutup popup detail user (opsional, tergantung UX yg dimau)
      setBlacklistReason("");           // Reset form

    } catch (error) {
      console.error("Error blacklisting user:", error);
      toast.error("Gagal melakukan blacklist peserta.");
    } finally {
      setIsBlacklistLoading(false);
    }
  };

  // --- RENDER ---

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Memuat Data Caang...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 pb-20">
      {/* 1. Header & Quick Stats */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Caang</h1>
          <p className="text-muted-foreground">
            Monitoring dan pengelolaan data peserta Open Recruitment.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Pendaftar"
            value={stats.total}
            icon={<UserIcon className="h-4 w-4" />}
          />
          <StatsCard
            title="Menunggu Verifikasi"
            value={stats.pendingVerification}
            icon={<CreditCard className="h-4 w-4" />}
            variant="warning"
          />
          <StatsCard
            title="Lolos / Aktif"
            value={stats.activeLolos}
            icon={<CheckCircle className="h-4 w-4" />}
            variant="success"
          />
          <StatsCard
            title="Blacklist / Gugur"
            value={stats.blacklisted}
            icon={<Ban className="h-4 w-4" />}
            variant="destructive"
          />
        </div>
      </div>

      {/* 2. Advanced Filters & Toolbar */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search */}
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari Nama atau NIM..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Filters Group */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select
                value={selectedDepartment}
                onValueChange={setSelectedDepartment}
              >
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Semua Prodi" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Prodi</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={adminStatusFilter}
                onValueChange={setAdminStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <CreditCard className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status Bayar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                  <SelectItem value="verified">
                    Lunas / Terverifikasi
                  </SelectItem>
                  <SelectItem value="not_uploaded">Belum Upload</SelectItem>
                  <SelectItem value="rejected">Ditolak</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExportCSV}>
                <Download className="mr-2 h-4 w-4" /> Export
              </Button>
            </div>
          </div>

          {/* Bulk Action Indicator */}
          {selectedUserIds.size > 0 && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-sm animate-in fade-in">
              <span className="font-semibold">
                {selectedUserIds.size} orang terpilih.
              </span>
              <Button size="sm" variant="secondary">
                Verifikasi Massal
              </Button>
              <Button size="sm" variant="destructive">
                Blacklist Massal
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Main Table */}
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    filteredData.length > 0 &&
                    selectedUserIds.size === filteredData.length
                  }
                  onCheckedChange={(c) => handleSelectAll(!!c)}
                />
              </TableHead>
              <TableHead>Profil Peserta</TableHead>
              <TableHead>Prodi / Jurusan</TableHead>
              <TableHead>Kontak</TableHead>
              <TableHead>Status Administrasi</TableHead>
              <TableHead>Status Seleksi</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Tidak ada data yang cocok dengan filter.
                </TableCell>
              </TableRow>
            ) : (
              filteredData.map((user) => {
                const reg = user.registrationId
                  ? registrations.get(user.registrationId)
                  : null;
                const isSelected = selectedUserIds.has(user.id);

                return (
                  <TableRow
                    key={user.id}
                    className={isSelected ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(c) => handleSelectUser(user.id, !!c)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                          {user.profile.photoUrl ? (
                            <FirebaseImage
                              path={user.profile.photoUrl}
                              width={100}
                              height={100}
                              alt={user.profile.fullName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {user.profile.fullName}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {user.profile.nim}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {user.profile.department}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {user.profile.major}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={`https://wa.me/${user.profile.phone
                          .replace(/^0/, "62")
                          .replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline text-sm flex items-center gap-1"
                      >
                        {user.profile.phone}
                      </a>
                    </TableCell>
                    <TableCell>
                      {/* Badge Pembayaran */}
                      {!reg?.payment.proofUrl ? (
                        <Badge variant="outline" className="text-gray-500">
                          Belum Upload
                        </Badge>
                      ) : reg.payment.verified ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100 border-green-200">
                          Lunas
                        </Badge>
                      ) : (
                        <Badge
                          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 border-yellow-200 cursor-pointer"
                          onClick={() => handleOpenDetail(user)}
                        >
                          Menunggu Verifikasi
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {/* Badge Kelulusan/Status Akun */}
                      {user.blacklistInfo?.isBlacklisted ? (
                        <Badge variant="destructive">Blacklist</Badge>
                      ) : user.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-blue-50 text-blue-700 hover:bg-blue-50"
                        >
                          Active / Lolos
                        </Badge>
                      ) : (
                        <Badge variant="outline">Gugur</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {/* Tombol Cepat Verifikasi jika Pending */}
                        {reg?.payment.proofUrl && !reg.payment.verified && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-green-600"
                            onClick={() => handleVerifyPayment(reg.id)}
                            title="Verifikasi Cepat"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenDetail(user)}
                        >
                          Detail
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* 4. Detail Modal (Candidate Profile) */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedUserForDetail &&
            (() => {
              const user = selectedUserForDetail;
              const reg = user.registrationId
                ? registrations.get(user.registrationId)
                : null;

              return (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-xl">
                      {user.profile.fullName}
                      <Badge variant="outline" className="text-sm font-normal">
                        {user.profile.nim}
                      </Badge>
                    </DialogTitle>
                    <DialogDescription>
                      Detail data pendaftar, berkas, dan hasil seleksi.
                    </DialogDescription>
                  </DialogHeader>

                  <Tabs defaultValue="biodata" className="mt-4">
                    <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 gap-1">
                      <TabsTrigger
                        value="biodata"
                        className="h-full whitespace-normal py-2"
                      >
                        Biodata
                      </TabsTrigger>
                      <TabsTrigger
                        value="berkas"
                        className="h-full whitespace-normal py-2"
                      >
                        Berkas & Pembayaran
                      </TabsTrigger>
                      <TabsTrigger
                        value="essay"
                        className="h-full whitespace-normal py-2"
                      >
                        Essay & Motivasi
                      </TabsTrigger>
                      <TabsTrigger
                        value="penilaian"
                        className="h-full whitespace-normal py-2"
                      >
                        Riwayat & Nilai
                      </TabsTrigger>
                    </TabsList>

                    {/* TAB 1: BIODATA */}
                    <TabsContent value="biodata" className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoRow
                          label="Nama Lengkap"
                          value={user.profile.fullName}
                        />
                        <InfoRow label="NIM" value={user.profile.nim} />
                        <InfoRow label="Jurusan" value={user.profile.major} />
                        <InfoRow
                          label="Prodi"
                          value={user.profile.department}
                        />
                        <InfoRow
                          label="Jenis Kelamin"
                          value={
                            user.profile.gender === Gender.MALE
                              ? "Laki-laki"
                              : "Perempuan"
                          }
                        />
                        <InfoRow
                          label="Tempat, Tgl Lahir"
                          value={`${user.profile.birthPlace}, ${formatDate(
                            user.profile.birthDate
                          )}`}
                        />
                        <InfoRow
                          label="No. HP / WA"
                          value={user.profile.phone}
                        />
                        <InfoRow
                          label="Alamat Domisili"
                          value={user.profile.address}
                          className="col-span-2"
                        />
                      </div>
                    </TabsContent>

                    {/* TAB 2: BERKAS & PEMBAYARAN */}
                    <TabsContent value="berkas" className="space-y-6 py-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-base">
                              Pas Foto
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex justify-center">
                            {reg?.documents.photoUrl ? (
                              <Image
                                src={reg.documents.photoUrl ?? ""}
                                className="h-48 rounded object-cover border"
                                width={100}
                                height={100}
                                alt={""}
                              />
                            ) : (
                              <p className="text-muted-foreground italic">
                                Belum upload
                              </p>
                            )}
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base">
                              Bukti Pembayaran
                            </CardTitle>
                            {reg?.payment.verified && (
                              <Badge className="bg-green-600">
                                Terverifikasi
                              </Badge>
                            )}
                          </CardHeader>
                          <CardContent className="flex flex-col gap-4">
                            <div className="bg-gray-100 rounded h-48 flex items-center justify-center overflow-hidden border">
                              {reg?.payment.proofUrl ? (
                                <a
                                  href={reg.payment.proofUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  <Image
                                    src={reg.payment.proofUrl}
                                    className="h-full w-full object-contain hover:scale-105 transition-transform"
                                    alt=""
                                    width={100}
                                    height={100}
                                  />
                                </a>
                              ) : (
                                <p className="text-muted-foreground italic">
                                  Belum upload bukti bayar
                                </p>
                              )}
                            </div>

                            {/* Action Buttons inside Modal */}
                            {reg?.payment.proofUrl && !reg.payment.verified && (
                              <div className="flex gap-2">
                                <Button
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  onClick={() => handleVerifyPayment(reg.id)}
                                >
                                  Terima Pembayaran
                                </Button>
                                <Button
                                  variant="destructive"
                                  className="w-full"
                                >
                                  Tolak
                                </Button>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </TabsContent>

                    {/* TAB 3: ESSAY */}
                    <TabsContent value="essay" className="space-y-4 py-4">
                      <div className="space-y-4">
                        <div>
                          <h3 className="font-semibold mb-1">
                            Motivasi Masuk Robotik
                          </h3>
                          <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {reg?.motivation || "Tidak ada data."}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">
                            Pengalaman Organisasi
                          </h3>
                          <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {reg?.experience || "-"}
                          </div>
                        </div>
                        <div>
                          <h3 className="font-semibold mb-1">Prestasi</h3>
                          <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                            {reg?.achievement || "-"}
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    {/* TAB 4: PENILAIAN (Placeholder) */}
                    <TabsContent value="penilaian" className="py-4">
                      <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
                        <School className="h-8 w-8 mb-2" />
                        <p>Data nilai wawancara dan absensi belum tersedia.</p>
                        <Button variant="link" size="sm">
                          Input Nilai Manual
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>

                  <DialogFooter className="mt-6 border-t pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setIsDetailOpen(false)}
                    >
                      Tutup
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setIsBlacklistConfirmOpen(true)}
                      // Disable jika user sudah diblacklist agar tidak double
                      disabled={selectedUserForDetail?.blacklistInfo?.isBlacklisted}
                    >
                      {selectedUserForDetail?.blacklistInfo?.isBlacklisted
                        ? "Sudah Di-blacklist"
                        : "Blacklist Peserta"}
                    </Button>
                  </DialogFooter>
                </>
              );
            })()}
        </DialogContent>
      </Dialog>
      <Dialog open={isBlacklistConfirmOpen} onOpenChange={setIsBlacklistConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Konfirmasi Blacklist</DialogTitle>
            <DialogDescription>
              Tindakan ini akan menonaktifkan akun peserta secara permanen untuk periode ini.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm font-medium">
                Alasan Blacklist <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="Contoh: Etika buruk saat wawancara, melanggar aturan berat..."
                value={blacklistReason}
                onChange={(e) => setBlacklistReason(e.target.value)}
                className="resize-none h-24" // Gunakan class tailwind standard jika component Textarea tidak support className
              />
            </div>

            {/* Review Data Singkat */}
            <div className="bg-red-50 p-3 rounded-md text-sm text-red-800 border border-red-200">
              <p>Peserta: <strong>{selectedUserForDetail?.profile.fullName}</strong></p>
              <p>Periode: <strong>{selectedUserForDetail?.registrationId && registrations.get(selectedUserForDetail.registrationId)?.orPeriod || "-"}</strong></p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBlacklistConfirmOpen(false)}
              disabled={isBlacklistLoading}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleBlacklistSubmit}
              disabled={isBlacklistLoading || !blacklistReason.trim()}
            >
              {isBlacklistLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                "Konfirmasi Blacklist"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB COMPONENTS (Local) ---

function StatsCard({
  title,
  value,
  icon,
  variant = "default",
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "warning" | "success" | "destructive";
}) {
  const getStyles = () => {
    switch (variant) {
      case "warning":
        return "bg-yellow-50 border-yellow-200 text-yellow-900";
      case "success":
        return "bg-green-50 border-green-200 text-green-900";
      case "destructive":
        return "bg-red-50 border-red-200 text-red-900";
      default:
        return "bg-white";
    }
  };

  return (
    <Card className={`${getStyles()} shadow-sm`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="opacity-50">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-sm">{value || "-"}</span>
    </div>
  );
}
