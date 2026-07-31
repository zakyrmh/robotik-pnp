"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { encryptToken } from "@/lib/utils/crypto";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  QrCodeIcon,
  RefreshIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";

interface AnggotaQrViewProps {
  activityId: string;
  activityTitle: string;
  profileId: string;
  profileName: string;
  nim: string;
}

export function AnggotaQrView({
  activityId,
  activityTitle,
  profileId,
  profileName,
  nim,
}: AnggotaQrViewProps) {
  const [qrToken, setQrToken] = useState(() =>
    encryptToken({
      profile_id: profileId,
      activity_id: activityId,
      generated_at: Date.now(),
    }),
  );
  const [countdown, setCountdown] = useState(300); // 5 menit TTL
  const [isLeaveFormOpen, setIsLeaveFormOpen] = useState(false);

  const generateNewQR = useCallback(() => {
    const token = encryptToken({
      profile_id: profileId,
      activity_id: activityId,
      generated_at: Date.now(),
    });
    setQrToken(token);
    setCountdown(300);
  }, [activityId, profileId]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          generateNewQR();
          return 300;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [generateNewQR]);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(
    qrToken,
  )}`;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-md mx-auto w-full">
      {/* Header Info - Light/Dark Mode & Precision Blueprint */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-center p-4 sm:p-6 shadow-xs">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-[#1e3a8a] dark:text-blue-400 uppercase tracking-widest font-semibold">
            <HugeiconsIcon icon={QrCodeIcon} size={18} />
            <span>DYNAMIC QR CODE PRESENSI</span>
          </div>
          <CardTitle className="text-lg sm:text-xl font-display font-medium text-[#0a192f] dark:text-slate-100">
            {activityTitle}
          </CardTitle>
          <div className="font-mono text-xs text-slate-500 dark:text-slate-400 mt-2">
            NIM: {nim} &bull;{" "}
            <span className="text-[#0a192f] dark:text-slate-200 font-semibold uppercase">
              {profileName}
            </span>
          </div>
        </CardHeader>
      </Card>

      {/* QR Code Container */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 text-center shadow-xs space-y-4">
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 mx-auto bg-white p-3 border-2 border-[#1e3a8a] dark:border-blue-500 rounded-lg shadow-sm">
          {qrToken ? (
            <Image
              src={qrImageUrl}
              alt="Dynamic QR Code"
              fill
              sizes="250px"
              className="object-contain p-2"
              priority
            />
          ) : (
            <div className="h-full flex items-center justify-center font-mono text-xs text-slate-400">
              MEMUAT QR CODE...
            </div>
          )}
        </div>

        {/* Countdown Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-[#1e3a8a] dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 py-2.5 px-4 rounded-lg border border-blue-200 dark:border-blue-900/60 font-semibold">
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              className="animate-spin"
            />
            <span>KEDALUWARSA DALAM: {countdown} DETIK</span>
          </div>
          <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            Tunjukkan QR Code ini kepada panitia Komdis di lokasi
          </p>
        </div>

        <Button
          type="button"
          onClick={generateNewQR}
          className="w-full bg-[#1e3a8a] hover:bg-[#1e40af] dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg cursor-pointer py-2.5 shadow-xs"
        >
          REFRESH QR CODE SEKARANG
        </Button>
      </Card>

      {/* Leave Request Alternative */}
      <div className="text-center pt-2">
        <button
          onClick={() => setIsLeaveFormOpen(!isLeaveFormOpen)}
          className="font-mono text-xs uppercase tracking-widest text-[#f97316] dark:text-orange-400 hover:text-[#ea580c] dark:hover:text-orange-300 transition-colors cursor-pointer font-semibold"
        >
          AJUKAN SURAT IZIN ATAU SAKIT
        </button>
      </div>

      {/* Form Pengajuan Surat Izin / Sakit */}
      {isLeaveFormOpen && (
        <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-2 font-mono text-xs text-[#f97316] dark:text-orange-400 uppercase tracking-widest font-semibold flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} size={16} />
            <span>FORM PENGAJUAN SURAT IZIN / SAKIT</span>
          </div>

          <p className="font-body text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
            Pengajuan perizinan akan diverifikasi oleh Komdis. Jika diterima,
            Anda dikenakan sanksi <strong>5 Poin</strong>. Jika ditolak,
            dikenakan sanksi <strong>10 Poin</strong>.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              alert("Pengajuan perizinan berhasil dikirim ke Komdis.");
              setIsLeaveFormOpen(false);
            }}
            className="space-y-3 font-mono text-xs"
          >
            <div>
              <label className="block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 font-semibold">
                ALASAN PERIZINAN:
              </label>
              <textarea
                required
                placeholder="Contoh: Sakit demam tinggi dengan rekomendasi istirahat dokter..."
                className="w-full bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 p-3 text-xs font-body text-[#0a192f] dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:border-[#f97316] rounded-lg h-20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#f97316] hover:bg-[#ea580c] dark:bg-orange-600 dark:hover:bg-orange-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg font-semibold cursor-pointer py-2.5 shadow-xs"
            >
              KIRIM PERIZINAN KE KOMDIS
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
