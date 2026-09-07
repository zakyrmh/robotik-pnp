import { describe, it, expect } from "vitest";
import {
  getActiveBatch,
  getBatchPhase,
  getCategoryBatchFee,
} from "@/lib/event-batch";
import type { EventSettings } from "@/types/event-registration";

import {
  isTimelineReleased,
  isBatch2Visible,
} from "@/lib/event-batch";

const SETTINGS: EventSettings = {
  id: 1,
  timeline_release_date: "2026-09-10T00:00:00+07:00",
  batch1_start: "2026-09-15T00:00:00+07:00",
  batch1_end: "2026-09-25T23:59:00+07:00",
  batch2_start: "2026-09-26T00:00:00+07:00",
  batch2_end: "2026-10-05T23:59:00+07:00",
  technical_meeting_start: "2026-10-13T09:00:00+07:00",
  technical_meeting_end: "2026-10-14T17:00:00+07:00",
  event_start: "2026-10-15T09:00:00+07:00",
  event_end: "2026-10-17T17:00:00+07:00",
  created_at: "2026-09-01T00:00:00.000Z",
  updated_at: "2026-09-01T00:00:00.000Z",
};

describe("event-batch phase & visibility detection", () => {
  it("returns unconfigured when settings are null", () => {
    expect(getBatchPhase(null).phase).toBe("unconfigured");
    expect(getActiveBatch(null)).toBeNull();
    expect(isTimelineReleased(null)).toBe(false);
    expect(isBatch2Visible(null)).toBe(false);
  });

  it("detects coming-soon phase before timeline_release_date", () => {
    const phase = getBatchPhase(
      SETTINGS,
      new Date("2026-09-08T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("coming-soon");
    expect(isTimelineReleased(SETTINGS, new Date("2026-09-08T12:00:00+07:00"))).toBe(false);
  });

  it("detects before-batch1 and released timeline after timeline_release_date", () => {
    const phase = getBatchPhase(
      SETTINGS,
      new Date("2026-09-12T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("before-batch1");
    expect(isTimelineReleased(SETTINGS, new Date("2026-09-12T12:00:00+07:00"))).toBe(true);
    expect(isBatch2Visible(SETTINGS, new Date("2026-09-12T12:00:00+07:00"))).toBe(false);
  });

  it("hides Batch 2 during Batch 1 registration period", () => {
    const now = new Date("2026-09-18T12:00:00+07:00");
    const phase = getBatchPhase(SETTINGS, now);
    expect(phase.phase).toBe("batch1-open");
    expect(isBatch2Visible(SETTINGS, now)).toBe(false);
  });

  it("reveals Batch 2 after Batch 1 ends or when Batch 2 starts", () => {
    const afterBatch1 = new Date("2026-09-26T00:00:00+07:00");
    expect(isBatch2Visible(SETTINGS, afterBatch1)).toBe(true);
    expect(getBatchPhase(SETTINGS, afterBatch1).phase).toBe("batch2-open");
  });

  it("detects batch1-open with countdown to batch1_end", () => {
    const phase = getBatchPhase(
      SETTINGS,
      new Date("2026-09-18T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("batch1-open");
    expect(
      getActiveBatch(SETTINGS, new Date("2026-09-18T12:00:00+07:00")),
    ).toBe("batch1");
    expect(phase.countdownTarget).toBe(SETTINGS.batch1_end);
  });

  it("detects between-batches gap with countdown to batch2_start", () => {
    const gapSettings: EventSettings = {
      ...SETTINGS,
      batch2_start: "2026-09-28T00:00:00+07:00",
    };
    const phase = getBatchPhase(
      gapSettings,
      new Date("2026-09-26T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("between-batches");
    expect(phase.countdownTarget).toBe(gapSettings.batch2_start);
  });

  it("detects batch2-open with countdown to batch2_end", () => {
    const phase = getBatchPhase(
      SETTINGS,
      new Date("2026-09-28T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("batch2-open");
    expect(
      getActiveBatch(SETTINGS, new Date("2026-09-28T12:00:00+07:00")),
    ).toBe("batch2");
    expect(phase.countdownTarget).toBe(SETTINGS.batch2_end);
  });

  it("detects before-event after batch2 closes", () => {
    const phase = getBatchPhase(
      SETTINGS,
      new Date("2026-10-10T12:00:00+07:00"),
    );
    expect(phase.phase).toBe("before-event");
    expect(phase.countdownTarget).toBe(SETTINGS.event_start);
  });

  it("detects event-ongoing and event-ended", () => {
    expect(
      getBatchPhase(SETTINGS, new Date("2026-10-16T12:00:00+07:00")).phase,
    ).toBe("event-ongoing");
    expect(
      getBatchPhase(SETTINGS, new Date("2026-10-20T12:00:00+07:00")).phase,
    ).toBe("event-ended");
  });
});

describe("getCategoryBatchFee", () => {
  const category = {
    registration_fee: 100000,
    registration_fee_batch1: 150000,
    registration_fee_batch2: 200000,
  };

  it("returns batch-specific fees", () => {
    expect(getCategoryBatchFee(category, "batch1")).toBe(150000);
    expect(getCategoryBatchFee(category, "batch2")).toBe(200000);
  });

  it("falls back to legacy fee when batch fees are null", () => {
    const legacy = {
      registration_fee: 100000,
      registration_fee_batch1: null,
      registration_fee_batch2: null,
    };
    expect(getCategoryBatchFee(legacy, "batch1")).toBe(100000);
    expect(getCategoryBatchFee(legacy, "batch2")).toBe(100000);
    expect(getCategoryBatchFee(legacy, null)).toBe(100000);
  });
});
