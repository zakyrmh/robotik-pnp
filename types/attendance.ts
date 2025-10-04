// types/attendance.ts
export type AttendanceStatus = "present" | "late" | "permission" | "sick" | "invalid";

export interface Attendances {
  _id: string;
  activityId: string;
  userId: string;
  tokenId: string;
  status: AttendanceStatus;
  checkInTime: Date;
  checkInBy: string;
  checkInLocation?: {
    latitude: number;
    longitude: number;
  };
  notes?: string;
  createdAt: Date;
}

// Helper untuk display status dalam Bahasa Indonesia
export const getStatusLabel = (status: AttendanceStatus): string => {
  const labels: Record<AttendanceStatus, string> = {
    present: "Hadir",
    late: "Telat",
    permission: "Izin",
    sick: "Sakit",
    invalid: "Tidak Valid"
  };
  return labels[status] || status;
};

// Helper untuk status color
export const getStatusColor = (status: AttendanceStatus | "alpha"): string => {
  const colors: Record<AttendanceStatus | "alpha", string> = {
    present: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
    late: "bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400",
    permission: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
    sick: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
    invalid: "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400",
    alpha: "bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400"
  };
  return colors[status] || colors.invalid;
};