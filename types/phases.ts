import { OrPhase } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface Phase {
  id: string;
  phase: OrPhase;
  orPeriod: string;
  
  // Info
  name: string;
  description: string;
  order: number; // Urutan fase
  
  // Schedule
  startDate: Timestamp;
  endDate: Timestamp;
  
  // Requirements
  prerequisites?: OrPhase[]; // Fase yang harus lulus dulu
  requiredActivities?: string[]; // Activity IDs yang wajib
  requiredTasks?: string[]; // Task IDs yang wajib
  minimumAttendanceRate?: number; // 0-100, optional
  
  // Status
  isActive: boolean;
  isVisible: boolean;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
}