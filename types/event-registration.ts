export type ActionResult<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string; fieldErrors?: Record<string, string[]> };

export type PaymentStatus = "pending" | "paid" | "expired" | "failed";
export type MemberVerificationStatus = "pending" | "verified" | "mismatch";
export type ViolationStatus = "active" | "dq_confirmed" | "appealed";
export type RoleEvent = "panitia-pendaftaran" | "panitia-verifikasi" | "panitia-pertandingan";

export interface EventCategory {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  registration_fee: number;
  max_team_members: number;
  quota: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EventRulesVersion {
  id: string;
  category_id: string;
  version: string;
  content: string;
  published_at: string;
}

export interface EventRegistration {
  id: string;
  registration_code: string;
  category_id: string;
  team_name: string;
  institution: string;
  origin_city: string | null;
  advisor_name: string | null;
  team_email: string;
  team_whatsapp: string;
  payment_status: PaymentStatus;
  total_amount: number;
  midtrans_order_id: string | null;
  midtrans_snap_token: string | null;
  midtrans_payment_type: string | null;
  paid_at: string | null;
  manual_payment_proof_url: string | null;
  rules_version_id: string | null;
  rules_accepted_at: string | null;
  access_token: string;
  created_at: string;
  updated_at: string;
  category?: EventCategory;
  members?: EventTeamMember[];
}

export interface EventTeamMember {
  id: string;
  registration_id: string;
  full_name: string;
  photo_url: string;
  member_qr_token: string;
  verification_status: MemberVerificationStatus;
  role_in_team: string;
  created_at: string;
}

export interface EventMemberVerification {
  id: string;
  member_id: string;
  verified_by: string;
  result: "verified" | "mismatch";
  notes: string | null;
  scanned_at: string;
}

export interface EventViolation {
  id: string;
  registration_id: string;
  violation_type: string;
  description: string | null;
  warning_number: number;
  issued_by: string;
  status: ViolationStatus;
  created_at: string;
}
