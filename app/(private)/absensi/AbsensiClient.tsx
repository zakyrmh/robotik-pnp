"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Calendar03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { generateAttendanceQR, scanAttendanceQR, submitLeaveRequest } from "@/lib/actions/attendance";
import { Html5Qrcode } from "html5-qrcode";

// Inline custom SVGs for safety against missing HUGEICONS exports
const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
  </svg>
);

const LocationIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1 1 15 0Z" />
  </svg>
);

const CancelIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
  </svg>
);

export interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
}

export interface Attendance {
  id: string;
  activity_id: string | null;
  profile_id: string | null;
  check_in_at: string | null;
  status: "hadir" | "telat" | "izin" | "sakit" | "alfa";
  notes: string | null;
  proof_url: string | null;
  verified_by: string | null;
}

export interface HistoryItem {
  id: string;
  check_in_at: string;
  status: "hadir" | "telat" | "izin" | "sakit" | "alfa";
  notes: string | null;
  proof_url: string | null;
  activity_id: string | null;
  activity_title: string;
  activity_start_date: string;
  activity_location: string;
}

interface AbsensiClientProps {
  profile: {
    id: string;
    email: string;
    role: string;
    is_onboarded: boolean;
  };
  initialActivities: Activity[];
  initialAttendances: Attendance[];
  initialHistory: HistoryItem[];
}

