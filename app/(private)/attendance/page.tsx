// app/(private)/attendance/page.tsx

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Attendance } from "@/types/attendance";
import { CaangRegistration } from "@/types/caang";
import { Html5QrcodeScanner } from "html5-qrcode";

// ganti toast -> sonner
import { Toaster, toast } from "sonner";

export default function AdminAttendancePage() {
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  // Fetch attendance data
  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "attendance"));
      const snapshot = await getDocs(q);

      const data: Attendance[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Attendance),
        id: docSnap.id,
      }));

      setAttendances(data);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  }, []);

  // cooldown map untuk cegah spam QR
  const scanCooldownRef = useRef<Record<string, number>>({});

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      let parsed;
      try {
        parsed = JSON.parse(decodedText);
      } catch (err) {
        console.error("Error parsing QR JSON:", err);
        toast.error("QR format tidak dikenal");
        return;
      }

      const { userId, activityId, timestamp, hash } = parsed as {
        userId?: string;
        activityId?: string;
        timestamp?: string;
        hash?: string;
      };

      if (!userId || !activityId || !timestamp || !hash) {
        toast.error("QR tidak lengkap");
        return;
      }

      // cooldown
      const key = hash;
      const now = Date.now();
      if (scanCooldownRef.current[key] && scanCooldownRef.current[key] > now) {
        return;
      }
      scanCooldownRef.current[key] = now + 4000;

      try {
        setUpdating(true);
        const res = await fetch("/api/validate-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            activityId,
            timestamp,
            signature: hash,
          }),
        });
        const body = await res.json();

        if (!res.ok) {
          toast.error(body?.error || "Gagal memvalidasi QR");
          return;
        }

        if (body.ok) {
          if (body.message === "already_present") {
            toast.info("Peserta sudah tercatat hadir");
          } else {
            toast.success("Absensi tercatat", {
              description: body.message,
            });
          }
          await fetchAttendances();
        } else {
          toast.error(body?.error || "Validasi gagal");
        }
      } catch (err) {
        console.error("validate-scan fetch error", err);
        toast.error("Gagal koneksi ke server");
      } finally {
        setUpdating(false);
      }
    },
    [fetchAttendances]
  );

  const initializeScanner = useCallback(() => {
    if (scannerRef.current || !scannerDivRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(handleScanSuccess, (error) => {
      console.warn("QR scan warning:", error);
    });

    scannerRef.current = scanner;
    setScanning(true);
  }, [handleScanSuccess]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          scannerRef.current = null;
          setScanning(false);
        })
        .catch(console.error);
    }
  }, []);

  const toggleScanner = useCallback(() => {
    if (scanning) {
      stopScanner();
    } else {
      initializeScanner();
    }
  }, [scanning, stopScanner, initializeScanner]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Scanner Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                📷 Scanner Absensi
              </h2>
              <button
                onClick={toggleScanner}
                disabled={updating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  scanning
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating
                  ? "Memproses..."
                  : scanning
                  ? "Stop Scanner"
                  : "Start Scanner"}
              </button>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div
                id="qr-reader"
                ref={scannerDivRef}
                className="border rounded-lg overflow-hidden"
              />

              {!scanning && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Klik &quot;Start Scanner&quot; untuk memulai scan QR
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                📋 Daftar Calon Anggota
              </h2>
              <button
                onClick={fetchAttendances}
                disabled={loading}
                className="px-3 py-2 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Memuat..." : "Refresh"}
              </button>
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Memuat data...
                </p>
              </div>
            ) : attendances.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                Tidak ada data absensi
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-200 dark:border-slate-700 text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Nama</th>
                      <th className="px-4 py-3 text-left font-medium">NIM</th>
                      <th className="px-4 py-3 text-left font-medium">Prodi</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Waktu Update
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendances.map((att) => (
                      <tr
                        key={att.uid}
                        className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-4 py-3">
                          {(att.userId as CaangRegistration)?.namaLengkap ||
                            "—"}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {(att.userId as CaangRegistration)?.nim || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {(att.userId as CaangRegistration)?.prodi || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              att.status === "present"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}
                          >
                            {att.status === "present" ? "Hadir" : "Belum Hadir"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {att.updatedAt
                            ? new Date(att.updatedAt).toLocaleString("id-ID")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Total: {attendances.length} | Hadir:{" "}
                  {attendances.filter((a) => a.status === "present").length} |
                  Belum:{" "}
                  {attendances.filter((a) => a.status !== "present").length}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sonner container */}
      <Toaster richColors position="top-right" />
    </>
  );
}
