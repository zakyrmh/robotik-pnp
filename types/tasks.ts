import { OrPhase, SubmissionType, TaskStatus, TaskType } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Task {
  id: string;
  activityId?: string; // Optional, bisa standalone task
  orPeriod: string;
  
  // Basic Info
  title: string;
  description: string;
  instructions?: string;
  type: TaskType; // Individual or Group
  
  // Deadline
  deadline: Timestamp;
  
  // Submission Settings
  submissionTypes: SubmissionType[]; // Bisa multiple
  allowedFileTypes?: string[]; // ['.pdf', '.doc', '.jpg']
  
  // Grading
  isScorePublished: boolean;
  
  // Status
  isPublished: boolean;
  isVisible: boolean;
  
  // Soft Delete
  deletedAt?: Timestamp;
  deletedBy?: string;
  updatedBy?: string;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  userId?: string;
  subGroupId?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  fileType?: string;
  linkUrl?: string;
  textAnswer?: string;
  score?: number;
  feedback?: string;
  submittedAt: Timestamp;
  gradedAt?: Timestamp;
  gradedBy?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  deletedAt?: Timestamp;
  deletedBy?: string;
}