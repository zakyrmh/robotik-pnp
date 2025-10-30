import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Attendance {
  id: string; // {activityId}_{userId}
  activityId: string;
  userId: string;
  orPeriod: string;
  
  // Status
  status: AttendanceStatus;
  
  // Check-in Info
  checkedInAt?: Timestamp;
  checkedInBy: string; // Admin yang scan/input atau userId sendiri
  method: AttendanceMethod;
  
  // QR Code Data (jika pakai QR)
  qrCodeHash?: string; // Hash dari QR yang di-generate CAANG
  qrCodeScannedBy?: string; // Admin yang scan
  
  // Location
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  
  // Notes
  userNotes?: string; // Keterangan dari user (untuk izin/sakit)
  adminNotes?: string; // Catatan dari admin
  
  // Approval (untuk izin/sakit)
  needsApproval: boolean;
  approvedBy?: string; // Admin user ID
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  // Scoring (kehadiran punya poin)
  points: number; // Present: 100, Late: 75, Excused: 50, Sick: 50, Absent: 0
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}