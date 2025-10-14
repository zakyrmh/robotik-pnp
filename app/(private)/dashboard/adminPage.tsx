"use client";

import React from "react";
import OverviewCard from "@/components/Dashboard/admin/OverviewCard";

export default function AdminDashboard() {
  // const [userAccount, setUser] = useState<User | null>(null);
  // const [caang, setCaang] = useState<Registration | null>(null);

  // const user = auth.currentUser;

  // useEffect(() => {
  //   if (!user) return;

  //   const fetchData = async () => {
  //     try {
  //       // Ambil data user
  //       const userRef = doc(db, "users_new", user.uid);
  //       const userSnap = await getDoc(userRef);

  //       if (userSnap.exists()) {
  //         const userData = userSnap.data() as User;
  //         setUser(userData);

  //         if (userData.registrationId) {
  //           const caangRef = doc(db, "registrations", userData.registrationId);
  //           const caangSnap = await getDoc(caangRef);

  //           if (caangSnap.exists()) {
  //             setCaang(caangSnap.data() as Registration);
  //           } else {
  //             console.warn("Dokumen registration tidak ditemukan!");
  //           }
  //         } else {
  //           console.warn("User belum memiliki registrationId!");
  //         }
  //       } else {
  //         console.warn("Dokumen users tidak ditemukan!");
  //       }
  //     } catch (err) {
  //       console.error("Error fetching registration:", err);
  //     }
  //   };

  //   fetchData();
  // }, [user]);

  return (
    <div className="min-h-screen lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="space-y-6">
          <OverviewCard />
        </div>
      </div>
    </div>
  );
}
