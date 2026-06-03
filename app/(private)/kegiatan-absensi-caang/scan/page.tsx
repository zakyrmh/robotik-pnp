"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft02Icon,
  QrCode01Icon,
  CheckmarkCircle02Icon,
} from "@hugeicons/core-free-icons";
import type { Html5QrcodeScanner } from "html5-qrcode";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { scanAttendanceQR } from "@/lib/actions/attendance";

interface ScannedUser {
  name: string;
  status: "hadir" | "telat";
  time: string;
}

export default function AdminScanQRPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useAuth();
  
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [scannedList, setScannedList] = useState<ScannedUser[]>([]);
  const [cameraActive, setCameraActive] = useState(false);

  const lastScannedRef = useRef<{ token: string; time: number } | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  // 1. Web Audio Synthesizer Beeps for instant physical scanner feedback
  const playSuccessBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note (success tone)
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.12);
    } catch (e) {
      console.log("Audio beep failed:", e);
    }
  };

  const playErrorBeep = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const audioCtx = new AudioContextClass();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(180, audioCtx.currentTime); // Low warning tone
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.25);
    } catch (e) {
      console.log("Audio beep failed:", e);
    }
  };

  // 2. Validate admin role
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }
    const checkRole = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      
      if (data && (data.role === "admin-or" || data.role === "super-admin")) {
        setIsAuthorized(true);
      } else {
        setIsAuthorized(false);
        toast.error("Akses ditolak. Hanya Admin yang dapat mengakses halaman scanner.");
        router.push("/dashboard");
      }
    };
    checkRole();
  }, [user, authLoading, supabase, router]);

  // 3. Scan success logic
  const handleScanSuccess = useCallback(async (decodedText: string) => {
    const now = Date.now();
    // Throttle: Prevent duplicate scans of the exact same code within 5 seconds
    if (
      lastScannedRef.current &&
      lastScannedRef.current.token === decodedText &&
      now - lastScannedRef.current.time < 5000
    ) {
      return;
    }
    lastScannedRef.current = { token: decodedText, time: now };

    const toastId = toast.loading("Memproses QR Code...");
    try {
      const res = await scanAttendanceQR(decodedText);
      toast.dismiss(toastId);
      
      if (res.success && res.data) {
        playSuccessBeep();
        toast.success(`Absensi Berhasil: ${res.data.name} (${res.data.status.toUpperCase()})`);
        
        setScannedList((prev) => [
          {
            name: res.data!.name,
            status: res.data!.status,
            time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          },
          ...prev.slice(0, 4),
        ]);
      } else {
        console.error("Attendance scan failed. Server response:", res);
        playErrorBeep();
        toast.error(res.message || "Gagal memproses absensi.");
      }
    } catch (err: unknown) {
      console.error("Connection error during scan:", err);
      toast.dismiss(toastId);
      playErrorBeep();
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Kesalahan koneksi: " + msg);
    }
  }, []);

  // 4. Dynamic Client-only initialization of html5-qrcode
  useEffect(() => {
    if (isAuthorized !== true) return;

    let scannerInstance: Html5QrcodeScanner | null = null;

    // Load dynamically to bypass SSR
    import("html5-qrcode")
      .then((lib) => {
        scannerInstance = new lib.Html5QrcodeScanner(
          "admin-scanner-view",
          {
            fps: 10,
            qrbox: (width, height) => {
              const min = Math.min(width, height);
              const size = Math.floor(min * 0.7);
              return { width: size, height: size };
            },
            rememberLastUsedCamera: true,
            aspectRatio: 1.0,
          },
          /* verbose= */ false
        );

        scannerRef.current = scannerInstance;

        scannerInstance.render(
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {
            // Ignore scan failures (occurs repeatedly on every frame when no QR code is in frame)
          }
        );
        setCameraActive(true);
      })
      .catch((err) => {
        console.error("Gagal memuat html5-qrcode:", err);
        toast.error("Gagal mengaktifkan modul kamera.");
      });

    return () => {
      if (scannerInstance) {
        scannerInstance
          .clear()
          .then(() => {
            setCameraActive(false);
          })
          .catch((err: unknown) => {
            console.error("Failed to clear html5QrcodeScanner: ", err);
          });
      }
    };
  }, [isAuthorized, handleScanSuccess]);

  if (authLoading || isAuthorized === null) {
    return (
      <div className="w-full max-w-4xl mx-auto px-4 py-12">
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center rounded-none animate-pulse space-y-4">
          <div className="h-6 bg-zinc-100 dark:bg-zinc-900 w-1/4 mx-auto rounded-none"></div>
          <div className="h-4 bg-zinc-150 dark:bg-zinc-900 w-1/2 mx-auto rounded-none"></div>
          <div className="h-40 bg-zinc-50 dark:bg-zinc-900/50 w-full rounded-none mt-8"></div>
        </div>
      </div>
    );
  }

  if (isAuthorized === false) {
    return null; // Handled by useEffect redirect
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        onClick={() => router.push("/kegiatan-absensi-caang")}
        className="rounded-none border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-50 hover:bg-zinc-100 dark:hover:bg-zinc-900 h-9 font-mono text-xs uppercase tracking-wider px-3"
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="mr-1.5" />
        Kembali ke Dashboard
      </Button>

      {/* Header Banner */}
      <div className="relative border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm overflow-hidden">
        {/* Tricolor tech stripe */}
        <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <span className="font-mono text-[9px] text-[#e22718] font-bold uppercase tracking-widest block flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#e22718] rounded-full animate-pulse" />
              LIVE TELEMETRY SCANNER
            </span>
            <h1 className="text-xl font-bold uppercase tracking-widest text-zinc-900 dark:text-zinc-50 font-sans flex items-center gap-2">
              <HugeiconsIcon icon={QrCode01Icon} size={22} className="text-[#1c69d4] dark:text-[#0066b1]" />
              Kamera Scan QR Absensi
            </h1>
            <p className="text-xs font-mono uppercase tracking-wider text-zinc-500 mt-1">
              Sistem pencatatan kehadiran real-time UKM Robotik PNP
            </p>
          </div>
          <div>
            <Badge className="bg-zinc-100 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 px-3 py-1.5 rounded-none font-mono text-[10px] uppercase tracking-wider">
              CAMERA STATUS: {cameraActive ? "ACTIVE" : "LOADING"}
            </Badge>
          </div>
        </div>
      </div>

      {/* Grid Scanner & Log */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Camera Scanner Container */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm space-y-4">
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-900 pb-2">
            KAMERA SCANNER VIEW
          </h2>
          
          <div className="flex flex-col items-center justify-center p-3 border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 rounded-none relative overflow-hidden">
            {/* The scanner renders here */}
            <div id="admin-scanner-view" className="w-full max-w-sm overflow-hidden bg-black relative rounded-none border border-zinc-350 dark:border-zinc-700 aspect-square" />
            <style dangerouslySetInnerHTML={{ __html: `
              #admin-scanner-view * {
                color: #e4e4e7 !important; /* zinc-200 */
              }
              #admin-scanner-view a {
                color: #3b82f6 !important; /* blue-500 */
                text-decoration: underline !important;
              }
              #admin-scanner-view button {
                background-color: #27272a !important; /* zinc-800 */
                border: 1px solid #3f3f46 !important; /* zinc-700 */
                color: #ffffff !important;
                padding: 6px 12px !important;
                font-family: monospace !important;
                font-size: 11px !important;
                text-transform: uppercase !important;
                letter-spacing: 0.05em !important;
                border-radius: 0px !important;
                cursor: pointer !important;
              }
              #admin-scanner-view button:hover {
                background-color: #3f3f46 !important; /* zinc-700 */
              }
              #admin-scanner-view select {
                background-color: #27272a !important;
                border: 1px solid #3f3f46 !important;
                color: #ffffff !important;
                padding: 4px !important;
                border-radius: 0px !important;
                font-family: monospace !important;
                font-size: 11px !important;
              }
            `}} />
          </div>

          <div className="text-[10px] text-zinc-500 font-mono uppercase text-center leading-relaxed">
            Hadapkan QR Code absensi mahasiswa ke kamera. Kamera aktif secara otomatis untuk memindai antrean absensi berantai.
          </div>
        </div>

        {/* Right Column: Scan History Feed */}
        <div className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 rounded-none shadow-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h2 className="font-mono text-[11px] font-bold uppercase tracking-wider text-zinc-500 border-b border-zinc-100 dark:border-zinc-900 pb-2">
              RIWAYAT SCAN SESI SEKARANG (TERBARU)
            </h2>

            {scannedList.length === 0 ? (
              <div className="py-16 text-center text-zinc-400 font-mono text-xs uppercase tracking-wider space-y-2">
                <HugeiconsIcon icon={QrCode01Icon} size={28} className="mx-auto text-zinc-300 dark:text-zinc-700" />
                <p>Belum ada data masuk</p>
                <p className="text-[9px] text-zinc-500">Mulai pemindaian untuk mengisi riwayat absensi</p>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                {scannedList.map((log, idx) => (
                  <div key={idx} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {log.status === "hadir" ? (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-[#10b981]" />
                      ) : (
                        <HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} className="text-amber-500" />
                      )}
                      <div>
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 uppercase block">{log.name}</span>
                        <span className="text-[10px] font-mono text-zinc-400">ABSENSI BERHASIL</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`font-mono text-[9px] px-2 py-0.5 rounded-none uppercase ${
                        log.status === "hadir" 
                          ? "bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30" 
                          : "bg-amber-500/15 text-amber-500 border border-amber-500/30"
                      }`}>
                        {log.status}
                      </Badge>
                      <span className="block font-mono text-[10px] text-zinc-500 mt-1">{log.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex justify-between items-center text-[9px] font-mono text-zinc-400 uppercase tracking-widest mt-6">
            <span>SESSION ENTRIES: {scannedList.length}</span>
            <span className="text-emerald-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              ONLINE SCANNING FEED
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
