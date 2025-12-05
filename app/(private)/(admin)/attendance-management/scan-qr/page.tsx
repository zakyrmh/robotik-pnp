"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scanner } from "@yudiel/react-qr-scanner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ScanQrCode,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowLeft,
  Loader2,
  User,
  Calendar,
  Clock,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { getActivities } from "@/lib/firebase/activities";
import { getUserById } from "@/lib/firebase/users";
import { getAttendanceByCompositeId } from "@/lib/firebase/attendances";
import { Activity } from "@/types/activities";
// Update Import Type
import { User as UserType } from "@/types/users"; 
import { Attendance } from "@/types/attendances";
import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app, db } from "@/lib/firebaseConfig";
import { doc, setDoc, Timestamp } from "firebase/firestore";
import { generateSHA256Hash, calculatePoints } from "@/utils/cryptoUtils";
import { toast } from "sonner";

interface ScanResult {
  type: "success" | "error";
  message: string;
  attendance?: Attendance;
  user?: UserType;
}

export default function ScanQRPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  
  // Ganti currentUserRole string menjadi status permission boolean
  const [isAuthorizedScanner, setIsAuthorizedScanner] = useState(false); 
  
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);

  // Listen to auth state and check admin/authorized roles
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUserId(user.uid);

        // Get user data to check role
        const userResponse = await getUserById(user.uid);
        
        if (userResponse.success && userResponse.data) {
          const userData = userResponse.data;
          const roles = userData.roles;

          // LOGIKA BARU: Cek permission berdasarkan roles boolean
          // Diizinkan jika: SuperAdmin, Kestari, Komdis, atau Recruiter (Panitia)
          const hasAccess = 
            roles?.isSuperAdmin || 
            roles?.isKestari || 
            roles?.isKomdis || 
            roles?.isRecruiter;

          if (hasAccess) {
            setIsAuthorizedScanner(true);
          } else {
            toast.error(
              "Akses ditolak! Anda tidak memiliki izin untuk melakukan scanning absensi."
            );
            router.push("/dashboard");
          }
        } else {
            // Jika data user tidak ketemu
            toast.error("Gagal mengambil data user.");
            router.push("/login");
        }
      } else {
        setCurrentUserId(null);
        setIsAuthorizedScanner(false);
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Load activities
  useEffect(() => {
    const loadActivities = async () => {
      setLoading(true);
      try {
        const data = await getActivities();

        // Filter only active activities with attendance enabled
        const activeActivities = data.filter(
          (activity) => activity.attendanceEnabled && activity.isActive
        );

        setActivities(activeActivities);

        // Set default to today's activity
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayActivity = activeActivities.find((activity) => {
          const activityDate = activity.startDateTime.toDate();
          activityDate.setHours(0, 0, 0, 0);
          return activityDate.getTime() === today.getTime();
        });

        if (todayActivity) {
          setSelectedActivityId(todayActivity.id);
          setSelectedActivity(todayActivity);
        } else if (activeActivities.length > 0) {
          // Default to first activity if no today's activity
          setSelectedActivityId(activeActivities[0].id);
          setSelectedActivity(activeActivities[0]);
        }
      } catch (error) {
        console.error("Error loading activities:", error);
        toast.error("Gagal memuat data aktivitas");
      } finally {
        setLoading(false);
      }
    };

    // Hanya load activity jika user sudah terotorisasi
    if (isAuthorizedScanner) {
      loadActivities();
    }
  }, [isAuthorizedScanner]);

  // Update selected activity when selection changes
  useEffect(() => {
    const activity = activities.find((a) => a.id === selectedActivityId);
    setSelectedActivity(activity || null);
  }, [selectedActivityId, activities]);

  // Validate QR Code data
  const validateQRData = async (
    encryptedData: string
  ): Promise<{
    isValid: boolean;
    userId?: string;
    activityId?: string;
    expiryTimestamp?: number;
    error?: string;
  }> => {
    try {
      // Decode base64
      const decoded = atob(encryptedData);

      // Split to get data and hash
      const parts = decoded.split("_");

      if (parts.length !== 4) {
        return { isValid: false, error: "Format QR Code tidak valid" };
      }

      const [userId, activityId, expiryTimestamp, hash] = parts;

      // Validate hash
      const rawData = `${userId}_${activityId}_${expiryTimestamp}`;
      const calculatedHash = await generateSHA256Hash(rawData);

      if (calculatedHash !== hash) {
        return {
          isValid: false,
          error: "QR Code tidak valid atau telah dimodifikasi",
        };
      }

      // Check expiry
      const now = Date.now();
      const expiry = parseInt(expiryTimestamp);

      if (now > expiry) {
        return { isValid: false, error: "QR Code sudah expired" };
      }

      return {
        isValid: true,
        userId,
        activityId,
        expiryTimestamp: expiry,
      };
    } catch (error) {
      console.error("Error validating QR data:", error);
      return { isValid: false, error: "Gagal memvalidasi QR Code" };
    }
  };

  // Determine attendance status based on time
  const determineAttendanceStatus = (activity: Activity): AttendanceStatus => {
    const now = new Date();
    const openTime = activity.attendanceOpenTime?.toDate();
    const closeTime = activity.attendanceCloseTime?.toDate();
    const lateTolerance = activity.lateTolerance || 0; // in minutes

    if (!openTime || !closeTime) {
      return AttendanceStatus.PRESENT;
    }

    // Calculate late threshold
    const lateThreshold = new Date(
      closeTime.getTime() + lateTolerance * 60 * 1000
    );

    // If before open time, can't scan yet
    if (now < openTime) {
      return AttendanceStatus.PRESENT; // Shouldn't reach here, but default to present
    }

    // If within attendance window (openTime to closeTime), mark as present
    if (now >= openTime && now <= closeTime) {
      return AttendanceStatus.PRESENT;
    }

    // If after close time but within late tolerance, mark as late
    if (now > closeTime && now <= lateThreshold) {
      return AttendanceStatus.LATE;
    }

    // If beyond late tolerance, still mark as late (admin can override)
    return AttendanceStatus.LATE;
  };

  // Handle QR scan
  const handleScan = async (result: string) => {
    if (processing || !selectedActivity || !currentUserId) return;

    setProcessing(true);
    setScanning(false);

    try {
      // Validate QR data
      const validation = await validateQRData(result);

      if (!validation.isValid) {
        setScanResult({
          type: "error",
          message: validation.error || "QR Code tidak valid",
        });

        // Clear result after 5 seconds
        setTimeout(() => {
          setScanResult(null);
          setScanning(true);
        }, 5000);

        setProcessing(false);
        return;
      }

      const { userId, activityId } = validation;

      // Check if activity matches selected activity
      if (activityId !== selectedActivity.id) {
        setScanResult({
          type: "error",
          message: "QR Code tidak sesuai dengan aktivitas yang dipilih",
        });

        setTimeout(() => {
          setScanResult(null);
          setScanning(true);
        }, 5000);

        setProcessing(false);
        return;
      }

      // Check if attendance already exists
      const existingAttendance = await getAttendanceByCompositeId(
        activityId!,
        userId!
      );

      if (existingAttendance) {
        setScanResult({
          type: "error",
          message:
            "QR Code sudah pernah di-scan. User telah melakukan absensi.",
        });

        setTimeout(() => {
          setScanResult(null);
          setScanning(true);
        }, 5000);

        setProcessing(false);
        return;
      }

      // Get user data
      const userResponse = await getUserById(userId!);

      if (!userResponse.success || !userResponse.data) {
        setScanResult({
          type: "error",
          message: "User tidak ditemukan",
        });

        setTimeout(() => {
          setScanResult(null);
          setScanning(true);
        }, 5000);

        setProcessing(false);
        return;
      }

      const user = userResponse.data;

      // Determine status
      const status = determineAttendanceStatus(selectedActivity);
      const points = calculatePoints(status);

      // Create attendance record
      const attendanceId = `${activityId}_${userId}`;
      const newAttendance: Omit<Attendance, "id"> = {
        activityId: activityId!,
        userId: userId!,
        orPeriod: selectedActivity.orPeriod,
        status,
        checkedInAt: Timestamp.now(),
        checkedInBy: currentUserId,
        method: AttendanceMethod.QR_CODE,
        qrCodeHash: validation.expiryTimestamp?.toString(),
        needsApproval: false,
        points,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      // Save to Firestore
      await setDoc(doc(db, "attendances", attendanceId), newAttendance);

      // Success result
      setScanResult({
        type: "success",
        message: `Absensi berhasil! Status: ${
          status === AttendanceStatus.PRESENT ? "Hadir" : "Terlambat"
        }`,
        attendance: { id: attendanceId, ...newAttendance } as Attendance,
        user,
      });

      toast.success(
        `Absensi ${user.profile?.fullName || "User"} berhasil dicatat!`
      );

      // Clear result and resume scanning after 5 seconds
      setTimeout(() => {
        setScanResult(null);
        setScanning(true);
      }, 5000);
    } catch (error) {
      console.error("Error processing QR scan:", error);
      setScanResult({
        type: "error",
        message: "Terjadi kesalahan saat memproses QR Code",
      });

      toast.error("Gagal memproses absensi");

      setTimeout(() => {
        setScanResult(null);
        setScanning(true);
      }, 5000);
    } finally {
      setProcessing(false);
    }
  };

  // Handle scan error
  const handleError = (error: unknown) => {
    console.error("Scanner error:", error);

    // Cast the error parameter to the Error type
    if (typeof error === "object" && error !== null && "message" in error) {
      const errorAsError = error as Error;
      // Filter out common minor errors if needed
      console.error(errorAsError.message);
    }
  };

  // Render logic: Use isAuthorizedScanner instead of currentUserRole
  if (loading || !isAuthorizedScanner) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali
          </Button>

          <div className="flex items-center gap-4 mb-2">
            <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <ScanQrCode className="w-8 h-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                Scan QR Code Absensi
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Scan QR Code untuk mencatat absensi calon anggota
              </p>
            </div>
          </div>
        </motion.div>

        {/* Activity Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <Card>
            <CardHeader>
              <CardTitle>Pilih Aktivitas</CardTitle>
              <CardDescription>
                Pilih aktivitas yang akan dicatat absensinya
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={selectedActivityId}
                onValueChange={setSelectedActivityId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih aktivitas..." />
                </SelectTrigger>
                <SelectContent>
                  {activities.map((activity) => (
                    <SelectItem key={activity.id} value={activity.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{activity.title}</span>
                        <span className="text-xs text-muted-foreground">
                          {format(
                            activity.startDateTime.toDate(),
                            "dd MMM yyyy, HH:mm",
                            { locale: id }
                          )}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected Activity Info */}
              {selectedActivity && (
                <div className="mt-4 p-4 bg-muted rounded-lg space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {format(
                        selectedActivity.startDateTime.toDate(),
                        "dd MMMM yyyy",
                        { locale: id }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>
                      {format(
                        selectedActivity.startDateTime.toDate(),
                        "HH:mm",
                        { locale: id }
                      )}{" "}
                      -{" "}
                      {format(selectedActivity.endDateTime.toDate(), "HH:mm", {
                        locale: id,
                      })}
                    </span>
                  </div>
                  {selectedActivity.attendanceOpenTime &&
                    selectedActivity.attendanceCloseTime && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <AlertCircle className="w-4 h-4" />
                        <span>
                          Absensi:{" "}
                          {format(
                            selectedActivity.attendanceOpenTime.toDate(),
                            "HH:mm"
                          )}{" "}
                          -{" "}
                          {format(
                            selectedActivity.attendanceCloseTime.toDate(),
                            "HH:mm"
                          )}
                          {selectedActivity.lateTolerance &&
                            ` (Toleransi: ${selectedActivity.lateTolerance} menit)`}
                        </span>
                      </div>
                    )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* QR Scanner */}
        <AnimatePresence mode="wait">
          {!selectedActivity ? (
            <motion.div
              key="no-activity"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Pilih aktivitas terlebih dahulu untuk mulai scan QR Code
                </AlertDescription>
              </Alert>
            </motion.div>
          ) : scanResult ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card
                className={
                  scanResult.type === "success"
                    ? "border-green-500"
                    : "border-red-500"
                }
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {scanResult.type === "success" ? (
                      <>
                        <CheckCircle2 className="w-6 h-6 text-green-600" />
                        <span className="text-green-600">
                          Absensi Berhasil!
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-6 h-6 text-red-600" />
                        <span className="text-red-600">Gagal!</span>
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert
                    variant={
                      scanResult.type === "success" ? "default" : "destructive"
                    }
                  >
                    <AlertDescription className="text-base">
                      {scanResult.message}
                    </AlertDescription>
                  </Alert>

                  {scanResult.type === "success" &&
                    scanResult.user &&
                    scanResult.attendance && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-4 bg-muted rounded-lg">
                          <User className="w-5 h-5" />
                          <div>
                            <p className="font-semibold">
                              {scanResult.user.profile?.fullName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {scanResult.user.profile?.nim}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            Status:
                          </span>
                          <Badge
                            className={
                              scanResult.attendance.status ===
                              AttendanceStatus.PRESENT
                                ? "bg-green-500"
                                : "bg-yellow-500"
                            }
                          >
                            {scanResult.attendance.status ===
                            AttendanceStatus.PRESENT
                              ? "Hadir"
                              : "Terlambat"}
                          </Badge>
                        </div>

                        <div className="text-sm text-muted-foreground">
                          Poin: {scanResult.attendance.points}
                        </div>
                      </div>
                    )}

                  <p className="text-sm text-center text-muted-foreground">
                    Akan melanjutkan scan dalam beberapa detik...
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="scanner"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ScanQrCode className="w-5 h-5 text-blue-600" />
                    Scanner QR Code
                  </CardTitle>
                  <CardDescription>
                    Arahkan kamera ke QR Code yang ditampilkan oleh calon
                    anggota
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!scanning && !processing && (
                    <div className="text-center space-y-4">
                      <p className="text-muted-foreground">
                        Klik tombol di bawah untuk mulai scan QR Code
                      </p>
                      <Button onClick={() => setScanning(true)} size="lg">
                        <ScanQrCode className="w-5 h-5 mr-2" />
                        Mulai Scan
                      </Button>
                    </div>
                  )}

                  {scanning && (
                    <div className="space-y-4">
                      <div className="relative rounded-lg overflow-hidden">
                        <Scanner
                          onScan={(result) => {
                            if (
                              result &&
                              result.length > 0 &&
                              result[0].rawValue
                            ) {
                              handleScan(result[0].rawValue);
                            }
                          }}
                          onError={handleError}
                          constraints={{
                            facingMode: "environment",
                          }}
                          styles={{
                            container: {
                              width: "100%",
                            //   paddingTop: "75%",
                              position: "relative",
                            },
                            video: {
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            },
                          }}
                        />
                      </div>
                      <Button
                        variant="outline"
                        onClick={() => setScanning(false)}
                        className="w-full"
                      >
                        Hentikan Scan
                      </Button>
                    </div>
                  )}

                  {processing && (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4">
                      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                      <p className="text-muted-foreground">
                        Memproses QR Code...
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}