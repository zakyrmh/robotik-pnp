"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { collection, doc, getDoc, getDocs, query } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { Attendances } from "@/types/attendance";
import { CaangRegistration } from "@/types/caang";
import { Html5QrcodeScanner } from "html5-qrcode";

// ganti toast -> sonner
import { Toaster, toast } from "sonner";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";

// Extended Attendance type dengan user data
interface AttendanceWithUser extends Attendances {
  userData?: CaangRegistration;
}

export default function AdminAttendancePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          if (data.role !== "admin") {
            router.push("/dashboard");
          }
        } else {
          console.log("User data not found");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const [attendances, setAttendances] = useState<AttendanceWithUser[]>([]);
  const [scanning, setScanning] = useState(false);
  const [updating, setUpdating] = useState(false);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  const [activities, setActivities] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedActivity, setSelectedActivity] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [filteredAttendances, setFilteredAttendances] = useState<
    AttendanceWithUser[]
  >([]);

  // Fetch attendance data with user information
  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      const q = query(collection(db, "attendance"));
      const snapshot = await getDocs(q);

      const attendanceData: Attendances[] = snapshot.docs.map((docSnap) => ({
        ...(docSnap.data() as Attendances),
        id: docSnap.id,
      }));

      // Fetch user data untuk setiap attendance record
      const attendancesWithUserData: AttendanceWithUser[] = await Promise.all(
        attendanceData.map(async (attendance) => {
          try {
            // Ambil data user dari koleksi caang_registration
            const userDoc = await getDoc(
              doc(db, "caang_registration", attendance.userId.toString())
            );

            if (userDoc.exists()) {
              const userData = userDoc.data() as CaangRegistration;
              return {
                ...attendance,
                userData: userData,
              };
            } else {
              console.warn(
                `User data not found for userId: ${attendance.userId}`
              );
              return {
                ...attendance,
                userData: undefined,
              };
            }
          } catch (error) {
            console.error(
              `Error fetching user data for ${attendance.userId}:`,
              error
            );
            return {
              ...attendance,
              userData: undefined,
            };
          }
        })
      );

      setAttendances(attendancesWithUserData);
    } catch (error) {
      console.error("Error fetching attendance:", error);
      toast.error("Gagal memuat data absensi");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch daftar activities
  const fetchActivities = useCallback(async () => {
    try {
      const q = query(collection(db, "activities")); // Sesuaikan nama collection
      const snapshot = await getDocs(q);

      const activitiesData = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        name: docSnap.data().name || docSnap.data().title || docSnap.id, // Sesuaikan field name
      }));

      setActivities(activitiesData);
    } catch (error) {
      console.error("Error fetching activities:", error);
      toast.error("Gagal memuat daftar aktivitas");
    }
  }, []);

  // Filter dan search logic
  useEffect(() => {
    let result = [...attendances];

    // Filter by activity
    if (selectedActivity !== "all") {
      result = result.filter((att) => att.activityId.toString() === selectedActivity);
    }

    // Search functionality
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((att) => {
        const nama = att.userData?.namaLengkap?.toLowerCase() || "";
        const nim = att.userData?.nim?.toLowerCase() || "";
        const prodi = att.userData?.prodi?.toLowerCase() || "";
        const status = att.status?.toLowerCase() || "";

        return (
          nama.includes(query) ||
          nim.includes(query) ||
          prodi.includes(query) ||
          status.includes(query)
        );
      });
    }

    setFilteredAttendances(result);
  }, [attendances, selectedActivity, searchQuery]);

  // Fetch activities saat component mount
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // cooldown map untuk cegah spam QR
  const scanCooldownRef = useRef<Record<string, number>>({});

  const handleScanSuccess = useCallback(
    async (decodedText: string) => {
      let parsed;
      try {
        parsed = JSON.parse(decodedText);
      } catch (err) {
        console.error("Error parsing QR JSON:", err);
        toast.error("QR format tidak dikenal");
        return;
      }

      const { userId, activityId, timestamp, hash } = parsed as {
        userId?: string;
        activityId?: string;
        timestamp?: string;
        hash?: string;
      };

      if (!userId || !activityId || !timestamp || !hash) {
        toast.error("QR tidak lengkap");
        return;
      }

      // cooldown
      const key = hash;
      const now = Date.now();
      if (scanCooldownRef.current[key] && scanCooldownRef.current[key] > now) {
        return;
      }
      scanCooldownRef.current[key] = now + 4000;

      try {
        setUpdating(true);
        const res = await fetch("/api/validate-scan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            activityId,
            timestamp,
            signature: hash,
          }),
        });
        const body = await res.json();

        if (!res.ok) {
          toast.error(body?.error || "Gagal memvalidasi QR");
          return;
        }

        if (body.ok) {
          if (body.message === "already_present") {
            toast.info("Peserta sudah tercatat hadir");
          } else {
            toast.success("Absensi tercatat", {
              description: body.message,
            });
          }
          await fetchAttendances();
        } else {
          toast.error(body?.error || "Validasi gagal");
        }
      } catch (err) {
        console.error("validate-scan fetch error", err);
        toast.error("Gagal koneksi ke server");
      } finally {
        setUpdating(false);
      }
    },
    [fetchAttendances]
  );

  const initializeScanner = useCallback(() => {
    if (scannerRef.current || !scannerDivRef.current) return;

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 }, aspectRatio: 1.0 },
      false
    );

    scanner.render(handleScanSuccess, (error) => {
      console.warn("QR scan warning:", error);
    });

    scannerRef.current = scanner;
    setScanning(true);
  }, [handleScanSuccess]);

  const stopScanner = useCallback(() => {
    if (scannerRef.current) {
      scannerRef.current
        .clear()
        .then(() => {
          scannerRef.current = null;
          setScanning(false);
        })
        .catch(console.error);
    }
  }, []);

  const toggleScanner = useCallback(() => {
    if (scanning) {
      stopScanner();
    } else {
      initializeScanner();
    }
  }, [scanning, stopScanner, initializeScanner]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances]);

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, [stopScanner]);

  return (
    <>
      <div className="min-h-screen p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Scanner Section */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                📷 Scanner Absensi
              </h2>
              <button
                onClick={toggleScanner}
                disabled={updating}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  scanning
                    ? "bg-red-500 hover:bg-red-600 text-white"
                    : "bg-blue-500 hover:bg-blue-600 text-white"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {updating
                  ? "Memproses..."
                  : scanning
                  ? "Stop Scanner"
                  : "Start Scanner"}
              </button>
            </div>

            <div className="w-full max-w-md mx-auto">
              <div
                id="qr-reader"
                ref={scannerDivRef}
                className="border rounded-lg overflow-hidden"
              />

              {!scanning && (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  Klik &quot;Start Scanner&quot; untuk memulai scan QR
                </div>
              )}
            </div>
          </div>

          {/* Attendance Table */}
          {/* Attendance Table */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                📋 Daftar Calon Anggota
              </h2>
              <button
                onClick={fetchAttendances}
                disabled={loading}
                className="px-3 py-2 text-sm bg-slate-500 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50"
              >
                {loading ? "Memuat..." : "Refresh"}
              </button>
            </div>

            {/* Filter dan Search Section */}
            <div className="mb-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Activity Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Filter Aktivitas
                  </label>
                  <select
                    value={selectedActivity}
                    onChange={(e) => setSelectedActivity(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Semua Aktivitas</option>
                    {activities.map((activity) => (
                      <option key={activity.id} value={activity.id}>
                        {activity.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Search Input */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    Cari Data
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari nama, NIM, prodi, atau status..."
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Info Filter Aktif */}
              {(selectedActivity !== "all" || searchQuery.trim() !== "") && (
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                  <span>Filter aktif:</span>
                  {selectedActivity !== "all" && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                      {activities.find((a) => a.id === selectedActivity)?.name}
                    </span>
                  )}
                  {searchQuery.trim() !== "" && (
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded">
                      Pencarian: &quot;{searchQuery}&quot;
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setSelectedActivity("all");
                      setSearchQuery("");
                    }}
                    className="ml-2 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-slate-500 dark:text-slate-400 mt-2">
                  Memuat data...
                </p>
              </div>
            ) : filteredAttendances.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                {searchQuery.trim() !== "" || selectedActivity !== "all"
                  ? "Tidak ada data yang sesuai dengan filter"
                  : "Tidak ada data absensi"}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-slate-200 dark:border-slate-700 text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium">Nama</th>
                      <th className="px-4 py-3 text-left font-medium">NIM</th>
                      <th className="px-4 py-3 text-left font-medium">Prodi</th>
                      <th className="px-4 py-3 text-left font-medium">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left font-medium">
                        Waktu Update
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAttendances.map((att) => (
                      <tr
                        key={String(att._id)}
                        className="border-t border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
                      >
                        <td className="px-4 py-3">
                          {att.userData?.namaLengkap || "Data tidak ditemukan"}
                        </td>
                        <td className="px-4 py-3 font-mono">
                          {att.userData?.nim || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {att.userData?.prodi || "—"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${
                              att.status === "present"
                                ? "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                                : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                            }`}
                          >
                            {att.status === "present" ? "Hadir" : "Belum Hadir"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500 dark:text-slate-400">
                          {att.createdAt
                            ? new Date(att.createdAt).toLocaleString("id-ID")
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-4 text-sm text-slate-600 dark:text-slate-400">
                  Menampilkan: {filteredAttendances.length} dari{" "}
                  {attendances.length} data | Hadir:{" "}
                  {
                    filteredAttendances.filter((a) => a.status === "present")
                      .length
                  }{" "}
                  | Belum:{" "}
                  {
                    filteredAttendances.filter((a) => a.status !== "present")
                      .length
                  }
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sonner container */}
      <Toaster richColors position="top-right" />
    </>
  );
}
