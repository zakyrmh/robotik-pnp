import { Timestamp } from "firebase/firestore";

// Group Parent - Container untuk sub-groups (misal: "Kelompok Project 1")
export interface GroupParent {
  id: string;
  name: string; // Misal: "Kelompok Project 1", "Kelompok Project 2"
  description?: string;
  orPeriod: string; // Misal: "OR 21"
  
  // Metadata
  totalSubGroups: number; // Jumlah sub-group yang ada
  totalMembers: number; // Total anggota dari semua sub-group
  
  isActive: boolean;
  
  createdBy: string; // Admin yang membuat
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Sub-Group - Kelompok aktual dengan anggota (misal: "Kelompok 1", "Kelompok 2")
export interface SubGroup {
  id: string;
  parentId: string; // Reference ke GroupParent
  name: string; // Misal: "Kelompok 1", "Kelompok 2"
  description?: string;
  orPeriod: string;
  
  // Members
  memberIds: string[]; // User IDs
  leaderId?: string; // Ketua kelompok (optional)
  
  // Member Details for Display (cached data)
  members: GroupMember[];
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Member info dengan attendance data untuk highlighting
export interface GroupMember {
  userId: string;
  fullName: string;
  nim: string;
  attendancePercentage: number; // 0-100
  totalActivities: number;
  attendedActivities: number;
  isLowAttendance: boolean; // true jika < 25%
}