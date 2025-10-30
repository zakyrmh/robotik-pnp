import { Timestamp } from "firebase/firestore";

export interface Group {
  id: string;
  taskId: string;
  orPeriod: string;
  
  // Group Info
  name: string;
  description?: string;
  
  // Members
  memberIds: string[]; // User IDs
  memberNames: string[]; // Untuk display
  leaderId: string; // Ketua kelompok
  
  // Submission
  submissionId?: string; // Reference ke submissions
  
  // Status
  isComplete: boolean; // Apakah anggota sudah lengkap
  isActive: boolean;
  
  // Metadata
  createdBy: string; // User yang buat grup atau admin
  createdAt: Timestamp;
  updatedAt: Timestamp;
}