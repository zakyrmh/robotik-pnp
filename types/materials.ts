import { OrPhase, TrainingCategory } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Material {
  id: string;
  activityId?: string; // Bisa linked ke activity atau standalone
  orPeriod: string;
  phase: OrPhase;
  
  // Info
  title: string;
  description?: string;
  category: TrainingCategory;
  
  // File
  fileUrl: string;
  fileName: string;
  fileSize: number; // Bytes
  fileType: string; // MIME type
  
  // Access Control
  isPublic: boolean; // Bisa diakses semua atau hanya yang sudah attend activity
  requiredActivityId?: string; // Harus attend activity ini dulu
  
  // Statistics
  downloadCount: number;
  
  // Metadata
  uploadedBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp | null;
  deletedBy?: string | null;
}