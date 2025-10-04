"use client";

import { motion } from "framer-motion";
import UsersTable from "@/components/Dashboard/UsersTable";
import LoadingSkeleton from "@/components/Dashboard/LoadingSkeleton";
import { useEffect, useState } from "react";
import { CaangRegistration, UserWithCaang } from "@/types/caang";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { exportToCSV } from "@/utils/exportToCSV";
import PaymentModal from "@/components/Dashboard/PaymentModal";
import StatisticsSection from "@/components/Dashboard/StatisticsSection";
import ChartsSection from "@/components/Dashboard/ChartsSection";
import UserDetailModal from "@/components/Dashboard/UserDetailModal";
import formatDate from "@/utils/formatDate";
import { UserAccount } from "@/types/users";

const ANIMATION_VARIANTS = {
  container: {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  },
};

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<UserWithCaang[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserWithCaang | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] =
    useState<UserWithCaang | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const usersData: UserAccount[] = usersSnapshot.docs.map((doc) => ({
          uid: doc.id,
          ...(doc.data() as Omit<UserAccount, "uid">),
        }));

        const caangSnapshot = await getDocs(
          collection(db, "caang_registration")
        );
        const caangData: CaangRegistration[] = caangSnapshot.docs.map(
          (doc) => ({
            uid: doc.id,
            ...(doc.data() as Omit<CaangRegistration, "uid">),
          })
        );

        const merged: UserWithCaang[] = usersData.map((u) => {
          const registration = caangData.find((c) => c.uid === u.uid);
          return { user: u, registration };
        });

        setUsers(merged);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSort = (key: string) => {
    let direction: "asc" | "desc" = "asc";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "asc"
    ) {
      direction = "desc";
    }
    setSortConfig({ key, direction });

    setUsers((prev) =>
      [...prev].sort((a, b) => {
        const aVal = getValueByKey(a, key);
        const bVal = getValueByKey(b, key);

        if (aVal < bVal) return direction === "asc" ? -1 : 1;
        if (aVal > bVal) return direction === "asc" ? 1 : -1;
        return 0;
      })
    );
  };

  const getValueByKey = (user: UserWithCaang, key: string): string => {
    switch (key) {
      case "user.name":
        return user.user?.name || "";
      case "user.email":
        return user.user?.email || "";
      case "registration.namaLengkap":
        return user.registration?.namaLengkap || "";
      case "registration.namaPanggilan":
        return user.registration?.namaPanggilan || "";
      case "registration.nim":
        return user.registration?.nim || "";
      case "registration.namaOrangTua":
        return user.registration?.namaOrangTua || "";
      case "registration.pasFoto":
        return user.registration?.pasFoto || "";
      case "registration.pembayaran":
        return user.registration?.pembayaran || "";
      default:
        return "";
    }
  };

  const handleUserSelect = (user: UserWithCaang) => {
    setSelectedUser(user);
  };

  const handleUserDetailClick = (user: UserWithCaang) => {
    setSelectedUserDetail(user);
  };

  const handleExport = () => {
    exportToCSV(
      users.map((u) => ({
        no: users.indexOf(u) + 1,
        uid: u.user?.uid || "",
        email: u.user?.email || "",
        namaLengkap: u.user?.name || "",
        namaPanggilan: u.registration?.namaPanggilan || "",
        jenisKelamin: u.registration?.jenisKelamin || "",
        agama: u.registration?.agama || "",
        tempatLahir: u.registration?.tempatLahir || "",
        tanggalLahir: formatDate(u.registration?.tanggalLahir),
        noHp: u.registration?.noHp || "",
        instagram: u.registration?.instagram || "",
        alamatAsal: u.registration?.alamatAsal || "",
        alamatDomisili: u.registration?.alamatDomisili || "",
        asalSekolah: u.registration?.asalSekolah || "",
        nim: u.registration?.nim || "",
        jurusan: u.registration?.jurusan || "",
        prodi: u.registration?.prodi || "",
        riwayatOrganisasi: u.registration?.riwayatOrganisasi || "",
        riwayatPrestasi: u.registration?.riwayatPrestasi || "",
        tujuanMasuk: u.registration?.tujuanMasuk || "",
        namaOrangTua: u.registration?.namaOrangTua || "",
        noHpOrangTua: u.registration?.noHpOrangTua || "",
        pasFoto: u.registration?.pasFoto || "",
        followIgRobotik: u.registration?.followIgRobotik || "",
        followIgMrc: u.registration?.followIgMrc || "",
        youtubeRobotik: u.registration?.youtubeRobotik || "",
        pembayaran: u.registration?.pembayaran || "",
      })),
      "caang_registration_21"
    );
  };

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

      <StatisticsSection users={users} />

      <ChartsSection users={users} />

      <motion.div variants={ANIMATION_VARIANTS.item}>
        <UsersTable
          users={users}
          sortConfig={sortConfig}
          onSort={handleSort}
          onUserSelect={handleUserSelect}
          onUserDetailClick={handleUserDetailClick}
          handleExport={handleExport}
        />
      </motion.div>

      {selectedUser && (
        <PaymentModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdate={(updatedUser) => {
            setUsers((prev) =>
              prev.map((u) =>
                u.user?.uid === updatedUser.user?.uid ? updatedUser : u
              )
            );
          }}
        />
      )}

      {selectedUserDetail && (
        <UserDetailModal
          user={selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
        />
      )}
    </motion.div>
  );
}
