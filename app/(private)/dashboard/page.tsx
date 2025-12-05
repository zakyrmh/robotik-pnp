"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { User, UserSystemRoles } from "@/types/users";
import Loading from "@/components/Loading";
import AdminDashboard from "@/app/(private)/dashboard/adminPage";
import CaangDashboard from "@/app/(private)/dashboard/caangPage";

const DEFAULT_ROLES: UserSystemRoles = {
  isSuperAdmin: false,
  isKestari: false,
  isKomdis: false,
  isRecruiter: false,
  isKRIMember: false,
  isOfficialMember: false,
  isCaang: true,
  isAlumni: false,
};

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<UserSystemRoles>(DEFAULT_ROLES);
  const [userData, setUserData] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        router.push("/login");
        return;
      }

      try {
        const userRef = doc(db, "users_new", firebaseUser.uid);
        const snap = await getDoc(userRef);

        if (snap.exists()) {
          const data = snap.data() as User;
          setUserData(data);

          if (data.roles) {
            setUserRoles(data.roles);
          }
        } else {
          console.warn("User data not found in Dashboard");
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setIsLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (isLoading) {
    return <Loading />;
  }

  const isInternalUser = 
    userRoles.isSuperAdmin || 
    userRoles.isRecruiter || 
    userRoles.isKestari || 
    userRoles.isKomdis || 
    userRoles.isOfficialMember || 
    userRoles.isKRIMember;

  if (isInternalUser) {
    return <AdminDashboard user={userData} />;
  }
  return <CaangDashboard />;
}