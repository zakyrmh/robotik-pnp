"use client";

import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar03Icon,
  Clock01Icon,
  Location01Icon,
  ArrowLeft02Icon,
  Image01Icon,
} from "@hugeicons/core-free-icons";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { generateAttendanceQR, submitLeaveRequest } from "@/lib/actions/attendance";

interface Activity {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  banner_url: string | null;
  target_audience: "caang" | "anggota";
  created_at: string;
}

interface AttendanceRecord {
  id: string;
  activity_id: string;
  profile_id: string;
  check_in_at: string;
  status: "hadir" | "izin" | "sakit" | "alfa" | "telat";
  notes: string | null;
  proof_url: string | null;
  verified_by: string | null;
}

export default function AbsensiKegiatanPage() {
  const params = useParams();
  const router = useRouter();
  const activityId = params.id as string;
  
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  
  const [activity, setActivity] = useState<Activity | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"qr" | "leave">("qr");

  // Geolocation state
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | undefined>(undefined);

  // QR Code States
  const [qrString, setQrString] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Form Leave States
  const [leaveStatus, setLeaveStatus] = useState<"izin" | "sakit">("izin");
  const [leaveNotes, setLeaveNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isSubmittingLeave, setIsSubmittingLeave] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Get browser geolocation
  useEffect(() => {
    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoordinates({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => {
          console.log("Geolocation error:", err);
        }
      );
    }
  }, []);

  // 2. Fetch Activity and Attendance data
  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Fetch Activity
      const { data: actData, error: actError } = await supabase
        .from("activities")
        .select("*")
        .eq("id", activityId)
        .single();
      
      if (actError) throw actError;
      setActivity(actData);

      // Fetch Attendance log
      const { data: attData, error: attError } = await supabase
        .from("attendances")
        .select("*")
        .eq("activity_id", activityId)
        .eq("profile_id", user.id)
        .maybeSingle();

      if (attError) throw attError;
      setAttendance(attData);
    } catch (err) {
      console.error("Error loading absensi data:", err);
      toast.error("Gagal memuat informasi kegiatan atau absensi.");
    } finally {
      setLoading(false);
    }
  }, [user, activityId, supabase]);

  useEffect(() => {
    if (!authLoading && user) {
      Promise.resolve().then(() => {
        fetchData();
      });
    }
  }, [user, authLoading, fetchData]);

  // 3. Countdown timer logic for QR Code expiration
  useEffect(() => {
    if (qrExpiresAt) {
      const calculateCountdown = () => {
        const diff = new Date(qrExpiresAt).getTime() - Date.now();
        const seconds = Math.max(0, Math.floor(diff / 1000));
        setCountdown(seconds);

        if (seconds <= 0) {
          setQrString(null);
          setQrExpiresAt(null);
          if (timerRef.current) clearInterval(timerRef.current);
        }
      };

      calculateCountdown();
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = setInterval(calculateCountdown, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [qrExpiresAt]);

  // 4. Generate QR Code handler
  const handleGenerateQR = async () => {
    setIsGeneratingQr(true);
    const toastId = toast.loading("Membuat QR Code...");
    try {
      const res = await generateAttendanceQR(activityId, coordinates);
      toast.dismiss(toastId);
      
      if (res.success && res.data) {
        setQrString(res.data.qrString);
        setQrExpiresAt(res.data.expiresAt);
        toast.success(res.message);
      } else {
        toast.error(res.message || "Gagal membuat QR Code.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Kesalahan jaringan: " + msg);
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // 5. File Upload handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal adalah 5MB.");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 6. Submit leave request form handler
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveNotes.trim()) {
      toast.error("Alasan berhalangan hadir wajib diisi.");
      return;
    }
    if (!selectedFile) {
      toast.error("Foto bukti berhalangan hadir wajib diunggah.");
      return;
    }

    setIsSubmittingLeave(true);
    const toastId = toast.loading("Mengirim pengajuan izin...");

    try {
      const formData = new FormData();
      formData.append("activity_id", activityId);
      formData.append("status", leaveStatus);
      formData.append("notes", leaveNotes.trim());
      formData.append("file", selectedFile);

      const res = await submitLeaveRequest(formData);
      toast.dismiss(toastId);

      if (res.success) {
        toast.success(res.message);
        // Refresh page data to show the leaves log view
        fetchData();
      } else {
        toast.error(res.message || "Gagal mengirim pengajuan.");
      }
    } catch (err: unknown) {
      toast.dismiss(toastId);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Kesalahan jaringan: " + msg);
    } finally {
      setIsSubmittingLeave(false);
    }
  };

  // Helper date formatting
  const formatIndoDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeRange = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    const startTime = start.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    const endTime = end.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    if (start.toDateString() === end.toDateString()) {
      return `${startTime} - ${endTime} WIB`;
    }
    return `${startTime} (Mulai) s/d ${endTime} (Selesai) WIB`;
  };

  // Helper activity window check
  const isWithinWindow = useMemo(() => {
    if (!activity) return false;
    const now = new Date();
    const startWindow = new Date(new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000);
    const endWindow = new Date(new Date(activity.end_date).getTime() + 2 * 60 * 60 * 1000);
    return now >= startWindow && now <= endWindow;
  }, [activity]);

  // Helper leave proof URL generator
  const proofPublicUrl = useMemo(() => {
    if (!attendance?.proof_url) return "";
    const { data } = supabase.storage.from("registrations").getPublicUrl(attendance.proof_url);
    return data.publicUrl;
  }, [attendance, supabase]);

  // Helper to render existing attendance status badge
  const renderAttendanceStatus = (status: string) => {
    switch (status) {
      case "hadir":
        return <Badge className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 font-mono text-xs rounded-none px-3 uppercase py-1">HADIR</Badge>;
      case "telat":
        return <Badge className="bg-amber-500/15 text-amber-500 border border-amber-500/30 font-mono text-xs rounded-none px-3 uppercase py-1">TELAT</Badge>;
      case "izin":
        return <Badge className="bg-blue-500/15 text-blue-500 border border-blue-500/30 font-mono text-xs rounded-none px-3 uppercase py-1">IZIN</Badge>;
      case "sakit":
        return <Badge className="bg-red-500/15 text-red-500 border border-red-500/30 font-mono text-xs rounded-none px-3 uppercase py-1 shadow-[0_0_8px_rgba(239,68,68,0.1)]">SAKIT</Badge>;
      default:
        return <Badge className="bg-zinc-500/15 text-zinc-400 border border-zinc-500/30 font-mono text-xs rounded-none px-3 uppercase py-1">ALFA</Badge>;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12 space-y-6">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center rounded-none animate-pulse space-y-4">
          <div className="h-6 bg-zinc-100 dark:bg-zinc-900 w-1/4 mx-auto rounded-none"></div>
          <div className="h-4 bg-zinc-150 dark:bg-zinc-900 w-1/2 mx-auto rounded-none"></div>
          <div className="h-40 bg-zinc-50 dark:bg-zinc-900/50 w-full rounded-none mt-8"></div>
        </div>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="border border-[#e22718]/25 bg-red-500/5 p-8 text-center rounded-none space-y-4">
          <div className="w-12 h-12 rounded-none bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/20 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            !
          </div>
          <h2 className="font-sans text-base font-bold uppercase tracking-widest text-[#e22718]">Kegiatan Tidak Ditemukan</h2>
          <Button onClick={() => router.push("/kegiatan")} className="rounded-none bg-zinc-900 text-white font-mono text-xs uppercase tracking-wider">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  // Check role authorization
  const isAuthorized = user?.role === "caang" || user?.role === "anggota";
  if (!isAuthorized) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="border border-[#e22718]/25 bg-red-500/5 p-8 text-center rounded-none space-y-4">
          <div className="w-12 h-12 rounded-none bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/20 flex items-center justify-center mx-auto text-xl font-bold font-mono">
            !
          </div>
          <h2 className="font-sans text-base font-bold uppercase tracking-widest text-[#e22718]">Akses Ditolak</h2>
          <p className="text-xs font-mono uppercase text-zinc-500">Hanya Calon Anggota (Caang) dan Anggota yang dapat melakukan absensi.</p>
          <Button onClick={() => router.push("/kegiatan")} className="rounded-none bg-zinc-900 text-white font-mono text-xs uppercase tracking-wider">
            Kembali
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/kegiatan")}
        className="rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 h-9 font-mono text-xs uppercase tracking-wider px-3"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="mr-1.5" />
        Kembali ke Kegiatan
      </Button>

      {/* Activity Details Card */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor tech stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-[#1c69d4] dark:text-[#0066b1] font-bold uppercase tracking-widest block">ABSENSI AKTIF</span>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans">
              {activity.title}
            </h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 text-xs text-zinc-500 font-mono pt-1">
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Calendar03Icon} size={14} className="text-[#1c69d4] dark:text-[#0066b1]" />
                {formatIndoDate(activity.start_date)}
              </span>
              <span className="flex items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} size={14} className="text-[#1c69d4] dark:text-[#0066b1]" />
                {formatTimeRange(activity.start_date, activity.end_date)}
              </span>
              {activity.location && (
                <span className="flex items-center gap-1">
                  <HugeiconsIcon icon={Location01Icon} size={14} className="text-[#1c69d4] dark:text-[#0066b1]" />
                  {activity.location}
                </span>
              )}
            </div>
          </div>
          
          <div>
            <Badge className="bg-zinc-900/60 dark:bg-zinc-950/60 text-white border border-zinc-700 font-mono text-[9px] rounded-none px-2 uppercase py-1">
              AUDIENCE: {activity.target_audience === "caang" ? "CAANG" : "ANGGOTA"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Absensi Container */}
      <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm">
        {/* Scenario 1: Already attended */}
        {attendance ? (
          <div className="space-y-6 text-center py-6 font-sans">
            <div className="mx-auto w-16 h-16 rounded-none bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center border border-zinc-250 dark:border-zinc-800">
              <HugeiconsIcon icon={Calendar03Icon} size={32} className="text-[#1c69d4] dark:text-[#0066b1]" />
            </div>
            
            <div className="space-y-2">
              <h2 className="text-lg font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50">
                Absensi Telah Tercatat
              </h2>
              <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto">
                Anda sudah melakukan pengisian absensi untuk kegiatan ini. Rincian status Anda adalah sebagai berikut:
              </p>
            </div>

            <div className="max-w-md mx-auto bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-900 text-left font-sans space-y-3">
              <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">STATUS KEHADIRAN</span>
                {renderAttendanceStatus(attendance.status)}
              </div>
              
              <div className="flex items-center justify-between border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
                <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest">WAKTU SUBMIT</span>
                <span className="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                  {new Date(attendance.check_in_at).toLocaleString("id-ID")} WIB
                </span>
              </div>

              {attendance.notes && (
                <div className="border-b border-zinc-200/50 dark:border-zinc-800/50 pb-2">
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-0.5">KETERANGAN / ALASAN</span>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">
                    {attendance.notes}
                  </p>
                </div>
              )}

              {attendance.proof_url && proofPublicUrl && (
                <div>
                  <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2">BUKTI FOTO DOKUMEN</span>
                  <div className="relative h-48 w-full border border-zinc-200 dark:border-zinc-800 bg-black/10 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={proofPublicUrl}
                      alt="Bukti Izin / Sakit"
                      className="object-contain w-full h-full"
                    />
                  </div>
                </div>
              )}
              
              {attendance.verified_by === null && (attendance.status === "izin" || attendance.status === "sakit") && (
                <div className="mt-2 text-[10px] font-mono text-amber-500 uppercase tracking-wide flex items-center justify-center py-1 bg-amber-500/10 border border-amber-500/20">
                  MENUNGGU VERIFIKASI ADMIN KOMDIS
                </div>
              )}
            </div>
          </div>
        ) : !isWithinWindow ? (
          // Scenario 2: Outside time window
          <div className="text-center py-12 space-y-4">
            <div className="w-12 h-12 rounded-none bg-[#e22718]/10 text-[#e22718] border border-[#e22718]/20 flex items-center justify-center mx-auto text-xl font-bold font-mono">
              !
            </div>
            <h2 className="font-sans text-base font-bold uppercase tracking-widest text-[#e22718]">Absensi Tidak Tersedia</h2>
            <p className="text-xs font-mono text-zinc-500 max-w-md mx-auto leading-relaxed">
              Absensi hanya dapat diakses dalam rentang waktu **2 jam sebelum** kegiatan dimulai hingga **2 jam setelah** kegiatan selesai.
            </p>
            <div className="max-w-xs mx-auto border border-zinc-200 dark:border-zinc-800 p-3 bg-zinc-50 dark:bg-zinc-900/30 text-[10px] font-mono text-zinc-500 space-y-1">
              <div>ABSENSI BISA DIAKSES:</div>
              <div className="text-zinc-700 dark:text-zinc-300 font-bold">
                {new Date(new Date(activity.start_date).getTime() - 2 * 60 * 60 * 1000).toLocaleString("id-ID")} WIB
              </div>
              <div>SAMPAI JATUH TEMPO:</div>
              <div className="text-[#e22718] font-bold">
                {new Date(new Date(activity.end_date).getTime() + 2 * 60 * 60 * 1000).toLocaleString("id-ID")} WIB
              </div>
            </div>
          </div>
        ) : (
          // Scenario 3: Inside time window, no attendance recorded yet - Render Tab Form
          <>
            {/* Tabs Selector */}
            <div className="flex border-b border-zinc-200 dark:border-zinc-800 mb-6 font-sans">
              <button
                type="button"
                onClick={() => setActiveTab("qr")}
                className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 text-center transition-colors focus:outline-hidden ${
                  activeTab === "qr"
                    ? "border-[#1c69d4] text-[#1c69d4] dark:text-[#0066b1] bg-zinc-50/50 dark:bg-zinc-900/25"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Presensi QR Code
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("leave")}
                className={`flex-1 py-3 text-xs font-mono font-bold uppercase tracking-wider border-b-2 text-center transition-colors focus:outline-hidden ${
                  activeTab === "leave"
                    ? "border-[#1c69d4] text-[#1c69d4] dark:text-[#0066b1] bg-zinc-50/50 dark:bg-zinc-900/25"
                    : "border-transparent text-zinc-400 hover:text-zinc-600"
                }`}
              >
                Pengajuan Izin / Sakit
              </button>
            </div>

            {/* TAB CONTENT: QR CODE PRESENSI */}
            {activeTab === "qr" && (
              <div className="space-y-6 text-center py-4 font-sans">
                {!qrString ? (
                  <div className="space-y-4 py-8">
                    <p className="text-xs text-zinc-500 font-mono max-w-md mx-auto leading-relaxed">
                      Silakan tekan tombol di bawah ini untuk menghasilkan QR Code absensi mandiri Anda. Tunjukkan QR Code ini kepada Admin / Komdis di lokasi untuk dipindai.
                    </p>
                    {coordinates && (
                      <p className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">
                        KOORDINAT GEO-LOCATION TERDETEKSI
                      </p>
                    )}
                    <Button
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQr}
                      className="rounded-none bg-[#1c69d4] hover:bg-[#1059b0] text-white font-mono text-xs uppercase tracking-wider px-6 h-10 shadow-sm"
                    >
                      {isGeneratingQr ? "Menghasilkan..." : "Hasilkan QR Code"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6 max-w-sm mx-auto p-6 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-none">
                    <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest block">QR CODE ABSENSI MANDIRI</span>
                    
                    {/* Render QR code via external API */}
                    <div className="relative w-48 h-48 mx-auto border border-zinc-200 dark:border-zinc-700 bg-white p-2 flex items-center justify-center shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrString)}`}
                        alt="QR Code Mandiri"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <div className="font-mono text-xs text-zinc-600 dark:text-zinc-400">
                        QR Code berakhir dalam: <span className="font-bold text-[#e22718] font-mono">{countdown} detik</span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-mono leading-relaxed uppercase">
                        Silakan tunjukkan layar HP Anda ke scanner Admin. QR Code akan hancur dan kedaluwarsa setelah 5 menit.
                      </p>
                    </div>

                    <Button
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQr}
                      variant="ghost"
                      className="w-full rounded-none border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] uppercase tracking-wider h-9 hover:bg-zinc-150 dark:hover:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
                    >
                      Generate Ulang Sekarang
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* TAB CONTENT: FORM LEAVE REQUEST */}
            {activeTab === "leave" && (
              <form onSubmit={handleLeaveSubmit} className="space-y-5 py-2 font-sans max-w-lg mx-auto">
                <div className="space-y-4">
                  {/* Status Selection (Izin vs Sakit) */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Jenis Keterangan *
                    </Label>
                    <div className="flex gap-4">
                      <label className="flex-1 flex items-center justify-center h-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-none cursor-pointer font-mono text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                        <input
                          type="radio"
                          name="leave-status"
                          value="izin"
                          checked={leaveStatus === "izin"}
                          onChange={() => setLeaveStatus("izin")}
                          className="mr-2 accent-[#1c69d4] h-4 w-4"
                        />
                        Izin
                      </label>
                      <label className="flex-1 flex items-center justify-center h-10 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-none cursor-pointer font-mono text-xs uppercase tracking-wider text-zinc-700 dark:text-zinc-300 select-none hover:bg-zinc-100 dark:hover:bg-zinc-900/50 transition-colors">
                        <input
                          type="radio"
                          name="leave-status"
                          value="sakit"
                          checked={leaveStatus === "sakit"}
                          onChange={() => setLeaveStatus("sakit")}
                          className="mr-2 accent-[#e22718] h-4 w-4"
                        />
                        Sakit
                      </label>
                    </div>
                  </div>

                  {/* Notes Description */}
                  <div className="space-y-1.5">
                    <Label htmlFor="leave-notes" className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Alasan Detail Berhalangan Hadir *
                    </Label>
                    <textarea
                      id="leave-notes"
                      rows={4}
                      placeholder="Tuliskan keterangan / alasan ketidakhadiran Anda secara lengkap di sini..."
                      value={leaveNotes}
                      onChange={(e) => setLeaveNotes(e.target.value)}
                      className="w-full bg-transparent p-2.5 rounded-none border border-zinc-200 dark:border-zinc-800 text-sm text-zinc-900 dark:text-zinc-50 focus:outline-hidden focus:border-zinc-400 dark:focus:border-zinc-600 placeholder:text-zinc-400 placeholder:text-xs"
                      required
                    />
                  </div>

                  {/* Photo Proof Upload */}
                  <div className="space-y-1.5">
                    <Label className="text-xs font-mono font-bold uppercase tracking-wider text-zinc-500">
                      Foto Bukti Pendukung (Surat Sakit / Surat Izin) *
                    </Label>
                    
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      required
                    />
                    
                    <div className="flex flex-col gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-12 w-full rounded-none border border-dashed border-zinc-300 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 font-mono text-xs uppercase tracking-wider flex items-center justify-center text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100/50 dark:hover:bg-zinc-900/50"
                      >
                        <HugeiconsIcon icon={Image01Icon} size={18} className="mr-2" />
                        Pilih Gambar Bukti
                      </Button>

                      {filePreview && (
                        <div className="relative border border-zinc-200 dark:border-zinc-800 bg-zinc-50 p-2 text-center shrink-0">
                          <span className="font-mono text-[9px] text-zinc-400 uppercase tracking-widest block mb-1">PREVIEW GAMBAR</span>
                          <div className="relative h-48 w-full border border-zinc-200 dark:border-zinc-850 overflow-hidden bg-black/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={filePreview}
                              alt="Bukti Upload Preview"
                              className="object-contain w-full h-full"
                            />
                          </div>
                          <span className="font-mono text-[9px] text-zinc-500 block mt-1.5 truncate max-w-full">
                            {selectedFile?.name} ({(selectedFile!.size / (1024 * 1024)).toFixed(2)} MB)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-end gap-2">
                  <Button
                    type="submit"
                    disabled={isSubmittingLeave}
                    className="w-full rounded-none bg-[#1c69d4] hover:bg-[#1059b0] text-white font-mono text-xs uppercase tracking-wider h-10 px-4"
                  >
                    {isSubmittingLeave ? "Mengirim..." : "Kirim Pengajuan Izin / Sakit"}
                  </Button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );
}
