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
