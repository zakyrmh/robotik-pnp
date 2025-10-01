"use client";

import { useState, useEffect } from "react";
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
  AlertCircle,
  CheckCircle,
  Loader2,
  ArrowLeft,
} from "lucide-react";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

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

export default function EditActivityPage() {
  const { slug } = useParams();
  const router = useRouter();

  const [activityId, setActivityId] = useState<string>("");
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
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const activityTypes = [
    { value: "workshop", label: "Workshop" },
    { value: "competition", label: "Competition" },
    { value: "meeting", label: "Meeting" },
    { value: "showcase", label: "Showcase" },
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

  useEffect(() => {
    if (!slug) return;

    const fetchActivity = async () => {
      try {
        setLoading(true);
        setError(null);

        const q = query(collection(db, "activities"), where("slug", "==", slug));
        const snapshot = await getDocs(q);

        if (snapshot.empty) {
          setError("Aktivitas tidak ditemukan");
          setLoading(false);
          return;
        }

        const activityDoc = snapshot.docs[0];
        const data = activityDoc.data();
        setActivityId(activityDoc.id);

        const activityDate = data.date?.toDate?.() || new Date(data.date);
        const dateString = activityDate.toISOString().split("T")[0];

        setFormData({
          title: data.title || "",
          subtitle: data.subtitle || "",
          description: data.description || "",
          date: dateString,
          startTime: data.startTime || "00:00",
          endTime: data.endTime || "23:59",
          location: data.location || "",
          type: data.type || "workshop",
          status: data.status || "upcoming",
          maxParticipants: String(data.maxParticipants || 0),
          icon: data.icon || "bot",
          requirements: data.requirements || [],
          enableAttendance: !!data.attendanceWindow,
          attendanceOpenBefore: String(data.attendanceWindow?.openBefore || 15),
          attendanceCloseAfter: String(data.attendanceWindow?.closeAfter || 30),
          lateThreshold: String(data.lateThreshold || 10),
        });

        setLoading(false);
      } catch (err) {
        console.error("Error fetching activity:", err);
        setError("Gagal memuat data aktivitas");
        setLoading(false);
      }
    };

    fetchActivity();
  }, [slug]);

  const generateSlug = (title: string): string => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
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
      setError("Judul aktivitas wajib diisi");
      return false;
    }
    if (!formData.date) {
      setError("Tanggal aktivitas wajib diisi");
      return false;
    }
    if (!formData.startTime || !formData.endTime) {
      setError("Waktu mulai dan selesai wajib diisi");
      return false;
    }
    if (formData.startTime >= formData.endTime) {
      setError("Waktu selesai harus lebih besar dari waktu mulai");
      return false;
    }
    if (!formData.maxParticipants || parseInt(formData.maxParticipants) <= 0) {
      setError("Jumlah maksimal peserta harus lebih dari 0");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!validateForm()) return;

    setSaving(true);

    try {
      const newSlug = generateSlug(formData.title);
      const activityDate = new Date(`${formData.date}T${formData.startTime}`);

      const updateData = {
        slug: newSlug,
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
        icon: formData.icon,
        requirements: formData.requirements,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "activities", activityId), updateData);

      setSuccess(true);
      setTimeout(() => {
        router.push("/management-activity");
      }, 1500);
    } catch (err) {
      console.error("Error updating activity:", err);
      setError("Gagal mengupdate aktivitas. Silakan coba lagi.");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
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

  if (error && !activityId) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-red-700 dark:text-red-300 mb-4">{error}</p>
            <Link
              href="/management-activity"
              className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg"
            >
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Daftar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/management-activity"
            className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali ke Daftar
          </Link>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
            Edit Aktivitas
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Perbarui informasi aktivitas
          </p>
        </div>

        {error && activityId && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-800 dark:text-red-300 font-medium">Error</p>
              <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="w-5 h-5 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-3 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-green-800 dark:text-green-300 font-medium">
                Berhasil!
              </p>
              <p className="text-green-700 dark:text-green-400 text-sm">
                Aktivitas berhasil diperbarui. Mengalihkan...
              </p>
            </div>
          </div>
        )}

        <div className="space-y-6">
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

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
              <Users className="w-5 h-5 mr-2" />
              Peserta
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Maksimal Peserta *
                </label>
                <input
                  type="number"
                  name="maxParticipants"
                  value={formData.maxParticipants}
                  onChange={handleInputChange}
                  min="1"
                  placeholder="Contoh: 30"
                  className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

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
                      e.key === "Enter" && (e.preventDefault(), addRequirement())
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
                    {formData.attendanceOpenBefore} menit sebelum waktu mulai dan
                    ditutup {formData.attendanceCloseAfter} menit setelah waktu mulai.
                    Peserta yang absen lebih dari {formData.lateThreshold} menit akan
                    ditandai terlambat.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-3">
            <Link
              href="/management-activity"
              className="px-6 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center"
            >
              <X className="w-4 h-4 mr-2" />
              Batal
            </Link>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg flex items-center"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Simpan Perubahan
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}