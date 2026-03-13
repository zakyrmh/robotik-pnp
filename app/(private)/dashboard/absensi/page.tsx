import { Suspense } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  HelpCircle,
  Info,
} from "lucide-react";
import { getMyAttendances } from "@/app/actions/or-events.action";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AbsensiPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Rekap Absensi</h1>
        <p className="text-sm text-muted-foreground">
          Riwayat kehadiran kamu pada setiap tahapan kegiatan Open Recruitment.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        <Suspense fallback={<StatsSkeleton />}>
          <AttendanceStats />
        </Suspense>
      </div>

      <div className="rounded-xl border bg-card shadow-sm overflow-hidden">
        <Suspense fallback={<TableSkeleton />}>
          <AttendanceTable />
        </Suspense>
      </div>
    </div>
  );
}

async function AttendanceStats() {
  const { data: attendances } = await getMyAttendances();
  
  const present = attendances.filter(a => a.status === 'present').length;
  const late = attendances.filter(a => a.status === 'late').length;
  const excused = attendances.filter(a => a.status === 'excused').length;
  const absent = attendances.filter(a => a.status === 'absent').length;

  const stats = [
    { label: 'Hadir', value: present, color: 'text-emerald-600', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
    { label: 'Terlambat', value: late, color: 'text-amber-600', bg: 'bg-amber-500/10', icon: Clock },
    { label: 'Izin/Sakit', value: excused, color: 'text-blue-600', bg: 'bg-blue-500/10', icon: HelpCircle },
    { label: 'Alpa', value: absent, color: 'text-red-600', bg: 'bg-red-500/10', icon: XCircle },
  ];

  return (
    <>
      {stats.map((stat) => (
        <div key={stat.label} className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}>
              <stat.icon className={`size-5 ${stat.color}`} />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">{stat.label}</p>
              <p className="text-xl font-bold tracking-tight">{stat.value}</p>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

async function AttendanceTable() {
  const { data: attendances, error } = await getMyAttendances();

  if (error) {
    return (
      <div className="p-8 text-center text-destructive">
        <AlertCircle className="size-8 mx-auto mb-2" />
        <p className="text-sm font-medium">{error}</p>
      </div>
    );
  }

  if (attendances.length === 0) {
    return (
      <div className="p-12 text-center">
        <Info className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium text-muted-foreground">Belum ada data absensi</p>
        <p className="text-xs text-muted-foreground mt-1">
          Data akan muncul setelah kegiatan selesai dan diproses oleh admin.
        </p>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader className="bg-muted/50">
        <TableRow>
          <TableHead>Kegiatan</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Waktu Check-in</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Catatan</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {attendances.map((att) => (
          <TableRow key={att.id}>
            <TableCell className="font-medium">
              {att.event?.title || 'Kegiatan dihapus'}
            </TableCell>
            <TableCell className="text-xs">
              {att.event ? new Date(att.event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
            </TableCell>
            <TableCell className="text-xs font-mono">
              {att.checked_in_at ? new Date(att.checked_in_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'}
            </TableCell>
            <TableCell>
              <AttendanceBadge status={att.status} />
            </TableCell>
            <TableCell className="text-xs text-muted-foreground italic">
              {att.notes || '-'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function AttendanceBadge({ status }: { status: string }) {
  const configs: Record<string, { label: string, variant: "success" | "warning" | "blue" | "destructive" | "secondary" | "default" | "outline" | "amber" | "emerald" | "indigo" | "ghost" | "link" }> = {
    present: { label: 'Hadir', variant: 'success' },
    late: { label: 'Terlambat', variant: 'warning' },
    excused: { label: 'Izin', variant: 'blue' },
    absent: { label: 'Alpa', variant: 'destructive' },
  };

  const config = configs[status] || { label: status, variant: 'secondary' };

  return (
    <Badge variant={config.variant} className="text-[10px] uppercase font-bold tracking-wider px-2 py-0">
      {config.label}
    </Badge>
  );
}

function StatsSkeleton() {
  return [1, 2, 3, 4].map(i => <Skeleton key={i} className="h-20 w-full rounded-xl" />);
}

function TableSkeleton() {
  return <Skeleton className="h-64 w-full" />;
}
