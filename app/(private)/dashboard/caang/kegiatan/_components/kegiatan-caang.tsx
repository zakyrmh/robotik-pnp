"use client";

/**
 * KegiatanCaang — Daftar kegiatan OR untuk caang.
 *
 * Fitur:
 * - Grid card kegiatan published/completed
 * - Detail modal per kegiatan
 * - Generate QR absensi (modal, persist selama belum expired)
 * - Timer countdown 5 menit
 */

import { useState, useEffect, useTransition, useRef, useCallback } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  QrCode as QrIcon,
  Loader2,
  Info,
  Link2,
  ChevronRight,
  X,
} from "lucide-react";
import { toast } from "sonner";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

import { caangGenerateAttendanceToken } from "@/app/actions/or-caang.action";
import type { OrEvent, OrAttendanceToken } from "@/lib/db/schema/or";
import { OR_EVENT_TYPE_LABELS, OR_EVENT_MODE_LABELS } from "@/lib/db/schema/or";
import Image from "next/image";

// ═══════════════════════════════════════════════

interface Props {
  initialEvents: OrEvent[];
}

export function KegiatanCaang({ initialEvents }: Props) {
  const [isPending, startTransition] = useTransition();
  const [events] = useState<OrEvent[]>(initialEvents);
  const [selectedEvent, setSelectedEvent] = useState<OrEvent | null>(null);

  // QR state — persists across modal open/close
  const [qrToken, setQrToken] = useState<OrAttendanceToken | null>(null);
  const [qrEventId, setQrEventId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [showQrModal, setShowQrModal] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Timer for QR Expiration ──
  useEffect(() => {
    if (!qrToken) return;

    // Clear previous timer
    if (timerRef.current) clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      const remaining = Math.max(
        0,
        Math.floor(
          (new Date(qrToken.expires_at).getTime() - Date.now()) / 1000,
        ),
      );
      setTimeLeft(remaining);

      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setQrToken(null);
        setQrEventId(null);
        setQrDataUrl(null);
      }
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrToken]);

  // ── Generate QR data URL from token ──
  const generateQrImage = useCallback(async (token: string) => {
    try {
      const url = await QRCode.toDataURL(token, {
        width: 220,
        margin: 2,
        color: { dark: "#000000", light: "#ffffff" },
        errorCorrectionLevel: "M",
      });
      setQrDataUrl(url);
    } catch {
      toast.error("Gagal generate QR image.");
    }
  }, []);

  // ── Check if event is within generate window ──
  const canGenerateQr = (
    event: OrEvent,
  ): { allowed: boolean; message?: string } => {
    const now = new Date();
    const eventStart = new Date(`${event.event_date}T${event.start_time}`);
    const windowStart = new Date(eventStart.getTime() - 2 * 60 * 60 * 1000);

    if (now < windowStart) {
      const diffMs = windowStart.getTime() - now.getTime();
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      return {
        allowed: false,
        message: `Bisa generate ${diffHours > 0 ? `${diffHours}j ` : ""}${diffMins}m lagi`,
      };
    }

    if (event.end_time) {
      const eventEnd = new Date(`${event.event_date}T${event.end_time}`);
      if (now > eventEnd) {
        return { allowed: false, message: "Kegiatan sudah selesai" };
      }
    }

    return { allowed: true };
  };

  const handleOpenDetail = (event: OrEvent) => {
    setSelectedEvent(event);
  };

  const handleGenerateToken = () => {
    if (!selectedEvent) return;

    startTransition(async () => {
      const { data, error } = await caangGenerateAttendanceToken(
        selectedEvent.id,
      );
      if (data) {
        setQrToken(data);
        setQrEventId(selectedEvent.id);
        await generateQrImage(data.token);
        setShowQrModal(true);
      } else {
        toast.error(error || "Gagal generate token.");
      }
    });
  };

  // ── Open existing QR (if token still valid) ──
  const handleOpenExistingQr = () => {
    if (qrToken && qrDataUrl) {
      setShowQrModal(true);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Check if current event has an active QR token
  const hasActiveTokenForEvent = (eventId: string) =>
    qrToken && qrEventId === eventId && timeLeft > 0;

  return (
    <>
      {/* Grid Events */}
      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed bg-card p-12 text-center shadow-sm">
          <Calendar className="size-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">Belum Ada Kegiatan</p>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto mt-1">
            Pantau terus halaman ini untuk informasi kegiatan seleksi terbaru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {events.map((event) => {
            const qrCheck = canGenerateQr(event);
            return (
              <div
                key={event.id}
                className="rounded-xl border bg-card shadow-sm overflow-hidden cursor-pointer hover:ring-1 hover:ring-primary/20 transition-all"
                onClick={() => handleOpenDetail(event)}
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 px-4 pt-3 pb-2">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-accent/50 border-transparent"
                      >
                        {OR_EVENT_TYPE_LABELS[event.event_type]}
                      </Badge>
                      {event.status === "completed" && (
                        <Badge
                          variant="outline"
                          className="text-[10px] bg-blue-500/15 text-blue-600 border-blue-500/25"
                        >
                          Selesai
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm font-semibold truncate">
                      {event.title}
                    </p>
                  </div>
                  <div className="size-7 rounded-full bg-muted/50 flex items-center justify-center shrink-0">
                    <ChevronRight className="size-3.5 text-muted-foreground" />
                  </div>
                </div>

                {/* Details */}
                <div className="px-4 pb-3 space-y-1.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="size-3 shrink-0" />
                    <span>
                      {new Date(event.event_date).toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="size-3 shrink-0" />
                    <span>
                      {event.start_time.substring(0, 5)} –{" "}
                      {event.end_time?.substring(0, 5) || "Selesai"} WIB
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="size-3 shrink-0" />
                    <span className="truncate">
                      {event.execution_mode === "online"
                        ? "Daring (Online)"
                        : event.location || "-"}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t px-4 py-2 flex items-center justify-between">
                  <span className="text-[10px] text-muted-foreground">
                    {OR_EVENT_MODE_LABELS[event.execution_mode]}
                  </span>
                  {event.allow_attendance && (
                    <span className="text-[10px] font-semibold text-emerald-600 flex items-center gap-1">
                      <QrIcon className="size-3" />
                      {hasActiveTokenForEvent(event.id)
                        ? `QR Aktif (${formatTime(timeLeft)})`
                        : qrCheck.allowed
                          ? "Ada Absensi"
                          : qrCheck.message}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!selectedEvent}
        onOpenChange={(open) => !open && setSelectedEvent(null)}
      >
        <DialogContent className="max-w-md rounded-xl shadow-lg">
          {selectedEvent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-lg font-bold">
                  {selectedEvent.title}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Detail informasi dan sistem absensi kegiatan.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Event info */}
                <div className="rounded-lg bg-muted/30 p-3 space-y-2.5 border">
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-background flex items-center justify-center border shadow-sm">
                      <Calendar className="size-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">
                      {new Date(selectedEvent.event_date).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-background flex items-center justify-center border shadow-sm">
                      <Clock className="size-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">
                      {selectedEvent.start_time.substring(0, 5)} –{" "}
                      {selectedEvent.end_time?.substring(0, 5) || "Selesai"} WIB
                    </p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <div className="size-7 rounded-md bg-background flex items-center justify-center border shadow-sm">
                      <MapPin className="size-3.5 text-primary" />
                    </div>
                    <p className="text-xs font-medium">
                      {selectedEvent.location || "Daring (Online)"}
                    </p>
                  </div>
                  {selectedEvent.meeting_link && (
                    <div className="flex items-center gap-2.5">
                      <div className="size-7 rounded-md bg-background flex items-center justify-center border shadow-sm">
                        <Link2 className="size-3.5 text-blue-600" />
                      </div>
                      <a
                        href={selectedEvent.meeting_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-medium text-blue-600 hover:underline truncate flex-1"
                      >
                        Link Meeting →
                      </a>
                    </div>
                  )}
                </div>

                {selectedEvent.description && (
                  <div className="space-y-1">
                    <Label className="text-[10px] text-muted-foreground">
                      Deskripsi
                    </Label>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {selectedEvent.description}
                    </p>
                  </div>
                )}

                {/* Attendance section */}
                {selectedEvent.allow_attendance ? (
                  <div className="border-t pt-4 space-y-3">
                    <div className="flex flex-col items-center text-center space-y-2">
                      <div className="size-12 rounded-xl bg-primary/5 flex items-center justify-center">
                        <QrIcon className="size-6 text-primary" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-semibold">Absensi Digital</p>
                        <p className="text-[10px] text-muted-foreground max-w-[220px]">
                          QR Code berlaku 5 menit. Hanya bisa generate 2 jam
                          sebelum acara dimulai.
                        </p>
                      </div>

                      {(() => {
                        const check = canGenerateQr(selectedEvent);
                        const hasActive = hasActiveTokenForEvent(
                          selectedEvent.id,
                        );

                        if (hasActive) {
                          // Token masih aktif → buka kembali modal QR
                          return (
                            <Button
                              className="w-full cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenExistingQr();
                              }}
                            >
                              <QrIcon className="size-4" /> Lihat QR Code (
                              {formatTime(timeLeft)})
                            </Button>
                          );
                        }

                        if (!check.allowed) {
                          // Belum bisa generate
                          return (
                            <div className="w-full space-y-2">
                              <Button
                                className="w-full cursor-not-allowed"
                                disabled
                              >
                                <QrIcon className="size-4" /> Generate QR
                                Absensi
                              </Button>
                              <p className="text-[10px] text-orange-600 font-medium">
                                {check.message}
                              </p>
                            </div>
                          );
                        }

                        // Bisa generate
                        return (
                          <Button
                            className="w-full cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleGenerateToken();
                            }}
                            disabled={isPending}
                          >
                            {isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <QrIcon className="size-4" />
                            )}
                            Generate QR Absensi
                          </Button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-muted/30 p-3 flex items-start gap-2.5 border border-dashed">
                    <Info className="size-4 text-muted-foreground mt-0.5 shrink-0" />
                    <p className="text-[10px] text-muted-foreground leading-normal">
                      Kegiatan ini bersifat informatif. Tidak diperlukan absensi
                      kehadiran.
                    </p>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs cursor-pointer"
                  onClick={() => setSelectedEvent(null)}
                >
                  Tutup
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* QR Code Modal — persists across detail dialog open/close */}
      <Dialog open={showQrModal} onOpenChange={setShowQrModal}>
        <DialogContent className="max-w-xs rounded-xl shadow-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-center">
              QR Code Absensi
            </DialogTitle>
            <DialogDescription className="text-xs text-center">
              Tunjukkan QR ini ke panitia untuk discan.
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center space-y-3 py-2">
            {qrDataUrl ? (
              <div className="p-3 bg-white rounded-xl border shadow-sm">
                <Image
                  src={qrDataUrl}
                  alt="QR Code Absensi"
                  className="size-[200px] rounded-lg"
                />
              </div>
            ) : (
              <div className="size-[200px] rounded-xl bg-muted animate-pulse" />
            )}

            {timeLeft > 0 ? (
              <div className="text-center space-y-1.5">
                <p
                  className={`text-xs font-bold flex items-center gap-1.5 justify-center ${
                    timeLeft <= 60 ? "text-red-600" : "text-primary"
                  }`}
                >
                  <Clock className="size-3 animate-pulse" />
                  Berlaku: {formatTime(timeLeft)}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  QR akan otomatis expired setelah 5 menit.
                </p>
              </div>
            ) : (
              <div className="text-center space-y-1.5">
                <p className="text-xs font-bold text-red-600">QR Expired</p>
                <p className="text-[10px] text-muted-foreground">
                  Silakan generate ulang dari halaman kegiatan.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs cursor-pointer"
              onClick={() => setShowQrModal(false)}
            >
              <X className="size-3" /> Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
