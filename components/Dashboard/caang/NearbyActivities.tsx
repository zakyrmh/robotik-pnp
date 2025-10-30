"use client";

import { useEffect, useState } from "react";
import { Clock, MapPin, QrCode } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Activity } from "@/types/activities";
import { Timestamp } from "firebase/firestore";
import { isSameDay, toJSDate } from "@/utils/helper";
import { format } from "date-fns";

export default function NearbyActivities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 Ambil data dari Firestore
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
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div
                    className={`${
                      isToday
                        ? "w-16 h-16 bg-white/20 text-white"
                        : "text-center w-14"
                    } rounded-xl flex flex-col items-center justify-center`}
                  >
                    <span
                      className={`text-2xl font-bold ${
                        isToday ? "" : "text-blue-600 dark:text-blue-400"
                      }`}
                    >
                      {day}
                    </span>
                    <span
                      className={`text-xs ${
                        isToday ? "" : "text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {month}
                    </span>
                  </div>

                  <div>
                    {isToday && (
                      <span className="inline-block px-3 py-1 bg-white/25 backdrop-blur-sm rounded-full text-xs font-bold mb-2">
                        🔴 HARI INI
                      </span>
                    )}
                    <h4
                      className={`${
                        isToday
                          ? "text-xl font-bold mb-2"
                          : "font-semibold text-gray-800 dark:text-gray-100"
                      }`}
                    >
                      {activity.title}
                    </h4>
                    <div
                      className={`space-y-1 text-sm ${
                        isToday
                          ? "text-white"
                          : "text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      <p className="flex items-center">
                        <Clock className="mr-2 h-4 w-4" />
                        {format(activity.startDateTime.toDate(), "hh:mm")} {" "}
                        <span>WIB</span>
                      </p>
                      {activity.location && (
                        <p className="flex items-center">
                          <MapPin className="mr-2 h-4 w-4" />
                          {activity.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Tombol Absen hanya muncul jika attendanceEnabled dan status ongoing */}
                {activity.attendanceEnabled && isOngoing && (
                  <button className="flex items-center px-5 py-3 bg-white text-red-600 rounded-xl font-bold hover:bg-red-50 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-gray-700 transition whitespace-nowrap">
                    <QrCode className="mr-2 h-5 w-5" />
                    Absen
                  </button>
                )}

                {/* Label hari tersisa (tampil untuk semua kecuali hari ini) */}
                {!isToday && (
                  <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-sm font-medium">
                    {daysLeft(activity.startDateTime)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
