import type {
  EventCategory,
  EventSettings,
  RegistrationBatch,
} from "@/types/event-registration";

export type BatchPhase =
  | { phase: "before-batch1"; batch: null; countdownTarget: string | null }
  | { phase: "batch1-open"; batch: "batch1"; countdownTarget: string | null }
  | { phase: "between-batches"; batch: null; countdownTarget: string | null }
  | { phase: "batch2-open"; batch: "batch2"; countdownTarget: string | null }
  | { phase: "before-event"; batch: null; countdownTarget: string | null }
  | { phase: "event-ongoing"; batch: null; countdownTarget: string | null }
  | { phase: "event-ended"; batch: null; countdownTarget: null }
  | { phase: "unconfigured"; batch: null; countdownTarget: null };

function inRange(
  now: number,
  start: string | null,
  end: string | null,
): boolean {
  if (!start || !end) return false;
  const s = Date.parse(start);
  const e = Date.parse(end);
  return !Number.isNaN(s) && !Number.isNaN(e) && now >= s && now <= e;
}

/**
 * Menentukan fase pendaftaran/acara saat ini dari settings global.
 * Dipakai untuk countdown hero, status tombol daftar, dan penentuan biaya.
 */
export function getBatchPhase(
  settings: EventSettings | null | undefined,
  now: Date = new Date(),
): BatchPhase {
  if (!settings)
    return { phase: "unconfigured", batch: null, countdownTarget: null };

  const t = now.getTime();
  const {
    batch1_start,
    batch1_end,
    batch2_start,
    batch2_end,
    event_start,
    event_end,
  } = settings;

  const hasAnyBatch = Boolean(
    (batch1_start && batch1_end) || (batch2_start && batch2_end),
  );

  if (inRange(t, batch1_start, batch1_end)) {
    return {
      phase: "batch1-open",
      batch: "batch1",
      countdownTarget: batch1_end,
    };
  }
  if (inRange(t, batch2_start, batch2_end)) {
    return {
      phase: "batch2-open",
      batch: "batch2",
      countdownTarget: batch2_end,
    };
  }

  if (hasAnyBatch && batch1_start && t < Date.parse(batch1_start)) {
    return {
      phase: "before-batch1",
      batch: null,
      countdownTarget: batch1_start,
    };
  }
  if (
    hasAnyBatch &&
    batch1_end &&
    batch2_start &&
    t > Date.parse(batch1_end) &&
    t < Date.parse(batch2_start)
  ) {
    return {
      phase: "between-batches",
      batch: null,
      countdownTarget: batch2_start,
    };
  }

  // Di luar kedua batch tapi batch terkonfigurasi: jika batch2 sudah lewat, arahkan ke acara
  if (hasAnyBatch && batch2_end && t > Date.parse(batch2_end)) {
    if (event_start && t < Date.parse(event_start)) {
      return {
        phase: "before-event",
        batch: null,
        countdownTarget: event_start,
      };
    }
  } else if (!hasAnyBatch && event_start && t < Date.parse(event_start)) {
    return { phase: "before-event", batch: null, countdownTarget: event_start };
  }

  if (event_start && event_end) {
    const s = Date.parse(event_start);
    const e = Date.parse(event_end);
    if (t >= s && t <= e)
      return {
        phase: "event-ongoing",
        batch: null,
        countdownTarget: event_end,
      };
    if (t > e)
      return { phase: "event-ended", batch: null, countdownTarget: null };
  }
  if (event_start && t >= Date.parse(event_start)) {
    return { phase: "event-ongoing", batch: null, countdownTarget: null };
  }

  return { phase: "unconfigured", batch: null, countdownTarget: null };
}

export function getActiveBatch(
  settings: EventSettings | null | undefined,
  now: Date = new Date(),
): RegistrationBatch | null {
  return getBatchPhase(settings, now).batch;
}

/** Biaya efektif kategori untuk batch tertentu (fallback ke registration_fee legacy). */
export function getCategoryBatchFee(
  category: Pick<
    EventCategory,
    "registration_fee" | "registration_fee_batch1" | "registration_fee_batch2"
  >,
  batch: RegistrationBatch | null,
): number {
  if (batch === "batch1")
    return category.registration_fee_batch1 ?? category.registration_fee;
  if (batch === "batch2")
    return category.registration_fee_batch2 ?? category.registration_fee;
  return category.registration_fee;
}

export const BATCH_LABELS: Record<RegistrationBatch, string> = {
  batch1: "Batch 1",
  batch2: "Batch 2",
};

export const PHASE_LABELS: Record<BatchPhase["phase"], string> = {
  "before-batch1": "Pendaftaran Batch 1 segera dibuka",
  "batch1-open": "Penutupan Pendaftaran Batch 1",
  "between-batches": "Pendaftaran Batch 2 segera dibuka",
  "batch2-open": "Penutupan Pendaftaran Batch 2",
  "before-event": "Hari-H Pelaksanaan Lomba",
  "event-ongoing": "Acara sedang berlangsung",
  "event-ended": "Acara telah selesai",
  unconfigured: "Jadwal menyusul",
};
