import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  UserGroupIcon,
  ArrowLeft01Icon,
  CheckmarkCircle01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { ActivityItem } from "@/lib/actions/activities";
import { ActivityDetailActions } from "@/components/features/kegiatan/activity-detail-actions";


interface ActivityDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: ActivityDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: activity } = await supabase
    .from("activities")
    .select("title")
    .eq("id", id)
    .is("deleted_at", null)
    .single();

  return {
    title: activity
      ? `${activity.title} | UKM Robotik PNP`
      : "Detail Kegiatan | UKM Robotik PNP",
    description:
      "Detail informasi agenda dan presensi kegiatan UKM Robotik PNP",
  };
}

function formatIndoDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function formatTimeRange(startStr: string, endStr: string) {
  const start = new Date(startStr);
  const end = new Date(endStr);
  const startTime = start.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const endTime = end.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (start.toDateString() === end.toDateString()) {
    return `${startTime} - ${endTime} WIB`;
  }
  return `${startTime} (Mulai) s/d ${endTime} (Selesai) WIB`;
}

function getActivityStatus(
  activity: ActivityItem,
): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(activity.start_date);
  const end = new Date(activity.end_date);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export default async function ActivityDetailPage({
  params,
}: ActivityDetailPageProps) {
  const { id: activityId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const userRole = profile?.role || "anggota";

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .eq("id", activityId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    notFound();
  }

  const activity = data as ActivityItem;
  const status = getActivityStatus(activity);

  const canManage =
    activity.target_audience === "caang"
      ? ["super-admin", "admin-or"].includes(userRole)
      : ["super-admin", "admin-komdis"].includes(userRole);

  const now = new Date();
  const openTime = activity.checkin_open_at
    ? new Date(activity.checkin_open_at)
    : new Date(new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000);
  const closeTime = activity.checkin_close_at
    ? new Date(activity.checkin_close_at)
    : new Date(activity.end_date);
  const isAttendanceActive = now >= openTime && now <= closeTime;

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-md border border-border text-foreground hover:bg-muted font-medium text-xs h-9 px-3"
          >
            <Link href="/kegiatan">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Kembali
            </Link>
          </Button>
          <div>
            <span className="text-micro font-mono font-bold uppercase tracking-wider text-primary block">
              Detail Kegiatan
            </span>
            <h1 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-foreground">
              {activity.title}
            </h1>
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {status === "ongoing" && (
            <Badge className="bg-accent text-accent-foreground border-accent/40 rounded-full px-3.5 py-1 text-micro font-semibold uppercase animate-pulse">
              Sedang Berlangsung
            </Badge>
          )}
          {status === "upcoming" && (
            <Badge className="bg-primary-soft text-primary border-primary/15 rounded-full px-3.5 py-1 text-micro font-semibold uppercase">
              Akan Datang
            </Badge>
          )}
          {status === "completed" && (
            <Badge className="bg-muted text-muted-foreground border-border rounded-full px-3.5 py-1 text-micro font-semibold uppercase">
              Selesai
            </Badge>
          )}
        </div>
      </div>

      {/* Banner Image */}
      <div className="relative w-full h-48 sm:h-72 lg:h-80 rounded-lg border border-border bg-card overflow-hidden shadow-soft">
        {activity.banner_url ? (
          <Image
            src={activity.banner_url}
            alt={activity.title}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-muted/60 text-muted-foreground gap-2 p-6 text-center">
            <div className="p-3 rounded-full bg-background border border-border">
              <HugeiconsIcon icon={Calendar03Icon} size={32} />
            </div>
            <span className="text-xs font-medium">
              Tidak ada gambar banner untuk kegiatan ini
            </span>
          </div>
        )}
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Tanggal & Waktu */}
        <div className="border border-border bg-card rounded-lg p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-md bg-primary-soft text-primary shrink-0">
            <HugeiconsIcon icon={Clock01Icon} size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-micro font-medium uppercase tracking-wide text-muted-foreground block">
              Jadwal Waktu
            </span>
            <span className="text-xs font-semibold text-foreground block mt-0.5">
              {formatIndoDate(activity.start_date)}
            </span>
            <span className="text-micro font-mono text-muted-foreground block mt-0.5">
              {formatTimeRange(activity.start_date, activity.end_date)}
            </span>
          </div>
        </div>

        {/* Lokasi */}
        <div className="border border-border bg-card rounded-lg p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-md bg-accent/20 text-accent-strong dark:bg-accent/10 dark:text-primary shrink-0">
            <HugeiconsIcon icon={Location01Icon} size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-micro font-medium uppercase tracking-wide text-muted-foreground block">
              Lokasi Pelaksanaan
            </span>
            <span
              className="text-xs font-semibold text-foreground block mt-0.5 truncate"
              title={activity.location || "TBA"}
            >
              {activity.location || "Lokasi belum ditentukan"}
            </span>
            <span className="text-micro text-muted-foreground block mt-0.5">
              Ruang / Tempat Kegiatan
            </span>
          </div>
        </div>

        {/* Target Audience */}
        <div className="border border-border bg-card rounded-lg p-4 flex items-start gap-3">
          <div className="p-2.5 rounded-md bg-primary-soft text-primary shrink-0">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
          </div>
          <div className="min-w-0">
            <span className="text-micro font-medium uppercase tracking-wide text-muted-foreground block">
              Peserta Kegiatan
            </span>
            <span className="text-xs font-semibold text-foreground uppercase block mt-0.5">
              {activity.target_audience === "caang"
                ? "Calon Anggota (Caang)"
                : "Anggota UKM Robotik PNP"}
            </span>
            <span className="text-micro text-muted-foreground block mt-0.5">
              Target Audiens Formal
            </span>
          </div>
        </div>
      </div>

      {/* Deskripsi & Detail Content */}
      <div className="border border-border bg-card rounded-lg p-5 sm:p-6 space-y-4">
        <h2 className="text-sm sm:text-base font-display font-semibold text-foreground border-b border-border pb-2">
          Deskripsi & Agenda Kegiatan
        </h2>
        {activity.description ? (
          <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
            {activity.description}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground italic">
            Belum ada deskripsi tambahan yang diberikan untuk kegiatan ini.
          </p>
        )}
      </div>

      {/* Action Footer */}
      <div className="border border-border bg-card rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-center sm:text-left">
          <span className="text-xs font-semibold text-foreground block">
            Aksi & Presensi Kegiatan
          </span>
          <span className="text-micro text-muted-foreground block mt-0.5">
            {isAttendanceActive
              ? "Jendela presensi sedang dibuka! Anda dapat mengisi absensi sekarang."
              : "Gunakan tombol di sebelah kanan untuk mengakses halaman presensi atau rekap."}
          </span>
        </div>

        <ActivityDetailActions
          activity={activity}
          userRole={userRole}
          canManage={canManage}
          isAttendanceActive={isAttendanceActive}
        />
      </div>
    </div>
  );
}

