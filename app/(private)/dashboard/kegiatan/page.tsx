import { Suspense } from "react";
import {
  CalendarDays,
  MapPin,
  Clock,
  Video,
  Monitor,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import { getAllEventsForCaang, OrEvent } from "@/app/actions/or-events.action";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function KegiatanPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Jadwal & Kegiatan</h1>
        <p className="text-sm text-muted-foreground">
          Seluruh jadwal pelatihan, wawancara, dan kegiatan Open Recruitment UKM Robotik PNP.
        </p>
      </div>

      <Suspense fallback={<KegiatanSkeleton />}>
        <KegiatanList />
      </Suspense>
    </div>
  );
}

async function KegiatanList() {
  const { data: events, error } = await getAllEventsForCaang();

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-8 text-center">
        <AlertCircle className="size-8 text-destructive mx-auto mb-2" />
        <p className="text-sm font-medium text-destructive">{error}</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-dashed p-12 text-center">
        <CalendarDays className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <p className="text-sm font-medium">Belum ada kegiatan</p>
        <p className="text-xs text-muted-foreground mt-1 text-balance max-w-xs mx-auto">
          Panitia belum mempublikasikan jadwal kegiatan apa pun. Silakan cek berkala atau hubungi admin di grup komunitas.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

function EventCard({ event }: { event: OrEvent }) {
  const isPast = new Date(`${event.event_date}T${event.start_time}`) < new Date();
  
  return (
    <div className={`group relative flex flex-col rounded-xl border bg-card transition-all hover:shadow-md ${isPast ? 'opacity-80' : ''}`}>
      <div className="p-5 space-y-4">
        {/* Header: Mode & Status */}
        <div className="flex items-center justify-between">
          <Badge variant={event.execution_mode === 'offline' ? 'amber' : 'blue'} className="capitalize text-[10px] h-5">
            {event.execution_mode === 'offline' ? <MapPin className="size-3 mr-1" /> : <Video className="size-3 mr-1" />}
            {event.execution_mode}
          </Badge>
          
          {event.status === 'completed' ? (
            <Badge variant="success" className="text-[10px] h-5">Selesai</Badge>
          ) : isPast ? (
            <Badge variant="secondary" className="text-[10px] h-5">Sudah Terlewat</Badge>
          ) : (
            <Badge variant="outline" className="text-[10px] h-5 border-blue-500/50 text-blue-600 animate-pulse">Akan Datang</Badge>
          )}
        </div>

        {/* Title */}
        <div>
          <h3 className="font-bold leading-tight group-hover:text-primary transition-colors">{event.title}</h3>
          <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">{event.description || 'Tidak ada deskripsi.'}</p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-y-2 text-xs border-t pt-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="size-3.5" />
            <span>{new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{event.start_time.substring(0, 5)} {event.end_time ? `- ${event.end_time.substring(0, 5)}` : ''}</span>
          </div>
          <div className="col-span-2 flex items-center gap-2 text-muted-foreground truncate">
            <MapPin className="size-3.5" />
            <span>{event.location || '-'}</span>
          </div>
        </div>

        {/* Action Button for Online Link */}
        {(event.execution_mode === 'online' || event.execution_mode === 'hybrid') && event.meeting_link && !isPast && (
          <a
            href={event.meeting_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full mt-2 rounded-lg bg-blue-500 py-2 text-xs font-semibold text-white hover:bg-blue-600 transition-colors"
          >
            <Monitor className="size-3.5" />
            Gabung Sesi Online
            <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function KegiatanSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Skeleton key={i} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}
