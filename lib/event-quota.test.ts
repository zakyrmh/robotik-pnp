import { describe, it, expect } from "vitest";
import {
  isRegistrationHoldingSlot,
  isRegistrationExpired,
  getRemainingHoldMs,
  MASA_TUNGGU_SLOT_MS,
} from "@/lib/event-quota";

const now = new Date("2026-09-23T12:00:00.000Z");
const hoursAgo = (h: number) =>
  new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();

describe("event-quota: kriteria penahanan slot", () => {
  it("MASA_TUNGGU_SLOT_MS = 1 jam", () => {
    expect(MASA_TUNGGU_SLOT_MS).toBe(1 * 60 * 60 * 1000);
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

  it("unpaid baru (<1 jam) menahan slot", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(0.5) },
        now,
      ),
    ).toBe(true);
  });

  it("unpaid lama (2 jam) tidak menahan slot", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(2) },
        now,
      ),
    ).toBe(false);
  });

  it("pending mengikuti aturan masa tunggu yang sama", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "pending", created_at: hoursAgo(0.75) },
        now,
      ),
    ).toBe(true);
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "pending", created_at: hoursAgo(1.5) },
        now,
      ),
    ).toBe(false);
  });

  it("status final-gagal tidak menahan slot", () => {
    for (const s of ["rejected", "expired", "failed"]) {
      expect(
        isRegistrationHoldingSlot(
          { payment_status: s, created_at: hoursAgo(0.5) },
          now,
        ),
      ).toBe(false);
    }
  });

  it("batas tepat 1 jam: tidak menahan (butuh created_at > now - 1h)", () => {
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(1) },
        now,
      ),
    ).toBe(false);
    expect(
      isRegistrationHoldingSlot(
        { payment_status: "unpaid", created_at: hoursAgo(0.99) },
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

describe("event-quota: kedaluwarsa masa tahan (penutupan permanen)", () => {
  it("unpaid >1 jam dianggap kedaluwarsa", () => {
    expect(
      isRegistrationExpired(
        { payment_status: "unpaid", created_at: hoursAgo(1.5) },
        now,
      ),
    ).toBe(true);
  });

  it("unpaid <1 jam belum kedaluwarsa", () => {
    expect(
      isRegistrationExpired(
        { payment_status: "unpaid", created_at: hoursAgo(0.5) },
        now,
      ),
    ).toBe(false);
  });

  it("status permanen tidak pernah 'kedaluwarsa' (tetap menahan)", () => {
    for (const s of ["paid", "pending_verification"]) {
      expect(
        isRegistrationExpired(
          { payment_status: s, created_at: hoursAgo(999) },
          now,
        ),
      ).toBe(false);
    }
  });

  it("status final-gagal bukan 'kedaluwarsa' (sudah mati di jalur lain)", () => {
    for (const s of ["rejected", "expired", "failed"]) {
      expect(
        isRegistrationExpired(
          { payment_status: s, created_at: hoursAgo(999) },
          now,
        ),
      ).toBe(false);
    }
  });

  it("data tanggal cacat tidak dianggap kedaluwarsa (fail-safe)", () => {
    expect(
      isRegistrationExpired(
        { payment_status: "unpaid", created_at: "bukan-tanggal" },
        now,
      ),
    ).toBe(false);
  });
});

describe("event-quota: sisa waktu countdown", () => {
  it("unpaid <1 jam menyisakan waktu > 0", () => {
    const remaining = getRemainingHoldMs(
      { payment_status: "unpaid", created_at: hoursAgo(0.25) },
      now,
    );
    expect(remaining).toBeGreaterThan(0);
    expect(remaining).toBeLessThanOrEqual(MASA_TUNGGU_SLOT_MS);
  });

  it("unpaid >1 jam menyisakan 0", () => {
    expect(
      getRemainingHoldMs(
        { payment_status: "unpaid", created_at: hoursAgo(2) },
        now,
      ),
    ).toBe(0);
  });

  it("status permanen menyisakan 0 (tidak ada countdown)", () => {
    expect(
      getRemainingHoldMs(
        { payment_status: "paid", created_at: hoursAgo(0.25) },
        now,
      ),
    ).toBe(0);
  });
});
