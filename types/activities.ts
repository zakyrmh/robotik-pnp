import { ActivityMode, ActivityType, AttendanceMethod, OrPhase, TrainingCategory } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Activity {
  id: string;
  slug: string;
  
  // Basic Info
  title: string;
  description: string;
  type: ActivityType;
  phase: OrPhase;
  orPeriod: string;
  
  // Category (untuk training)
  category?: TrainingCategory;
  sessionNumber?: number; // Untuk training: sesi ke-1, 2, 3, dst
  totalSessions?: number; // Total sesi training
  
  // Schedule
  scheduledDate: Timestamp;
  endDate?: Timestamp;
  duration?: number; // Menit
  
  // Mode & Location
  mode: ActivityMode;
  location?: string;
  onlineLink?: string;
  
  // PIC & Mentors
  picId: string; // Admin user ID
  picName: string;
  mentorIds?: string[];
  mentorNames?: string[];
  
  // Attendance
  attendanceEnabled: boolean;
  attendanceMethod: AttendanceMethod;
  attendanceOpenTime?: Timestamp; // 1 jam sebelum
  attendanceCloseTime?: Timestamp; // 1 jam setelah endDate
  lateTolerance?: number; // Toleransi keterlambatan dalam menit
  
  // Related Data
  materialsUrls?: string[]; // Link materi download
  hasTask: boolean;
  taskIds?: string[]; // Reference ke tasks
  
  // Prerequisites
  requiredPhases?: OrPhase[]; // Fase yang harus lulus dulu
  
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