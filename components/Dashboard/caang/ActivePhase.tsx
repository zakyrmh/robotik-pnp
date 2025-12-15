"use client";

import { Calendar, Clock, GraduationCap } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getUserById } from "@/lib/firebase/users";
import { getActivities } from "@/lib/firebase/activities";
import { getAttendances } from "@/lib/firebase/attendances";
import { extractOrPeriod, calculateAttendancePercentage } from "@/utils/helper";
import { AttendanceStatus } from "@/types/enum";

export default function ActivePhase() {
  const { user } = useAuth();
  const [attendancePercentage, setAttendancePercentage] = useState<number>(0);
  const [totalActivities, setTotalActivities] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchAttendanceData() {
      if (!user?.uid) {
        setLoading(false);
        return;
      }

      try {
        // 1. Fetch user data untuk mendapatkan registrationId
        const userResponse = await getUserById(user.uid);

        if (!userResponse.success || !userResponse.data) {
          console.error("Failed to fetch user data");
          setLoading(false);
          return;
        }

        const userData = userResponse.data;
        const orPeriod = extractOrPeriod(userData.registrationId);

        console.log("OR Period:", orPeriod);

        if (!orPeriod) {
          console.error("Failed to extract OR Period from registrationId");
          setLoading(false);
          return;
        }

        // 2. Fetch activities dengan filter: orPeriod, isActive:true, tidak ada deletedAt
        const allActivities = await getActivities();
        const filteredActivities = allActivities.filter(
          (activity) =>
            activity.orPeriod === orPeriod &&
            activity.isActive === true &&
            !activity.deletedAt
        );

        setTotalActivities(filteredActivities.length);

        // 3. Fetch attendances user dengan status PRESENT atau LATE
        const allAttendances = await getAttendances({ userId: user.uid });
        const validAttendances = allAttendances.filter(
          (attendance) =>
            (attendance.status === AttendanceStatus.PRESENT ||
              attendance.status === AttendanceStatus.LATE) &&
            !attendance.deletedAt
        );

        // 4. Hitung persentase kehadiran
        const percentage = calculateAttendancePercentage(
          validAttendances.length,
          filteredActivities.length
        );

        setAttendancePercentage(percentage);
      } catch (error) {
        console.error("Error fetching attendance data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendanceData();
  }, [user]);

  return (
    <div className="mb-8 transition-all duration-300">
      {/* Header */}
      <div className="flex flex-col items-start gap-2 justify-between mb-4 sm:flex-row sm:items-center">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Fase Aktif Saat Ini
        </h3>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-xs font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
          SEDANG BERLANGSUNG
        </span>
      </div>

      {/* Main Card */}
      <div
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 
                    dark:from-blue-900 dark:via-blue-800 dark:to-purple-900
                    rounded-2xl p-6 lg:p-8 text-white shadow-xl transition-all duration-300"
      >
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div className="flex items-center space-x-3 lg:space-x-4">
              <div className="w-14 h-14 lg:w-16 lg:h-16 bg-white/20 dark:bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center flex-shrink-0">
                <GraduationCap className="h-8 w-8 lg:h-12 lg:w-12 text-white dark:text-blue-200" />
              </div>
              <div>
                <h4 className="text-xl lg:text-2xl font-bold uppercase">
                  pelatihan
                </h4>
                <p className="text-sm lg:text-base text-blue-100 dark:text-blue-200/80">
                  Pemograman Dasar
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between md:block md:text-right border-t border-white/20 md:border-t-0 pt-4 md:pt-0">
              <p className="text-sm text-blue-100 dark:text-blue-200 mb-0 md:mb-2">
                Kehadiran
              </p>
              <p className="text-2xl lg:text-4xl font-bold mb-1 text-white dark:text-blue-100">
                {loading ? "..." : `${attendancePercentage}%`}
              </p>
            </div>
          </div>

          <p className="text-blue-100 text-sm lg:text-base dark:text-blue-200 mb-4 bg-white/10 dark:bg-black/10 p-3 rounded-lg border border-white/10">
            Anda sedang dalam fase pelatihan. Pastikan mengikuti semua sesi
            tepat waktu.
          </p>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-6 text-sm">
            <div className="flex items-center space-x-2">
              <Calendar className="text-blue-100 dark:text-blue-300 h-4 w-4" />
              <span>7 - 14 Desember 2025</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="text-blue-100 dark:text-blue-300 h-4 w-4" />
              <span>Total: 2 sesi</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
