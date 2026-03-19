"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
  Zap,
  Star,
  Activity,
} from "lucide-react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import { caangGetMyAttendance } from "@/app/actions/or-caang.action";
import {
  OrEvent,
  OrEventAttendance,
  OR_ATTENDANCE_STATUS_LABELS,
} from "@/lib/db/schema/or";

const ATTENDANCE_STATUS_COLORS: Record<string, string> = {
  present: "bg-emerald-500/15 text-emerald-600 border-emerald-500/25",
  late: "bg-orange-500/15 text-orange-600 border-orange-500/25",
  excused: "bg-blue-500/15 text-blue-600 border-blue-500/25",
  sick: "bg-purple-500/15 text-purple-600 border-purple-500/25",
  absent: "bg-red-500/15 text-red-600 border-red-500/25",
};

export default function CaangAbsensiPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [attendance, setAttendance] = useState<(OrEventAttendance & { or_events: OrEvent })[]>([]);

  const fetchAttendance = useCallback(async () => {
    setIsLoading(true);
    const { data } = await caangGetMyAttendance();
    if (data) setAttendance(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAttendance();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchAttendance]);

  // Statistics
  const totalPoints = attendance.reduce((acc, curr) => acc + curr.points, 0);
  const presentCount = attendance.filter(a => a.status === 'present').length;
  const lateCount = attendance.filter(a => a.status === 'late').length;

  return (
    <div className="space-y-6 pb-10">
      {/* Header Consistent Style */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <ClipboardCheck className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rekap Absensi</h1>
          <p className="text-sm text-muted-foreground">
            Riwayat kehadiran dan perolehan poin Anda selama proses OR.
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-xl shadow-sm border overflow-hidden bg-primary/5 border-primary/10">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-primary font-black uppercase tracking-widest">Total Poin</p>
              <p className="text-2xl font-black italic">{totalPoints}</p>
            </div>
            <Star className="size-5 text-primary opacity-30" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">Hadir Tepat</p>
              <p className="text-2xl font-bold">{presentCount}</p>
            </div>
            <CheckCircle2 className="size-5 text-emerald-600 opacity-20" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-orange-600 font-bold uppercase tracking-widest">Terlambat</p>
              <p className="text-2xl font-bold">{lateCount}</p>
            </div>
            <Clock className="size-5 text-orange-600 opacity-20" />
          </CardContent>
        </Card>
        <Card className="rounded-xl shadow-sm border overflow-hidden">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Total Event</p>
              <p className="text-2xl font-bold">{attendance.length}</p>
            </div>
            <Activity className="size-5 text-muted-foreground opacity-20" />
          </CardContent>
        </Card>
      </div>

      {/* Attendance List */}
      <div className="space-y-4 pt-2">
        <h2 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2 italic">
          <Zap className="size-4 text-primary" /> Riwayat Kehadiran
        </h2>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
          </div>
        ) : attendance.length === 0 ? (
          <Card className="rounded-xl border border-dashed py-16 text-center">
            <ClipboardCheck className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <h3 className="text-lg font-bold italic tracking-tight uppercase">Belum Ada Data</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto font-medium">
              Data absensi akan muncul di sini setelah Anda mengikuti kegiatan pertama.
            </p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {attendance.map((att) => (
              <Card key={att.id} className="rounded-xl border shadow-sm transition-all hover:ring-1 hover:ring-primary/10 overflow-hidden">
                <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
                      <Calendar className="size-5 text-muted-foreground" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-xs font-bold text-muted-foreground tracking-tighter uppercase">{new Date(att.or_events.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                      <h4 className="font-black text-sm tracking-tight">{att.or_events.title}</h4>
                      {att.checked_in_at && (
                        <p className="text-[10px] font-bold text-muted-foreground italic tracking-widest uppercase">
                          Check-in: {new Date(att.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-10 border-t sm:border-0 pt-3 sm:pt-0 mt-1 sm:mt-0">
                    <div className="space-y-1 sm:text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground sm:mx-auto">Status</p>
                      <Badge variant="outline" className={`text-[10px] font-bold rounded-lg ${ATTENDANCE_STATUS_COLORS[att.status]}`}>
                        {OR_ATTENDANCE_STATUS_LABELS[att.status]}
                      </Badge>
                    </div>
                    <div className="space-y-1 sm:text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground sm:mx-auto">Perolehan</p>
                      <p className="text-lg font-black text-primary italic">+{att.points} <span className="text-[9px] uppercase tracking-tighter font-medium not-italic">pts</span></p>
                    </div>
                  </div>
                </CardContent>
                {att.notes && (
                  <div className="bg-muted/30 px-5 py-2 border-t">
                    <p className="text-[10px] italic text-muted-foreground font-medium flex items-center gap-1.5">
                       <AlertCircle className="size-3" /> Catatan Admin: {att.notes}
                    </p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
