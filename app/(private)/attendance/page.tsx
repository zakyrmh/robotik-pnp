"use client";

import React, { useState, useEffect, useCallback } from "react";
import { doc, getDoc, DocumentData } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";

// Components
import QRScanner from "@/components/Attendance/QRScanner";
import AttendanceTable, { AttendanceWithUser } from "@/components/Attendance/AttendanceTable";

// Helpers
import {
  fetchAttendancesWithAlpha,
  fetchActivities
} from "@/lib/attendanceHelpers";

interface UserData extends DocumentData {
  role: string;
  email?: string;
  name?: string;
}

interface Activity {
  id: string;
  name: string;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(true);
  const [authChecking, setAuthChecking] = useState<boolean>(true);
  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityForAlpha, setSelectedActivityForAlpha] = useState<string>("");

  // Auth check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as UserData;
          if (data.role !== "admin") {
            toast.error("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
            router.push("/dashboard");
            return;
          }
        } else {
          console.log("User data not found");
          toast.error("Data user tidak ditemukan");
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        toast.error("Gagal memverifikasi akses");
      } finally {
        setAuthChecking(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Fetch attendances
  const loadAttendances = useCallback(async () => {
    try {
      setLoading(true);
      
      // Jika ada activity dipilih, fetch dengan alpha detection
      if (selectedActivityForAlpha) {
        const data: AttendanceWithUser[] = await fetchAttendancesWithAlpha(selectedActivityForAlpha);
        setAttendances(data);
      } else {
        // Fetch semua attendance tanpa alpha
        const data: AttendanceWithUser[] = await fetchAttendancesWithAlpha();
        setAttendances(data);
      }
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  }, [selectedActivityForAlpha]);

  // Fetch activities
  const loadActivities = useCallback(async () => {
    try {
      const data: Activity[] = await fetchActivities();
      setActivities(data);
      
      // Set default selected activity (first activity)
      if (data.length > 0 && !selectedActivityForAlpha) {
        setSelectedActivityForAlpha(data[0].id);
      }
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat daftar aktivitas");
    }
  }, [selectedActivityForAlpha]);

  // Initial load activities
  useEffect(() => {
    if (!authChecking) {
      loadActivities();
    }
  }, [loadActivities, authChecking]);

  // Load attendances when activity selected
  useEffect(() => {
    if (selectedActivityForAlpha && !authChecking) {
      loadAttendances();
    }
  }, [selectedActivityForAlpha, loadAttendances, authChecking]);

  const handleScanSuccess = (): void => {
    loadAttendances();
  };

  const handleRefresh = (): void => {
    loadAttendances();
  };

  const handleStatusUpdate = (): void => {
    loadAttendances();
  };

  const handleActivityChange = (event: React.ChangeEvent<HTMLSelectElement>): void => {
    setSelectedActivityForAlpha(event.target.value);
  };

  // Show loading while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-slate-600 dark:text-slate-400 mt-4">Memverifikasi akses...</p>
        </div>
      </div>
    );
  }

  // Show loading for initial data load
  if (loading && attendances.length === 0 && activities.length === 0) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Memuat data...</p>
          </div>
        </div>
        <Toaster richColors position="top-right" />
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen p-6 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              📊 Manajemen Kehadiran
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Kelola kehadiran calon anggota dengan scan QR atau ubah status manual
            </p>
          </div>

          {/* Activity Selector for Alpha Detection */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                Pilih Aktivitas (untuk deteksi Alpha)
              </label>
              <select
                value={selectedActivityForAlpha}
                onChange={handleActivityChange}
                disabled={loading}
                className="w-full max-w-md px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Semua Aktivitas (tanpa alpha)</option>
                {activities.map((activity: Activity) => (
                  <option key={activity.id} value={activity.id}>
                    {activity.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedActivityForAlpha 
                  ? "Menampilkan semua peserta termasuk yang belum hadir (Alpha)" 
                  : "Menampilkan hanya yang sudah tercatat absensi"}
              </p>
            </div>
          </div>

          {/* QR Scanner Component */}
          <QRScanner onScanSuccess={handleScanSuccess} />

          {/* Attendance Table Component */}
          <AttendanceTable
            attendances={attendances}
            loading={loading}
            activities={activities}
            onRefresh={handleRefresh}
            onStatusUpdate={handleStatusUpdate}
          />
        </div>
      </div>

      {/* Sonner Toast Container */}
      <Toaster richColors position="top-right" />
    </>
  );
}