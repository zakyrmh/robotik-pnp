import { SubmissionType, TaskStatus } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Submission {
  id: string; // {taskId}_{userId} atau {taskId}_{groupId}
  taskId: string;
  userId?: string; // Untuk individual
  groupId?: string; // Untuk group
  orPeriod: string;
  
  // Submission Data
  submissionType: SubmissionType;
  
  // File uploads
  filesUrls?: string[];
  fileNames?: string[];
  fileSizes?: number[];
  
  // Link submission
  link?: string;
  
  // Text submission
  text?: string;
  
  // Status
  status: TaskStatus;
  isLate: boolean;
  
  // Revision
  revisionCount: number;
  revisionHistory?: RevisionHistory[];
  
  // Timestamps
  submittedAt: Timestamp;
  resubmittedAt?: Timestamp;
  
  // Grading
  grade?: GradeData;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface RevisionHistory {
  revisionNumber: number;
  submittedAt: Timestamp;
  filesUrls?: string[];
  link?: string;
  text?: string;
  notes?: string;
}

export interface GradeData {
  score: number;
  maxScore: number;
  feedback?: string;
  
  // Grader Info
  gradedBy: string; // Admin user ID
  graderName: string;
  gradedAt: Timestamp;
  
  // Edit History
  isEdited: boolean;
  editHistory?: GradeEditHistory[];
}

export interface GradeEditHistory {
  previousScore: number;
  newScore: number;
  reason?: string;
  editedBy: string;
  editedAt: Timestamp;
}