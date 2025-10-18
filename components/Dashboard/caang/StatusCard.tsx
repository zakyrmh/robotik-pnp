import { Registration } from "@/types/registrations";
import { BadgeCheck, CalendarCheck, IdCard } from "lucide-react";

interface StatusCardProps {
  caang?: Registration | null;
}

export default function StatusCard({ caang }: StatusCardProps) {
  return (
    <div
      id="statusCard"
      className="relative overflow-hidden rounded-2xl p-8 mb-8 shadow-xl
                 bg-gradient-to-r from-green-600 to-green-700 
                 text-white transition-all duration-300
                 dark:from-green-900 dark:to-emerald-800 dark:text-gray-100"
    >
      {/* Decorative background circles */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 dark:bg-black/20"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24 dark:bg-black/20"></div>

      <div className="relative z-10">
        {/* Verified badge */}
        <div className="flex items-center space-x-3 mb-4">
          <span className="flex items-center px-4 py-1.5 rounded-full text-sm font-semibold 
                           bg-white/20 backdrop-blur-sm text-white
                           dark:bg-emerald-700/40 dark:text-emerald-100">
            <BadgeCheck className="w-4 h-4" />
            <span className="ml-2">PENDAFTARAN TERVERIFIKASI</span>
          </span>
        </div>

        {/* Title */}
        <h3 className="text-3xl font-bold mb-3 dark:text-white">
          Selamat! Pendaftaran Anda Diterima ✓
        </h3>

        {/* Subtitle */}
        <p className="text-green-100 text-lg mb-6 dark:text-emerald-200">
          Data Anda telah diverifikasi oleh admin. Silakan ikuti tahapan seleksi
          berikutnya dengan seksama.
        </p>

        {/* Info section */}
        <div className="flex flex-wrap gap-4 items-center text-white/90 dark:text-gray-200">
          <div className="flex items-center space-x-2">
            <IdCard className="w-5 h-5 text-white dark:text-emerald-300" />
            <span>ID: {caang?.registrationId}</span>
          </div>
          <div className="flex items-center space-x-2">
            <CalendarCheck className="w-5 h-5 text-white dark:text-emerald-300" />
            <span>
              Terdaftar:{" "}
              {caang?.createdAt?.toDate().toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
