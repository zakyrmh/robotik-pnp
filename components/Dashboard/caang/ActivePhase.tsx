"use client";

import { useEffect, useState } from "react";
import { Calendar, Clock, GraduationCap } from "lucide-react";
import { getActivities } from "@/lib/firebase/activities";
import { db } from "@/lib/firebaseConfig";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  getDoc,
} from "firebase/firestore";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Activity } from "@/types/activities";
import { OrPhase, TrainingCategory } from "@/types/enum";
import { Attendance } from "@/types/attendances";

/**
 * Tipe dokumen di Firestore yang disimpan admin
 * Collection: "settings" docId: "activePhase"
 *
 * Contoh dokumen:
 * {
 *   phase: "PKTOS",
 *   showCategoryProgress: true
 * }
 */
export interface ActivePhaseSetting {
  phase: OrPhase;
  showCategoryProgress?: boolean;
}

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
  showCategoryProgress: boolean;
}

export default function ActivePhase() {
  const { user } = useAuth();
  const [phaseData, setPhaseData] = useState<PhaseData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPhaseData = async () => {
      setLoading(true);
      try {
        // 0️⃣ Ambil setting fase aktif dari Firestore (admin akan menyet ini)
        const settingsRef = doc(db, "settings", "activePhase");
        const settingsSnap = await getDoc(settingsRef);

        if (!settingsSnap.exists()) {
          // Tidak ada fase aktif yang diset oleh admin
          setPhaseData(null);
          setLoading(false);
          return;
        }

        const settings = settingsSnap.data() as Partial<ActivePhaseSetting>;
        if (!settings.phase) {
          setPhaseData(null);
          setLoading(false);
          return;
        }

        const activePhaseSetting: ActivePhaseSetting = {
          phase: settings.phase,
          showCategoryProgress: settings.showCategoryProgress ?? true,
        };

        // 1️⃣ Ambil semua kegiatan untuk fase aktif
        const activities = await getActivities({ phase: activePhaseSetting.phase });

        // jika tidak ada activities -> anggap tidak ada fase aktif yang berjalan
        if (!user || activities.length === 0) {
          setPhaseData(null);
          return;
        }

        // === NEW: ambil attendance hanya untuk activityId di fase aktif ===
        // 2️⃣ Ambil semua attendance milik user untuk activity yang ada di fase aktif
        const attendanceRef = collection(db, "attendance_new");
        const TEST_USER_ID = "d4jAAy6g4Thyq3nZ9wCliMRMQmB3"; // tetap hardcoded untuk testing sesuai permintaan

        const activityIds = activities.map((a) => a.id).filter(Boolean);

        // const attendanceDocs: FirebaseFirestore.QueryDocumentSnapshot[] = []; // placeholder type - will not be used directly
        // because we can't reference that type here, we'll gather docs via snapshots

        // Firestore 'in' query supports max 10 values. Batch if needed.
        const chunkSize = 10;
        const attendanceResults: Attendance[] = [];

        for (let i = 0; i < activityIds.length; i += chunkSize) {
          const chunk = activityIds.slice(i, i + chunkSize);
          if (chunk.length === 0) continue;

          const q = query(
            attendanceRef,
            where("userId", "==", TEST_USER_ID),
            where("activityId", "in", chunk)
          );
          const snap = await getDocs(q);
          snap.docs.forEach((d) => {
            attendanceResults.push({
              id: d.id,
              ...(d.data() as Omit<Attendance, "id">),
            });
          });
        }

        // attendanceResults now contains attendance only for the user AND activities in the active phase
        const attendanceData: Attendance[] = attendanceResults;

        // 3️⃣ Hitung completed sessions (present + late) — berdasarkan attendance yang sudah difilter
        const completedSessions = attendanceData.filter((a) =>
          ["present", "late"].includes(a.status as unknown as string)
        ).length;

        // 4️⃣ Total semua sesi dari daftar activity
        const totalSessions = activities.reduce(
          (sum, act) => sum + (act.totalSessions ?? 1),
          0
        );

        // 5️⃣ Hitung tanggal mulai & akhir (safely convert Timestamp -> Date)
        const dates: Date[] = activities
          .map((a) => (a.scheduledDate ? a.scheduledDate.toDate() : null))
          .filter((d): d is Date => d !== null);

        const startDate =
          dates.length > 0
            ? new Date(Math.min(...dates.map((d) => d.getTime())))
            : null;
        const endDate =
          dates.length > 0
            ? new Date(Math.max(...dates.map((d) => d.getTime())))
            : null;

        // 6️⃣ Kelompokkan progress per kategori
        // IMPORTANT: jika activity.category tidak ada, kita *tidak* masukkan ke categoryMap
        const categoryMap = new Map<
          TrainingCategory,
          { completed: number; total: number; activities: Activity[] }
        >();

        activities.forEach((activity) => {
          const cat = activity.category;
          if (!cat) {
            // skip activity tanpa kategori — karena progress per kategori bersifat opsional
            return;
          }

          const existing = categoryMap.get(cat) || {
            completed: 0,
            total: 0,
            activities: [],
          };

          existing.total += activity.totalSessions ?? 1;

          // Hitung jumlah sesi hadir per kategori (berdasarkan attendanceData yang sudah difilter)
          const completedForActivity = attendanceData.filter(
            (att) =>
              att.activityId === activity.id &&
              ["present", "late"].includes(att.status as unknown as string)
          ).length;

          existing.completed += completedForActivity;
          existing.activities.push(activity);
          categoryMap.set(cat, existing);
        });

        // 7️⃣ Format kategori jadi tampilan progress bar
        const categories: CategoryProgress[] = Array.from(categoryMap.entries()).map(
          ([category, data]) => {
            const percentage = data.total > 0 ? (data.completed / data.total) * 100 : 0;

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
                label = String(category);
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
          }
        );

        // 8️⃣ Set hasil akhir
        setPhaseData({
          phase: activePhaseSetting.phase,
          activities,
          completed: completedSessions,
          total: totalSessions,
          percentage: totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0,
          startDate,
          endDate,
          categories: categories.sort((a, b) => a.label.localeCompare(b.label)),
          showCategoryProgress: activePhaseSetting.showCategoryProgress ?? true,
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
            Saat ini belum ada fase pelatihan yang sedang berlangsung atau belum ada kegiatan di fase yang diset.
          </p>
        </div>
      </div>
    );
  }

  const { completed, total, percentage, startDate, endDate, categories, showCategoryProgress } =
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
                <h4 className="text-2xl font-bold uppercase">{phaseData.phase}</h4>
                <p className="text-blue-100 dark:text-blue-200/80">
                  {categories.map((c) => c.label).join(" • ")}
                </p>
              </div>
            </div>

            <p className="text-blue-100 dark:text-blue-200 mb-4">
              Anda sedang dalam fase <span className="uppercase">{phaseData.phase}</span>. Pastikan mengikuti semua sesi
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
        {showCategoryProgress && categories.length > 0 && (
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
