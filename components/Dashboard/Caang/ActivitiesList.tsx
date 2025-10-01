"use client";

import { useState, useEffect } from "react";
import { 
  Calendar, 
  CalendarDays, 
  ChevronRight, 
  Loader2, 
  Settings, 
  Trophy, 
  Users, 
  Wrench 
} from "lucide-react";
import Link from "next/link";
import { 
  collection, 
  query, 
  orderBy, 
  where, 
  onSnapshot 
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Activities } from "@/types/activities";

export default function ActivitiesList() {
  const [activities, setActivities] = useState<Activities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        setLoading(true);
        setError(null);

        // ✅ Query hanya upcoming & ongoing activities, sorted by date ascending
        const activitiesQuery = query(
          collection(db, "activities"),
          where("status", "in", ["upcoming", "ongoing"]),
          orderBy("date", "asc")
        );

        // Real-time listener
        const unsubscribe = onSnapshot(
          activitiesQuery,
          (querySnapshot) => {
            const activitiesData: Activities[] = [];

            querySnapshot.forEach((doc) => {
              const data = doc.data();

              // Convert Firestore timestamp to Date
              let activityDate: Date;
              if (data.date?.toDate) {
                activityDate = data.date.toDate();
              } else if (data.date) {
                activityDate = new Date(data.date);
              } else {
                activityDate = new Date();
              }

              const activity: Activities = {
                _id: doc.id,
                slug: data.slug || doc.id,
                icon: data.icon || "bot",
                title: data.title || "Untitled Activity",
                subtitle: data.subtitle || "",
                description: data.description || "",
                date: activityDate,
                startTime: data.startTime || "00:00",
                endTime: data.endTime || "23:59",
                location: data.location || "",
                type: data.type || "workshop",
                status: data.status || "upcoming",
                requirements: data.requirements || [],
                attendanceWindow: data.attendanceWindow,
                lateThreshold: data.lateThreshold,
                createdBy: data.createdBy,
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                maxParticipants: 0,
                currentParticipants: 0
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

        return () => unsubscribe();
      } catch (err) {
        console.error("Error setting up activities listener:", err);
        setError("Gagal memuat aktivitas");
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  const getActivityTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      workshop: "bg-blue-500 dark:bg-blue-600",
      competition: "bg-red-500 dark:bg-red-600",
      meeting: "bg-green-500 dark:bg-green-600",
      showcase: "bg-purple-500 dark:bg-purple-600",
    };
    return colors[type] || "bg-slate-500 dark:bg-slate-600";
  };

  const getStatusBadge = (status: string): React.ReactNode => {
    if (status === "ongoing") {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-full">
          Sedang Berlangsung
        </span>
      );
    }
    return null;
  };

  const formatDateTime = (date: Date, startTime?: string): { date: string; time: string } => {
    return {
      date: date.toLocaleDateString("id-ID", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      time: startTime || date.toLocaleTimeString("id-ID", {
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
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <CalendarDays className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-slate-500 dark:text-slate-400">
              Tidak ada aktivitas yang akan datang
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const { date: formattedDate, time } = formatDateTime(
              activity.date, 
              activity.startTime
            );
            return (
              <Link
                key={activity._id}
                href={`/activity/${activity.slug}`}
                className="flex items-center space-x-4 p-4 rounded-lg border border-slate-200 dark:border-slate-600 transition-all hover:bg-slate-50 dark:hover:bg-slate-700 hover:shadow-md"
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getActivityTypeColor(
                    activity.type
                  )}`}
                >
                  {getActivityTypeIcon(activity.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-slate-900 dark:text-slate-100">
                      {activity.title}
                    </h4>
                    {getStatusBadge(activity.status)}
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    {activity.subtitle}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-slate-600 dark:text-slate-300">
                    <span>{formattedDate}</span>
                    <span>•</span>
                    <span>{time}</span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400 dark:text-slate-500" />
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}