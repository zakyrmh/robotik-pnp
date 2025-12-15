import { Check, Circle, Lock, Trophy } from "lucide-react";

export default function RoadmapOR() {
  return (
    <div>
      <h3 className="text-lg font-bold text-gray-800 mb-4 dark:text-gray-100">
        Timeline Seleksi OR 21
      </h3>
      <div className="bg-white rounded-xl shadow-sm p-5 lg:p-6 dark:bg-gray-800">
        <div className="relative space-y-6">
          <div className="absolute left-3.5 lg:left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-600"></div>

          <div className="relative flex items-start space-x-4">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-100">
                Pendaftaran
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                1-20 Sep 2025 • Selesai
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-100">
                Demo Robot & Orientasi
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                28 Sep 2025 • Hadir
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-green-500 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Check className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-100">
                Wawancara 1
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                5 Okt 2025 • Lulus
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-blue-500 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800 animate-pulse">
              <Circle className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-100">
                Pelatihan
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                12 Okt - 21 Des • Berlangsung {`100%`}
              </p>
              <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{ width: "100%" }}
                ></div>
              </div>
            </div>
          </div>

          <div className="relative flex items-start space-x-4 opacity-60">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Lock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-300">
                Project Robot Soccer
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                29 Des - 29 Jan
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4 opacity-60">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Lock className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-300">
                Wawancara 2
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                H-2 sebelum kuliah
              </p>
            </div>
          </div>

          <div className="relative flex items-start space-x-4 opacity-60">
            <div className="w-7 h-7 lg:w-8 lg:h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-white flex-shrink-0 z-10 border-2 border-white dark:border-gray-800">
              <Trophy className="h-3.5 w-3.5 lg:h-4 lg:w-4" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm lg:text-base font-semibold text-gray-800 dark:text-gray-300">
                Pelantikan
              </h4>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                28 Des 2026
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
