"use client";

import { useState } from "react";
import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  QrCodeIcon,
  TableIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { KomdisScannerView } from "@/components/features/komdis/komdis-scanner-view";
import { AnggotaQrView } from "@/components/features/komdis/anggota-qr-view";
import { ActivityAttendanceDetailClient } from "./activity-attendance-detail-client";
import type { ActivityAttendanceDetailResult } from "@/lib/actions/komdis";

interface UnifiedActivityPresensiClientProps {
  activityId: string;
  userRole: string;
  canManage: boolean;
  profile: {
    id: string;
    full_name: string | null;
    nim: string | null;
  };
  activityDetailData?: ActivityAttendanceDetailResult | null;
  activityInfo?: {
    id: string;
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    location: string | null;
    target_audience: string;
    checkin_open_at?: string | null;
    checkin_close_at?: string | null;
  } | null;
}

export function UnifiedActivityPresensiClient({
  activityId,
  userRole,
  canManage,
  profile,
  activityDetailData,
  activityInfo,
}: UnifiedActivityPresensiClientProps) {
  const [managerView, setManagerView] = useState<
    "scanner" | "rekap" | "my_qr"
  >("scanner");

  const title =
    activityDetailData?.activity.title || activityInfo?.title || "Detail Presensi Kegiatan";
  const startDate =
    activityDetailData?.activity.startDate || activityInfo?.start_date;
  const endDate =
    activityDetailData?.activity.endDate || activityInfo?.end_date;
  const checkinOpenAt = activityInfo?.checkin_open_at;
  const checkinCloseAt = activityInfo?.checkin_close_at;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
      {/* Top Header & Navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-md border border-border text-foreground hover:bg-muted font-medium text-xs h-9 px-3"
          >
            <Link href="/presensi">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
              Kembali
            </Link>
          </Button>
          <div>
            <span className="text-micro font-mono font-bold uppercase tracking-wider text-primary block">
              {canManage ? "MODUL PRESENSI PANITIA / KOMDIS" : "PRESENSI KEGIATAN"}
            </span>
            <h1 className="text-lg sm:text-xl font-display font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          </div>
        </div>

        {/* Manager Mode Switcher Tabs */}
        {canManage && (
          <div className="flex border border-border bg-card rounded-lg p-1 gap-1 shadow-xs w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setManagerView("scanner")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                managerView === "scanner"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={QrCodeIcon} size={15} />
              <span>Pemindai QR</span>
            </button>

            <button
              type="button"
              onClick={() => setManagerView("rekap")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                managerView === "rekap"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={TableIcon} size={15} />
              <span>Tabel Rekap</span>
            </button>

            <button
              type="button"
              onClick={() => setManagerView("my_qr")}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 py-1.5 rounded-md font-mono text-xs uppercase tracking-wider font-semibold transition-colors cursor-pointer ${
                managerView === "my_qr"
                  ? "bg-primary text-primary-foreground shadow-xs"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <HugeiconsIcon icon={UserIcon} size={15} />
              <span>QR Saya</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {canManage ? (
        <>
          {managerView === "scanner" && (
            <div className="max-w-4xl mx-auto">
              <KomdisScannerView
                activityId={activityId}
                activityTitle={title}
              />
            </div>
          )}

          {managerView === "rekap" && activityDetailData && (
            <ActivityAttendanceDetailClient initialData={activityDetailData} />
          )}

          {managerView === "my_qr" && (
            <AnggotaQrView
              activityId={activityId}
              activityTitle={title}
              startDate={startDate}
              endDate={endDate}
              checkinOpenAt={checkinOpenAt}
              checkinCloseAt={checkinCloseAt}
              profileId={profile.id}
              profileName={profile.full_name || "Manajer"}
              nim={profile.nim || "-"}
            />
          )}
        </>
      ) : (
        /* Participant View (Anggota / Caang / Non-Manager) */
        <AnggotaQrView
          activityId={activityId}
          activityTitle={title}
          startDate={startDate}
          endDate={endDate}
          checkinOpenAt={checkinOpenAt}
          checkinCloseAt={checkinCloseAt}
          profileId={profile.id}
          profileName={profile.full_name || "Peserta"}
          nim={profile.nim || "-"}
        />
      )}
    </div>
  );
}
