import { Gender } from "@/types/enum";
import { Timestamp } from "firebase/firestore";

export type CompetitionTeam = 'krai' | 'krsbi_h' | 'krsbi_b' | 'krsti' | 'krsri';
export type OfficialDepartment = 'infokom' | 'litbang' | 'metrolab' | 'kestari';
export type CommitteePosition = 'chairman' | 'vice_chairman' | 'secretary' | 'treasurer' | 'coordinator' | 'staff' | 'member';

export interface BlacklistData {
  isBlacklisted: boolean;
  reason: string;        // Contoh: "Etika buruk saat wawancara"
  bannedAt: Timestamp;
  bannedBy: string;      // UID Admin yang melakukan blacklist
  period: string;        // Pada saat OR berapa dia di blacklist (Misal: "OR 21")
}

export interface User {
  id: string;
  email: string;
  emailVerified: boolean;

  roles: UserSystemRoles;
  assignments?: UserAssignments;
  
  profile: UserProfile;
  
  registrationId?: string;
  membership?: UserMembership;
  
  isActive: boolean;
  blacklistInfo?: BlacklistData;
  
  deletedAt?: Timestamp;
  deletedBy?: string;
  deleteReason?: string;
  
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastLoginAt?: Timestamp;
}

export interface UserSystemRoles {
  isSuperAdmin: boolean;      // Presidium Inti (Ketum, Waketu)
  isKestari: boolean;         // Anggota Dept Kestari (Akses Manajemen Piket)
  isKomdis: boolean;          // Anggota Komdis (Akses Sanksi)
  isRecruiter: boolean;       // Panitia Oprec (Akses Data Caang)
  isKRIMember: boolean;       // Anggota Tim Robot (Akses Logbook KRI)
  isOfficialMember: boolean;  // Anggota Dept Official (Infokom/Litbang)
  isCaang: boolean;           // Peserta Diklat
  isAlumni: boolean;
}

export interface UserAssignments {
  // Jika dia Panitia Oprec
  recruitment?: {
    position: CommitteePosition;
    division?: 'acara' | 'humas' | 'konsumsi' | 'perkap' | 'admin';
    period: number; // Misal: 2024
  };

  // Jika dia Tim KRI
  competition?: {
    team: CompetitionTeam; // 'krsbi_h', dll
    position: 'manager' | 'mechanic' | 'programmer' | 'electronics';
  };

  // Jika dia Pengurus Official (Dept)
  department?: {
    name: OfficialDepartment;
    position: CommitteePosition;
  };

  // Jabatan Struktural (Opsional, untuk Presidium)
  structural?: {
    title: 'ketua_umum' | 'wakil_ketua_1' | 'wakil_ketua_2' | 'sekretaris_1' | 'sekretaris_2' | 'bendahara_1' | 'bendahara_2';
  };
}

export interface UserProfile {
  fullName: string;
  nickname?: string;
  nim?: string;
  phone?: string;
  gender?: Gender;
  birthDate?: Timestamp;
  birthPlace?: string;
  address?: string;
  
  major?: string;
  department?: string;
  entryYear?: number;
  
  photoUrl?: string;
  ktmUrl?: string;
}

export interface UserMembership {
  memberId: string;
  joinYear: number;
  joinDate: Timestamp;
}