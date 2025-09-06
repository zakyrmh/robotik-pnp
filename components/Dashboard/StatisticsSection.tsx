import { motion } from "framer-motion";
import { Users, UserCheck, CheckCircle, AlertCircle } from "lucide-react";
import { FormDataCaang } from "@/types/caang";
import StatCard from "./StatCard";

interface UserData {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
}

interface StatisticsSectionProps {
  users: UserData[];
}

interface Statistics {
  totalUsers: number;
  completedRegistrations: number;
  verifiedPayments: number;
  pendingPayments: number;
  completionRate: number;
}

const ANIMATION_VARIANTS = {
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

export default function StatisticsSection({ users }: StatisticsSectionProps) {
  const calculateStatistics = (users: UserData[]): Statistics => {
    const totalUsers = users.length;
    const completedRegistrations = users.filter(
      (u) => u.caang?.namaPanggilan && u.caang?.nim && u.caang?.namaOrangTua
    ).length;
    const verifiedPayments = users.filter(
      (u) => u.caang?.pembayaran && u.caang?.payment_verification
    ).length;
    const pendingPayments = users.filter(
      (u) => u.caang?.pembayaran && !u.caang?.payment_verification
    ).length;

    return {
      totalUsers,
      completedRegistrations,
      verifiedPayments,
      pendingPayments,
      completionRate:
        totalUsers > 0
          ? Math.round((completedRegistrations / totalUsers) * 100)
          : 0,
    };
  };

  const statistics = calculateStatistics(users);

  return (
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
  );
}
