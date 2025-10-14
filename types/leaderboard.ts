import { Timestamp } from "firebase/firestore";

export interface Leaderboard {
  id: string; // {orPeriod}_{userId}
  userId: string;
  orPeriod: string;
  
  // User Info (denormalized for quick display)
  userName: string;
  nim: string;
  photoUrl?: string;
  
  // Scores
  totalPoints: number;
  attendancePoints: number;
  taskPoints: number;
  
  // Breakdown
  attendanceRate: number; // 0-100
  averageTaskScore: number; // 0-100
  totalActivitiesAttended: number;
  totalTasksSubmitted: number;
  
  // Ranking
  rank: number; // Updated by cloud function
  previousRank?: number;
  
  // Visibility (hanya admin yang bisa lihat)
  isVisible: boolean;
  
  // Metadata
  lastCalculatedAt: Timestamp;
  updatedAt: Timestamp;
}