import { Timestamp } from "firebase/firestore";

export interface Material {
  id: string;
  activityId?: string;
  orPeriod: string;

  // Info
  title: string;
  description?: string;

  // File
  fileUrl: string;
  fileName: string;
  fileSize: number; // Bytes
  fileType: string; // MIME type

  // Access Control
  isPublic: boolean;
  requiredActivityId?: string;

  // Statistics
  downloadCount: number;
  openCount: number;

  // Metadata
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
}