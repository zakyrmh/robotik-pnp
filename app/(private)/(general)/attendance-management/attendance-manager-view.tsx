"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ScanQrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

// Firebase Imports
import { getAttendances } from "@/lib/firebase/attendances";
import { getActivities } from "@/lib/firebase/activities";
import { getUsers } from "@/lib/firebase/users";

// Types
import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { Activity, ActivityType } from "@/types/activities";
import { User } from "@/types/users";

// Components
import AttendanceListTable, { AttendanceWithRelations } from "@/app/(private)/(general)/attendance-management/_components/attendance-list-table";
import AttendanceSummaryTable from "@/app/(private)/(general)/attendance-management/_components/attendance-summary-table";

interface AttendanceManagerViewProps {
  activityType: ActivityType; // 'recruitment' | 'internal'
  title: string;
  description: string;
}

export default function AttendanceManagerView({
  activityType,
  title,
  description
}: AttendanceManagerViewProps) {
  const [loading, setLoading] = useState(true);
  const [processedData, setProcessedData] = useState<AttendanceWithRelations[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [targetUsers, setTargetUsers] = useState<User[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Auth check
  useEffect(() => {
    const auth = getAuth(app);
    return onAuthStateChanged(auth, (user) => {
      setCurrentUserId(user ? user.uid : null);
    });
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Activities (Filter by Type)
      const allActivities = await getActivities({ type: activityType });
      setActivities(allActivities);

      // 2. Fetch Users (Filter by Role Context)
      const usersResponse = await getUsers();
      if (!usersResponse.success || !usersResponse.data) throw new Error("Gagal load user");
      
      let filteredUsers: User[] = [];
      if (activityType === 'recruitment') {
        // Halaman Recruitment: Hanya Caang
        filteredUsers = usersResponse.data.filter(u => u.roles?.isCaang && !u.deletedAt);
      } else {
        // Halaman Member: Anggota Tetap (Semua role kecuali Caang & Alumni)
        filteredUsers = usersResponse.data.filter(u => 
          !u.roles?.isCaang && 
          !u.roles?.isAlumni && 
          !u.deletedAt &&
          // Pastikan punya salah satu role anggota
          (u.roles?.isOfficialMember || u.roles?.isKRIMember || u.roles?.isKestari || u.roles?.isKomdis || u.roles?.isRecruiter)
        );
      }
      setTargetUsers(filteredUsers);

      // 3. Fetch Attendances (Bisa difilter by activityIds di client side)
      // Note: Idealnya query firestore 'in' activityIds, tapi limit 10. Fetch all lalu filter client lebih aman untuk jumlah kecil.
      const allAttendances = await getAttendances(); 
      
      // Filter attendances yang hanya milik Activity Type ini
      const relevantActivityIds = allActivities.map(a => a.id);
      const relevantAttendances = allAttendances.filter(a => relevantActivityIds.includes(a.activityId));

      // 4. Generate "Virtual Absent" Data
      // Ini logika inti untuk menganggap user "Alfa" jika tidak ada record
      const finalData: AttendanceWithRelations[] = [];

      // Masukkan data absensi real yang sudah ada
      relevantAttendances.forEach(att => {
        const user = filteredUsers.find(u => u.id === att.userId);
        const activity = allActivities.find(a => a.id === att.activityId);
        
        // Hanya masukkan jika User termasuk target audience halaman ini
        if (user && activity) {
          finalData.push({ ...att, user, activity, isAbsent: false });
        }
      });

      // Cari siapa yang bolos per aktivitas
      allActivities.forEach(activity => {
        // Siapa saja yang sudah absen di activity ini?
        const presentUserIds = relevantAttendances
          .filter(a => a.activityId === activity.id)
          .map(a => a.userId);

        // Siapa target user yang BELUM absen?
        const absentUsers = filteredUsers.filter(u => !presentUserIds.includes(u.id));

        // Buat data dummy untuk mereka
        absentUsers.forEach(user => {
          finalData.push({
            id: `virtual_${activity.id}_${user.id}`, // ID unik sementara
            activityId: activity.id,
            userId: user.id,
            orPeriod: activity.orPeriod || "",
            status: AttendanceStatus.ABSENT,
            checkedInBy: "",
            method: AttendanceMethod.MANUAL,
            needsApproval: false,
            points: 0,
            createdAt: activity.createdAt, // Sort berdasarkan tanggal activity
            updatedAt: activity.updatedAt,
            user: user,
            activity: activity,
            isAbsent: true // Flag penting
          });
        });
      });

      setProcessedData(finalData);

    } catch (error) {
      console.error("Error loading attendance data:", error);
    } finally {
      setLoading(false);
    }
  }, [activityType]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-[1600px] mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h1>
              <p className="text-gray-600 dark:text-gray-400">{description}</p>
            </div>
            <Link href="/attendance-management/scan-qr">
              <Button className="gap-2"><ScanQrCode className="w-5 h-5" /> Scan QR</Button>
            </Link>
          </div>
        </motion.div>

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="list">Daftar Kehadiran</TabsTrigger>
            <TabsTrigger value="summary">Ringkasan & Rekap</TabsTrigger>
          </TabsList>

          <TabsContent value="list" className="mt-6">
            <AttendanceListTable 
              data={processedData}
              loading={loading}
              refreshData={loadData}
              currentUserId={currentUserId}
              activities={activities}
              users={targetUsers}
              activityType={activityType}
            />
          </TabsContent>

          <TabsContent value="summary" className="mt-6">
            <AttendanceSummaryTable 
              attendancesData={processedData}
              activitiesData={activities}
              usersData={targetUsers}
              loading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}