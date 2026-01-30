"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  ShieldCheck,
  Bell,
  Activity,
  Lock,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { getCaangAnnouncements } from "@/lib/firebase/services/announcement-service";
import { getRecruitmentActivities } from "@/lib/firebase/services/activity-service";
import { Announcement } from "@/schemas/announcements";
import { Activity as ActivityType } from "@/schemas/activities";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

// =========================================================
// HELPER FUNCTIONS
// =========================================================

/**
 * Check if activity is today
 */
function isToday(date: Date): boolean {
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

// =========================================================
// COMPONENT
// =========================================================

export function OverviewCard() {
  const { user, isCaangVerified } = useDashboard();

  // State
  const [isLoading, setIsLoading] = useState(true);
  const [userIsActive, setUserIsActive] = useState(true);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [todayActivities, setTodayActivities] = useState<ActivityType[]>([]);

  // Fetch data
  useEffect(() => {
    async function fetchData() {
      if (!user?.uid) return;

      setIsLoading(true);

      try {
        // 1. Fetch user isActive status
        const userRef = doc(db, "users_new", user.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const userData = userSnap.data();
          setUserIsActive(userData.isActive ?? true);
        }

        // 2. Fetch announcements for caang
        const announcementData = await getCaangAnnouncements(undefined, 5);
        setAnnouncements(announcementData);

        // 3. Fetch today's activities (only if verified)
        if (isCaangVerified) {
          const allActivities = await getRecruitmentActivities();
          const todayActs = allActivities.filter((act) =>
            isToday(new Date(act.startDateTime)),
          );
          setTodayActivities(todayActs);
        }
      } catch (error) {
        console.error("Error fetching overview data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user?.uid, isCaangVerified]);

  if (isLoading) {
    return (
      <Card className="h-full border-none shadow-lg bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full border-none shadow-lg bg-linear-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-bold flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Overview
        </CardTitle>
        <CardDescription>
          Ringkasan aktivitas dan informasi akun Anda hari ini.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
        {/* Kegiatan Hari Ini */}
        <div className="flex flex-col space-y-2 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <CalendarDays className="w-4 h-4" />
            <span className="text-sm font-medium">Kegiatan Hari Ini</span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            {!isCaangVerified ? (
              // Locked - belum verified
              <div className="flex items-center gap-2 text-muted-foreground">
                <Lock className="w-4 h-4" />
                <p className="text-sm">
                  Selesaikan pendaftaran terlebih dahulu
                </p>
              </div>
            ) : todayActivities.length === 0 ? (
              // No activities today
              <>
                <p className="text-sm font-medium">Tidak ada jadwal kegiatan</p>
                <p className="text-xs text-muted-foreground">
                  Istirahat yang cukup!
                </p>
              </>
            ) : (
              // Show today's activities
              <div className="space-y-2">
                {todayActivities.slice(0, 2).map((act) => (
                  <div key={act.id} className="text-sm">
                    <p className="font-medium">{act.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(act.startDateTime).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      - {act.location || "Online"}
                    </p>
                  </div>
                ))}
                {todayActivities.length > 2 && (
                  <p className="text-xs text-primary">
                    +{todayActivities.length - 2} kegiatan lainnya
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status Akun */}
        <div className="flex flex-col space-y-2 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span className="text-sm font-medium">Status Akun</span>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="outline"
              className={
                userIsActive
                  ? "bg-green-500/10 text-green-600 hover:bg-green-500/20 border-green-200"
                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200"
              }
            >
              {userIsActive ? "Aktif" : "Tidak Aktif"}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Calon Anggota (Caang)
            </span>
          </div>
          {!userIsActive && (
            <p className="text-xs text-red-600 mt-1">
              Akun Anda sedang dinonaktifkan. Hubungi admin untuk informasi
              lebih lanjut.
            </p>
          )}
        </div>

        {/* Pengumuman Baru */}
        <div className="col-span-2 flex flex-col space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Bell className="w-4 h-4" />
              <span className="text-sm font-medium">Pengumuman Baru</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-xs text-primary"
            >
              Lihat Semua
            </Button>
          </div>
          <div className="space-y-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tidak ada pengumuman baru.
              </p>
            ) : (
              announcements.slice(0, 3).map((announcement, index) => (
                <div key={announcement.id} className="flex gap-3 items-start">
                  <div
                    className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${
                      index === 0 ? "bg-blue-500" : "bg-slate-300"
                    }`}
                  />
                  <div className="space-y-1">
                    <p
                      className={`text-sm font-medium leading-none ${
                        index === 0 ? "" : "text-muted-foreground"
                      }`}
                    >
                      {announcement.title}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {announcement.content}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Note: Aktivitas Terbaru section removed as it's not useful for caang 
             since they are directed step-by-step through the registration form */}
      </CardContent>
    </Card>
  );
}
