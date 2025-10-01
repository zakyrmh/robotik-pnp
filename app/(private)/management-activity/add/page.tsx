"use client";

import { useEffect, useState } from "react";
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  FileText,
  Save,
  X,
  Plus,
  Trash2,
  Wrench,
  Trophy,
  Settings,
} from "lucide-react";
import {
  collection,
  addDoc,
  serverTimestamp,
  getDoc,
  doc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";

interface FormData {
  title: string;
  subtitle: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  type: "workshop" | "competition" | "meeting" | "showcase";
  status: "upcoming" | "ongoing" | "completed";
  maxParticipants: string;
  icon: string;
  requirements: string[];
  enableAttendance: boolean;
  attendanceOpenBefore: string;
  attendanceCloseAfter: string;
  lateThreshold: string;
}

export default function AddActivityPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    title: "",
    subtitle: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    type: "workshop",
    status: "upcoming",
    maxParticipants: "",
    icon: "bot",
    requirements: [],
    enableAttendance: true,
    attendanceOpenBefore: "15",
    attendanceCloseAfter: "30",
    lateThreshold: "10",
  });

  const [currentRequirement, setCurrentRequirement] = useState("");
  const [loading, setLoading] = useState(false);
  const [uidUser, setUidUser] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUidUser(user ? user.uid : null);
      if (!user) {
        router.replace("/login");
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));

        if (!userDoc.exists()) {
          router.replace("/dashboard");
          return;
        }

        const userData = userDoc.data();
        if (userData.role !== "admin") {
          router.replace("/dashboard");
          return;
        }
        setLoading(false);
      } catch (error) {
        console.error("Error checking role:", error);
        router.replace("/dashboard");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const activityTypes = [
    {
      value: "workshop",
      label: "Workshop",
      icon: <Wrench className="w-4 h-4" />,
    },
    {
      value: "competition",
      label: "Competition",
      icon: <Trophy className="w-4 h-4" />,
    },
    { value: "meeting", label: "Meeting", icon: <Users className="w-4 h-4" /> },
    {
      value: "showcase",
      label: "Showcase",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  const iconOptions = [
    "bot",
    "robot",
    "code",
    "circuit",
    "microchip",
    "cpu",
    "wrench",
    "trophy",
    "users",
    "rocket",
    "zap",
    "star",
  ];

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const addRequirement = () => {
    if (currentRequirement.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, currentRequirement.trim()],
      }));
      setCurrentRequirement("");
    }
  };

  const removeRequirement = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const validateForm = (): boolean => {
    if (!formData.title.trim()) {
      toast.error("Judul aktivitas wajib diisi");
      return false;
    }
    if (!formData.date) {
      toast.error("Tanggal aktivitas wajib diisi");
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      toast.error("Waktu mulai dan selesai wajib diisi");
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      toast.error("Waktu selesai harus lebih besar dari waktu mulai");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);

    try {
      const slug = generateSlug(formData.title);

      // Gabungkan date dan time untuk timestamp lengkap
      const activityDate = new Date(`${formData.date}T${formData.startTime}`);

      const activityData = {
        slug,
        title: formData.title,
        subtitle: formData.subtitle,
        description: formData.description,
        date: activityDate,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        type: formData.type,
        status: formData.status,
        maxParticipants: parseInt(formData.maxParticipants),
        currentParticipants: 0,
        icon: formData.icon,
        requirements: formData.requirements,
        ...(formData.enableAttendance && {
          attendanceWindow: {
            openBefore: parseInt(formData.attendanceOpenBefore),
            closeAfter: parseInt(formData.attendanceCloseAfter),
          },
          lateThreshold: parseInt(formData.lateThreshold),
        }),
        createdBy: uidUser,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await addDoc(collection(db, "activities"), activityData);

      setFormData({
        title: "",
        subtitle: "",
        description: "",
        date: "",
        startTime: "",
        endTime: "",
        location: "",
        type: "workshop",
        status: "upcoming",
        maxParticipants: "",
        icon: "bot",
        requirements: [],
        enableAttendance: true,
        attendanceOpenBefore: "15",
        attendanceCloseAfter: "30",
        lateThreshold: "10",
      });

      setTimeout(() => toast.success("Aktivitas berhasil ditambahkan"), 5000);
    } catch (err) {
      console.error("Error adding activity:", err);
      toast.error("Gagal menambahkan aktivitas. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Tambah Aktivitas Baru
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Buat aktivitas baru untuk UKM Robotik PNP
          </p>
        </div>

        <Toaster richColors position="top-right" />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <FileText className="w-5 h-5 mr-2" />
              Informasi Dasar
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Judul Aktivitas *
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Contoh: Workshop IoT dengan ESP32"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subtitle
                </label>
                <input
                  type="text"
                  name="subtitle"
                  value={formData.subtitle}
                  onChange={handleInputChange}
                  placeholder="Deskripsi singkat aktivitas"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Deskripsi Lengkap *
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Jelaskan detail aktivitas ini..."
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Tipe Aktivitas *
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {activityTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Status *
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Icon
                </label>
                <select
                  name="icon"
                  value={formData.icon}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {iconOptions.map((icon) => (
                    <option key={icon} value={icon}>
                      {icon}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Schedule & Location */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Jadwal & Lokasi
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Tanggal *
                </label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Waktu Mulai *
                  </label>
                  <input
                    type="time"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Waktu Selesai *
                  </label>
                  <input
                    type="time"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Lokasi *
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  placeholder="Contoh: Lab Robotika Gedung A Lt. 2"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>
          </div>

          {/* Participants */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Peserta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Persyaratan (Opsional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={currentRequirement}
                    onChange={(e) => setCurrentRequirement(e.target.value)}
                    onKeyPress={(e) =>
                      e.key === "Enter" &&
                      (e.preventDefault(), addRequirement())
                    }
                    placeholder="Tambah persyaratan"
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {formData.requirements.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {formData.requirements.map((req, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700 rounded"
                      >
                        <span className="text-sm text-slate-700 dark:text-slate-300">
                          {req}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeRequirement(index)}
                          className="text-red-600 hover:text-red-700 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Attendance Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                Pengaturan Absensi
              </h2>
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  name="enableAttendance"
                  checked={formData.enableAttendance}
                  onChange={handleInputChange}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-blue-600"></div>
                <span className="ml-3 text-sm font-medium text-slate-700 dark:text-slate-300">
                  Aktifkan Absensi
                </span>
              </label>
            </div>

            {formData.enableAttendance && (
              <div className="space-y-4 pl-7">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Buka (menit sebelum)
                    </label>
                    <input
                      type="number"
                      name="attendanceOpenBefore"
                      value={formData.attendanceOpenBefore}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Tutup (menit setelah)
                    </label>
                    <input
                      type="number"
                      name="attendanceCloseAfter"
                      value={formData.attendanceCloseAfter}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Batas Terlambat (menit)
                    </label>
                    <input
                      type="number"
                      name="lateThreshold"
                      value={formData.lateThreshold}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    <strong>Info:</strong> Absensi akan dibuka{" "}
                    {formData.attendanceOpenBefore} menit sebelum waktu mulai
                    dan ditutup {formData.attendanceCloseAfter} menit setelah
                    waktu mulai. Peserta yang absen lebih dari{" "}
                    {formData.lateThreshold} menit akan ditandai terlambat.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Aktivitas
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
