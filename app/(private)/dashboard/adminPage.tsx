"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { FormDataCaang } from "@/types/caang";
import PaymentModal from "@/components/Dashboard/PaymentModal";

import StatisticsSection from "@/components/Dashboard/StatisticsSection";
import ChartsSection from "@/components/Dashboard/ChartsSection";
import UsersTable from "@/components/Dashboard/UsersTable";
import LoadingSkeleton from "@/components/Dashboard/LoadingSkeleton";
import UserDetailModal from "@/components/Dashboard/UserDetailModal";

interface UserData {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
}

interface SortConfig {
  key: keyof UserData | string;
  direction: "asc" | "desc";
}

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
export default function AdminDashboard() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserData | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);

  // Fetch data function
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const usersSnap = await getDocs(collection(db, "users"));

      const userPromises = usersSnap.docs
        .filter((userDoc) => userDoc.data().role !== "admin")
        .map(async (userDoc) => {
          const user = userDoc.data();
          const caangSnap = await getDoc(
            doc(db, "caang_registration", userDoc.id)
          );

          return {
            uid: userDoc.id,
            email: user.email,
            role: user.role,
            namaLengkap: user.name,
            caang: caangSnap.exists()
              ? (caangSnap.data() as FormDataCaang)
              : undefined,
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

  // Function to update single user in the list (optimistic update)
  const updateUserInList = useCallback((updatedUser: UserData) => {
    setUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.uid === updatedUser.uid ? updatedUser : user
      )
    );
  }, []);

  // Sorting functions
  const requestSort = useCallback((key: string) => {
    setSortConfig((prevConfig) => {
      let direction: "asc" | "desc" = "asc";
      if (
        prevConfig &&
        prevConfig.key === key &&
        prevConfig.direction === "asc"
      ) {
        direction = "desc";
      }
      return { key, direction };
    });
  }, []);

  const getSortableValue = useCallback(
    (user: UserData, key: string): string => {
      if (key.startsWith("caang.")) {
        const caangKey = key.split(".")[1] as keyof FormDataCaang;
        const value = user.caang?.[caangKey];

        // Handle different types safely
        if (typeof value === "string") return value;
        if (typeof value === "number") return value;
        if (typeof value === "boolean") return value ? "true" : "false";
        if (value && typeof value === "object" && "seconds" in value) {
          // Handle Firestore Timestamp
          return new Date(value.seconds * 1000).toISOString();
        }
        return "";
      }

      const value = user[key as keyof UserData];
      return typeof value === "string" ? value : "";
    },
    []
  );

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

  // Handler functions
  const handleUserDetailClick = useCallback((user: UserData) => {
    setSelectedUserDetail(user);
  }, []);

  const handlePaymentReviewClick = useCallback((user: UserData) => {
    setSelectedUser(user);
  }, []);

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
      <StatisticsSection users={users} />

      {/* Charts */}
      <ChartsSection users={users} />

      {/* Table */}
      <motion.div variants={ANIMATION_VARIANTS.item}>
        <UsersTable
          users={sortedUsers}
          sortConfig={sortConfig}
          onSort={requestSort}
          onUserSelect={handlePaymentReviewClick}
          onUserDetailClick={handleUserDetailClick}
        />
      </motion.div>

      {/* Payment Modal */}
      {selectedUser && (
        <PaymentModal
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onUserUpdate={updateUserInList}
        />
      )}

      {/* User Detail Modal */}
      {selectedUserDetail && (
        <UserDetailModal
          user={selectedUserDetail}
          onClose={() => setSelectedUserDetail(null)}
        />
      )}
    </motion.div>
  );
}
