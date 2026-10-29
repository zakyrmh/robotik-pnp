import { describe, expect, it } from "vitest";
import {
  countCheckinMetrics,
  csvCell,
  eventCheckinErrorMessage,
} from "@/lib/event-checkin";
import type { EventCheckinRegistration } from "@/types/event-checkin";

const baseRegistration: EventCheckinRegistration = {
  id: "550e8400-e29b-41d4-a716-446655440000",
  registration_code: "MRC-001",
  team_name: "Robot PNP",
  institution: "Politeknik Negeri Padang",
  advisor_name: "Dr. Pembimbing",
  payment_status: "paid",
  advisor_badge_handed_at: null,
  advisor_badge_handed_by: null,
  advisor_badge_handoff_type: null,
  advisor_badge_recipient_name: null,
  advisor_badge_recipient_role: null,
  advisor_badge_version: 0,
  category: { id: "550e8400-e29b-41d4-a716-446655440010", name: "Sumo" },
  members: [
    {
      id: "550e8400-e29b-41d4-a716-446655440001",
      full_name: "Ketua Tim",
      photo_url: "/photo.webp",
      member_qr_token: "550e8400-e29b-41d4-a716-446655440101",
      role_in_team: "Ketua Tim",
      checkin: {
        checked_in_at: "2026-10-27T01:00:00.000Z",
        checked_in_by: "550e8400-e29b-41d4-a716-446655440020",
        badge_handed_at: "2026-10-27T01:00:00.000Z",
        badge_handed_by: "550e8400-e29b-41d4-a716-446655440020",
        badge_handoff_type: "self",
        badge_recipient_name: "Ketua Tim",
        badge_recipient_role: "member",
        version: 1,
      },
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440002",
      full_name: "Anggota Tim",
      photo_url: "/photo-2.webp",
      member_qr_token: "550e8400-e29b-41d4-a716-446655440102",
      role_in_team: "Anggota",
      checkin: {
        checked_in_at: null,
        checked_in_by: null,
        badge_handed_at: "2026-10-27T01:00:00.000Z",
        badge_handed_by: "550e8400-e29b-41d4-a716-446655440020",
        badge_handoff_type: "representative",
        badge_recipient_name: "Ketua Tim",
        badge_recipient_role: "leader",
        version: 1,
      },
    },
  ],
};

describe("countCheckinMetrics", () => {
  it("memisahkan hadir, kokarde, dan penyerahan melalui perwakilan", () => {
    expect(countCheckinMetrics([baseRegistration])).toEqual({
      eligibleMembers: 2,
      presentMembers: 1,
      handedBadges: 2,
      representedBadges: 1,
      teamsNone: 0,
      teamsPartial: 1,
      teamsComplete: 0,
      advisorBadgesHanded: 0,
      advisorBadgesPending: 1,
    });
  });
});

describe("csvCell", () => {
  it("mencegah formula injection dan meng-escape tanda kutip", () => {
    expect(csvCell('=HYPERLINK("https://example.test")')).toBe(
      '"\'=HYPERLINK(""https://example.test"")"',
    );
  });
});

describe("eventCheckinErrorMessage", () => {
  it("memberi instruksi refresh saat terjadi konflik antar meja", () => {
    expect(eventCheckinErrorMessage("checkin_conflict")).toContain("meja lain");
  });
});
