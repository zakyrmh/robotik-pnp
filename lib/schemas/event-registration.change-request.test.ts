import { describe, it, expect } from "vitest";
import {
  registrationChangeRequestSchema,
  reviewChangeRequestSchema,
  HARD_MAX_TEAM_MEMBERS,
  MIN_TEAM_MEMBERS,
} from "./event-registration";

function validMember(overrides: Record<string, unknown> = {}) {
  return {
    full_name: "Budi Santoso",
    photo_url:
      "https://abc.supabase.co/storage/v1/object/public/mrc/photos/a.webp",
    role_in_team: "Ketua",
    ...overrides,
  };
}

function validPayload(overrides: Record<string, unknown> = {}) {
  return {
    team_name: "Tim Robotik A",
    institution: "SMK Negeri 1 Padang",
    origin_city: "Padang",
    advisor_name: "Pak Dedi",
    team_email: "tim@example.com",
    team_whatsapp: "081234567890",
    members: [
      validMember(),
      validMember({ full_name: "Ani", role_in_team: "Anggota" }),
    ],
    ...overrides,
  };
}

describe("registrationChangeRequestSchema", () => {
  it("menerima payload valid", () => {
    const res = registrationChangeRequestSchema.safeParse(validPayload());
    expect(res.success).toBe(true);
  });

  it("menolak anggota kurang dari minimum", () => {
    const res = registrationChangeRequestSchema.safeParse(
      validPayload({ members: [validMember()] }),
    );
    expect(res.success).toBe(false);
  });

  it("menolak anggota melebihi plafon keras", () => {
    const many = Array.from({ length: HARD_MAX_TEAM_MEMBERS + 1 }, (_, i) =>
      validMember({ full_name: `Anggota ${i}` }),
    );
    const res = registrationChangeRequestSchema.safeParse(
      validPayload({ members: many }),
    );
    expect(res.success).toBe(false);
  });

  it("menolak WhatsApp tidak valid", () => {
    const res = registrationChangeRequestSchema.safeParse(
      validPayload({ team_whatsapp: "12345" }),
    );
    expect(res.success).toBe(false);
  });

  it("menolak URL foto internal (SSRF)", () => {
    const res = registrationChangeRequestSchema.safeParse(
      validPayload({
        members: [
          validMember({ photo_url: "https://169.254.169.254/x.jpg" }),
          validMember(),
        ],
      }),
    );
    expect(res.success).toBe(false);
  });

  it(`mewajibkan minimal ${MIN_TEAM_MEMBERS} anggota`, () => {
    expect(MIN_TEAM_MEMBERS).toBeGreaterThanOrEqual(2);
  });
});

describe("reviewChangeRequestSchema", () => {
  it("menerima approve tanpa catatan", () => {
    const res = reviewChangeRequestSchema.safeParse({
      request_id: "550e8400-e29b-41d4-a716-446655440000",
      action: "approve",
    });
    expect(res.success).toBe(true);
  });

  it("menerima reject dengan catatan", () => {
    const res = reviewChangeRequestSchema.safeParse({
      request_id: "550e8400-e29b-41d4-a716-446655440000",
      action: "reject",
      note: "Nomor WA tidak bisa dihubungi",
    });
    expect(res.success).toBe(true);
  });

  it("menolak action selain approve/reject", () => {
    const res = reviewChangeRequestSchema.safeParse({
      request_id: "550e8400-e29b-41d4-a716-446655440000",
      action: "delete",
    });
    expect(res.success).toBe(false);
  });

  it("menolak request_id bukan UUID", () => {
    const res = reviewChangeRequestSchema.safeParse({
      request_id: "not-a-uuid",
      action: "approve",
    });
    expect(res.success).toBe(false);
  });
});
