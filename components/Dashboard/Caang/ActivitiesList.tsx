"use client";

import { useState, useEffect } from "react";
import { Calendar, CalendarDays, ChevronRight, Loader2, Settings, Trophy, Users, Wrench } from "lucide-react";
import Link from "next/link";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig"; // Sesuaikan path dengan konfigurasi Firebase Anda
import { Activity } from "@/types/activity";

export default function ActivitiesList() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        // Create query to get activities ordered by date
        const activitiesQuery = query(
          collection(db, "activities"),
          orderBy("date", "desc")
        );

        // Use real-time listener for automatic updates
        const unsubscribe = onSnapshot(
          activitiesQuery,
          (querySnapshot) => {
            const activitiesData: Activity[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();

              // Convert Firestore timestamp to Date
              let activityDate: Date;
              if (data.date?.toDate) {
                // Firestore Timestamp
                activityDate = data.date.toDate();
              } else if (data.date) {
                // Regular Date or string
                activityDate = new Date(data.date);
              } else {
                activityDate = new Date(); // Fallback
              }

              // Determine status based on date if not provided
              let status = data.status;
              if (!status) {
                const now = new Date();
                status = activityDate > now ? "upcoming" : "completed";
              }

              const activity: Activity = {
                uid: doc.id,
                icon: data.icon || "bot",
                title: data.title || "Untitled Activity",
                subtitle: data.subtitle || "",
                date: activityDate,
                type: data.type || "workshop",
                status: status,
                slug: `/activity/${data.slug}` || `/activity/${doc.id}`,
                description: "",
                location: "",
                maxParticipants: 0,
                currentParticipants: 0,
              };

              activitiesData.push(activity);
            });

            setActivities(activitiesData);
            setLoading(false);
          },
          (err) => {
            console.error("Error fetching activities:", err);
            setError("Gagal memuat aktivitas");
            setLoading(false);
          }
        );

        // Cleanup listener on component unmount
        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up activities listener:", err);
        setError("Gagal memuat aktivitas");
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const sortedActivities = activities.sort((a, b) => {
    // Sort: upcoming first (by date ascending), then completed (by date descending)
    if (a.status === "upcoming" && b.status === "completed") return -1;
    if (a.status === "completed" && b.status === "upcoming") return 1;
    if (a.status === "upcoming" && b.status === "upcoming") {
      return a.date.getTime() - b.date.getTime();
    }
    return b.date.getTime() - a.date.getTime();
  });

  const getActivityTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      workshop: "bg-blue-500 dark:bg-blue-600",
      competition: "bg-red-500 dark:bg-red-600",
      meeting: "bg-green-500 dark:bg-green-600",
      showcase: "bg-purple-500 dark:bg-purple-600",
    };
    return colors[type] || "bg-slate-500 dark:bg-slate-600";
  };

  const getStatusColor = (status: string): string => {
    return status === "upcoming"
      ? "text-slate-900 dark:text-slate-100"
      : "text-slate-500 dark:text-slate-400";
  };

  const formatDateTime = (date: Date): { date: string; time: string } => {
    return {
      date: date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: date.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const getActivityTypeIcon = (type: string): React.ReactNode => {
    const icons: { [key: string]: React.ReactNode } = {
      workshop: <Wrench className="w-5 h-5" />,
      competition: <Trophy className="w-5 h-5" />,
      meeting: <Users className="w-5 h-5" />,
      showcase: <Settings className="w-5 h-5" />,
    };
    return icons[type] || <Calendar className="w-5 h-5" />;
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <CalendarDays className="w-5 h-5 mr-2" />
          Daftar Aktivitas
        </h3>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-slate-500 dark:text-slate-400" />
          <span className="ml-2 text-slate-500 dark:text-slate-400">
            Memuat aktivitas...
          </span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
          <CalendarDays className="w-5 h-5 mr-2" />
          Daftar Aktivitas
        </h3>
        <div className="text-center py-8">
          <p className="text-red-500 dark:text-red-400">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 text-sm text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 underline"
          >
            Coba lagi
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
        <CalendarDays className="w-5 h-5 mr-2" />
        Daftar Aktivitas
      </h3>
      <div className="space-y-4">
        {sortedActivities.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              Tidak ada aktivitas tersedia
            </p>
          </div>
        ) : (
          sortedActivities.map((activity) => {
            const { date: formattedDate, time } = formatDateTime(activity.date);
            return (
              <div key={activity.uid}>
                <Link
                  href={activity.slug}
                  className={`flex items-center space-x-4 p-4 rounded-lg border transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md ${
                    activity.status === "upcoming"
                      ? "border-slate-200 dark:border-slate-600"
                      : "border-slate-100 dark:border-slate-700 opacity-75"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getActivityTypeColor(
                      activity.type
                    )}`}
                  >
                    {activity && getActivityTypeIcon(activity.type)}
                  </div>
                  <div className="flex-1">
                    <h4
                      className={`font-medium ${getStatusColor(
                        activity.status
                      )}`}
                    >
                      {activity.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                      {activity.subtitle}
                    </p>
                    <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                      <span>{formattedDate}</span>
                      <span>•</span>
                      <span>{time}</span>
                      {activity.status === "upcoming" && (
                        <>
                          <span>•</span>
                          <span className="text-green-600 dark:text-green-400 font-medium">
                            Akan Datang
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
