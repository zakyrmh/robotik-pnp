import { Database } from "@/types/database.types";

export type UserRole = Database["public"]["Enums"]["user_role"];
export type RegistrationStatus = Database["public"]["Enums"]["reg_status"];

export interface UserManagementItem {
  id: string;
  email: string;
  fullName: string | null;
  nim: string | null;
  role: UserRole;
  isOnboarded: boolean;
  isOnInternship: boolean;
  internshipStartDate: string | null;
  internshipEndDate: string | null;
  avatarUrl: string | null;
  phoneNumber: string | null;
  studyProgramId: string | null;
  studyProgramName: string | null;
  registrationStatus: RegistrationStatus | null;
  deletedAt: string | null;
  deleteReason: string | null;
  createdAt: string;
}

export interface UserManagementFilter {
  search?: string;
  role?: string;
  studyProgramId?: string;
  status?: "all" | "active" | "archived";
  page?: number;
  perPage?: number;
}

export interface UserManagementQueryResult {
  data: UserManagementItem[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface SystemAuditLogEntry {
  id: string;
  actorId: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  actorAvatarUrl?: string | null;
  actionType: string;
  targetUserId: string | null;
  targetUserName?: string | null;
  targetUserEmail?: string | null;
  targetUserRole?: string | null;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  details: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export interface SystemAuditLogQueryResult {
  data: SystemAuditLogEntry[];
  totalCount: number;
  page: number;
  perPage: number;
  totalPages: number;
}
