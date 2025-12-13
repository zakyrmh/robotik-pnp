
"use client";

import { useEffect, useState } from "react";
import { getUserPresenceData, ActivityWithAttendance, PresenceStats } from "@/lib/firebase/services/presence-service";
import { PresenceStatsCard } from "./presence-stats";
import { ActivityItem } from "./activity-item";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export default function PresenceClientPage() {
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<{
    stats: PresenceStats;
    activities: ActivityWithAttendance[];
    orPeriod: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      
      try {
        setLoading(true);
        setError(null);
        const result = await getUserPresenceData(user.uid);
        setData(result);
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data absensi.");
      } finally {
        setLoading(false);
      }
    }

    if (!authLoading) {
      if (user) {
        fetchData();
      } else {
         // Handle not logged in if necessary, typically protected by layout/middleware
         setLoading(false);
      }
    }
  }, [user, authLoading]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground">Memuat data absensi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Coba Lagi
        </Button>
      </Alert>
    );
  }

  if (!data) {
    return (
        <div className="text-center py-10">
            <h2 className="text-xl font-semibold">Data tidak ditemukan</h2>
            <p className="text-muted-foreground">Tidak ada data absensi untuk ditampilkan.</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Riwayat Absensi</h1>
        <p className="text-muted-foreground">
          Berikut adalah rekapitulasi kehadiran Anda selama periode <span className="font-semibold text-foreground">OR {data.orPeriod}</span>.
        </p>
      </div>

      <PresenceStatsCard stats={data.stats} />

      <div className="space-y-4">
        <h2 className="text-xl font-semibold flex items-center gap-2">
            Daftar Kegiatan
            <span className="text-xs font-normal text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                {data.activities.length}
            </span>
        </h2>
        
        {data.activities.length === 0 ? (
          <div className="text-center py-12 border rounded-xl bg-card/50 border-dashed">
            <p className="text-muted-foreground">Belum ada kegiatan untuk periode ini.</p>
          </div>
        ) : (
          <div className="grid gap-4">
             {data.activities.map((item) => (
               <ActivityItem key={item.activity.id} item={item} />
             ))}
          </div>
        )}
      </div>
    </div>
  );
}
