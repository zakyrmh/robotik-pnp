"use client";

import { User } from "@/types/users";
import { BadgeCheck, Rocket } from "lucide-react";
import { useEffect, useState } from "react";
import { getAppSettings } from "@/lib/firebase/settings";

interface StatusCardProps {
  user?: User | null;
}

export default function StatusCard({ user }: StatusCardProps) {
  const [orPeriod, setOrPeriod] = useState<string>("");

  useEffect(() => {
    const fetchSettings = async () => {
      const settings = await getAppSettings();
      if (settings?.currentOrPeriod) {
        setOrPeriod(settings.currentOrPeriod);
      }
    };
    fetchSettings();
  }, []);

  return (
    <div className="bg-gradient-to-r from-green-500 via-green-600 to-emerald-600 dark:from-green-900 dark:via-green-800 dark:to-emerald-900 rounded-2xl p-8 text-white shadow-xl mb-8 relative overflow-hidden fade-in transition-all duration-300">
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 dark:bg-black/20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 dark:bg-black/20"></div>

      <div className="relative z-10 flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center dark:bg-black/20">
              <BadgeCheck className="w-10 h-10" />
            </div>
            <div>
              <h3 className="text-3xl font-bold">Selamat Datang! 🎉</h3>
              <p className="text-green-100 dark:text-green-200">
                Akun Anda berhasil dibuat
              </p>
            </div>
          </div>
          <p className="text-lg text-green-50 mb-4 dark:text-green-100">
            Hai <span className="font-bold">{user?.profile.fullName}</span>,
            terima kasih telah mendaftar di Open Recruitment UKM Robotik PNP
            Angkatan {orPeriod}!
          </p>
          <p className="text-green-100 dark:text-green-200">
            Silakan lengkapi data pendaftaran Anda dengan mengikuti
            langkah-langkah di bawah ini untuk melanjutkan proses seleksi.
          </p>
        </div>
        <div className="hidden lg:block">
          <div className="w-32 h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center dark:bg-black/20">
            <Rocket className="w-24 h-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
