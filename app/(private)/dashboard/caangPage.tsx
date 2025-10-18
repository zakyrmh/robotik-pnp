"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import StatusCard from "@/components/Dashboard/caang/StatusCard";
import { Registration } from "@/types/registrations";
import { User } from "@/types/users";
import StepRegistration from "@/components/Dashboard/caang/StepRegistration";
import StatusCardRegist from "@/components/Dashboard/caang/StatusCardRegist";
import QuickInfoCard from "@/components/Dashboard/caang/QuickInfoCards";
import ImportantInformation from "@/components/Dashboard/caang/ImportantInformation";
import ActivePhase from "@/components/Dashboard/caang/ActivePhase";
import NearbyActivities from "@/components/Dashboard/caang/NearbyActivities";
import QuickActions from "@/components/Dashboard/caang/QuickActions";
import RoadmapOR from "@/components/Dashboard/caang/RoadmapOR";
import Notification from "@/components/Dashboard/caang/Notification";

export default function CaangDashboard() {
  const [userAccount, setUser] = useState<User | null>(null);
  const [caang, setCaang] = useState<Registration | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      try {
        // Ambil data user dari users_new menggunakan user.uid
        const userRef = doc(db, "users_new", user.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const userData = userSnap.data() as User;
          setUser(userData);
        } else {
          console.warn("Dokumen users tidak ditemukan!");
        }

        // Ambil data registration menggunakan user.uid sebagai document ID
        const caangRef = doc(db, "registrations", user.uid);
        const caangSnap = await getDoc(caangRef);

        if (caangSnap.exists()) {
          setCaang(caangSnap.data() as Registration);
        } else {
          console.warn("Dokumen registration tidak ditemukan untuk user ini!");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };


    fetchData();
  }, [user]);

  if (!caang?.status.includes("verified")) {
    return (
      <div className="min-h-screen lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <StatusCardRegist user={userAccount} />
            <StepRegistration />
            <QuickInfoCard />
            <ImportantInformation />
          </div>
        </div>
      </div>
    );
  } else {
    return (
      <div className="min-h-screen lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="space-y-6">
            <StatusCard caang={caang} />
            <ActivePhase />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <NearbyActivities />
              <QuickActions />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RoadmapOR />
              <Notification />
            </div>
          </div>
        </div>
      </div>
    );
  }
}
