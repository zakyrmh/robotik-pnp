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
  Phone,
  Users,
  MessageCircle,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboard } from "@/components/dashboard/dashboard-context";
import { getCaangAnnouncements } from "@/lib/firebase/services/announcement-service";
import { getRecruitmentActivities } from "@/lib/firebase/services/activity-service";
import { getRecruitmentSettings } from "@/lib/firebase/services/settings-service";
import { Announcement } from "@/schemas/announcements";
import { Activity as ActivityType } from "@/schemas/activities";
import { ContactPerson, ExternalLinks } from "@/schemas/recruitment-settings";
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

/**
 * Format WhatsApp number to clickable link
 */
function formatWhatsAppLink(number: string): string {
  // Remove non-numeric characters except +
  const cleaned = number.replace(/[^0-9+]/g, "");
  // Remove leading 0 and add 62 if starts with 0
  const formatted = cleaned.startsWith("0")
    ? "62" + cleaned.slice(1)
    : cleaned.replace("+", "");
  return `https://wa.me/${formatted}`;
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
  const [contactPersons, setContactPersons] = useState<ContactPerson[]>([]);
  const [externalLinks, setExternalLinks] = useState<ExternalLinks | null>(
    null,
  );

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

        // 4. Fetch recruitment settings for contact persons and links
        const settings = await getRecruitmentSettings();
        if (settings) {
          setContactPersons(settings.contactPerson || []);
          setExternalLinks(settings.externalLinks || null);
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

        {/* Kontak Person */}
        <div className="flex flex-col space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Phone className="w-4 h-4" />
            <span className="text-sm font-medium">Kontak Panitia</span>
          </div>
          {contactPersons.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Belum ada kontak tersedia.
            </p>
          ) : (
            <div className="space-y-2">
              {contactPersons.slice(0, 2).map((cp, idx) => (
                <a
                  key={idx}
                  href={formatWhatsAppLink(cp.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group"
                >
                  <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                    <MessageCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{cp.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {cp.whatsapp}
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
              {contactPersons.length > 2 && (
                <p className="text-xs text-muted-foreground text-center">
                  +{contactPersons.length - 2} kontak lainnya
                </p>
              )}
            </div>
          )}
        </div>

        {/* Link Grup WhatsApp */}
        <div className="flex flex-col space-y-3 p-4 rounded-xl bg-white dark:bg-slate-900 border shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">Grup WhatsApp</span>
          </div>
          {externalLinks?.groupChatUrl ? (
            <a
              href={externalLinks.groupChatUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
            >
              <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                  Gabung Grup Caang
                </p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Klik untuk bergabung ke grup
                </p>
              </div>
              <ExternalLink className="w-5 h-5 text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform" />
            </a>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
              <Lock className="w-4 h-4" />
              <p className="text-sm">Link grup belum tersedia</p>
            </div>
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
      </CardContent>
    </Card>
  );
}
