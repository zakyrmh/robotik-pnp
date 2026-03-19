"use client";

import { useState, useEffect, useTransition, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  QrCode as QrIcon,
  Loader2,
  CalendarDays,
  Info,
  Link2,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter, // Added DialogFooter
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

import {
  caangGetEvents,
  caangGenerateAttendanceToken,
} from "@/app/actions/or-caang.action";
import {
  OrEvent,
  OR_EVENT_TYPE_LABELS,
  OR_EVENT_MODE_LABELS,
  OrAttendanceToken,
} from "@/lib/db/schema/or";

export default function CaangKegiatanPage() {
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [events, setEvents] = useState<OrEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<OrEvent | null>(null);
  const [qrToken, setQrToken] = useState<OrAttendanceToken | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    const { data } = await caangGetEvents();
    if (data) setEvents(data);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchEvents();
    }, 0);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  // Timer for QR Expiration
  useEffect(() => {
    if (!qrToken) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((new Date(qrToken.expires_at).getTime() - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining <= 0) {
        clearInterval(interval);
        setQrToken(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [qrToken]);

  const handleOpenDetail = (event: OrEvent) => {
    setSelectedEvent(event);
    setQrToken(null); // Reset QR when opening different event
  };

  const generateToken = () => {
    if (!selectedEvent) return;

    startTransition(async () => {
      const { data, error } = await caangGenerateAttendanceToken(selectedEvent.id);
      if (data) {
        setQrToken(data);
      } else {
        setFeedback({ type: "error", msg: error || "Gagal generate token." });
      }
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header Pattern */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <CalendarDays className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jadwal & Kegiatan</h1>
          <p className="text-sm text-muted-foreground">
            Daftar agenda kegiatan pendaftaran yang harus Anda ikuti.
          </p>
        </div>
      </div>

      {feedback && (
        <div className={`rounded-lg border px-4 py-3 text-sm animate-in fade-in-0 flex items-center gap-2 ${
          feedback.type === 'error' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700'
        }`}>
          <AlertCircle className="size-4" /> {feedback.msg}
        </div>
      )}

      {/* Grid Events */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-xl" />)}
        </div>
      ) : events.length === 0 ? (
        <Card className="rounded-xl border border-dashed py-16 text-center">
          <Calendar className="size-12 text-muted-foreground mx-auto mb-4 opacity-20" />
          <h3 className="text-lg font-bold">Belum Ada Kegiatan</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Pantau terus halaman ini untuk mendapatkan informasi kegiatan seleksi terbaru.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {events.map((event) => (
            <Card key={event.id} className="rounded-xl border shadow-sm flex flex-col hover:shadow-md transition-all cursor-pointer group" onClick={() => handleOpenDetail(event)}>
              <CardHeader className="p-4 flex flex-row items-start justify-between space-y-0">
                <div className="space-y-1">
                  <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider bg-primary/5 text-primary border-primary/10">
                    {OR_EVENT_TYPE_LABELS[event.event_type]}
                  </Badge>
                  <CardTitle className="text-base font-bold group-hover:text-primary transition-colors">{event.title}</CardTitle>
                </div>
                <div className="size-8 rounded-full bg-muted/50 flex items-center justify-center">
                  <ChevronRight className="size-4 text-muted-foreground" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3 flex-1 text-sm">
                <div className="flex flex-col gap-2 text-muted-foreground text-xs font-medium">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-primary" />
                    {new Date(event.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="size-3.5 text-primary" />
                    {event.start_time.substring(0, 5)} WIB
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="size-3.5 text-primary" />
                    <span className="truncate">{event.execution_mode === 'online' ? 'Daring (Online)' : event.location}</span>
                  </div>
                </div>
                
                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-70">
                    {OR_EVENT_MODE_LABELS[event.execution_mode]}
                  </span>
                  {event.allow_attendance && (
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 uppercase">
                      <QrIcon className="size-3" /> Ada Absensi
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
        <DialogContent className="max-w-md rounded-xl shadow-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">{selectedEvent.title}</DialogTitle>
                <DialogDescription className="text-sm font-medium">
                  Detail informasi dan sistem absensi kegiatan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-4">
                <div className="rounded-lg bg-muted/30 p-4 space-y-3 border">
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                         <Calendar className="size-4 text-primary" />
                      </div>
                      <p className="text-sm font-bold">{new Date(selectedEvent.event_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                         <Clock className="size-4 text-primary" />
                      </div>
                      <p className="text-sm font-bold">{selectedEvent.start_time.substring(0, 5)} - {selectedEvent.end_time?.substring(0, 5) || 'Selesai'} WIB</p>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                         <MapPin className="size-4 text-primary" />
                      </div>
                      <p className="text-sm font-bold">{selectedEvent.location || 'Daring (Online)'}</p>
                   </div>
                   {selectedEvent.meeting_link && (
                     <div className="flex items-center gap-3">
                        <div className="size-8 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                           <Link2 className="size-4 text-blue-600" />
                        </div>
                        <a href={selectedEvent.meeting_link} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-blue-600 hover:underline truncate flex-1">
                           Link Meeting →
                        </a>
                     </div>
                   )}
                </div>

                {selectedEvent.description && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Deskripsi Kegiatan</Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">{selectedEvent.description}</p>
                  </div>
                )}

                {selectedEvent.allow_attendance ? (
                  <div className="border-t pt-5 space-y-4">
                    <div className="flex flex-col items-center justify-center text-center space-y-3">
                      {!qrToken ? (
                        <>
                          <div className="size-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-1">
                             <QrIcon className="size-8 text-primary opacity-40 shrink-0" />
                          </div>
                          <div className="space-y-1">
                            <h4 className="text-sm font-bold italic tracking-tight uppercase">Sistem Absensi Digital</h4>
                            <p className="text-[10px] text-muted-foreground max-w-[200px]">QR Code berlaku selama 5 menit untuk discan oleh panitia.</p>
                          </div>
                          <Button 
                            className="w-full h-10 rounded-xl font-bold bg-primary hover:shadow-lg shadow-primary/20 transition-all"
                            onClick={generateToken}
                            disabled={isPending}
                          >
                            {isPending ? <Loader2 className="size-4 animate-spin mr-2" /> : <QrIcon className="size-4 mr-2" />}
                            Generate QR Absensi
                          </Button>
                        </>
                      ) : (
                        <>
                          {/* QR Code Placeholder/Simulation */}
                          <div className="relative group p-4 bg-white rounded-2xl border shadow-inner">
                             {/* Simulation of a QR code using blocks or simple image API */}
                             <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${qrToken.token}`}
                                alt="QR Code Absensi"
                                className="size-[180px] rounded-lg"
                             />
                             <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl pointer-events-none">
                                <div className="bg-primary/90 text-white text-[10px] font-black px-2 py-1 rounded-full uppercase tracking-widest">RAHASIA</div>
                             </div>
                          </div>
                          <div className="space-y-1.5 pt-2">
                             <p className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5 justify-center">
                                <Clock className="size-3 animate-pulse" /> Expired: {formatTime(timeLeft)}
                             </p>
                             <code className="text-[10px] font-bold bg-muted px-2 py-1 rounded-md text-muted-foreground">
                                {qrToken.token}
                             </code>
                             <p className="text-[9px] text-muted-foreground italic font-medium">Tunjukkan ke panitia untuk discan.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-zinc-500/5 p-3 flex items-start gap-3 border border-dashed">
                      <Info className="size-4 text-zinc-500 mt-0.5" />
                      <p className="text-[10px] font-medium text-muted-foreground leading-normal italic">
                        Kegiatan ini bersifat informatif atau bersifat penugasan/project. Tidak diperlukan absensi kehadiran di tempat.
                      </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => setSelectedEvent(null)}>Tutup</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

