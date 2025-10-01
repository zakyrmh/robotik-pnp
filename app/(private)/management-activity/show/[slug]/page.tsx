"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  ArrowLeft,
  User,
  QrCode,
  TrendingUp,
  Wrench,
  Trophy,
  Settings,
} from "lucide-react";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  onSnapshot,
  deleteDoc,
  updateDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Activities } from "@/types/activities";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface AttendanceRecord {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  status: "present" | "late" | "invalid";
  checkInTime: Date;
  checkInBy: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
}

export default function AdminActivityDetailPage() {
  const { slug } = useParams();
  const router = useRouter();
  
  const [activity, setActivity] = useState<Activities | null>(null);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [activeTab, setActiveTab] = useState<"details" | "attendances">(
    "details"
  );

useEffect(() => {
  if (!slug) return;

  const fetchActivity = async () => {
    try {
      setLoading(true);

      const q = query(collection(db, "activities"), where("slug", "==", slug));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("Aktivitas tidak ditemukan");
        setLoading(false);
        return;
      }

      const activityDoc = snapshot.docs[0];
      const data = activityDoc.data();

      const activityDate = data.date?.toDate?.() || new Date(data.date);

      const activityData: Activities = {
        _id: activityDoc.id,
        slug: data.slug || activityDoc.id,
        icon: data.icon || "bot",
        title: data.title || "Untitled Activity",
        subtitle: data.subtitle || "",
        description: data.description || "",
        date: activityDate,
        startTime: data.startTime || "00:00",
        endTime: data.endTime || "23:59",
        location: data.location || "",
        type: data.type || "workshop",
        status: data.status || "upcoming",
        maxParticipants: data.maxParticipants || 0,
        currentParticipants: data.currentParticipants || 0,
        requirements: data.requirements || [],
        attendanceWindow: data.attendanceWindow,
        lateThreshold: data.lateThreshold,
        createdBy: data.createdBy || "",
        createdAt: data.createdAt?.toDate?.() || new Date(),
        updatedAt: data.updatedAt?.toDate?.() || new Date(),
      };

      setActivity(activityData);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching activity:", err);
      setError("Gagal memuat data aktivitas");
      setLoading(false);
    }
  };

  fetchActivity();
}, [slug]);

  useEffect(() => {
    if (!activity?._id) return;

    const attendanceQuery = query(
      collection(db, "attendance"),
      where("activityId", "==", activity._id)
    );

    const unsubscribe = onSnapshot(attendanceQuery, async (snapshot) => {
      const attendanceData: AttendanceRecord[] = [];

      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();

        let userName = "Unknown User";
        let userEmail = "";

        try {
          const userDoc = await getDoc(doc(db, "users", data.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            userName = userData.name || "Unknown User";
            userEmail = userData.email || "";
          }
        } catch (err) {
          console.error("Error fetching user:", err);
        }

        attendanceData.push({
          _id: docSnap.id,
          userId: data.userId,
          userName,
          userEmail,
          status: data.status || "present",
          checkInTime: data.checkInTime?.toDate?.() || new Date(),
          checkInBy: data.checkInBy || "",
          checkInLocation: data.checkInLocation,
        });
      }

      attendanceData.sort(
        (a, b) => a.checkInTime.getTime() - b.checkInTime.getTime()
      );
      setAttendances(attendanceData);
    });

    return () => unsubscribe();
  }, [activity]);

  const handleDelete = async () => {
    try {
      await deleteDoc(doc(db, "activities", activity?._id || ""));
      window.location.href = "/admin/activities";
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Gagal menghapus aktivitas");
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!activity) return;

    const previousActivity = { ...activity };
    setActivity({
      ...activity,
      status: newStatus as "upcoming" | "ongoing" | "completed",
      updatedAt: new Date(),
    });

    try {
      await updateDoc(doc(db, "activities", activity?._id || ""), {
        status: newStatus,
        updatedAt: new Date(),
      });

      router.push("/attendance");
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Gagal mengubah status");

      setActivity(previousActivity);
    }
  };

  const getActivityTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      workshop: "bg-blue-500",
      competition: "bg-red-500",
      meeting: "bg-green-500",
      showcase: "bg-purple-500",
    };
    return colors[type] || "bg-slate-500";
  };

  const getActivityTypeIcon = (type: string) => {
    if (type === "workshop") return <Wrench className="w-6 h-6" />;
    if (type === "competition") return <Trophy className="w-6 h-6" />;
    if (type === "meeting") return <Users className="w-6 h-6" />;
    if (type === "showcase") return <Settings className="w-6 h-6" />;
    return <Calendar className="w-6 h-6" />;
  };

  const getStatusBadge = (status: string) => {
    let bgColor = "bg-blue-100 dark:bg-blue-900/30";
    let textColor = "text-blue-700 dark:text-blue-300";
    let icon = <Clock className="w-4 h-4" />;

    if (status === "ongoing") {
      bgColor = "bg-green-100 dark:bg-green-900/30";
      textColor = "text-green-700 dark:text-green-300";
      icon = <CheckCircle className="w-4 h-4" />;
    } else if (status === "completed") {
      bgColor = "bg-slate-100 dark:bg-slate-700";
      textColor = "text-slate-700 dark:text-slate-300";
      icon = <XCircle className="w-4 h-4" />;
    }

    return (
      <span
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${bgColor} ${textColor}`}
      >
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status: string) => {
    if (status === "present") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
          <CheckCircle className="w-3 h-3" />
          Hadir
        </span>
      );
    }
    if (status === "late") {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300">
          <Clock className="w-3 h-3" />
          Terlambat
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
        <XCircle className="w-3 h-3" />
        Invalid
      </span>
    );
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const attendanceStats = {
    total: attendances.length,
    present: attendances.filter((a) => a.status === "present").length,
    late: attendances.filter((a) => a.status === "late").length,
    invalid: attendances.filter((a) => a.status === "invalid").length,
    rate: activity
      ? Math.round((attendances.length / activity.maxParticipants) * 100)
      : 0,
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Memuat data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !activity) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 dark:text-red-300">
              {error || "Aktivitas tidak ditemukan"}
            </p>
            <Link
              href="/management-activity"
              className="mt-4 inline-block px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/management-activity"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Daftar
          </Link>

          <div className="flex gap-2">
            <a
              href={`/admin/activities/edit/${activity.slug}`}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            >
              <Edit className="w-4 h-4" />
              Edit
            </a>
            <button
              onClick={() => setDeleteConfirm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <Trash2 className="w-4 h-4" />
              Hapus
            </button>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 mb-6">
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`w-16 h-16 rounded-xl flex items-center justify-center text-white ${getActivityTypeColor(
                activity.type
              )}`}
            >
              {getActivityTypeIcon(activity.type)}
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">
                    {activity.title}
                  </h1>
                  <p className="text-slate-600 dark:text-slate-400">
                    {activity.subtitle}
                  </p>
                </div>
                {getStatusBadge(activity.status)}
              </div>

              <div className="flex flex-wrap gap-4 mt-4 text-sm">
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Calendar className="w-4 h-4" />
                  {formatDate(activity.date)}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  {activity.startTime} - {activity.endTime}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <MapPin className="w-4 h-4" />
                  {activity.location}
                </div>
                <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                  <Users className="w-4 h-4" />
                  {activity.currentParticipants}/{activity.maxParticipants}{" "}
                  peserta
                </div>
              </div>
            </div>
          </div>

          {activity.status !== "completed" && (
            <div className="flex gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
              {activity.status !== "ongoing" && (
                <button
                  onClick={() => handleStatusChange("ongoing")}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Mulai Aktivitas
                </button>
              )}
              {activity.status === "ongoing" && (
                <button
                  onClick={() => handleStatusChange("completed")}
                  className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white rounded-lg text-sm flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Selesaikan Aktivitas
                </button>
              )}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-6">
          <div className="border-b border-slate-200 dark:border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab("details")}
                className={`px-6 py-4 font-medium border-b-2 transition ${
                  activeTab === "details"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Detail Aktivitas
              </button>
              <button
                onClick={() => setActiveTab("attendances")}
                className={`px-6 py-4 font-medium border-b-2 transition ${
                  activeTab === "attendances"
                    ? "border-blue-600 text-blue-600 dark:text-blue-400"
                    : "border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100"
                }`}
              >
                Daftar Hadir ({attendances.length})
              </button>
            </div>
          </div>

          <div className="p-6">
            {activeTab === "details" ? (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Deskripsi
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {activity.description || "Tidak ada deskripsi"}
                  </p>
                </div>

                {activity.requirements && activity.requirements.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" />
                      Persyaratan
                    </h3>
                    <ul className="space-y-2">
                      {activity.requirements.map((req, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-slate-600 dark:text-slate-400"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2 flex-shrink-0"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {activity.attendanceWindow && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
                      <QrCode className="w-5 h-5" />
                      Pengaturan Absensi
                    </h3>
                    <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Absensi dibuka
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {activity.attendanceWindow.openBefore} menit sebelum
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600 dark:text-slate-400">
                          Absensi ditutup
                        </span>
                        <span className="font-medium text-slate-900 dark:text-slate-100">
                          {activity.attendanceWindow.closeAfter} menit setelah
                        </span>
                      </div>
                      {activity.lateThreshold && (
                        <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-400">
                            Batas terlambat
                          </span>
                          <span className="font-medium text-slate-900 dark:text-slate-100">
                            {activity.lateThreshold} menit
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Total Hadir
                        </p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                          {attendanceStats.total}
                        </p>
                      </div>
                      <Users className="w-8 h-8 text-slate-400" />
                    </div>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 dark:text-green-400">
                          Tepat Waktu
                        </p>
                        <p className="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">
                          {attendanceStats.present}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400">
                          Terlambat
                        </p>
                        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300 mt-1">
                          {attendanceStats.late}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-400" />
                    </div>
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Persentase
                        </p>
                        <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">
                          {attendanceStats.rate}%
                        </p>
                      </div>
                      <TrendingUp className="w-8 h-8 text-blue-400" />
                    </div>
                  </div>
                </div>

                {attendances.length === 0 ? (
                  <div className="text-center py-12">
                    <User className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                    <p className="text-slate-500 dark:text-slate-400">
                      Belum ada peserta yang melakukan absensi
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            No
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            Nama
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            Email
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            Waktu Check-in
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {attendances.map((attendance, idx) => (
                          <tr
                            key={attendance._id}
                            className="hover:bg-slate-50 dark:hover:bg-slate-700/30"
                          >
                            <td className="px-4 py-3 text-sm text-slate-900 dark:text-slate-100">
                              {idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {attendance.userName}
                              </p>
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                              {attendance.userEmail}
                            </td>
                            <td className="px-4 py-3 text-sm text-slate-600 dark:text-slate-400">
                              {formatTime(attendance.checkInTime)}
                            </td>
                            <td className="px-4 py-3">
                              {getAttendanceStatusBadge(attendance.status)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              Konfirmasi Hapus
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Apakah Anda yakin ingin menghapus aktivitas ini? Semua data
              absensi juga akan terhapus dan tindakan ini tidak dapat
              dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteConfirm(false)}
                className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
