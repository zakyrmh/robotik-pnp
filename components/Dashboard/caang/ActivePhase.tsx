"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, GraduationCap } from "lucide-react";
import { getActivities } from "@/lib/firebase/activities";
import { db } from "@/lib/firebaseConfig";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity } from "@/types/activities";
import { OrPhase, TrainingCategory } from "@/types/enum";
import { Attendance } from "@/types/attendances";

interface CategoryProgress {
  category: TrainingCategory;
  label: string;
  color: string;
  bgColor: string;
  completed: number;
  total: number;
  percentage: number;
}

interface PhaseData {
  phase: OrPhase;
  activities: Activity[];
  completed: number;
  total: number;
  percentage: number;
  startDate: Date | null;
  endDate: Date | null;
  categories: CategoryProgress[];
}

export default function ActivePhase() {
  const { user } = useAuth();
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhaseData = async () => {
      setLoading(true);
      try {
        // 1️⃣ Ambil semua kegiatan fase pelatihan
        const activities = await getActivities({ phase: OrPhase.PELATIHAN });

        if (!user || activities.length === 0) {
          setPhaseData(null);
          return;
        }

        // 2️⃣ Ambil semua attendance milik user dari Firestore
        const attendanceRef = collection(db, "attendance_new");
        const q = query(attendanceRef, where("userId", "==", user.uid));
        const snapshot = await getDocs(q);
        const attendanceData: Attendance[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Attendance, "id">),
        }));

        // 3️⃣ Hitung completed sessions (present + late)
        const completedSessions = attendanceData.filter((a) =>
          ["present", "late"].includes(a.status)
        ).length;

        // 4️⃣ Total semua sesi dari daftar activity
        const totalSessions = activities.reduce(
          (sum, act) => sum + (act.totalSessions || 1),
          0
        );

        // 5️⃣ Hitung tanggal mulai & akhir
        const dates = activities.map((a) => a.scheduledDate.toDate());
        const startDate =
          dates.length > 0
            ? new Date(Math.min(...dates.map((d) => d.getTime())))
            : null;
        const endDate =
          dates.length > 0
            ? new Date(Math.max(...dates.map((d) => d.getTime())))
            : null;

        // 6️⃣ Kelompokkan progress per kategori
        const categoryMap = new Map<
          TrainingCategory,
          { completed: number; total: number; activities: Activity[] }
        >();

        activities.forEach((activity) => {
          const cat = activity.category || TrainingCategory.PEMROGRAMAN;
          const existing = categoryMap.get(cat) || {
            completed: 0,
            total: 0,
            activities: [],
          };

          existing.total += activity.totalSessions || 1;

          // Hitung jumlah sesi hadir per kategori
          const completedForActivity = attendanceData.filter(
            (att) =>
              att.activityId === activity.id &&
              ["present", "late"].includes(att.status)
          ).length;

          existing.completed += completedForActivity;
          existing.activities.push(activity);
          categoryMap.set(cat, existing);
        });

        // 7️⃣ Format kategori jadi tampilan progress bar
        const categories: CategoryProgress[] = Array.from(
          categoryMap.entries()
        ).map(([category, data]) => {
          const percentage =
            data.total > 0 ? (data.completed / data.total) * 100 : 0;

          let label = "";
          let color = "";
          let bgColor = "";

          switch (category) {
            case TrainingCategory.ELEKTRONIKA:
              label = "Elektronika";
              color = "bg-yellow-400";
              bgColor = "bg-yellow-400 text-yellow-900";
              break;
            case TrainingCategory.MEKANIK:
              label = "Mekanik";
              color = "bg-gray-300";
              bgColor = "bg-gray-300 text-gray-700";
              break;
            case TrainingCategory.PEMROGRAMAN:
              label = "Pemrograman";
              color = "bg-green-400";
              bgColor = "bg-green-400 text-green-900";
              break;
            default:
              label = category;
              color = "bg-blue-400";
              bgColor = "bg-blue-400 text-blue-900";
          }

          return {
            category,
            label,
            color,
            bgColor,
            completed: data.completed,
            total: data.total,
            percentage,
          };
        });

        // 8️⃣ Set hasil akhir
        setPhaseData({
          phase: OrPhase.PELATIHAN,
          activities,
          completed: completedSessions,
          total: totalSessions,
          percentage:
            totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
          startDate,
          endDate,
          categories: categories.sort((a, b) => a.label.localeCompare(b.label)),
        });
      } catch (error) {
        console.error("Error loading phase data:", error);
        setPhaseData(null);
      } finally {
        setLoading(false);
      }
    };

    loadPhaseData();
  }, [user]);

  // 🌀 Skeleton saat loading
  if (loading) {
    return (
      <div className="mb-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-4"></div>
        <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-2xl"></div>
      </div>
    );
  }

  // ❌ Tidak ada data aktif
  if (!phaseData) {
    return (
      <div className="mb-8">
        <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl p-8 text-center">
          <GraduationCap className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
            Belum Ada Fase Aktif
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Saat ini belum ada fase pelatihan yang sedang berlangsung.
          </p>
        </div>
      </div>
    );
  }

  const { completed, total, percentage, startDate, endDate, categories } =
    phaseData;

  // 🎨 Tampilan utama
  return (
    <div className="mb-8 transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          Fase Aktif Saat Ini
        </h3>
        <span className="px-4 py-2 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200 rounded-full text-sm font-bold flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></span>
          SEDANG BERLANGSUNG
        </span>
      </div>

      {/* Main Card */}
      <div
        className="bg-gradient-to-r from-blue-600 via-blue-700 to-purple-700 
                    dark:from-blue-900 dark:via-blue-800 dark:to-purple-900
                    rounded-2xl p-8 text-white shadow-xl transition-all duration-300"
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            {/* Info Header */}
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-16 h-16 bg-white/20 dark:bg-black/30 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                <GraduationCap className="h-12 w-12 text-white dark:text-blue-200" />
              </div>
              <div>
                <h4 className="text-2xl font-bold">Pelatihan</h4>
                <p className="text-blue-100 dark:text-blue-200/80">
                  {categories.map((c) => c.label).join(" • ")}
                </p>
              </div>
            </div>

            <p className="text-blue-100 dark:text-blue-200 mb-4">
              Anda sedang dalam fase pelatihan. Pastikan mengikuti semua sesi
              tepat waktu.
            </p>

            <div className="flex items-center space-x-4 text-sm">
              {startDate && endDate && (
                <div className="flex items-center space-x-2">
                  <Calendar className="text-blue-100 dark:text-blue-300 h-4 w-4" />
                  <span>
                    {format(startDate, "dd MMM", { locale: localeId })} -{" "}
                    {format(endDate, "dd MMM yyyy", { locale: localeId })}
                  </span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Clock className="text-blue-100 dark:text-blue-300 h-4 w-4" />
                <span>Total: {total} sesi</span>
              </div>
            </div>
          </div>

          {/* Attendance */}
          <div className="text-right">
            <p className="text-sm text-blue-100 dark:text-blue-200 mb-2">
              Kehadiran
            </p>
            <p className="text-5xl font-bold mb-1 text-white dark:text-blue-100">
              {percentage.toFixed(0)}%
            </p>
            <p className="text-sm text-blue-100 dark:text-blue-300">
              {completed} dari {total} sesi
            </p>
          </div>
        </div>

        {/* Progress per kategori */}
        {categories.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {categories.map((cat) => (
              <div
                key={cat.category}
                className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-xl p-4 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{cat.label}</span>
                  <span
                    className={`text-xs ${cat.bgColor} px-2 py-0.5 rounded-full font-bold`}
                  >
                    {cat.percentage.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-white/20 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className={`${cat.color} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${cat.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-blue-100 dark:text-blue-300 mt-2">
                  {cat.completed} dari {cat.total} sesi
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
