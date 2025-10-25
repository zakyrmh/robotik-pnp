"use client";

import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Camera,
  Users,
  Building2,
  MapPin,
  Trophy,
} from "lucide-react";
import { toast, Toaster } from "sonner";
import Image from "next/image";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";

// Types
interface PesertaData {
  asal_daerah: string;
  cabang_lomba: string;
  foto_anggota?: string;
  instansi: string;
  nama_anggota: string;
  nama_tim_karya: string;
  pembimbing?: string;
  qr_code: string;
}

interface AbsensiData {
  cabang_lomba: string;
  nama_tim_karya: string;
  nama_anggota: string;
  qr_code: string;
  timestamp?: Timestamp;
}

export default function AbsensiQRScanner() {
  const [isScanning, setIsScanning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [pesertaData, setPesertaData] = useState<PesertaData | null>(null);
  const [scannerReady, setScannerReady] = useState(false);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);
  const startingRef = useRef(false);
  const processingRef = useRef(false);

  const startScanner = async () => {
    if (startingRef.current) return;
    if (scannerRef.current && isScanning) return;

    startingRef.current = true;

    try {
      if (!scannerDivRef.current) return;

      const waitForSize = async (retries = 15, delayMs = 200) => {
        for (let i = 0; i < retries; i++) {
          const el = scannerDivRef.current!;
          const w = el.offsetWidth || el.clientWidth;
          const h = el.offsetHeight || el.clientHeight;
          if (w > 0 && h > 0) return true;
          await new Promise((r) => setTimeout(r, delayMs));
        }
        return false;
      };

      const ok = await waitForSize();
      if (!ok) {
        console.warn("Scanner container has zero size, aborting start.");
        toast.error("Gagal memulai kamera (elemen scanner tidak tersedia).", {
          duration: 4000,
        });
        return;
      }

      const html5QrCode = new Html5Qrcode("qr-reader");
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        onScanSuccess,
        (errorMessage) => {
          try {
            if (
              typeof errorMessage === "string" &&
              errorMessage.includes("IndexSizeError")
            )
              return;
          } catch (e) {
            console.error(e);
          }
        }
      );

      setIsScanning(true);
      setScannerReady(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      toast.error("Gagal memulai kamera. Pastikan izin kamera diberikan.", {
        duration: 5000,
      });
    } finally {
      startingRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (!scannerRef.current) return;

    try {
      // stop() biasanya menghentikan scanning; clear() membersihkan DOM element
      await scannerRef.current.stop();
    } catch (err) {
      // beberapa versi html5-qrcode melempar jika kamera sudah berhenti
      console.warn("stop() error (mungkin sudah berhenti):", err);
    }

    try {
      await scannerRef.current.clear();
    } catch (err) {
      console.warn("clear() error:", err);
    }

    scannerRef.current = null;
    setIsScanning(false);
    setScannerReady(false);
  };

  const onScanSuccess = async (decodedText: string) => {
    // Prevent concurrent processing
    if (processingRef.current) return;
    processingRef.current = true;

    // Stop scanner while processing to avoid duplicate triggers
    await stopScanner();

    try {
      // 1) Validasi peserta dari collection `peserta_mrc_ix`
      const pesertaQ = query(
        collection(db, "peserta_mrc_ix"),
        where("qr_code", "==", decodedText),
        limit(1)
      );

      const pesertaSnap = await getDocs(pesertaQ);

      if (pesertaSnap.empty) {
        toast.error("QR Code tidak valid atau tidak terdaftar!", {
          duration: 5000,
          icon: <XCircle className="w-5 h-5" />,
        });

        setTimeout(() => startScanner(), 5000);
        return;
      }

      const pesertaDoc = pesertaSnap.docs[0].data() as PesertaData;

      // 2) Ambil absensi terakhir untuk QR ini (urutan desc)
      const absensiQ = query(
        collection(db, "absensi_peserta_mrc_ix"),
        where("qr_code", "==", decodedText),
        orderBy("timestamp", "desc"),
        limit(1)
      );

      const absensiSnap = await getDocs(absensiQ);

      if (!absensiSnap.empty) {
        const lastAbsensi = absensiSnap.docs[0].data() as AbsensiData;
        const lastTimestamp = lastAbsensi.timestamp;

        // Firestore Timestamp memiliki metode toDate(); jika tidak, fallback ke Date
        const lastDate =
          lastTimestamp && typeof lastTimestamp.toDate === "function"
            ? lastTimestamp.toDate()
            : undefined;

        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

        if (lastDate && lastDate > tenMinutesAgo) {
          toast.error("Anda sudah melakukan absensi dalam 10 menit terakhir!", {
            duration: 5000,
            icon: <XCircle className="w-5 h-5" />,
          });

          setTimeout(() => startScanner(), 5000);
          return;
        }
      }

      // 3) Simpan absensi dengan serverTimestamp
      const absensiData: Omit<AbsensiData, "timestamp"> & {
        timestamp?: Timestamp;
      } = {
        cabang_lomba: pesertaDoc.cabang_lomba,
        nama_tim_karya: pesertaDoc.nama_tim_karya,
        nama_anggota: pesertaDoc.nama_anggota,
        qr_code: decodedText,
        timestamp: serverTimestamp() as Timestamp,
      };

      await addDoc(collection(db, "absensi_peserta_mrc_ix"), absensiData);

      // 4) Tampilkan popup sukses
      setPesertaData(pesertaDoc);
      setShowSuccess(true);

      // tutup popup dan restart scanner setelah 5 detik
      setTimeout(() => {
        setShowSuccess(false);
        setPesertaData(null);
        startScanner();
      }, 10000);
    } catch (error) {
      console.error("Error processing QR code:", error);
      toast.error("Terjadi kesalahan saat memproses QR Code!", {
        duration: 5000,
        icon: <XCircle className="w-5 h-5" />,
      });

      setTimeout(() => startScanner(), 5000);
    } finally {
      processingRef.current = false;
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      // cleanup
      stopScanner();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-red-950 to-yellow-900 flex flex-col items-center justify-center p-4">
      <Toaster position="top-center" richColors />

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center gap-6 mb-8"
      >
        <Image
          src="/images/logo-mrc.png"
          alt="Logo 1"
          className="h-20 w-auto object-contain"
          width={100}
          height={100}
        />
      </motion.div>

      {/* Title */}
      <motion.h1
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-4xl font-bold text-yellow-400 mb-2 text-center"
      >
        Absensi Peserta MRC IX
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-red-200 mb-8 text-center"
      >
        Scan QR Code untuk melakukan absensi
      </motion.p>

      {/* Scanner Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.4 }}
        className="bg-black/50 backdrop-blur-sm p-6 rounded-2xl border-2 border-yellow-500 shadow-2xl shadow-red-900/50 max-w-md w-full"
      >
        <div className="relative">
          <div
            id="qr-reader"
            ref={scannerDivRef}
            className="rounded-lg overflow-hidden border-2 border-red-500"
          />

          {!scannerReady && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/70 rounded-lg">
              <div className="text-center">
                <Camera className="w-16 h-16 text-yellow-400 mx-auto mb-4 animate-pulse" />
                <p className="text-white">Memuat kamera...</p>
              </div>
            </div>
          )}
        </div>

        {isScanning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 text-center"
          >
            <div className="flex items-center justify-center gap-2 text-yellow-300">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
              <span className="text-sm">Scanner Aktif</span>
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Success Popup */}
      <AnimatePresence>
        {showSuccess && pesertaData && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="bg-gradient-to-br from-red-900 to-black border-2 border-yellow-500 rounded-2xl p-8 max-w-3xl w-full shadow-2xl"
            >
              <div className="text-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle2 className="w-20 h-20 text-green-400 mx-auto mb-4" />
                </motion.div>
                <h2 className="text-3xl font-bold text-yellow-400 mb-2">
                  Absensi Berhasil!
                </h2>
                <p className="text-red-200">Data peserta berhasil tercatat</p>
              </div>

              {/* 🔸 Grid 2 Kolom: Foto & Data */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Kolom 1 - Foto Peserta */}
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 rounded-xl overflow-hidden border-4 border-yellow-500 shadow-lg">
                    <Image
                      src={
                        pesertaData.foto_anggota || "/images/default-avatar.png"
                      }
                      alt={pesertaData.nama_anggota}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Kolom 2 - Data Peserta */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3 bg-black/30 p-4 rounded-lg border border-red-500/30">
                    <Trophy className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">Cabang Lomba</p>
                      <p className="text-white font-semibold">
                        {pesertaData.cabang_lomba}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/30 p-4 rounded-lg border border-red-500/30">
                    <Users className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">Nama Tim/Karya</p>
                      <p className="text-white font-semibold">
                        {pesertaData.nama_tim_karya}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/30 p-4 rounded-lg border border-red-500/30">
                    <Users className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">Nama Anggota</p>
                      <p className="text-white font-semibold">
                        {pesertaData.nama_anggota}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/30 p-4 rounded-lg border border-red-500/30">
                    <Building2 className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">Instansi</p>
                      <p className="text-white font-semibold">
                        {pesertaData.instansi}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 bg-black/30 p-4 rounded-lg border border-red-500/30">
                    <MapPin className="w-5 h-5 text-yellow-400 mt-1 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-red-300 text-sm">Daerah Asal</p>
                      <p className="text-white font-semibold">
                        {pesertaData.asal_daerah}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer popup */}
              <div className="mt-6 text-center">
                <p className="text-yellow-300 text-sm">
                  Popup akan ditutup otomatis dalam 5 detik...
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
