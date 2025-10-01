"use client";

import { useState, useEffect } from "react";
import {
  Calendar,
  CalendarDays,
  Search,
  Plus,
  Edit,
  Trash2,
  Users,
  Loader2,
  MoreVertical,
  Eye,
  CheckCircle,
  Clock,
  XCircle,
  Wrench,
  Trophy,
  Settings,
  MapPin,
} from "lucide-react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot,
  deleteDoc,
  doc,
  updateDoc 
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { Activities } from "@/types/activities";
import Link from "next/link";

export default function AdminActivitiesPage() {
  const [activities, setActivities] = useState<Activities[]>([]);
  const [filteredActivities, setFilteredActivities] = useState<Activities[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);

  useEffect(() => {
    const activitiesQuery = query(
      collection(db, "activities"),
      orderBy("date", "desc")
    );

    const unsubscribe = onSnapshot(
      activitiesQuery,
      (querySnapshot) => {
        const activitiesData: Activities[] = [];

        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();

          let activityDate: Date;
          if (data.date?.toDate) {
            activityDate = data.date.toDate();
          } else if (data.date) {
            activityDate = new Date(data.date);
          } else {
            activityDate = new Date();
          }

          const activity: Activities = {
            _id: docSnap.id,
            slug: data.slug || docSnap.id,
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

          activitiesData.push(activity);
        });

        setActivities(activitiesData);
        setFilteredActivities(activitiesData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching activities:", err);
        setError("Gagal memuat aktivitas");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    let filtered = activities;

    if (searchQuery) {
      filtered = filtered.filter(
        (activity) =>
          activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((activity) => activity.status === filterStatus);
    }

    if (filterType !== "all") {
      filtered = filtered.filter((activity) => activity.type === filterType);
    }

    setFilteredActivities(filtered);
  }, [searchQuery, filterStatus, filterType, activities]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, "activities", id));
      setDeleteConfirm(null);
      setActionMenuOpen(null);
    } catch (err) {
      console.error("Error deleting activity:", err);
      alert("Gagal menghapus aktivitas");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, "activities", id), {
        status: newStatus,
        updatedAt: new Date(),
      });
      setActionMenuOpen(null);
    } catch (err) {
      console.error("Error updating status:", err);
      alert("Gagal mengubah status");
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

  const getStatusBadge = (status: string) => {
    let bgColor = "bg-blue-100 dark:bg-blue-900/30";
    let textColor = "text-blue-700 dark:text-blue-300";
    let icon = <Clock className="w-3 h-3" />;

    if (status === "ongoing") {
      bgColor = "bg-green-100 dark:bg-green-900/30";
      textColor = "text-green-700 dark:text-green-300";
      icon = <CheckCircle className="w-3 h-3" />;
    } else if (status === "completed") {
      bgColor = "bg-slate-100 dark:bg-slate-700";
      textColor = "text-slate-700 dark:text-slate-300";
      icon = <XCircle className="w-3 h-3" />;
    }

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${bgColor} ${textColor}`}>
        {icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getActivityTypeIcon = (type: string) => {
    if (type === "workshop") return <Wrench className="w-4 h-4" />;
    if (type === "competition") return <Trophy className="w-4 h-4" />;
    if (type === "meeting") return <Users className="w-4 h-4" />;
    if (type === "showcase") return <Settings className="w-4 h-4" />;
    return <Calendar className="w-4 h-4" />;
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const stats = {
    total: activities.length,
    upcoming: activities.filter((a) => a.status === "upcoming").length,
    ongoing: activities.filter((a) => a.status === "ongoing").length,
    completed: activities.filter((a) => a.status === "completed").length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            <span className="ml-3 text-slate-600 dark:text-slate-400">
              Memuat data aktivitas...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-700 dark:text-red-300">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              Coba Lagi
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                Kelola Aktivitas
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1">
                Kelola semua aktivitas UKM Robotik PNP
              </p>
            </div>
            <Link
              href="/management-activity/add"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition"
            >
              <Plus className="w-5 h-5" />
              Tambah Aktivitas
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Total Aktivitas</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.total}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Akan Datang</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                  {stats.upcoming}
                </p>
              </div>
              <Clock className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Berlangsung</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                  {stats.ongoing}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Selesai</p>
                <p className="text-2xl font-bold text-slate-600 dark:text-slate-400 mt-1">
                  {stats.completed}
                </p>
              </div>
              <XCircle className="w-8 h-8 text-slate-400" />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari aktivitas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Status</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Semua Tipe</option>
                  <option value="workshop">Workshop</option>
                  <option value="competition">Competition</option>
                  <option value="meeting">Meeting</option>
                  <option value="showcase">Showcase</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            {filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <p className="text-slate-500 dark:text-slate-400">
                  {searchQuery || filterStatus !== "all" || filterType !== "all"
                    ? "Tidak ada aktivitas yang sesuai dengan filter"
                    : "Belum ada aktivitas"}
                </p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-800/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Aktivitas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Tanggal & Waktu
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Lokasi
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Peserta
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredActivities.map((activity) => (
                    <tr
                      key={activity._id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${getActivityTypeColor(
                              activity.type
                            )}`}
                          >
                            {getActivityTypeIcon(activity.type)}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">
                              {activity.title}
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                              {activity.subtitle}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-slate-900 dark:text-slate-100">
                          {formatDate(activity.date)}
                        </p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          {activity.startTime} - {activity.endTime}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                          <MapPin className="w-4 h-4" />
                          {activity.location}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="text-slate-900 dark:text-slate-100">
                            {activity.currentParticipants}/{activity.maxParticipants}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">{getStatusBadge(activity.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() =>
                              setActionMenuOpen(
                                actionMenuOpen === activity._id ? null : activity._id
                              )
                            }
                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
                          >
                            <MoreVertical className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                          </button>

                          {actionMenuOpen === activity._id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-10">
                              <a
                                href={`/management-activity/show/${activity.slug}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-t-lg"
                              >
                                <Eye className="w-4 h-4" />
                                Lihat Detail
                              </a>
                              <a
                                href={`/management-activity/edit/${activity.slug}`}
                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                              >
                                <Edit className="w-4 h-4" />
                                Edit
                              </a>

                              {activity.status !== "ongoing" && (
                                <button
                                  onClick={() => handleStatusChange(activity._id, "ongoing")}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-green-700 dark:text-green-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                  Set Ongoing
                                </button>
                              )}

                              {activity.status !== "completed" && (
                                <button
                                  onClick={() => handleStatusChange(activity._id, "completed")}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                                >
                                  <XCircle className="w-4 h-4" />
                                  Set Completed
                                </button>
                              )}

                              <div className="border-t border-slate-200 dark:border-slate-700">
                                <button
                                  onClick={() => setDeleteConfirm(activity._id)}
                                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-b-lg"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                Konfirmasi Hapus
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                Apakah Anda yakin ingin menghapus aktivitas ini? Tindakan ini tidak dapat
                dibatalkan.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}