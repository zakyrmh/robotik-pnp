import {
  collection,
  query,
  where,
  getDocs,
  orderBy,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import {
  Attendance,
  AttendanceSchema,
  AttendanceStatus,
} from "@/schemas/attendances";
import { Activity } from "@/schemas/activities";

// =========================================================
// TYPES
// =========================================================

export interface AttendanceStats {
  totalCaang: number;
  present: number;
  late: number;
  excused: number;
  sick: number;
  absent: number;
}

export interface CaangAttendanceSummary {
  userId: string;
  userName: string;
  userNim: string;
  userProdi: string;
  isBlacklisted: boolean;
  isActive: boolean;
  attendanceRecords: {
    activityId: string;
    activityTitle: string;
    status: AttendanceStatus;
  }[];
  totalActivities: number;
  presentCount: number;
  lateCount: number;
  excusedCount: number;
  sickCount: number;
  absentCount: number;
  absentPercentage: number;
}

// Attendance with user info joined
export interface AttendanceWithUser extends Attendance {
  userName?: string;
  userNim?: string;
  userProdi?: string;
}

// =========================================================
// SERVICE FUNCTIONS
// =========================================================

/**
 * Fetch attendances by activity ID
 */
export async function getAttendancesByActivity(
  activityId: string
): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, "attendances");
    const q = query(
      attendancesRef,
      where("activityId", "==", activityId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const attendances: Attendance[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const parsed = AttendanceSchema.safeParse({
        id: doc.id,
        ...data,
      });

      if (parsed.success) {
        attendances.push(parsed.data);
      } else {
        console.warn(
          `[attendance-service] Invalid attendance data for ${doc.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return attendances;
  } catch (error) {
    console.error("[attendance-service] Error fetching attendances:", error);
    throw error;
  }
}

/**
 * Fetch attendances by OR period
 */
export async function getAttendancesByOrPeriod(
  orPeriod: string
): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, "attendances");
    const q = query(
      attendancesRef,
      where("orPeriod", "==", orPeriod),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(q);
    const attendances: Attendance[] = [];

    snapshot.forEach((doc) => {
      const data = doc.data();
      const parsed = AttendanceSchema.safeParse({
        id: doc.id,
        ...data,
      });

      if (parsed.success) {
        attendances.push(parsed.data);
      } else {
        console.warn(
          `[attendance-service] Invalid attendance data for ${doc.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return attendances;
  } catch (error) {
    console.error(
      "[attendance-service] Error fetching attendances by OR:",
      error
    );
    throw error;
  }
}

/**
 * Calculate attendance statistics for an activity
 */
export function calculateAttendanceStats(
  attendances: Attendance[]
): AttendanceStats {
  const stats: AttendanceStats = {
    totalCaang: attendances.length,
    present: 0,
    late: 0,
    excused: 0,
    sick: 0,
    absent: 0,
  };

  attendances.forEach((a) => {
    switch (a.status) {
      case "present":
        stats.present++;
        break;
      case "late":
        stats.late++;
        break;
      case "excused":
        stats.excused++;
        break;
      case "sick":
        stats.sick++;
        break;
      case "absent":
        stats.absent++;
        break;
    }
  });

  return stats;
}

/**
 * Get status label in Indonesian
 */
export function getAttendanceStatusLabel(status: AttendanceStatus): string {
  const labels: Record<AttendanceStatus, string> = {
    present: "Hadir",
    late: "Terlambat",
    excused: "Izin",
    sick: "Sakit",
    absent: "Alfa",
    pending_approval: "Menunggu Persetujuan",
  };
  return labels[status];
}

/**
 * Get status short label (single character) for recap table
 */
export function getAttendanceStatusShortLabel(
  status: AttendanceStatus
): string {
  const labels: Record<AttendanceStatus, string> = {
    present: "H",
    late: "T",
    excused: "I",
    sick: "S",
    absent: "A",
    pending_approval: "P",
  };
  return labels[status];
}

/**
 * Get status color class for styling
 */
export function getAttendanceStatusColor(status: AttendanceStatus): string {
  const colors: Record<AttendanceStatus, string> = {
    present:
      "text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950/50",
    late: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/50",
    excused: "text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/50",
    sick: "text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-950/50",
    absent: "text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/50",
    pending_approval:
      "text-slate-600 bg-slate-50 dark:text-slate-400 dark:bg-slate-800",
  };
  return colors[status];
}

/**
 * Get unique OR periods from attendances
 */
export function getUniqueOrPeriods(attendances: Attendance[]): string[] {
  const periods = new Set<string>();
  attendances.forEach((a) => {
    if (a.orPeriod) {
      periods.add(a.orPeriod);
    }
  });
  return Array.from(periods).sort().reverse();
}

/**
 * Group attendances by user for summary view
 */
export function groupAttendancesByUser(
  attendances: Attendance[],
  activities: Activity[],
  usersData: Map<
    string,
    {
      name: string;
      nim: string;
      prodi: string;
      isBlacklisted: boolean;
      isActive: boolean;
    }
  >
): CaangAttendanceSummary[] {
  const userMap = new Map<string, CaangAttendanceSummary>();

  // Initialize with all users
  usersData.forEach((userData, userId) => {
    userMap.set(userId, {
      userId,
      userName: userData.name,
      userNim: userData.nim,
      userProdi: userData.prodi,
      isBlacklisted: userData.isBlacklisted,
      isActive: userData.isActive,
      attendanceRecords: [],
      totalActivities: activities.length,
      presentCount: 0,
      lateCount: 0,
      excusedCount: 0,
      sickCount: 0,
      absentCount: 0,
      absentPercentage: 0,
    });
  });

  // Populate attendance records
  attendances.forEach((attendance) => {
    const summary = userMap.get(attendance.userId);
    if (summary) {
      const activity = activities.find((a) => a.id === attendance.activityId);
      if (activity) {
        summary.attendanceRecords.push({
          activityId: attendance.activityId,
          activityTitle: activity.title,
          status: attendance.status,
        });

        switch (attendance.status) {
          case "present":
            summary.presentCount++;
            break;
          case "late":
            summary.lateCount++;
            break;
          case "excused":
            summary.excusedCount++;
            break;
          case "sick":
            summary.sickCount++;
            break;
          case "absent":
            summary.absentCount++;
            break;
        }
      }
    }
  });

  // Calculate absent percentage
  userMap.forEach((summary) => {
    if (summary.totalActivities > 0) {
      summary.absentPercentage =
        (summary.absentCount / summary.totalActivities) * 100;
    }
  });

  return Array.from(userMap.values());
}

/**
 * Format check-in time
 */
export function formatCheckInTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Format date for display
 */
export function formatAttendanceDate(date: Date): string {
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// =========================================================
// DATA FETCHING FUNCTIONS
// =========================================================

/**
 * Caang user data for attendance display
 */
export interface CaangUserData {
  id: string;
  fullName: string;
  nim: string;
  prodi: string;
  isBlacklisted: boolean;
  isActive: boolean;
}

/**
 * Fetch all caang users (users_new collection where roles.isCaang = true)
 * Note: Menggunakan ekstraksi data manual untuk menghindari validasi ketat
 * karena beberapa dokumen mungkin memiliki field null
 */
export async function getCaangUsers(): Promise<CaangUserData[]> {
  try {
    const usersRef = collection(db, "users_new");
    const q = query(
      usersRef,
      where("roles.isCaang", "==", true),
      where("isActive", "==", true)
    );

    const snapshot = await getDocs(q);
    const users: CaangUserData[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      // Ekstrak data secara manual untuk menghindari validasi ketat
      // dan handle null values dengan aman
      try {
        const profile = data.profile || {};
        const blacklistInfo = data.blacklistInfo || {};

        users.push({
          id: docSnap.id,
          fullName: profile.fullName || profile.nickname || "Unknown",
          nim: profile.nim || "-",
          prodi: profile.major || profile.department || "-",
          isBlacklisted: blacklistInfo.isBlacklisted === true,
          isActive: data.isActive !== false, // Default true jika undefined
        });
      } catch (err) {
        console.warn(
          `[attendance-service] Error extracting user data for ${docSnap.id}:`,
          err
        );
      }
    });

    return users;
  } catch (error) {
    console.error("[attendance-service] Error fetching caang users:", error);
    throw error;
  }
}

/**
 * Fetch all attendances for recruitment activities
 */
export async function getAllRecruitmentAttendances(): Promise<Attendance[]> {
  try {
    const attendancesRef = collection(db, "attendances");
    // Note: We fetch all attendances and filter by activity type in the application
    // because Firestore doesn't support joins
    const q = query(attendancesRef, orderBy("createdAt", "desc"));

    const snapshot = await getDocs(q);
    const attendances: Attendance[] = [];

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const parsed = AttendanceSchema.safeParse({
        id: docSnap.id,
        ...data,
      });

      if (parsed.success) {
        attendances.push(parsed.data);
      } else {
        console.warn(
          `[attendance-service] Invalid attendance data for ${docSnap.id}:`,
          parsed.error.flatten()
        );
      }
    });

    return attendances;
  } catch (error) {
    console.error(
      "[attendance-service] Error fetching all attendances:",
      error
    );
    throw error;
  }
}

/**
 * Join attendances with user data
 */
export function joinAttendancesWithUsers(
  attendances: Attendance[],
  users: CaangUserData[]
): AttendanceWithUser[] {
  const userMap = new Map(users.map((u) => [u.id, u]));

  return attendances.map((attendance) => {
    const user = userMap.get(attendance.userId);
    return {
      ...attendance,
      userName: user?.fullName,
      userNim: user?.nim,
      userProdi: user?.prodi,
    };
  });
}

/**
 * User attendance data for attendance list table
 * Shows ALL users with their attendance status for a specific activity
 */
export interface UserAttendanceData {
  id: string; // attendance id or generated id
  userId: string; // user id
  userName: string;
  userNim: string;
  userProdi: string;
  status: AttendanceStatus;
  hasAttendanceRecord: boolean;
  attendanceId?: string;
  checkedInAt?: Date;
  method?: string;
  userNotes?: string;
  adminNotes?: string;
}

/**
 * Get all users with their attendance status for a specific activity
 * - Shows ALL caang users
 * - If user has attendance record → use that status
 * - If user has NO attendance record → set status as "absent"
 */
export function getUsersWithAttendanceStatus(
  users: CaangUserData[],
  attendances: Attendance[],
  activityId: string
): UserAttendanceData[] {
  // Create a map of userId → attendance for the selected activity
  const attendanceMap = new Map<string, Attendance>();
  attendances
    .filter((a) => a.activityId === activityId)
    .forEach((a) => {
      attendanceMap.set(a.userId, a);
    });

  // Map all users with their attendance status
  return users.map((user) => {
    const attendance = attendanceMap.get(user.id);

    if (attendance) {
      // User has attendance record
      return {
        id: attendance.id,
        userId: user.id,
        userName: user.fullName,
        userNim: user.nim,
        userProdi: user.prodi,
        status: attendance.status,
        hasAttendanceRecord: true,
        attendanceId: attendance.id,
        checkedInAt: attendance.checkedInAt,
        method: attendance.method,
        userNotes: attendance.userNotes,
        adminNotes: attendance.adminNotes,
      };
    } else {
      // User has NO attendance record → status = absent
      return {
        id: `norecord-${user.id}`,
        userId: user.id,
        userName: user.fullName,
        userNim: user.nim,
        userProdi: user.prodi,
        status: "absent" as AttendanceStatus,
        hasAttendanceRecord: false,
      };
    }
  });
}

/**
 * Build attendance summary for recap table
 * Groups all attendance data by user and calculates statistics
 */
export function buildAttendanceSummary(
  attendances: Attendance[],
  activities: Activity[],
  users: CaangUserData[]
): CaangAttendanceSummary[] {
  // Create a map for quick activity lookup
  const activityMap = new Map(activities.map((a) => [a.id, a]));

  // Filter attendances to only include those from the activities list
  const activityIds = new Set(activities.map((a) => a.id));
  const relevantAttendances = attendances.filter((a) =>
    activityIds.has(a.activityId)
  );

  // Group attendances by userId
  const attendancesByUser = new Map<string, Attendance[]>();
  relevantAttendances.forEach((a) => {
    const existing = attendancesByUser.get(a.userId) || [];
    existing.push(a);
    attendancesByUser.set(a.userId, existing);
  });

  // Build summary for each user
  const summaries: CaangAttendanceSummary[] = users.map((user) => {
    const userAttendances = attendancesByUser.get(user.id) || [];

    // Build attendance records with activity info
    const attendanceRecords = userAttendances.map((a) => {
      const activity = activityMap.get(a.activityId);
      return {
        activityId: a.activityId,
        activityTitle: activity?.title || "Unknown Activity",
        status: a.status,
      };
    });

    // Count by status
    let presentCount = 0;
    let lateCount = 0;
    let excusedCount = 0;
    let sickCount = 0;
    let absentCount = 0;

    userAttendances.forEach((a) => {
      switch (a.status) {
        case "present":
          presentCount++;
          break;
        case "late":
          lateCount++;
          break;
        case "excused":
          excusedCount++;
          break;
        case "sick":
          sickCount++;
          break;
        case "absent":
          absentCount++;
          break;
      }
    });

    // For users without attendance records in some activities, count as absent
    const recordedActivities = new Set(
      userAttendances.map((a) => a.activityId)
    );
    activities.forEach((activity) => {
      if (!recordedActivities.has(activity.id)) {
        absentCount++;
        attendanceRecords.push({
          activityId: activity.id,
          activityTitle: activity.title,
          status: "absent",
        });
      }
    });

    // Calculate absent percentage
    const totalActivities = activities.length;
    const absentPercentage =
      totalActivities > 0 ? (absentCount / totalActivities) * 100 : 0;

    return {
      userId: user.id,
      userName: user.fullName,
      userNim: user.nim,
      userProdi: user.prodi,
      isBlacklisted: user.isBlacklisted,
      isActive: user.isActive,
      attendanceRecords,
      totalActivities,
      presentCount,
      lateCount,
      excusedCount,
      sickCount,
      absentCount,
      absentPercentage,
    };
  });

  // Sort by absent percentage descending (worst first)
  return summaries.sort((a, b) => b.absentPercentage - a.absentPercentage);
}

// =========================================================
// CRUD OPERATIONS
// =========================================================

/**
 * Calculate points based on status
 */
export function getPointsFromStatus(status: AttendanceStatus): number {
  switch (status) {
    case "present":
      return 100;
    case "late":
      return 75;
    case "excused":
      return 50;
    case "sick":
      return 50;
    case "absent":
      return 0;
    case "pending_approval":
      return 0;
    default:
      return 0;
  }
}

/**
 * Create a new attendance record
 */
export async function createAttendance(
  data: Omit<Attendance, "id" | "createdAt" | "updatedAt" | "points">
): Promise<string> {
  try {
    const attendancesRef = collection(db, "attendances");
    const points = getPointsFromStatus(data.status);

    const docRef = await addDoc(attendancesRef, {
      ...data,
      points,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return docRef.id;
  } catch (error) {
    console.error("[attendance-service] Error creating attendance:", error);
    throw error;
  }
}

/**
 * Update an existing attendance record
 */
export async function updateAttendance(
  id: string,
  data: Partial<Omit<Attendance, "id" | "createdAt" | "updatedAt">>
): Promise<void> {
  try {
    const docRef = doc(db, "attendances", id);
    const updates: {
      [K in keyof typeof data]?: (typeof data)[K];
    } & {
      updatedAt: ReturnType<typeof serverTimestamp>;
      points?: number;
    } = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Recalculate points if status is updated
    if (data.status) {
      updates.points = getPointsFromStatus(data.status);
    }

    await updateDoc(docRef, updates);
  } catch (error) {
    console.error(
      `[attendance-service] Error updating attendance ${id}:`,
      error
    );
    throw error;
  }
}

/**
 * Delete (soft delete) an attendance record
 */
export async function deleteAttendance(
  id: string,
  deletedBy: string
): Promise<void> {
  try {
    const docRef = doc(db, "attendances", id);
    // Soft delete
    await updateDoc(docRef, {
      deletedAt: serverTimestamp(),
      deletedBy,
    });
  } catch (error) {
    console.error(
      `[attendance-service] Error deleting attendance ${id}:`,
      error
    );
    throw error;
  }
}
