import { Book, PartyPopper, Phone, Tickets } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
        Aksi Cepat
      </h3>

      <div className="space-y-3">
        {/* Absen */}
        {/* <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition group">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
              <QrCode className="h-6 w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold">Absen Sekarang</p>
              <p className="text-xs text-blue-100 dark:text-blue-200">
                Scan QR / Input kode
              </p>
            </div>
          </div>
        </button> */}

        {/* Materi */}
        <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-green-500 dark:hover:border-green-400 group">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition">
              <Book className="text-green-600 dark:text-green-400 h-6 w-6 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                Materi
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                PDF, Video, Code
              </p>
            </div>
            {/* <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
              3
            </span> */}
          </div>
        </button>

        {/* PKTOS */}
        <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-orange-500 dark:hover:border-orange-400 group">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-lg flex items-center justify-center group-hover:bg-orange-500 transition">
              <Tickets className="text-orange-600 dark:text-orange-400 h-6 w-6 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                PKTOS
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Absensi PKTOS
              </p>
            </div>
            {/* <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
              3
            </span> */}
          </div>
        </button>

        {/* Volunteer MRC */}
        <button className="w-full bg-gradient-to-r from-yellow-500 to-red-600 dark:from-yellow-600 dark:to-red-700 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer">
          <Link
            href={
              "/events/caang/volunteer-mrc"
            }
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <PartyPopper className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Volunteer MRC IX</p>
                <p className="text-xs text-green-100 dark:text-green-200">
                  Daftar sebagai volunteer
                </p>
              </div>
            </div>
          </Link>
        </button>

        {/* Grup WA */}
        <button className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer">
          <Link
            href={
              "https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
            }
            target="_blank"
          >
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                <Phone className="h-6 w-6" />
              </div>
              <div className="text-left">
                <p className="font-semibold">Grup WA</p>
                <p className="text-xs text-green-100 dark:text-green-200">
                  Join diskusi CAANG
                </p>
              </div>
            </div>
          </Link>
        </button>

        {/* Software */}
        {/* <button className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-red-500 dark:hover:border-red-400 group">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition">
              <HardDriveDownload className="text-red-600 dark:text-red-400 w-6 h-6 group-hover:text-white" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-100">
                Software
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                SolidWork, Proteus
              </p>
            </div>
          </div>
        </button> */}
      </div>
    </div>
  );
}
