import { Book, Phone } from "lucide-react";
import Link from "next/link";

export default function QuickActions() {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-4">
        Aksi Cepat
      </h3>

      <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
        {/* Absen */}
        {/* <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-700 dark:to-blue-800 text-white p-3 lg:p-4 rounded-xl shadow-md hover:shadow-lg transition group">
          <div className="flex lg:items-center flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 text-center lg:text-left">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
              <QrCode className="h-5 w-5 lg:h-6 lg:w-6" />
            </div>
            <div className="text-left">
              <p className="font-semibold text-sm lg:text-base">Absen Sekarang</p>
              <p className="text-[10px] lg:text-xs text-blue-100 dark:text-blue-200">
                Scan QR / Input
              </p>
            </div>
          </div>
        </button> */}

        {/* Materi */}
        <button className="w-full bg-white dark:bg-gray-800 p-3 lg:p-4 rounded-xl shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-green-500 dark:hover:border-green-400 group">
          <div className="flex lg:items-center flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 text-center lg:text-left">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 dark:bg-green-900/40 rounded-lg flex items-center justify-center group-hover:bg-green-500 transition mx-auto lg:mx-0">
              <Book className="text-green-600 dark:text-green-400 h-5 w-5 lg:h-6 lg:w-6 group-hover:text-white" />
            </div>
            <div className="text-center lg:text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm lg:text-base">
                Materi
              </p>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400">
                PDF, Video, Code
              </p>
            </div>
            {/* <span className="ml-auto px-2 py-1 bg-red-500 text-white text-xs rounded-full font-bold">
              3
            </span> */}
          </div>
        </button>

        {/* Grup WA */}
        <button className="w-full bg-gradient-to-r from-green-500 to-green-600 dark:from-green-600 dark:to-green-700 text-white p-3 lg:p-4 rounded-xl shadow-md hover:shadow-lg transition cursor-pointer">
          <Link
            href={
              "https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
            }
            target="_blank"
            className="block"
          >
            <div className="flex lg:items-center flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 text-center lg:text-left">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-white/20 rounded-lg flex items-center justify-center mx-auto lg:mx-0">
                <Phone className="h-5 w-5 lg:h-6 lg:w-6" />
              </div>
              <div className="text-center lg:text-left">
                <p className="font-semibold text-sm lg:text-base">Grup WA</p>
                <p className="text-[10px] lg:text-xs text-green-100 dark:text-green-200">
                  Join diskusi CAANG
                </p>
              </div>
            </div>
          </Link>
        </button>

        {/* Software */}
        {/* <button className="w-full bg-white dark:bg-gray-800 p-3 lg:p-4 rounded-xl shadow-sm hover:shadow-md transition border-2 border-transparent hover:border-red-500 dark:hover:border-red-400 group">
          <div className="flex lg:items-center flex-col lg:flex-row space-y-2 lg:space-y-0 lg:space-x-3 text-center lg:text-left">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 dark:bg-red-900/40 rounded-lg flex items-center justify-center group-hover:bg-red-500 transition mx-auto lg:mx-0">
              <HardDriveDownload className="text-red-600 dark:text-red-400 w-5 h-5 lg:w-6 lg:h-6 group-hover:text-white" />
            </div>
            <div className="text-center lg:text-left">
              <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm lg:text-base">
                Software
              </p>
              <p className="text-[10px] lg:text-xs text-gray-500 dark:text-gray-400">
                SolidWork, Proteus
              </p>
            </div>
          </div>
        </button> */}
      </div>
    </div>
  );
}
