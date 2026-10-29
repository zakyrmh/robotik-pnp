import { describe, expect, it } from "vitest";
import {
  correctEventCheckinSchema,
  recordAdvisorBadgeSchema,
  recordEventCheckinSchema,
} from "@/lib/schemas/event-checkin";

const REGISTRATION_ID = "550e8400-e29b-41d4-a716-446655440000";
const MEMBER_ID = "550e8400-e29b-41d4-a716-446655440001";
const SECOND_MEMBER_ID = "550e8400-e29b-41d4-a716-446655440002";

describe("recordEventCheckinSchema", () => {
  it("menerima bulk hadir dan kokarde dengan versi tiap anggota", () => {
    const result = recordEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      memberIds: [MEMBER_ID, SECOND_MEMBER_ID],
      action: "present_and_badge",
      expectedVersions: { [MEMBER_ID]: 0, [SECOND_MEMBER_ID]: 2 },
    });

    expect(result.success).toBe(true);
  });

  it("menolak anggota duplikat dan versi yang hilang", () => {
    const duplicate = recordEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      memberIds: [MEMBER_ID, MEMBER_ID],
      action: "present_only",
      expectedVersions: { [MEMBER_ID]: 0 },
    });
    const missingVersion = recordEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      memberIds: [MEMBER_ID, SECOND_MEMBER_ID],
      action: "present_only",
      expectedVersions: { [MEMBER_ID]: 0 },
    });

    expect(duplicate.success).toBe(false);
    expect(missingVersion.success).toBe(false);
  });

  it("mewajibkan identitas ketua untuk penyerahan yang diwakilkan", () => {
    const result = recordEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      memberIds: [MEMBER_ID],
      action: "proxy_badge",
      expectedVersions: { [MEMBER_ID]: 0 },
      proxyRole: "leader",
    });

    expect(result.success).toBe(false);
  });
});

describe("recordAdvisorBadgeSchema", () => {
  it("mewajibkan member ketua jika kokarde pembimbing diwakili ketua", () => {
    expect(
      recordAdvisorBadgeSchema.safeParse({
        registrationId: REGISTRATION_ID,
        recipientRole: "leader",
        expectedVersion: 0,
      }).success,
    ).toBe(false);
  });
});

describe("correctEventCheckinSchema", () => {
  it("hanya mengizinkan koreksi kokarde untuk pembimbing", () => {
    const result = correctEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      target: "advisor",
      field: "attendance",
      expectedVersion: 1,
      reason: "Salah catat",
    });

    expect(result.success).toBe(false);
  });

  it("mewajibkan alasan koreksi yang cukup", () => {
    const result = correctEventCheckinSchema.safeParse({
      registrationId: REGISTRATION_ID,
      target: "member",
      field: "badge",
      memberId: MEMBER_ID,
      expectedVersion: 1,
      reason: "x",
    });

    expect(result.success).toBe(false);
  });
});
