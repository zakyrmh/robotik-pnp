import { Gender, UserRole } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;
  role: UserRole;
  
  profile: UserProfile;
  
  registrationId?: string;
  
  membership?: UserMembership;
  
  isActive: boolean;
  
  deletedAt?: Timestamp;
  deletedBy?: string;
  deleteReason?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface UserProfile {
  fullName: string;
  nickname?: string;
  nim: string;
  phone: string;
  gender: Gender;
  birthDate: Timestamp;
  birthPlace: string;
  address: string;
  
  major: string;
  department: string;
  entryYear: number;
  
  photoUrl?: string;
  ktmUrl?: string;
}

export interface UserMembership {
  memberId: string;
  joinYear: number;
  joinDate: Timestamp;
}