"use client";

import { useState, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Calendar03Icon, Clock01Icon, Location01Icon, Search01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  upsertAttendanceStatus,
  type ActivityItem,
  type AttendanceSummaryItem,
} from "@/lib/actions/activities";

interface ActivityDetailClientProps {
  activity: ActivityItem;
  initialSummary: AttendanceSummaryItem[];
}

type StatusAbsensi = "hadir" | "izin" | "sakit" | "alfa" | "telat";

const STATUS_CONFIG: Record<
  StatusAbsensi,
  { label: string; color: string; bg: string; border: string }
> = {
  hadir: {
    label: "Hadir",
    color: "text-[#10b981]",
    bg: "bg-[#10b981]/15",
    border: "border-[#10b981]/30",
  },
  izin: {
    label: "Izin",
    color: "text-amber-500",
    bg: "bg-amber-500/15",
    border: "border-amber-500/30",
  },
  sakit: {
    label: "Sakit",
    color: "text-[#1c69d4]",
    bg: "bg-[#1c69d4]/15",
    border: "border-[#1c69d4]/30",
  },
  alfa: {
    label: "Alfa",
    color: "text-[#e22718]",
    bg: "bg-[#e22718]/15",
    border: "border-[#e22718]/30",
  },
  telat: {
    label: "Telat",
    color: "text-purple-500",
    bg: "bg-purple-500/15",
    border: "border-purple-500/30",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getActivityStatus(activity: ActivityItem): "upcoming" | "ongoing" | "completed" {
  const now = new Date();
  const start = new Date(activity.start_date);
  const end = new Date(activity.end_date);
  if (now < start) return "upcoming";
  if (now >= start && now <= end) return "ongoing";
  return "completed";
}

export function ActivityDetailClient({ activity, initialSummary }: ActivityDetailClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [summary, setSummary] = useState(initialSummary);
  const [overrideCell, setOverrideCell] = useState<string | null>(null);

  const filteredSummary = useMemo(() => {
    if (!search.trim()) return summary;
    const q = search.toLowerCase();
    return summary.filter(
      (s) =>
        s.fullName.toLowerCase().includes(q) ||
        s.nim.toLowerCase().includes(q) ||
        s.studyProgramName.toLowerCase().includes(q)
    );
  }, [summary, search]);

  const getActivityStatusBadge = (activity: ActivityItem) => {
    const status = getActivityStatus(activity);
    switch (status) {
      case "upcoming":
        return <Badge variant="secondary" className="font-mono text-[10px] uppercase tracking-wider rounded-none">Akan Datang</Badge>;
      case "ongoing":
        return <Badge className="bg-[#1c69d4] hover:bg-[#1c69d4]/90 font-mono text-[10px] uppercase tracking-wider rounded-none">Berlangsung</Badge>;
      case "completed":
        return <Badge variant="outline" className="font-mono text-[10px] uppercase tracking-wider text-zinc-500 rounded-none border-zinc-200">Selesai</Badge>;
    }
  };

  const handleAttendanceChange = (profileId: string, status: StatusAbsensi) => {
    setOverrideCell(null);
    startTransition(async () => {
      const res = await upsertAttendanceStatus(activity.id, profileId, status);
      if (res.success) {
        toast.success(res.message);
        setSummary((prev) =>
          prev.map((item) => {
            if (item.profileId === profileId) {
              return {
                ...item,
                attendances: {
                  ...item.attendances,
                  [activity.id]: status,
                },
              };
            }
            return item;
          })
        );
      } else {
        toast.error(res.message);
      }
    });
  };

  // Hitung agregat kehadiran dari state
  const aggregatedStats = useMemo(() => {
    const stats = { hadir: 0, izin: 0, sakit: 0, alfa: 0, telat: 0 };
    for (const item of summary) {
      const s = item.attendances[activity.id] as StatusAbsensi | null;
      if (s && stats[s] !== undefined) {
        stats[s]++;
      } else {
        stats.alfa++;
      }
    }
    return stats;
  }, [summary, activity.id]);

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-[#0a0f24] text-zinc-900 dark:text-zinc-50 font-sans selection:bg-[#1c69d4] selection:text-white pb-24">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#0a0f24]/80 backdrop-blur-md border-b border-zinc-200 dark:border-[#222b54]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-6 gap-4">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => router.push("/kegiatan-absensi-caang")}
                className="mt-1 rounded-none border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900"
              >
                <HugeiconsIcon icon={ArrowLeft01Icon} size={18} />
              </Button>
              <div>
                <h1 className="text-3xl font-bold uppercase tracking-tight font-sans">
                  {activity.title}
                </h1>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400 max-w-2xl">
                  {activity.description || "Tidak ada deskripsi."}
                </p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  {getActivityStatusBadge(activity)}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                    <HugeiconsIcon icon={Calendar03Icon} size={14} />
                    <span>{formatDate(activity.start_date)}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                    <HugeiconsIcon icon={Clock01Icon} size={14} />
                    <span>
                      {new Date(activity.start_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} -{" "}
                      {new Date(activity.end_date).toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  {activity.location && (
                    <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono">
                      <HugeiconsIcon icon={Location01Icon} size={14} />
                      <span>{activity.location}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

        {/* ── Summary Stats ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {(["hadir", "izin", "sakit", "alfa", "telat"] as StatusAbsensi[]).map((s) => (
            <div key={s} className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-none p-4 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${STATUS_CONFIG[s].color}`}>{aggregatedStats[s]}</span>
              <span className="font-mono text-xs uppercase tracking-wider text-zinc-500 mt-1">{STATUS_CONFIG[s].label}</span>
            </div>
          ))}
        </div>

        {/* ── Toolbar ───────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 border border-zinc-200 dark:border-zinc-800 rounded-none">
          <div className="relative flex-1 max-w-sm">
            <HugeiconsIcon
              icon={Search01Icon}
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <Input
              placeholder="Cari nama, NIM, prodi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-none border-zinc-200 dark:border-zinc-800 focus-visible:ring-0 focus-visible:border-[#1c69d4] font-mono text-sm"
            />
          </div>
        </div>

        {/* ── Table ─────────────────────────────────────────────────────────── */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 rounded-none overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500 w-[60px] text-center">No</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500">Caang</th>
                  <th className="p-4 font-mono text-[10px] uppercase tracking-wider text-zinc-500 w-[200px] text-center">Status Kehadiran</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900/50">
                {filteredSummary.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center text-zinc-500 font-mono text-xs">
                      Tidak ada data Caang ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredSummary.map((item, idx) => {
                    const status = item.attendances[activity.id] as StatusAbsensi | null;
                    const cfg = status && STATUS_CONFIG[status] ? STATUS_CONFIG[status] : STATUS_CONFIG.alfa;
                    const isOpen = overrideCell === item.profileId;

                    return (
                      <tr key={item.profileId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/20 transition-colors">
                        <td className="p-4 text-center font-mono text-xs text-zinc-500">
                          {idx + 1}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="relative w-10 h-10 rounded-none border border-zinc-200 dark:border-zinc-800 shrink-0 bg-zinc-100 dark:bg-zinc-900 overflow-hidden">
                              {item.photoUrl ? (
                                <Image
                                  src={item.photoUrl}
                                  alt={item.fullName}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-sm text-zinc-500">
                                  {item.fullName[0]?.toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                                {item.fullName}
                              </p>
                              <p className="font-mono text-[10px] text-zinc-500 uppercase mt-0.5">
                                {item.nim} · {item.studyProgramName}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-center relative">
                          <button
                            onClick={() => setOverrideCell(isOpen ? null : item.profileId)}
                            disabled={isPending}
                            className={`font-mono text-[10px] uppercase tracking-wider px-3 py-1.5 rounded-none border transition-colors w-full max-w-[120px] ${
                              cfg ? `${cfg.bg} ${cfg.color} ${cfg.border}` : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 border-zinc-200 dark:border-zinc-800"
                            } hover:opacity-80 disabled:opacity-50`}
                          >
                            {cfg ? cfg.label : "Alfa"}
                          </button>

                          {/* Dropdown Menu */}
                          {isOpen && (
                            <div className="absolute z-50 top-full left-1/2 -translate-x-1/2 mt-1 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-lg rounded-none min-w-[120px]">
                              {(["hadir", "izin", "sakit", "alfa", "telat"] as StatusAbsensi[]).map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleAttendanceChange(item.profileId, s)}
                                  className={`w-full text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider hover:opacity-80 transition-colors ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bg}`}
                                >
                                  {STATUS_CONFIG[s].label}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
