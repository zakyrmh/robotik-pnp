import { describe, it, expect } from "vitest";
import {
  eventRegistrationSchema,
  eventMemberSchema,
  isMrcImageUrl,
  HARD_MAX_TEAM_MEMBERS,
} from "@/lib/schemas/event-registration";

const member = (over: Partial<Record<string, unknown>> = {}) => ({
  full_name: "Anggota Tim",
  photo_url: "/api/r2/ukm-robotik-pnp/foto.webp",
  role_in_team: "Anggota",
  ...over,
});

const base = {
  category_id: "272a043a-ce3e-4dba-8418-222fe720a2dd",
  team_name: "Tim Robotik",
  institution: "Politeknik Negeri Padang",
  origin_city: "Padang",
  team_email: "tim@example.com",
  team_whatsapp: "081234567890",
  accept_rules: true as const,
};

describe("K3 — Validasi URL gambar menolak target internal (SSRF)", () => {
  it("menolak host metadata cloud", () => {
    expect(isMrcImageUrl("https://169.254.169.254/latest/meta-data/")).toBe(
      false,
    );
    expect(
      isMrcImageUrl("http://metadata.google.internal/computeMetadata"),
    ).toBe(false);
  });

  it("menolak loopback & jaringan privat", () => {
    expect(isMrcImageUrl("http://127.0.0.1:5432/x.png")).toBe(false);
    expect(isMrcImageUrl("http://localhost/x.png")).toBe(false);
    expect(isMrcImageUrl("http://10.0.0.5/x.png")).toBe(false);
    expect(isMrcImageUrl("http://192.168.1.1/x.png")).toBe(false);
    expect(isMrcImageUrl("http://172.16.0.1/x.png")).toBe(false);
    expect(isMrcImageUrl("http://[::1]/x.png")).toBe(false);
  });

  it("menolak protokol non-http(s) dan host tanpa domain", () => {
    expect(isMrcImageUrl("file:///etc/passwd")).toBe(false);
    expect(isMrcImageUrl("javascript:alert(1)")).toBe(false);
    expect(isMrcImageUrl("http://intranet/x.png")).toBe(false);
  });

  it("tetap menerima proxy internal & domain publik valid", () => {
    expect(isMrcImageUrl("/api/r2/ukm-robotik-pnp/foto.webp")).toBe(true);
    expect(isMrcImageUrl("https://cdn.robotik-pnp.com/foto.webp")).toBe(true);
  });

  it("photo_url memakai skema yang sudah diperketat", () => {
    const r = eventMemberSchema.safeParse(
      member({ photo_url: "http://169.254.169.254/x" }),
    );
    expect(r.success).toBe(false);
  });
});

describe("K2 — Batas jumlah anggota ditegakkan di server", () => {
  it(`menolak lebih dari ${HARD_MAX_TEAM_MEMBERS} anggota`, () => {
    const many = Array.from({ length: HARD_MAX_TEAM_MEMBERS + 1 }, (_, i) =>
      member({ full_name: `Anggota ${i}` }),
    );
    const r = eventRegistrationSchema.safeParse({ ...base, members: many });
    expect(r.success).toBe(false);
  });

  it("dulu 100 anggota lolos; sekarang ditolak", () => {
    const hundred = Array.from({ length: 100 }, (_, i) =>
      member({ full_name: `Anggota ${i}` }),
    );
    expect(
      eventRegistrationSchema.safeParse({ ...base, members: hundred }).success,
    ).toBe(false);
  });

  it("tetap menerima jumlah wajar (1-2 anggota)", () => {
    expect(
      eventRegistrationSchema.safeParse({ ...base, members: [member()] })
        .success,
    ).toBe(true);
    expect(
      eventRegistrationSchema.safeParse({
        ...base,
        members: [member(), member({ full_name: "Anggota Dua" })],
      }).success,
    ).toBe(true);
  });

  it("menolak array kosong", () => {
    expect(
      eventRegistrationSchema.safeParse({ ...base, members: [] }).success,
    ).toBe(false);
  });
});

describe("S-4/S-5 — Batas panjang string & format WhatsApp", () => {
  it("menolak string yang sangat panjang", () => {
    expect(
      eventRegistrationSchema.safeParse({
        ...base,
        team_name: "A".repeat(10000),
        members: [member()],
      }).success,
    ).toBe(false);
  });

  it("menolak nomor WhatsApp yang tidak sesuai format Indonesia", () => {
    for (const bad of [
      "123456789",
      "abcdefghij",
      "0212345678",
      "0812",
      "+1234567890",
    ]) {
      expect(
        eventRegistrationSchema.safeParse({
          ...base,
          team_whatsapp: bad,
          members: [member()],
        }).success,
        `harusnya menolak: ${bad}`,
      ).toBe(false);
    }
  });

  it("menerima format WhatsApp Indonesia yang valid", () => {
    for (const good of ["081234567890", "6281234567890", "+6281234567890"]) {
      expect(
        eventRegistrationSchema.safeParse({
          ...base,
          team_whatsapp: good,
          members: [member()],
        }).success,
        `harusnya menerima: ${good}`,
      ).toBe(true);
    }
  });
});

describe("S-1/S-2 — Field anti-bot pada skema", () => {
  const member = {
    full_name: "Anggota Tim",
    photo_url: "/api/r2/ukm-robotik-pnp/foto.webp",
    role_in_team: "Anggota",
  };
  const base = {
    category_id: "272a043a-ce3e-4dba-8418-222fe720a2dd",
    team_name: "Tim Robotik",
    institution: "Politeknik Negeri Padang",
    origin_city: "Padang",
    team_email: "tim@example.com",
    team_whatsapp: "081234567890",
    accept_rules: true as const,
    members: [member],
  };

  it("menerima payload lengkap dengan field anti-bot", () => {
    const r = eventRegistrationSchema.safeParse({
      ...base,
      captcha_token: "token-turnstile",
      website: "",
      form_rendered_at: 1758600000000,
    });
    expect(r.success).toBe(true);
  });

  it("field anti-bot bersifat opsional (kompatibel dengan pemanggil lama)", () => {
    expect(eventRegistrationSchema.safeParse(base).success).toBe(true);
  });

  it("form_rendered_at menerima nilai string numerik (coerce dari FormData)", () => {
    const r = eventRegistrationSchema.safeParse({
      ...base,
      form_rendered_at: "1758600000000",
    });
    expect(r.success).toBe(true);
    if (r.success) expect(typeof r.data.form_rendered_at).toBe("number");
  });
});
