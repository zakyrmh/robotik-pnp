"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { KomdisScannerView } from "@/components/features/komdis/komdis-scanner-view";
import { AnggotaQrView } from "@/components/features/komdis/anggota-qr-view";
import { Skeleton } from "@/components/ui/skeleton";

interface AbsensiKegiatanClientProps {
  activityId: string;
}

interface ActivityInfo {
  id: string;
  title: string;
  target_audience: "caang" | "anggota";
}

interface ProfileInfo {
  id: string;
  role: string;
  full_name: string | null;
  nim: string | null;
}

export function AbsensiKegiatanClient({
  activityId,
}: AbsensiKegiatanClientProps) {
  const supabase = createClient();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [profile, setProfile] = useState<ProfileInfo | null>(null);
  const [activity, setActivity] = useState<ActivityInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const userId = user.id;
    let isMounted = true;

    async function loadData() {
      try {
        const [
          { data: profData, error: profError },
          { data: actData, error: actError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, role, full_name, nim")
            .eq("id", userId)
            .single(),
          supabase
            .from("activities")
            .select("id, title, target_audience")
            .eq("id", activityId)
            .single(),
        ]);

        if (profError || !profData) {
          router.push("/login");
          return;
        }

        if (actError || !actData) {
          if (isMounted) {
            setError("Kegiatan tidak ditemukan.");
            setLoading(false);
          }
          return;
        }

        if (isMounted) {
          setProfile(profData);
          setActivity(actData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Gagal memuat data presensi:", err);
        if (isMounted) {
          setError("Gagal memuat informasi kegiatan.");
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading, activityId, supabase, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-xl mx-auto space-y-6 px-2 sm:px-0">
        <Skeleton className="h-28 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
        <Skeleton className="h-80 w-full rounded-xl bg-slate-200 dark:bg-slate-800" />
      </div>
    );
  }

  if (error || !profile || !activity) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center border border-red-200 dark:border-red-900/50 rounded-xl bg-red-50 dark:bg-red-950/30 p-6 sm:p-8 max-w-xl mx-auto px-4">
        <p className="text-xs font-mono uppercase tracking-wider text-red-700 dark:text-red-300">
          {error || "Kegiatan tidak ditemukan."}
        </p>
      </div>
    );
  }

  const isKomdisAdmin = ["admin-komdis", "super-admin"].includes(profile.role);

  return (
    <div className="space-y-6 px-2 sm:px-4 lg:px-6 max-w-4xl mx-auto">
      {/* Precision Blueprint Top Tricolor Line */}
      <div className="h-1 w-full bg-linear-to-r from-[#1e3a8a] via-[#3b82f6] to-[#f97316] rounded-full" />

      {isKomdisAdmin ? (
        <KomdisScannerView
          activityId={activityId}
          activityTitle={activity.title}
        />
      ) : (
        <AnggotaQrView
          activityId={activityId}
          activityTitle={activity.title}
          profileId={profile.id}
          profileName={profile.full_name || "Anggota"}
          nim={profile.nim || "-"}
        />
      )}
    </div>
  );
}
