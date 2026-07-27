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
    <div className="space-y-6 max-w-md mx-auto">
      {/* Header Info */}
      <Card className="bg-surface-card-dark border-hairline-dark rounded-none text-center p-6 shadow-none">
        <CardHeader className="p-0 space-y-1">
          <div className="flex items-center justify-center gap-2 font-mono text-xs text-cyber-blue uppercase tracking-widest">
            <HugeiconsIcon icon={QrCodeIcon} size={18} />
            <span>DYNAMIC QR CODE PRESENSI</span>
          </div>
          <CardTitle className="text-xl font-bold uppercase text-white font-sans">
            {activityTitle}
          </CardTitle>
          <div className="font-mono text-xs text-gray-400 mt-2">
            NIM: {nim} &bull;{" "}
            <span className="text-white uppercase">{profileName}</span>
          </div>
        </CardHeader>
      </Card>

      {/* QR Code Container */}
      <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-6 text-center shadow-none space-y-4">
        <div className="relative w-64 h-64 mx-auto bg-white p-3 border-2 border-cyber-blue shadow-[0_0_15px_rgba(0,102,177,0.3)]">
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
            <div className="h-full flex items-center justify-center font-mono text-xs text-gray-500">
              MEMUAT QR CODE...
            </div>
          )}
        </div>

        {/* Countdown Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 font-mono text-xs uppercase tracking-wider text-cyber-blue bg-cyber-blue/10 py-2.5 px-4 border border-cyber-blue/20">
            <HugeiconsIcon
              icon={RefreshIcon}
              size={14}
              className="animate-spin"
            />
            <span>KEDALUWARSA DALAM: {countdown} DETIK</span>
          </div>
          <p className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">
            Tunjukkan QR Code ini kepada panitia Komdis di lokasi
          </p>
        </div>

        <Button
          type="button"
          onClick={generateNewQR}
          className="w-full bg-canvas-dark border-hairline-dark hover:bg-surface-card-dark text-white font-mono text-xs uppercase tracking-wider rounded-none cursor-pointer py-2.5"
        >
          [ REFRESH QR CODE SEKARANG ]
        </Button>
      </Card>

      {/* Leave Request Alternative */}
      <div className="text-center pt-2">
        <button
          onClick={() => setIsLeaveFormOpen(!isLeaveFormOpen)}
          className="font-mono text-xs uppercase tracking-widest text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
        >
          [ HABISKAN HALAMAN / AJUKAN SURAT IZIN ATAU SAKIT ]
        </button>
      </div>

      {/* Form Pengajuan Surat Izin / Sakit Mockup */}
      {isLeaveFormOpen && (
        <Card className="bg-surface-card-dark border-hairline-dark rounded-none p-6 shadow-none space-y-4">
          <div className="border-b border-hairline-dark pb-2 font-mono text-xs text-amber-400 uppercase tracking-widest flex items-center gap-2">
            <HugeiconsIcon icon={File01Icon} size={16} />
            <span>FORM PENGAJUAN SURAT IZIN / SAKIT</span>
          </div>

          <p className="font-sans text-xs text-gray-300 font-light leading-relaxed">
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
              <label className="block text-[10px] text-gray-400 uppercase tracking-widest mb-1">
                ALASAN PERIZINAN:
              </label>
              <textarea
                required
                placeholder="Contoh: Sakit demam tinggi dengan rekomendasi istirahat dokter..."
                className="w-full bg-canvas-dark border border-hairline-dark p-3 text-xs font-sans text-white focus:outline-hidden focus:border-cyber-blue rounded-none h-20"
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-amber-500 hover:bg-amber-600 text-black font-mono text-xs uppercase tracking-wider rounded-none font-bold cursor-pointer py-2.5"
            >
              KIRIM PERIZINAN KE KOMDIS
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
