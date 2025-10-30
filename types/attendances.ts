import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Attendance {
  id: string;
  activityId: string;
  userId: string;
  
  // Status
  status: AttendanceStatus;
  
  // Check-in Info
  checkedInAt?: Timestamp;
  checkedInBy: string;
  method: AttendanceMethod;
  
  // QR Code Data (jika pakai QR)
  qrCodeHash?: string;
  
  // Notes
  userNotes?: string; // Keterangan dari user (untuk izin/sakit)
  adminNotes?: string; // Catatan dari admin
  
  // Approval (untuk izin/sakit)
  needsApproval: boolean;
  approvedBy?: string; // Admin user ID
  approvedAt?: Timestamp;
  rejectionReason?: string;
  
  // Scoring (kehadiran punya poin)
  points: number;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}