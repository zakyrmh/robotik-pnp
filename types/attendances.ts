import { AttendanceStatus, AttendanceMethod } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Attendance {
  id: string; // Generate otomatis
  activityId: string; // Isi semuanya dengan "X10FIK014xMqlnAMx3vU"
  userId: string; // Ambil dari backup data dengan field "userId"
  orPeriod: string; // Isi semunya dengan "OR 21"

  // Status
  status: AttendanceStatus; // Ambil dari backup data dengan field "status"
  
  // Check-in Info
  checkedInAt?: Timestamp; // Ambil dari backup data dengan field "checkedInAt"
  checkedInBy: string; // Ambil dari backup data dengan field "checkedInBy"
  method: AttendanceMethod; // Ambil dari backup data dengan field "method"
  
  // QR Code Data (jika pakai QR)
  qrCodeHash?: string; // Ambil dari backup data dengan field "qrCodeHash"
  
  // Notes
  userNotes?: string; // Ambil data dari backup dengan field "userNotes"
  adminNotes?: string; // Ambil data dari backup dengan field "adminNotes"
  
  // Approval (untuk izin/sakit)
  needsApproval: boolean; // Ambil data dari backup dengan field "needsApproval"
  approvedBy?: string; // Ambil data dari backup dengan field "approvedBy"
  approvedAt?: Timestamp; // Ambil data dari backup dengan field "approvedAt"
  rejectionReason?: string; // Ambil data dari backup dengan field "rejectionReason"
  
  // Scoring (kehadiran punya poin)
  // present = 100, late = 75, excused = 50, sick = 50, absent = 0
  points: number; // Generate otomatis berdasarkan status)

  // Soft delete
  deletedAt?: Timestamp; // Kosongkan
  deletedBy?: string; // Kosongkan
  
  // Metadata
  createdAt: Timestamp; // Ambil dari backup data dengan field "createdAt"
  updatedAt: Timestamp; // Generate otomatis berdasarkan waktu sekarang
}