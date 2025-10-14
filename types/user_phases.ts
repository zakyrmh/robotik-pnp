import { OrPhase, PhaseStatus } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface UserPhase {
  id: string; // {userId}_{phaseId}
  userId: string;
  phase: OrPhase;
  orPeriod: string;
  
  // Status
  status: PhaseStatus;
  
  // Requirements
  requiredActivities: string[]; // Activity IDs yang wajib
  completedActivities: string[]; // Activity IDs yang sudah diikuti
  
  requiredTasks: string[]; // Task IDs yang wajib
  completedTasks: string[]; // Task IDs yang sudah dikumpulkan
  
  // Progress
  attendanceRate: number; // 0-100
  totalActivities: number;
  attendedActivities: number;
  
  totalTasks: number;
  submittedTasks: number;
  gradedTasks: number;
  
  // Scoring
  totalPoints: number; // Total poin (dari kehadiran + nilai)
  attendancePoints: number;
  taskPoints: number;
  averageTaskScore?: number;
  
  // Decision
  passed: boolean; // Manual decision by admin
  decidedBy?: string; // Admin user ID
  decidedAt?: Timestamp;
  decisionNotes?: string;
  
  // Timestamps
  startedAt?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}