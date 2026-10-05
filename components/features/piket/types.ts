// components/features/piket/types.ts
import type {
  PiketComplianceStatus,
  PiketLogStatus,
} from "@/lib/repositories/piket";

export type { PiketComplianceStatus, PiketLogStatus };

export interface PiketProfile {
  id: string;
  email: string;
  role: string;
  is_onboarded: boolean;
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

export interface PiketScheduleMember {
  member_id: string;
  profile_id: string;
  nim: string;
  name: string;
  is_on_internship?: boolean;
  internship_start_date?: string | null;
  internship_end_date?: string | null;
}

export interface PiketSchedule {
  id: string;
  academic_period?: string;
  week_number: number;
  room_target: string;
  members: PiketScheduleMember[];
}

export interface PiketAssignment {
  schedule_id: string;
  academic_period?: string;
  week_number: number;
  room_target: string;
}

export interface PiketLog {
  id: string;
  duty_date: string;
  notes: string | null;
  proof_image_url: string;
  proof_image_before_url?: string | null;
  is_verified: boolean;
  is_final: boolean;
  rejection_reason: string;
  verified_at: string;
  schedule_id: string;
  academic_period?: string;
  schedule_day: string;
  reporter_id: string;
  reporter_name: string;
  reporter_nim: string;
  verifier_name: string;
}

export interface PiketFine {
  id: string;
  amount: number;
  status: string;
  notes: string;
  imposed_by: string;
  paid_at: string;
  created_at: string;
  profile_id: string;
  schedule_id: string;
  academic_period: string;
  week_number: number;
  member_name: string;
  member_nim: string;
}

export function getPiketLogStatus(log: {
  is_verified: boolean;
  is_final: boolean;
  verifier_name: string;
}): PiketLogStatus {
  if (!log.is_verified) return "rejected";
  if (log.is_final) return log.verifier_name ? "approved" : "auto_final";
  return "pending";
}
