import { Timestamp } from "firebase/firestore";
import { OrPhase } from "@/types/enum";

export interface UserStatistics {
  userId: string;
  orPeriod: string;
  
  // Attendance
  totalActivities: number;
  attendedActivities: number;
  attendanceRate: number;
  attendancePoints: number;
  
  // Tasks
  totalTasks: number;
  submittedTasks: number;
  gradedTasks: number;
  averageTaskScore: number;
  taskPoints: number;
  
  // Overall
  totalPoints: number;
  rank?: number;
  
  // Phase Progress
  currentPhase: OrPhase;
  completedPhases: OrPhase[];
  failedPhases: OrPhase[];
  
  updatedAt: Timestamp;
}