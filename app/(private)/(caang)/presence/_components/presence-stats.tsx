
import { PresenceStats } from "@/lib/firebase/services/presence-service";
import { cn } from "@/lib/utils";
import { CalendarCheck, CheckCircle2, XCircle, Clock } from "lucide-react";

interface PresenceStatsProps {
  stats: PresenceStats;
}

interface StatItemProps {
    label: string;
    value: number;
    icon: React.ElementType;
    color: string;
    bgColor: string;
}

export function PresenceStatsCard({ stats }: PresenceStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatItem
        label="Total Kegiatan"
        value={stats.totalActivities}
        icon={CalendarCheck}
        color="text-blue-500"
        bgColor="bg-blue-500/10"
      />
      
      <StatItem
        label="Hadir"
        value={stats.attended}
        icon={CheckCircle2}
        color="text-green-500"
        bgColor="bg-green-500/10"
      />

      <StatItem
        label="Terlambat"
        value={stats.late}
        icon={Clock}
        color="text-yellow-500"
        bgColor="bg-yellow-500/10"
      />
      
      <StatItem
        label="Absen / Tidak Hadir"
        value={stats.absent}
        icon={XCircle}
        color="text-red-500"
        bgColor="bg-red-500/10"
      />
      
      <div className="col-span-2 md:col-span-4 mt-2">
        <div className="bg-card border rounded-xl p-6 flex flex-col items-center justify-center text-center">
            <h3 className="text-muted-foreground font-medium mb-2">Persentase Kehadiran</h3>
            <div className="relative flex items-center justify-center">
                 <div className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-cyan-500">
                    {stats.attendanceRate}%
                 </div>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
                Dari total {stats.totalActivities} kegiatan yang telah terlaksana
            </p>
        </div>
      </div>
    </div>
  );
}

function StatItem({ label, value, icon: Icon, color, bgColor }: StatItemProps) {
  return (
    <div className="bg-card border rounded-xl p-5 flex flex-col items-start justify-between hover:shadow-md transition-all">
      <div className={cn("p-2 rounded-lg mb-3", bgColor)}>
        <Icon className={cn("w-5 h-5", color)} />
      </div>
      <div>
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider mt-1">{label}</div>
      </div>
    </div>
  );
}
