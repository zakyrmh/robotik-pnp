import { describe, it, expect } from "vitest";
import {
  isRegistrationHoldingSlot,
  MASA_TUNGGU_SLOT_MS,
} from "@/lib/event-quota";

const now = new Date("2026-09-23T12:00:00.000Z");
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

describe("event-quota: kriteria penahanan slot", () => {
  it("MASA_TUNGGU_SLOT_MS = 5 jam", () => {
    expect(MASA_TUNGGU_SLOT_MS).toBe(5 * 60 * 60 * 1000);
  });

  it("status permanen (paid, pending_verification) selalu menahan", () => {
    for (const s of ["paid", "pending_verification"]) {
      expect(
        isRegistrationHoldingSlot(
          { payment_status: s, created_at: hoursAgo(999) },
          now,
        ),
      ).toBe(true);
    }
  });

  it("unpaid baru (<5 jam) menahan slot", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(1) },
        now,
      ),
    ).toBe(true);
  });

  it("unpaid lama (6 jam) tidak menahan slot", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(6) },
        now,
      ),
    ).toBe(false);
  });

  it("pending mengikuti aturan masa tunggu yang sama", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "pending", created_at: hoursAgo(4) },
        now,
      ),
    ).toBe(true);
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "pending", created_at: hoursAgo(5.5) },
        now,
      ),
    ).toBe(false);
  });

  it("status final-gagal tidak menahan slot", () => {
    for (const s of ["rejected", "expired", "failed"]) {
      expect(
        isRegistrationHoldingSlot(
          { payment_status: s, created_at: hoursAgo(1) },
          now,
        ),
      ).toBe(false);
    }
  });

  it("wilayah sepertiga dari fitur quota", () => {
    // Batas tepat 5 jam: belum menahan (menahan butuh created_at > now - 5h)
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(5) },
        now,
      ),
    ).toBe(false);
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(4.99) },
        now,
      ),
    ).toBe(true);
  });

  it("data tanggal cacat tidak menahan slot (fail-safe)", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: "bukan-tanggal" },
        now,
      ),
    ).toBe(false);
  });
});
