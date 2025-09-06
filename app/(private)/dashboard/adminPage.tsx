"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { FormDataCaang } from "@/types/caang";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PaymentModal from "@/components/PaymentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Users, 
  GraduationCap, 
  UserCheck, 
  AlertCircle,
  ArrowUpDown,
  CheckCircle,
  XCircle,
  Clock
} from "lucide-react";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Types
type UserData = {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
};

type SortConfig = {
  key: keyof UserData | string;
  direction: "asc" | "desc";
} | null;

type ChartDataItem = {
  name: string;
  value: number;
  percentage: number;
};

type PaymentStatus = "not_paid" | "pending" | "verified";

// Constants
const COLORS = [
  "#0088FE",
  "#00C49F", 
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF4560",
  "#8884d8",
  "#82ca9d",
];

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  }
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));
    //   const data: UserData[] = [];

      const userPromises = usersSnap.docs
        .filter(userDoc => userDoc.data().role !== "admin")
        .map(async (userDoc) => {
          const user = userDoc.data();
          const caangSnap = await getDoc(
            doc(db, "caang_registration", userDoc.id)
          );

          return {
            uid: userDoc.id,
            email: user.email,
            role: user.role,
            namaLengkap: user.namaLengkap,
            caang: caangSnap.exists() ? (caangSnap.data() as FormDataCaang) : undefined,
          };
        });

      const resolvedData = await Promise.all(userPromises);
      setUsers(resolvedData);
    } catch (err) {
      console.error("Gagal ambil data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sorting functions
  const requestSort = useCallback((key: string) => {
    setSortConfig(prevConfig => {
      let direction: "asc" | "desc" = "asc";
      if (prevConfig && prevConfig.key === key && prevConfig.direction === "asc") {
        direction = "desc";
      }
      return { key, direction };
    });
  }, []);

  const getSortableValue = useCallback((user: UserData, key: string): string => {
    if (key.startsWith("caang.")) {
      const caangKey = key.split(".")[1] as keyof FormDataCaang;
      const value = user.caang?.[caangKey];
      
      // Handle different types safely
      if (typeof value === "string") return value;
      if (typeof value === "number") return value;
      if (value && typeof value === "object" && "seconds" in value) {
        // Handle Firestore Timestamp
        return new Date(value.seconds * 1000).toISOString();
      }
      return "";
    }
    
    const value = user[key as keyof UserData];
    return typeof value === "string" ? value : "";
  }, []);

  const sortedUsers = useMemo(() => {
    if (!sortConfig) return users;

    return [...users].sort((a, b) => {
      const aValue = getSortableValue(a, sortConfig.key);
      const bValue = getSortableValue(b, sortConfig.key);

      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [users, sortConfig, getSortableValue]);

  // Chart data calculation
  const countByField = useCallback((field: keyof FormDataCaang): ChartDataItem[] => {
    const counts: Record<string, number> = {};
    const total = users.length;
    
    users.forEach((user) => {
      const value = user.caang?.[field];
      let stringValue: string;
      
      if (typeof value === "string") {
        stringValue = value || "Tidak diisi";
      } else if (typeof value === "number") {
        stringValue = value;
      } else if (value && typeof value === "object" && "seconds" in value) {
        stringValue = new Date(value.seconds * 1000).toLocaleDateString();
      } else {
        stringValue = "Tidak diisi";
      }
      
      counts[stringValue] = (counts[stringValue] || 0) + 1;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name,
      value,
      percentage: Math.round((value / total) * 100)
    }));
  }, [users]);

  const chartData = useMemo(() => ({
    jurusan: countByField("jurusan"),
    prodi: countByField("prodi"),
    jenisKelamin: countByField("jenisKelamin"),
  }), [countByField]);

  // Statistics calculation
  const statistics = useMemo(() => {
    const totalUsers = users.length;
    const completedRegistrations = users.filter(u => 
      u.caang?.namaPanggilan && u.caang?.nim && u.caang?.namaOrangTua
    ).length;
    const verifiedPayments = users.filter(u => 
      u.caang?.pembayaran && u.caang?.payment_verification
    ).length;
    const pendingPayments = users.filter(u => 
      u.caang?.pembayaran && !u.caang?.payment_verification
    ).length;

    return {
      totalUsers,
      completedRegistrations,
      verifiedPayments,
      pendingPayments,
      completionRate: totalUsers > 0 ? Math.round((completedRegistrations / totalUsers) * 100) : 0
    };
  }, [users]);

  // Utility functions
  const getPaymentStatus = (user: UserData): PaymentStatus => {
    const pembayaran = user.caang?.pembayaran;
    const verified = user.caang?.payment_verification;

    if (!pembayaran) return "not_paid";
    if (pembayaran && !verified) return "pending";
    return "verified";
  };

  const renderStatus = (value?: string | number) => {
    const hasValue = value !== undefined && value !== null && value !== "";
    return hasValue ? (
      <Badge variant="outline" className="text-green-600 border-green-600">
        <CheckCircle className="w-3 h-3 mr-1" />
        Lengkap
      </Badge>
    ) : (
      <Badge variant="outline" className="text-red-600 border-red-600">
        <XCircle className="w-3 h-3 mr-1" />
        Kosong
      </Badge>
    );
  };

  const renderPembayaran = (user: UserData) => {
    const status = getPaymentStatus(user);

    switch (status) {
      case "not_paid":
        return (
          <Badge variant="destructive">
            <XCircle className="w-3 h-3 mr-1" />
            Belum Bayar
          </Badge>
        );
      case "pending":
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => setSelectedUser(user)}
            className="bg-yellow-50 hover:bg-yellow-100 text-yellow-700 border-yellow-300"
          >
            <Clock className="w-3 h-3 mr-1" />
            Review
          </Button>
        );
      case "verified":
        return (
          <Badge variant="outline" className="text-green-600 border-green-600">
            <CheckCircle className="w-3 h-3 mr-1" />
            Terverifikasi
          </Badge>
        );
      default:
        return <span>-</span>;
    }
  };

  // Components
  const SortableHeader = ({ label, sortKey }: { label: string; sortKey: string }) => (
    <TableHead
      onClick={() => requestSort(sortKey)}
      className="cursor-pointer select-none hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className="w-3 h-3" />
        {sortConfig?.key === sortKey && (
          <span className="text-xs">
            {sortConfig.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </TableHead>
  );

  const StatCard = ({ 
    title, 
    value, 
    description, 
    icon: Icon, 
    trend 
  }: { 
    title: string; 
    value: string | number; 
    description: string; 
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    trend?: string;
  }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <p className="text-xs text-green-600 mt-1">{trend}</p>
        )}
      </CardContent>
    </Card>
  );

  const ChartCard = ({ 
    title, 
    data 
  }: { 
    title: string; 
    data: ChartDataItem[] 
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="w-full h-64">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: number, name: string) => [
                  `${value} orang (${Math.round((value / users.length) * 100)}%)`,
                  name
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );

  const LoadingSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-[140px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-6 space-y-8">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-bold">Dashboard Admin</h1>
        </div>
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <motion.div 
      className="p-6 space-y-8"
      variants={ANIMATION_VARIANTS.container}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={ANIMATION_VARIANTS.item}>
        <h1 className="text-3xl font-bold mb-2">Dashboard Admin</h1>
        <p className="text-muted-foreground">
          Kelola data calon anggota UKM Robotik PNP
        </p>
      </motion.div>

      {/* Statistics Cards */}
      <motion.div 
        variants={ANIMATION_VARIANTS.item}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <StatCard
          title="Total Pengguna"
          value={statistics.totalUsers}
          description="Jumlah pengguna terdaftar"
          icon={Users}
        />
        <StatCard
          title="Registrasi Lengkap"
          value={statistics.completedRegistrations}
          description={`${statistics.completionRate}% dari total pengguna`}
          icon={UserCheck}
          trend={`${statistics.completionRate}% completion rate`}
        />
        <StatCard
          title="Pembayaran Terverifikasi"
          value={statistics.verifiedPayments}
          description="Pembayaran yang sudah dikonfirmasi"
          icon={CheckCircle}
        />
        <StatCard
          title="Menunggu Verifikasi"
          value={statistics.pendingPayments}
          description="Pembayaran yang perlu direview"
          icon={AlertCircle}
        />
      </motion.div>

      {/* Charts */}
      <motion.div 
        variants={ANIMATION_VARIANTS.item}
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
      >
        <ChartCard title="Statistik Jurusan" data={chartData.jurusan} />
        <ChartCard title="Statistik Program Studi" data={chartData.prodi} />
        <ChartCard title="Statistik Jenis Kelamin" data={chartData.jenisKelamin} />
      </motion.div>

      {/* Table */}
      <motion.div variants={ANIMATION_VARIANTS.item}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5" />
              Data Calon Anggota
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                Data Calon Anggota UKM Robotik PNP ({users.length} pengguna)
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">No</TableHead>
                  <SortableHeader label="Nama" sortKey="namaLengkap" />
                  <SortableHeader label="Email" sortKey="email" />
                  <SortableHeader label="Data Pribadi" sortKey="caang.namaPanggilan" />
                  <SortableHeader label="Pendidikan" sortKey="caang.nim" />
                  <SortableHeader label="Orang Tua/Wali" sortKey="caang.namaOrangTua" />
                  <SortableHeader label="Dokumen" sortKey="caang.pasFoto" />
                  <SortableHeader label="Pembayaran" sortKey="caang.pembayaran" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedUsers.map((user, idx) => (
                  <TableRow key={user.uid} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell className="font-medium">
                      {user.namaLengkap || (
                        <span className="text-muted-foreground italic">
                          Belum diisi
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {user.email}
                    </TableCell>
                    <TableCell>{renderStatus(user.caang?.namaPanggilan)}</TableCell>
                    <TableCell>{renderStatus(user.caang?.nim)}</TableCell>
                    <TableCell>{renderStatus(user.caang?.namaOrangTua)}</TableCell>
                    <TableCell>{renderStatus(user.caang?.pasFoto)}</TableCell>
                    <TableCell>{renderPembayaran(user)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>

      {selectedUser && (
        <PaymentModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUpdated={fetchData}
        />
      )}
    </motion.div>
  );
}