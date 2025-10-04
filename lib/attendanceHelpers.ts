// lib/attendanceHelpers.ts
import { collection, getDocs, query, doc, getDoc, DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { AttendanceStatus } from "@/types/attendance";
import { CaangRegistration } from "@/types/caang";
import { AttendanceWithUser } from "@/components/Attendance/AttendanceTable";

interface FirebaseAttendanceData extends DocumentData {
  activityId: string;
  userId: string;
  tokenId: string;
  status: AttendanceStatus;
  checkInTime: Date | { seconds: number; nanoseconds: number };
  checkInBy: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  createdAt: Date | { seconds: number; nanoseconds: number };
}

interface FirebaseUserData extends DocumentData {
  namaLengkap: string;
  nim: string;
  prodi: string;
  email?: string;
  noHp?: string;
  angkatan?: string;
}

interface Activity {
  id: string;
  name: string;
}

/**
 * Helper untuk convert Firestore Timestamp ke Date
 */
const convertFirestoreDate = (date: Date | { seconds: number; nanoseconds: number } | undefined): Date | undefined => {
  if (!date) return undefined;
  
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'object' && 'seconds' in date) {
    return new Date(date.seconds * 1000);
  }
  
  return undefined;
};

/**
 * Fetch all attendances dengan user data
 */
export async function fetchAllAttendances(): Promise<AttendanceWithUser[]> {
  try {
    const q = query(collection(db, "attendance"));
    const snapshot = await getDocs(q);

    const attendanceData: Array<{ id: string; data: FirebaseAttendanceData }> = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      data: docSnap.data() as FirebaseAttendanceData
    }));

    // Fetch user data untuk setiap attendance record
    const attendancesWithUserData: AttendanceWithUser[] = await Promise.all(
      attendanceData.map(async (attendance) => {
        try {
          const userDoc = await getDoc(
            doc(db, "caang_registration", attendance.data.userId.toString())
          );

          let userData: CaangRegistration | undefined = undefined;

          if (userDoc.exists()) {
            const rawUserData = userDoc.data() as FirebaseUserData;
            userData = {
              namaLengkap: rawUserData.namaLengkap || "",
              nim: rawUserData.nim || "",
              prodi: rawUserData.prodi || "",
              email: rawUserData.email || "",
              noHp: rawUserData.noHp || "",
              angkatan: rawUserData.angkatan || ""
            } as CaangRegistration;
          } else {
            console.warn(`User data not found for userId: ${attendance.data.userId}`);
          }

          return {
            id: attendance.id,
            userId: attendance.data.userId.toString(),
            activityId: attendance.data.activityId.toString(),
            status: attendance.data.status,
            userData: userData,
            createdAt: convertFirestoreDate(attendance.data.createdAt),
            notes: attendance.data.notes
          };
        } catch (error) {
          console.error(`Error fetching user data for ${attendance.data.userId}:`, error);
          return {
            id: attendance.id,
            userId: attendance.data.userId.toString(),
            activityId: attendance.data.activityId.toString(),
            status: attendance.data.status,
            userData: undefined,
            createdAt: convertFirestoreDate(attendance.data.createdAt),
            notes: attendance.data.notes
          };
        }
      })
    );

    return attendancesWithUserData;
  } catch (error) {
    console.error("Error fetching attendances:", error);
    throw error;
  }
}

/**
 * Fetch all users dan merge dengan attendance data untuk deteksi alpha
 */
export async function fetchAttendancesWithAlpha(
  activityId?: string
): Promise<AttendanceWithUser[]> {
  try {
    // Fetch all users
    const usersSnapshot = await getDocs(collection(db, "caang_registration"));
    const allUsers: Array<{ id: string; data: CaangRegistration }> = usersSnapshot.docs.map((doc) => {
      const data = doc.data() as FirebaseUserData;
      return {
        id: doc.id,
        data: {
          namaLengkap: data.namaLengkap || "",
          nim: data.nim || "",
          prodi: data.prodi || "",
          email: data.email || "",
          noHp: data.noHp || "",
          angkatan: data.angkatan || ""
        } as CaangRegistration
      };
    });

    // Fetch all attendances
    const attendancesSnapshot = await getDocs(collection(db, "attendance"));
    const attendancesMap = new Map<string, { id: string; data: FirebaseAttendanceData }>();

    attendancesSnapshot.docs.forEach((doc) => {
      const data = doc.data() as FirebaseAttendanceData;
      const key = `${data.userId}_${data.activityId}`;
      attendancesMap.set(key, {
        id: doc.id,
        data: data
      });
    });

    // Merge data
    const result: AttendanceWithUser[] = [];

    for (const user of allUsers) {
      // Jika activityId spesifik, hanya proses untuk activity tersebut
      if (activityId) {
        const key = `${user.id}_${activityId}`;
        const attendance = attendancesMap.get(key);

        if (attendance) {
          // User memiliki record attendance
          result.push({
            id: attendance.id,
            userId: user.id,
            activityId: activityId,
            status: attendance.data.status,
            userData: user.data,
            createdAt: convertFirestoreDate(attendance.data.createdAt),
            notes: attendance.data.notes
          });
        } else {
          // User tidak memiliki record (alpha)
          result.push({
            id: `alpha_${user.id}_${activityId}`,
            userId: user.id,
            activityId: activityId,
            status: "alpha",
            userData: user.data,
            createdAt: undefined,
            notes: undefined
          });
        }
      } else {
        // Jika tidak ada activityId spesifik, ambil semua attendance user
        const userAttendances = Array.from(attendancesMap.values()).filter(
          (att) => att.data.userId.toString() === user.id
        );

        if (userAttendances.length > 0) {
          // User punya attendance records
          userAttendances.forEach((att) => {
            result.push({
              id: att.id,
              userId: user.id,
              activityId: att.data.activityId.toString(),
              status: att.data.status,
              userData: user.data,
              createdAt: convertFirestoreDate(att.data.createdAt),
              notes: att.data.notes
            });
          });
        }
        // Jika user tidak punya attendance sama sekali, kita skip
        // karena tanpa activityId spesifik, kita tidak tahu mana yang alpha
      }
    }

    return result;
  } catch (error) {
    console.error("Error fetching attendances with alpha:", error);
    throw error;
  }
}

/**
 * Fetch list of activities
 */
export async function fetchActivities(): Promise<Activity[]> {
  try {
    const q = query(collection(db, "activities"));
    const snapshot = await getDocs(q);

    const activitiesData: Activity[] = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as DocumentData;
      return {
        id: docSnap.id,
        name: (data.name || data.title || docSnap.id) as string,
      };
    });

    return activitiesData;
  } catch (error) {
    console.error("Error fetching activities:", error);
    throw error;
  }
}