import { describe, it, expect } from "vitest";
import {
  eventMemberSchema,
  eventRegistrationSchema,
} from "./event-registration";

const VALID_MEMBER = {
  full_name: "Ahmad Rivaldi",
  photo_url: "/api/r2/mrc/photos/1234-abcd.webp",
  identity_card_url: "/api/r2/mrc/id-cards/1234-abcd-thumb.webp",
  role_in_team: "Ketua Tim",
};

describe("eventMemberSchema image URLs", () => {
  it("accepts relative /api/r2 proxy URLs from our own upload pipeline", () => {
    expect(eventMemberSchema.safeParse(VALID_MEMBER).success).toBe(true);
  });

  it("accepts absolute https URLs (custom R2 public domain)", () => {
    const res = eventMemberSchema.safeParse({
      ...VALID_MEMBER,
      photo_url: "https://cdn.example.com/mrc/photos/abc.webp",
    });
    expect(res.success).toBe(true);
  });

  it("rejects empty and non-URL values", () => {
    expect(
      eventMemberSchema.safeParse({ ...VALID_MEMBER, photo_url: "" }).success,
    ).toBe(false);
    expect(
      eventMemberSchema.safeParse({ ...VALID_MEMBER, photo_url: "not-a-url" })
        .success,
    ).toBe(false);
    expect(
      eventMemberSchema.safeParse({ ...VALID_MEMBER, photo_url: "/api/r2/" })
        .success,
    ).toBe(false);
  });
});

describe("eventRegistrationSchema with pipeline URLs", () => {
  it("passes full payload using relative image URLs", () => {
    const res = eventRegistrationSchema.safeParse({
      category_id: "cc205295-92eb-456f-9d00-d49a8ad4c470",
      team_name: "Robosoccer PNP A",
      institution: "Politeknik Negeri Padang",
      origin_city: "Kota Padang",
      advisor_name: "Pak A",
      team_email: "tim@example.com",
      team_whatsapp: "08123456789",
      accept_rules: true,
      members: [VALID_MEMBER],
    });
    expect(res.success).toBe(true);
  });
});
