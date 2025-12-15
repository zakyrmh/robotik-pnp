"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, QrCode } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Activity } from "@/types/activities";
import { Timestamp } from "firebase/firestore";
import { isSameDay, toJSDate } from "@/utils/helper";
import { format } from "date-fns";
import Link from "next/link";

export default function NearbyActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const q = query(
          collection(db, "activities"),
          orderBy("startDateTime", "desc")
        );
        const snapshot = await getDocs(q);
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Activity[];

        // Filter hanya yang visible dan belum dihapus
        const filtered = data.filter((a) => a.isVisible && !a.deletedAt);

        // Pisahkan berdasarkan status
        const ongoing = filtered.filter((a) => a.status === "ongoing");
        const upcoming = filtered.filter((a) => a.status === "upcoming");
        const completedActivities = filtered.filter(
          (a) => a.status === "completed"
        );

        // Sort masing-masing grup
        // ongoing & upcoming: terdekat di atas (ascending)
        ongoing.sort(
          (a, b) => a.startDateTime.seconds - b.startDateTime.seconds
        );
        upcoming.sort(
          (a, b) => a.startDateTime.seconds - b.startDateTime.seconds
        );

        // completed: terbaru di atas (descending), ambil 2 teratas
        completedActivities.sort(
          (a, b) => b.startDateTime.seconds - a.startDateTime.seconds
        );
        const topCompleted = completedActivities.slice(0, 2);

        // Gabungkan: ongoing → upcoming → completed (2 teratas)
        const sorted = [...ongoing, ...upcoming, ...topCompleted];

        setActivities(sorted);
      } catch (err) {
        console.error("Error fetching activities:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  if (loading) {
    return (
      <p className="text-gray-500 dark:text-gray-400">Memuat aktivitas...</p>
    );
  }

  if (activities.length === 0) {
    return (
      <p className="text-gray-500 dark:text-gray-400">Belum ada aktivitas.</p>
    );
  }

  // 🔧 Helper untuk format tanggal
  const formatDate = (timestamp: Timestamp) => {
    const date = timestamp.toDate();
    const day = date.getDate();
    const month = date
      .toLocaleString("id-ID", { month: "short" })
      .toUpperCase();
    return { day, month };
  };

  // 🔧 Hitung sisa hari
  const daysLeft = (timestamp: Timestamp) => {
    const now = new Date();
    const target = timestamp.toDate();

    // Normalize ke tanggal saja (set jam ke 00:00:00)
    const nowDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const targetDate = new Date(
      target.getFullYear(),
      target.getMonth(),
      target.getDate()
    );

    const diff = Math.ceil(
      (targetDate.getTime() - nowDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diff < 0) return "Selesai";
    if (diff === 0) return "Hari ini";
    return `${diff} hari`;
  };

  return (
    <div className="lg:col-span-2">
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
        Aktivitas Terdekat
      </h3>

      <div className="space-y-4">
        {activities.map((activity) => {
          const { day, month } = formatDate(activity.startDateTime);

          // Check apakah hari ini (hanya tanggal, abaikan jam)
          const schedDate = toJSDate(activity.startDateTime);
          const today = new Date();
          const isToday = schedDate !== null && isSameDay(schedDate, today);
          const isCompleted = activity.status === "completed";
          const isOngoing = activity.status === "ongoing";

          let cardStyle =
            "bg-white dark:bg-gray-800 rounded-xl shadow-sm p-5 border-l-4 transition-colors";
          if (isToday) {
            cardStyle =
              "bg-gradient-to-r from-red-500 to-red-600 dark:from-red-600 dark:to-red-700 rounded-xl p-6 text-white shadow-lg transition-all";
          } else if (isCompleted) {
            cardStyle += " border-gray-300 dark:border-gray-600";
          } else {
            cardStyle += " border-blue-500 dark:border-blue-400";
          }

          return (
            <div key={activity.id} className={cardStyle}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-start space-x-4">
                  <div
                    className={`${
                      isToday
                        ? "w-14 h-14 md:w-16 md:h-16 bg-white/20 text-white"
                        : "text-center w-12 md:w-14"
                    } rounded-xl flex flex-col items-center justify-center flex-shrink-0 transition-all`}
                  >
                    <span
                      className={`text-xl md:text-2xl font-bold ${
                        isToday ? "" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {day}
                    </span>
                    <span
                      className={`text-[10px] md:text-xs ${
                        isToday ? "" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {month}
                    </span>
                  </div>

                  <div>
                    {isToday && (
                      <span className="inline-block px-2.5 py-0.5 bg-white/25 backdrop-blur-sm rounded-full text-[10px] md:text-xs font-bold mb-1.5 md:mb-2 border border-white/20">
                        🔴 HARI INI
                      </span>
                    )}
                    <h4
                      className={`${
                        isToday
                          ? "text-lg md:text-xl font-bold mb-1 md:mb-2"
                          : "text-base md:text-lg font-semibold text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {activity.title}
                    </h4>
                    <div
                      className={`space-y-0.5 text-xs md:text-sm ${
                        isToday
                          ? "text-white/90"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <p className="flex items-center">
                        <Clock className="mr-1.5 h-3.5 w-3.5" />
                        {format(activity.startDateTime.toDate(), "hh:mm")}{" "}
                        <span>WIB</span>
                      </p>
                      {activity.location && (
                        <p className="flex items-center">
                          <MapPin className="mr-1.5 h-3.5 w-3.5" />
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 mt-2 sm:mt-0 w-full sm:w-auto gap-3">
                  {/* Tombol Absen hanya muncul jika attendanceEnabled dan status ongoing */}
                  {activity.attendanceEnabled && isOngoing && (
                    <Link
                      href={`/activity/${activity.slug}`}
                      className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 md:px-5 md:py-3 bg-white text-red-600 rounded-lg md:rounded-xl font-bold hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 transition whitespace-nowrap text-sm"
                    >
                      <QrCode className="mr-2 h-4 w-4 md:h-5 md:w-5" />
                      Absen
                    </Link>
                  )}

                  {/* Label hari tersisa (tampil untuk semua kecuali hari ini) */}
                  {!isToday && (
                    <span className="px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs md:text-sm font-medium">
                      {daysLeft(activity.startDateTime)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
