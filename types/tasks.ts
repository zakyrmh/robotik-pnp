import { OrPhase, SubmissionType, TaskType } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Task {
  id: string;
  activityId?: string; // Optional, bisa standalone task
  orPeriod: string;
  phase: OrPhase;
  
  // Basic Info
  title: string;
  description: string;
  instructions?: string;
  type: TaskType; // Individual or Group
  
  // Deadline
  deadline: Timestamp;
  lateSubmissionAllowed: boolean;
  lateSubmissionDeadline?: Timestamp;
  latePenalty?: number; // Pengurangan poin untuk late submission (%)
  
  // Submission Settings
  submissionTypes: SubmissionType[]; // Bisa multiple
  allowedFileTypes?: string[]; // ['.pdf', '.doc', '.jpg']
  maxFileSize?: number; // Bytes
  maxFiles?: number;
  
  // Grading
  hasGrading: boolean;
  maxScore?: number; // e.g., 100
  isScorePublished: boolean; // Apakah nilai sudah di-publish
  
  // Group Settings (jika type = GROUP)
  groupSettings?: {
    minMembers: number;
    maxMembers: number;
    allowSelfFormation: boolean; // Bisa buat grup sendiri atau di-assign
  };
  
  // Materials
  materialsUrls?: string[];
  attachmentsUrls?: string[];
  
  // Statistics
  totalSubmissions?: number;
  gradedSubmissions?: number;
  averageScore?: number;
  
  // Status
  isPublished: boolean;
  isVisible: boolean;
  
  // Soft Delete
  deletedAt?: Timestamp;
  deletedBy?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}