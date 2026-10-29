import type { PaymentStatus, RoleEvent } from "@/types/event-registration";

export type EventCheckinAttendanceFilter =
  | "all"
  | "none"
  | "partial"
  | "complete";
export type EventCheckinBadgeFilter = "all" | "pending" | "complete";
export type EventCheckinAction =
  | "present_and_badge"
  | "present_only"
  | "proxy_badge";

export interface EventCheckinSearchRow {
  registration_id: string;
  registration_code: string;
  team_name: string;
  institution: string;
  category_id: string;
  category_name: string;
  payment_status: PaymentStatus;
  member_count: number;
  present_count: number;
  badge_count: number;
  total_count: number;
}

export interface EventMemberCheckin {
  checked_in_at: string | null;
  checked_in_by: string | null;
  badge_handed_at: string | null;
  badge_handed_by: string | null;
  badge_handoff_type: "self" | "representative" | null;
  badge_recipient_name: string | null;
  badge_recipient_role: "member" | "leader" | "advisor" | null;
  version: number;
}

export interface EventCheckinMember {
  id: string;
  full_name: string;
  photo_url: string;
  member_qr_token: string;
  role_in_team: string | null;
  checkin: EventMemberCheckin | null;
}

export interface EventCheckinRegistration {
  id: string;
  registration_code: string;
  team_name: string;
  institution: string;
  advisor_name: string | null;
  payment_status: PaymentStatus;
  advisor_badge_handed_at: string | null;
  advisor_badge_handed_by: string | null;
  advisor_badge_handoff_type: "self" | "representative" | null;
  advisor_badge_recipient_name: string | null;
  advisor_badge_recipient_role: "advisor" | "leader" | null;
  advisor_badge_version: number;
  category: { id: string; name: string } | null;
  members: EventCheckinMember[];
}

export interface EventCheckinMetrics {
  eligibleMembers: number;
  presentMembers: number;
  handedBadges: number;
  representedBadges: number;
  teamsNone: number;
  teamsPartial: number;
  teamsComplete: number;
  advisorBadgesHanded: number;
  advisorBadgesPending: number;
}

export interface EventCheckinAccess {
  isSuperAdmin: boolean;
  roleEvent: RoleEvent | undefined;
  canRecord: boolean;
  canCorrect: boolean;
  canSeeSensitive: boolean;
}