export function AbsensiClient({
  profile,
  initialActivities,
  initialAttendances,
  initialHistory,
}: AbsensiClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<string>("kegiatan");

  // Geolocation state
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // QR Modal state
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(0);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Leave Modal state
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [leaveStatus, setLeaveStatus] = useState<"sakit" | "izin">("izin");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [leaveFile, setLeaveFile] = useState<File | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);

  // Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const isAdmin = ["admin-komdis", "admin-or", "super-admin"].includes(profile.role);

  // 1. Ask for geolocation on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation access denied or unavailable:", error);
        }
      );
    }
  }, []);

  // 2. Countdown timer for QR Code expiration
  useEffect(() => {
    if (!expiresAt || countdown <= 0) return;
    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((new Date(expiresAt).getTime() - Date.now()) / 1000));
      setCountdown(remaining);
      if (remaining <= 0) {
        setQrString(null);
        setExpiresAt(null);
        toast.error("QR Code expired. Silakan buat ulang.");
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt, countdown]);

  // 3. Admin camera scanner activation
  useEffect(() => {
    if (isScannerOpen) {
      const timer = setTimeout(() => {
        const html5QrCode = new Html5Qrcode("qr-reader");
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          async (decodedText) => {
            await html5QrCode.stop();
            setIsScannerOpen(false);
            const loadToast = toast.loading("Memproses absensi...");

            try {
              const res = await scanAttendanceQR(decodedText);
              toast.dismiss(loadToast);
              if (res.success) {
                toast.success(res.message);
                router.refresh();
              } else {
                toast.error(res.message || "Gagal memproses absensi");
              }
            } catch (err: unknown) {
              toast.dismiss(loadToast);
              const errMsg = err instanceof Error ? err.message : String(err);
              toast.error("Kesalahan jaringan: " + errMsg);
            }
          },
          () => {}
        ).catch((err) => {
          console.error("Gagal memulai kamera scanner:", err);
          toast.error("Gagal membuka kamera: " + err);
          setIsScannerOpen(false);
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        if (scannerRef.current && scannerRef.current.isScanning) {
          scannerRef.current.stop().catch((e) => console.error("Scanner stop error:", e));
        }
      };
    }
  }, [isScannerOpen, router]);

  // 4. Generate QR helper
  const handleGenerateQR = async (activity: Activity) => {
    setSelectedActivity(activity);
    const loadToast = toast.loading("Membuat QR Code...");

    try {
      const res = await generateAttendanceQR(
        activity.id,
        coords ? { latitude: coords.latitude, longitude: coords.longitude } : undefined
      );

      toast.dismiss(loadToast);
      if (res.success && res.data) {
        setQrString(res.data.qrString);
        setExpiresAt(res.data.expiresAt);
        // eslint-disable-next-line react-hooks/purity
        const remaining = Math.max(0, Math.round((new Date(res.data.expiresAt).getTime() - Date.now()) / 1000));
        setCountdown(remaining);
        setIsQrModalOpen(true);
        toast.success(res.message);
      } else {
        toast.error(res.message || "Gagal membuat QR Code");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Kesalahan jaringan: " + errMsg);
    }
  };

  // 5. Submit leave request helper
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity || !leaveFile) {
      toast.error("Harap isi semua kolom dan unggah berkas bukti.");
      return;
    }

    setIsSubmittingLeave(true);
    const formData = new FormData();
    formData.append("activity_id", selectedActivity.id);
    formData.append("status", leaveStatus);
    formData.append("notes", leaveNotes);
    formData.append("file", leaveFile);

    const loadToast = toast.loading("Mengirim berkas pengajuan...");
    try {
      const res = await submitLeaveRequest(formData);
      toast.dismiss(loadToast);
      if (res.success) {
        toast.success(res.message);
        setIsLeaveModalOpen(false);
        setLeaveNotes("");
        setLeaveFile(null);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal mengajukan izin");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Kesalahan jaringan: " + errMsg);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Absensi Digital
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Lakukan absensi QR Code secara real-time atau ajukan surat sakit/izin kegiatan.
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setIsScannerOpen(true)}
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-indigo-500/20 py-5 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <CameraIcon />
            Pindai QR Absensi
          </Button>
        )}
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-xl w-full grid grid-cols-2">
          <TabsTrigger value="kegiatan" className="rounded-lg data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-500/30">
            Kegiatan Hari Ini
          </TabsTrigger>
          <TabsTrigger value="riwayat" className="rounded-lg data-[state=active]:bg-indigo-500/20 data-[state=active]:text-indigo-400 data-[state=active]:border-indigo-500/30">
            Riwayat Absensi
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Today's Activities */}
        <TabsContent value="kegiatan">
          <div className="grid gap-4 md:grid-cols-2">
            {initialActivities.length === 0 ? (
              <Card className="col-span-full border border-dashed border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-8 text-center">
                <CardContent className="space-y-3 pt-6">
                  <div className="inline-flex p-3 rounded-full bg-white/5 text-muted-foreground">
                    <HugeiconsIcon icon={Calendar03Icon} size={28} />
                  </div>
                  <h3 className="font-semibold text-foreground text-lg">Tidak Ada Kegiatan</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Hari ini tidak ada agenda kegiatan terjadwal untuk tingkat peran Anda.
                  </p>
                </CardContent>
              </Card>
            ) : (
              initialActivities.map((activity) => {
                const attendance = initialAttendances.find((a) => a.activity_id === activity.id);

                return (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl overflow-hidden group shadow-lg">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start gap-3">
                          <CardTitle className="text-base font-semibold group-hover:text-indigo-400 transition-colors line-clamp-1">
                            {activity.title}
                          </CardTitle>
                          {attendance ? (
                            <Badge
                              className={
                                attendance.status === "hadir"
                                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                  : attendance.status === "telat"
                                  ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                  : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                              }
                            >
                              {attendance.status.toUpperCase()}
                            </Badge>
                          ) : (
                            <Badge className="bg-neutral-500/10 text-neutral-400 border border-neutral-500/20">
                              BELUM ABSEN
                            </Badge>
                          )}
                        </div>
                        <CardDescription className="line-clamp-2 mt-1 min-h-[40px]">
                          {activity.description || "Tidak ada deskripsi kegiatan."}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="text-xs text-muted-foreground space-y-2 pb-4">
                        <div className="flex items-center gap-2">
                          <LocationIcon />
                          <span>{activity.location || "Lokasi tidak spesifik"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-indigo-500" />
                          <span>
                            {new Date(activity.start_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" - "}
                            {new Date(activity.end_date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </span>
                        </div>
                      </CardContent>
                      {!attendance && !isAdmin && (
                        <CardFooter className="grid grid-cols-2 gap-2 border-t border-white/5 pt-4 bg-black/10">
                          <Button
                            onClick={() => handleGenerateQR(activity)}
                            className="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-medium py-4 rounded-xl border border-indigo-500/20 transition-all text-xs flex justify-center items-center gap-1.5"
                          >
                            Hadir (QR)
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedActivity(activity);
                              setIsLeaveModalOpen(true);
                            }}
                            variant="outline"
                            className="border-white/5 bg-transparent hover:bg-white/5 text-muted-foreground hover:text-foreground font-medium py-4 rounded-xl text-xs transition-all"
                          >
                            Sakit / Izin
                          </Button>
                        </CardFooter>
                      )}
                    </Card>
                  </motion.div>
                );
              })
            )}
          </div>
        </TabsContent>

        {/* Tab 2: Attendance History */}
        <TabsContent value="riwayat">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Riwayat Kehadiran</CardTitle>
              <CardDescription>Daftar lengkap kehadiran dan pengajuan izin sakit Anda.</CardDescription>
            </CardHeader>
            <CardContent className="p-0 sm:p-6 overflow-x-auto">
              {initialHistory.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground text-sm">
                  Belum ada riwayat absensi tercatat.
                </div>
              ) : (
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-muted-foreground font-medium text-xs">
                      <th className="px-4 py-3">Nama Kegiatan</th>
                      <th className="px-4 py-3">Waktu Check In</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Keterangan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {initialHistory.map((log) => (
                      <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-4 font-medium text-foreground">
                          {log.activity_title}
                        </td>
                        <td className="px-4 py-4 text-muted-foreground text-xs">
                          {new Date(log.check_in_at).toLocaleString([], {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-4">
                          <Badge
                            className={
                              log.status === "hadir"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : log.status === "telat"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                            }
                          >
                            {log.status.toUpperCase()}
                          </Badge>
                        </td>
                        <td className="px-4 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                          {log.notes || "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* MODAL 1: Display QR Code for Student */}
      <Dialog open={isQrModalOpen} onOpenChange={setIsQrModalOpen}>
        <DialogContent className="sm:max-w-[400px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-center text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-center">QR Code Kehadiran</DialogTitle>
            <DialogDescription className="text-center text-xs text-slate-400 mt-1">
              Perlihatkan QR Code ini ke kamera scanner panitia di lokasi kegiatan.
            </DialogDescription>
          </DialogHeader>

          {qrString ? (
            <div className="my-6 space-y-4 flex flex-col items-center">
              <div className="p-4 bg-white rounded-xl shadow-inner inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`}
                  alt="QR Code"
                  className="w-48 h-48"
                />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold tracking-tight text-indigo-400">
                  {selectedActivity?.title}
                </p>
                <div className="text-xs text-slate-400 flex items-center gap-1.5 justify-center">
                  <span>Masa berlaku:</span>
                  <span className="font-mono bg-indigo-500/10 text-indigo-300 px-1.5 py-0.5 rounded border border-indigo-500/20">
                    {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, "0")}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-sm text-slate-400">Memuat QR Code...</div>
          )}

          <DialogFooter className="sm:justify-center">
            <Button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-slate-800 hover:bg-slate-700 text-white rounded-xl py-5"
            >
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: Form Upload Leave Request */}
      <Dialog open={isLeaveModalOpen} onOpenChange={setIsLeaveModalOpen}>
        <DialogContent className="sm:max-w-[420px] bg-slate-900 border border-white/10 rounded-2xl p-6 text-white">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold tracking-tight text-center">Pengajuan Sakit / Izin</DialogTitle>
            <DialogDescription className="text-slate-400 text-xs text-center mt-1">
              Ajukan dispensasi tidak hadir pada agenda: {selectedActivity?.title}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleLeaveSubmit} className="space-y-4 my-4">
            <div className="space-y-2">
              <Label className="text-xs text-slate-300">Jenis Dispensasi</Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLeaveStatus("izin")}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    leaveStatus === "izin"
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-md"
                      : "bg-transparent text-slate-400 border-white/5 hover:bg-white/5"
                  }`}
                >
                  Izin (Keperluan Khusus)
                </button>
                <button
                  type="button"
                  onClick={() => setLeaveStatus("sakit")}
                  className={`py-2 rounded-xl text-xs font-medium border transition-all ${
                    leaveStatus === "sakit"
                      ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30 shadow-md"
                      : "bg-transparent text-slate-400 border-white/5 hover:bg-white/5"
                  }`}
                >
                  Sakit (Butuh Istirahat)
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-xs text-slate-300">Alasan / Catatan</Label>
              <Textarea
                id="notes"
                placeholder="Tuliskan keterangan detail alasan Anda..."
                value={leaveNotes}
                onChange={(e) => setLeaveNotes(e.target.value)}
                className="bg-white/5 border-white/10 rounded-xl focus:border-indigo-500 text-xs py-3 h-20 text-white placeholder-slate-500"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="file" className="text-xs text-slate-300">Unggah Surat Bukti (PDF/Gambar)</Label>
              <Input
                id="file"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setLeaveFile(e.target.files[0]);
                  }
                }}
                className="bg-white/5 border-white/10 rounded-xl text-xs text-slate-400 file:bg-indigo-500/10 file:border-0 file:text-indigo-400 file:rounded file:px-2.5 file:py-1 file:text-xs file:font-semibold"
              />
            </div>

            <DialogFooter className="pt-4 gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsLeaveModalOpen(false)}
                className="border-white/5 bg-transparent text-slate-400 hover:text-white rounded-xl py-5 hover:bg-white/5 flex-1"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingLeave}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl py-5 flex-1 shadow-lg hover:shadow-indigo-500/20 transition-all"
              >
                {isSubmittingLeave ? "Mengirim..." : "Kirim Pengajuan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: Camera QR Scanner Overlay for Admin */}
      <AnimatePresence>
        {isScannerOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-md relative p-4 flex flex-col items-center">
              {/* Close Button */}
              <button
                onClick={() => setIsScannerOpen(false)}
                className="absolute top-0 right-0 p-2 text-slate-400 hover:text-white rounded-full bg-white/5 border border-white/10 shadow-lg hover:bg-white/10 transition-all"
              >
                <CancelIcon />
              </button>

              <div className="text-center mb-6 max-w-xs">
                <h3 className="text-white text-lg font-semibold">Memindai QR Absensi</h3>
                <p className="text-slate-400 text-xs mt-1">
                  Arahkan kamera belakang ke QR Code absensi mahasiswa.
                </p>
              </div>

              {/* Camera Scanner Viewfinder */}
              <div className="w-full aspect-square max-w-[320px] rounded-3xl overflow-hidden border-2 border-indigo-500/50 shadow-2xl relative bg-slate-950 flex items-center justify-center">
                <div id="qr-reader" className="w-full h-full object-cover" />
                {/* Laser scan effect */}
                <div className="absolute left-4 right-4 top-1/2 h-[2px] bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse pointer-events-none" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
