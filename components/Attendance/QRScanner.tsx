// components/attendance/QRScanner.tsx
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { toast } from "sonner";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "@/lib/firebaseConfig";
import { Attendances } from "@/types/attendance";

interface QRScannerProps {
  onScanSuccess?: () => void;
}

export default function QRScanner({ onScanSuccess }: QRScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  const scanCooldownRef = useRef<Record<string, number>>({});

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      let parsed;
      try {
        parsed = JSON.parse(decodedText);
      } catch (err) {
        console.error("Error parsing QR JSON:", err);
        toast.error("Format QR tidak dikenal");
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

      // Cooldown untuk mencegah spam scan
      const key = hash;
      const now = Date.now();
      if (scanCooldownRef.current[key] && scanCooldownRef.current[key] > now) {
        return;
      }
      scanCooldownRef.current[key] = now + 4000;

      try {
        setUpdating(true);
        
        // Cek apakah user sudah absen untuk activity ini
        const attendanceId = `${userId}_${activityId}`;
        const attendanceRef = doc(db, "attendance", attendanceId);
        const attendanceSnap = await getDoc(attendanceRef);

        if (attendanceSnap.exists()) {
          const existingData = attendanceSnap.data();
          if (existingData.status === "present" || existingData.status === "late") {
            toast.info("Peserta sudah tercatat hadir");
            return;
          }
        }

        // Validasi timestamp QR (maksimal 5 menit)
        const qrTime = new Date(timestamp).getTime();
        const currentTime = Date.now();
        const timeDiff = (currentTime - qrTime) / 1000 / 60; // dalam menit

        if (timeDiff > 5) {
          toast.error("QR Code sudah kadaluarsa (maksimal 5 menit)");
          return;
        }

        // Get current user (admin)
        const currentUser = auth.currentUser;
        if (!currentUser) {
          toast.error("Anda harus login sebagai admin");
          return;
        }

        // Simpan attendance
        const attendanceData: Partial<Attendances> = {
          activityId: activityId,
          userId: userId,
          tokenId: hash,
          status: "present",
          checkInTime: new Date(),
          checkInBy: currentUser.uid,
          createdAt: new Date(),
          notes: "Scan QR Code"
        };

        await setDoc(attendanceRef, attendanceData);

        toast.success("Absensi berhasil dicatat", {
          description: `User ID: ${userId}`
        });

        if (onScanSuccess) {
          onScanSuccess();
        }
      } catch (err) {
        console.error("Error processing scan:", err);
        toast.error("Gagal memproses scan");
      } finally {
        setUpdating(false);
      }
    },
    [onScanSuccess]
  );

  const initializeScanner = useCallback(() => {
    if (scannerRef.current || !scannerDivRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10, 
        qrbox: { width: 250, height: 250 }, 
        aspectRatio: 1.0 
      },
      false
    );

    scanner.render(handleScanSuccess, (error) => {
      // Suppress console warnings dari scanner
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
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
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
  );
}