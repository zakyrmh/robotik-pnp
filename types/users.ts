import { Division, Gender, NotificationChannel, UserRole } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string; // Firebase Auth UID
  email: string;
  emailVerified: boolean;
  role: UserRole;
  
  // Profile
  profile: UserProfile;
  
  // Registration (only for CAANG)
  registrationId?: string; // Reference to registrations collection
  
  // Membership (only for MEMBER)
  membership?: UserMembership;
  
  // Settings
  settings: UserSettings;
  
  // Status
  isActive: boolean;
  
  // Soft delete
  deletedAt?: Timestamp;
  deletedBy?: string;
  deleteReason?: string;
  
  // Metadata
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface UserProfile {
  fullName: string;
  nickname?: string;
  nim: string;
  phone: string;
  whatsapp: string;
  gender: Gender;
  birthDate: Timestamp;
  birthPlace: string;
  address: string;
  
  // Academic
  major: string; // Jurusan
  department: string; // Prodi
  semester: number;
  entryYear: number; // Tahun masuk PNP
  
  // Photo
  photoUrl?: string;
  ktmUrl?: string;
}

export interface UserMembership {
  memberId: string; // e.g., "MEMBER-2026-001"
  joinYear: number;
  batch: string; // e.g., "OR 21"
  division: Division;
  position?: string;
  joinDate: Timestamp;
  pelantikanDate?: Timestamp;
}

export interface UserSettings {
  notificationChannels: NotificationChannel[];
  allowWhatsappNotification: boolean;
  allowEmailNotification: boolean;
}