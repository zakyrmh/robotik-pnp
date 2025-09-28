"use client";

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  RefreshCw,
  User,
  Share2,
  Loader2,
  QrCode,
} from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { useAuth } from "@/hooks/useAuth";
import { Activity } from "@/types/activity";
import { useParams, useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { CaangRegistration, UserAccount, UserWithCaang } from "@/types/caang";
import ActivityInfoCard from "@/components/Activity/ActivityInfoCard";
import Image from "next/image";
import { onAuthStateChanged } from "firebase/auth";

// Add the Attendance types
export type AttendanceStatus = "present" | "late" | "invalid";

export interface Attendance {
  uid: string;
  userId: string;
  activityId: string;
  timestamp: Date;
  status: AttendanceStatus;
  verifiedBy?: string;
  updatedAt?: Date;
}

interface QRData {
  userId: string;
  activityId: string;
  timestamp: string;
  hash: string;
}

export default function ActivityDetailPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const { user } = useAuth();
  const [currentUserData, setCurrentUserData] = useState<UserWithCaang | null>(
    null
  );
  const [userDataLoading, setUserDataLoading] = useState(true);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  // Add attendance state
  const [attendanceRecord, setAttendanceRecord] = useState<Attendance | null>(null);
  const [attendanceLoading, setAttendanceLoading] = useState(false);

  const params = useParams();
  const slug = params?.slug as string;

  const [qrData, setQrData] = useState<QRData | null>(null);
  const [attendanceStatus, setAttendanceStatus] = useState<
    "none" | "pending" | "confirmed" | "failed"
  >("none");
  const [showQR, setShowQR] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Function to check attendance status
  const checkAttendanceStatus = async (userId: string, activityId: string) => {
    try {
      setAttendanceLoading(true);
      const attendanceQuery = query(
        collection(db, "attendance"),
        where("userId", "==", userId),
        where("activityId", "==", activityId)
      );
      
      const attendanceSnapshot = await getDocs(attendanceQuery);
      
      if (!attendanceSnapshot.empty) {
        const attendanceDoc = attendanceSnapshot.docs[0];
        const attendanceData = attendanceDoc.data();
        
        // Convert timestamp to Date if it's a Firestore Timestamp
        const timestamp = attendanceData.timestamp instanceof Timestamp 
          ? attendanceData.timestamp.toDate() 
          : attendanceData.timestamp;
          
        const updatedAt = attendanceData.updatedAt instanceof Timestamp 
          ? attendanceData.updatedAt.toDate() 
          : attendanceData.updatedAt;

        const attendance: Attendance = {
          uid: attendanceDoc.id,
          userId: attendanceData.userId,
          activityId: attendanceData.activityId,
          timestamp: timestamp,
          status: attendanceData.status,
          verifiedBy: attendanceData.verifiedBy,
          updatedAt: updatedAt,
        };
        
        setAttendanceRecord(attendance);
        setAttendanceStatus("confirmed");
        
        // Hide QR if it's still showing
        if (showQR) {
          setShowQR(false);
          setQrData(null);
          setCountdown(0);
        }
        
        return true; // Return true if attendance found
      } else {
        setAttendanceRecord(null);
        // Only set to "none" if not currently pending
        if (attendanceStatus !== "pending") {
          setAttendanceStatus("none");
        }
        return false; // Return false if no attendance found
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      return false;
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Auto-refresh attendance status when QR is pending
  useEffect(() => {
    if (attendanceStatus === "pending" && user?.uid && activity?.uid) {
      const pollInterval = setInterval(async () => {
        const hasAttendance = await checkAttendanceStatus(user.uid, activity.uid);
        if (hasAttendance) {
          // Clear the interval when attendance is found
          clearInterval(pollInterval);
        }
      }, 3000); // Check every 3 seconds

      // Cleanup interval
      return () => clearInterval(pollInterval);
    }
  }, [attendanceStatus, user?.uid, activity?.uid]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user?.uid) return;

      try {
        setUserDataLoading(true);

        // Fetch user account data
        const userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        // Fetch caang registration data
        const registrationDoc = await getDoc(
          doc(db, "caang_registration", user.uid)
        );
        const activitiesRef = collection(db, "activities");
        const q = query(activitiesRef, where("slug", "==", slug));
        const querySnapshot = await getDocs(q);

        const userData: UserWithCaang = {
          user: userDoc.exists() ? (userDoc.data() as UserAccount) : undefined,
          registration: registrationDoc.exists()
            ? (registrationDoc.data() as CaangRegistration)
            : undefined,
        };

        let activityData: Activity | null = null;
        if (!querySnapshot.empty) {
          const docSnap = querySnapshot.docs[0];
          const data = docSnap.data() as Activity;

          const rawDate = data.date;
          const dateValue =
            rawDate instanceof Timestamp ? rawDate.toDate() : (rawDate as Date);

          activityData = {
            ...data,
            uid: docSnap.id,
            date: dateValue,
            icon: null,
          };
          
          // Check attendance status for this activity
          await checkAttendanceStatus(user.uid, docSnap.id);
        }

        setCurrentUserData(userData);
        setActivity(activityData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setFetchError("Gagal memuat data");
      } finally {
        setUserDataLoading(false);
      }
    };

    fetchData();
  }, [slug, user]);

  const generateQRCode = async () => {
    if (!user?.uid || !activity?.uid) return;

    try {
      setUserDataLoading(true);

      const res = await fetch("/api/sign-qr", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, activityId: activity.uid }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Sign QR error:", data);
        alert("Gagal membuat QR. Coba lagi.");
        return;
      }

      const payload = data.payload as {
        userId: string;
        activityId: string;
        timestamp: string;
        signature: string;
      };

      const qrData: QRData = {
        userId: payload.userId,
        activityId: payload.activityId,
        timestamp: payload.timestamp,
        hash: payload.signature,
      };

      setQrData(qrData);
      setShowQR(true);
      setAttendanceStatus("pending");
      setCountdown(300);
    } catch (err) {
      console.error(err);
      alert("Terjadi kesalahan saat generate QR");
    } finally {
      setUserDataLoading(false);
    }
  };

  // Countdown effect
  useEffect(() => {
    if (countdown > 0 && showQR) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && showQR && attendanceStatus === "pending") {
      setShowQR(false);
      setAttendanceStatus("failed");
      setQrData(null);
    }
  }, [countdown, showQR, attendanceStatus]);

  // Format countdown
  const formatCountdown = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  };

  const canTakeAttendance = (): boolean => {
    if (!activity || attendanceRecord) {
      return false;
    }
    const now = new Date();
    const activityDate = activity.date;
    const timeDiff = (now.getTime() - activityDate.getTime()) / (1000 * 60);
    return timeDiff >= -30 && timeDiff <= 60 && activity.status !== "completed";
  };

  const shareActivity = () => {
    if (navigator.share) {
      navigator.share({
        title: activity?.title,
        text: activity?.subtitle,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Link telah disalin ke clipboard!");
    }
  };

  const getStatusColor = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "text-green-600 dark:text-green-400";
      case "late":
        return "text-yellow-600 dark:text-yellow-400";
      case "invalid":
        return "text-red-600 dark:text-red-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  const getStatusText = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return "Hadir";
      case "late":
        return "Terlambat";
      case "invalid":
        return "Tidak Valid";
      default:
        return "Tidak Diketahui";
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });
  };

  // Helper function to determine what to show
  const getAttendanceDisplayState = () => {
    // If user has attendance record, always show "already attended"
    if (attendanceRecord) {
      return "already_attended";
    }
    
    // If QR is showing, show QR
    if (showQR) {
      return "showing_qr";
    }
    
    // Based on attendance status
    switch (attendanceStatus) {
      case "confirmed":
        return "confirmed_waiting_refresh";
      case "failed":
        return "failed";
      case "pending":
        return "pending_no_qr"; // This shouldn't happen, but just in case
      default:
        return "initial";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen -mt-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">Memuat dashboard...</span>
      </div>
    );
  }

  if (userDataLoading || attendanceLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-8 h-8 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">Error loading data</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <User className="w-8 h-8 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">
            Silakan login terlebih dahulu
          </p>
        </div>
      </div>
    );
  }

  const displayState = getAttendanceDisplayState();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-4 py-4 lg:px-8">
        <div className="max-w-4xl mx-auto flex items-center space-x-4">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Detail Aktivitas
            </h1>
          </div>
          <button
            onClick={shareActivity}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Share2 className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 lg:p-8 space-y-6">
        {/* Activity Info Card */}
        <ActivityInfoCard />

        {/* Attendance Card */}
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
            <QrCode className="w-5 h-5 mr-2" />
            Absensi Kehadiran
          </h3>

          {/* Show attendance record if exists - this should be the primary condition */}
          {displayState === "already_attended" && attendanceRecord && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
              <div className="flex items-start space-x-3">
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                    Anda Sudah Terabsensi!
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-green-600 dark:text-green-300 font-medium">Status:</span>
                      <span className={`ml-2 font-semibold ${getStatusColor(attendanceRecord.status)}`}>
                        {getStatusText(attendanceRecord.status)}
                      </span>
                    </div>
                    <div>
                      <span className="text-green-600 dark:text-green-300 font-medium">Waktu:</span>
                      <span className="ml-2 text-green-700 dark:text-green-200">
                        {formatDate(attendanceRecord.timestamp)}
                      </span>
                    </div>
                    {attendanceRecord.verifiedBy && (
                      <div className="sm:col-span-2">
                        <span className="text-green-600 dark:text-green-300 font-medium">Diverifikasi oleh:</span>
                        <span className="ml-2 text-green-700 dark:text-green-200">
                          {attendanceRecord.verifiedBy}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* QR Code Display */}
          {displayState === "showing_qr" && (
            <div className="text-center">
              <div className="mb-6">
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                  Tunjukkan QR code ini kepada petugas untuk diabsen
                </p>
                <div className="text-2xl font-mono font-bold text-red-500 mb-4">
                  {formatCountdown(countdown)}
                </div>
              </div>

              <div className="flex justify-center mb-6">
                {qrData && (
                  <div className="relative inline-block">
                    <QRCode
                      value={JSON.stringify(qrData)}
                      size={256}
                      bgColor="#ffffff"
                      fgColor="#000000"
                      className="p-2 bg-white rounded-lg"
                    />
                    <Image
                      src="/images/logo.png"
                      alt="Logo"
                      className="absolute inset-0 w-16 h-16 m-auto rounded-full bg-white p-1"
                      width={64}
                      height={64}
                    />
                  </div>
                )}
              </div>

              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Nama</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {currentUserData?.registration?.namaLengkap ||
                        currentUserData?.user?.name ||
                        "Tidak tersedia"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">NIM</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {currentUserData?.registration?.nim || "Tidak tersedia"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">Prodi</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                      {currentUserData?.registration?.prodi || "Tidak tersedia"}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 dark:text-slate-400">ID</p>
                    <p className="font-medium text-slate-900 dark:text-slate-100 font-mono">
                      {qrData?.hash}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600">
                  <div className="grid grid-cols-1 gap-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        No. HP:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {currentUserData?.registration?.noHp ||
                          "Tidak tersedia"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">
                        Jurusan:
                      </span>
                      <span className="text-slate-700 dark:text-slate-300">
                        {currentUserData?.registration?.jurusan ||
                          "Tidak tersedia"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowQR(false);
                    setAttendanceStatus("none");
                    setQrData(null);
                    setCountdown(0);
                  }}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>Batalkan</span>
                </button>
              </div>
            </div>
          )}

          {/* Other states */}
          {!attendanceRecord && !showQR && (
            <div className="text-center py-8">
              {displayState === "initial" && (
                <>
                  <QrCode className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    {canTakeAttendance()
                      ? "Klik tombol di bawah untuk generate QR code absensi"
                      : "Absensi hanya dapat dilakukan 30 menit sebelum hingga 60 menit setelah aktivitas dimulai"}
                  </p>
                  <button
                    onClick={generateQRCode}
                    disabled={!canTakeAttendance()}
                    className={`inline-flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                      canTakeAttendance()
                        ? "bg-blue-600 hover:bg-blue-700 text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed"
                    }`}
                  >
                    <QrCode className="w-5 h-5" />
                    <span>Generate QR Absensi</span>
                  </button>
                </>
              )}

              {displayState === "confirmed_waiting_refresh" && (
                <>
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <p className="text-green-600 dark:text-green-400 font-medium mb-2">
                    Absensi Berhasil!
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    Kehadiran Anda telah tercatat pada sistem
                  </p>
                  <button
                    onClick={() => {
                      if (user?.uid && activity?.uid) {
                        checkAttendanceStatus(user.uid, activity.uid);
                      }
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Refresh Status</span>
                  </button>
                </>
              )}

              {displayState === "failed" && (
                <>
                  <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                    QR Code Expired
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">
                    QR code telah kedaluwarsa. Silakan generate ulang.
                  </p>
                  <button
                    onClick={() => {
                      setAttendanceStatus("none");
                      setQrData(null);
                    }}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                  >
                    <RefreshCw className="w-4 h-4" />
                    <span>Coba Lagi</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}