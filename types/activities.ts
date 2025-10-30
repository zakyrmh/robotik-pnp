import { ActivityMode } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Activity {
  id: string;
  slug: string;
  
  // Basic Info
  title: string;
  description: string;
  orPeriod: string;
  
  // Schedule
  startDateTime: Timestamp;
  endDateTime: Timestamp;
  
  // Mode & Location
  mode: ActivityMode;
  location?: string;
  onlineLink?: string;
  
  // Attendance
  attendanceEnabled: boolean;
  attendanceOpenTime?: Timestamp;
  attendanceCloseTime?: Timestamp;
  lateTolerance?: number; // Toleransi keterlambatan dalam menit
  
  // Statistics
  totalParticipants?: number;
  attendedCount?: number;
  absentCount?: number;
  
  // Status
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  isVisible: boolean;
  isActive: boolean;
  
  // Soft Delete
  deletedAt?: Timestamp;
  deletedBy?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}