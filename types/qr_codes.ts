import { Timestamp } from "firebase/firestore";

export interface QRCode {
  id: string; // Random unique ID
  userId: string; // CAANG yang generate
  activityId: string;
  
  // QR Data
  hash: string; // SHA-256 hash untuk security
  data: string; // Encrypted data: {userId}_{activityId}_{timestamp}
  
  // Validity
  expiresAt: Timestamp; // Valid untuk 5 menit
  isUsed: boolean;
  usedAt?: Timestamp;
  scannedBy?: string; // Admin yang scan
  
  // Attendance Reference
  attendanceId?: string;
  
  // Metadata
  createdAt: Timestamp;
}