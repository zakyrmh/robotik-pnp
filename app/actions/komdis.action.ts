"use server";

/**
 * Server Actions — Modul Komisi Disiplin
 *
 * Guard akses:
 * - requireModule('komisi-disiplin') → komdis, admin, super_admin
 * - requireAuth()                    → semua anggota UKM (self-service)
 */

import { randomBytes } from "crypto";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
  requireAuth,
  requireModule,
  isActionError,
  ok,
  fail,
} from "@/lib/actions/utils";
import type { ActionResult } from "@/lib/actions/utils";
import type {
  KomdisEvent,
  KomdisAttendanceWithUser,
  KomdisAttendanceToken,
  KomdisViolationWithUser,
  KomdisMemberPointSummary,
  KomdisPointReductionWithUser,
  KomdisWarningLetterWithUser,
  KomdisSpLevel,
  KomdisViolationCategory,
  KomdisReductionStatus,
  KomdisSpStatus,
} from "@/lib/db/schema/komdis";

// ═══════════════════════════════════════════════════════
// HELPER
// ═══════════════════════════════════════════════════════

/** Generate token hex 64 karakter secara kriptografis aman */
function generateToken(): string {
  return randomBytes(32).toString("hex");
}

/** Generate nomor surat SP */
function generateLetterNumber(level: KomdisSpLevel, sequence: number): string {
  const levelMap = { sp1: "1", sp2: "2", sp3: "3" };
  const now = new Date();
  const romanMonth = [
    "I",
    "II",
    "III",
    "IV",
    "V",
    "VI",
    "VII",
    "VIII",
    "IX",
    "X",
    "XI",
    "XII",
  ][now.getMonth()];
  const year = now.getFullYear();
  const seq = String(sequence).padStart(3, "0");
  return `SP-${levelMap[level]}/${seq}/KOMDIS/${romanMonth}/${year}`;
}

const TOKEN_TTL_MINUTES = 5;

// ═══════════════════════════════════════════════════════
// VALIDASI SCHEMA
// ═══════════════════════════════════════════════════════

const createEventSchema = z.object({
  title: z.string().min(3, "Judul minimal 3 karakter").max(255),
  description: z.string().max(2000).optional(),
  location: z.string().max(255).optional(),
  eventDate: z.string().date("Format tanggal tidak valid"),
  startTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format waktu tidak valid (HH:MM)"),
  endTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Format waktu tidak valid (HH:MM)")
    .optional(),
  lateTolerance: z.number().int().min(0).max(120).default(0),
  pointsPerLate: z.number().int().min(0).max(100).default(1),
});

const updateEventSchema = createEventSchema.partial();

const updateEventStatusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "upcoming", "ongoing", "completed"]),
});

const scanAttendanceSchema = z.object({
  token: z.string().length(64, "Token tidak valid"),
});

const giveSanctionSchema = z.object({
  attendanceId: z.string().uuid(),
  sanctionType: z.enum(["physical", "points"]),
  points: z.number().int().min(0).default(0),
  notes: z.string().max(500).optional(),
});

const manualAttendanceSchema = z.object({
  eventId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(["present", "late", "absent"]),
  lateMinutes: z.number().int().min(0).default(0),
});

const createViolationSchema = z.object({
  userId: z.string().uuid(),
  category: z.enum(["attendance", "discipline", "property", "ethics", "other"]),
  description: z.string().min(3).max(1000),
  points: z.number().int().min(0).max(100),
  eventId: z.string().uuid().optional(),
  sanctionId: z.string().uuid().optional(),
});

const reviewReductionSchema = z.object({
  reductionId: z.string().uuid(),
  status: z.enum(["approved", "rejected"]),
  approvedPoints: z.number().int().min(0).optional(),
  reviewNotes: z.string().max(500).optional(),
});

const submitReductionSchema = z.object({
  points: z.number().int().min(1, "Minimal 1 poin"),
  reason: z.string().min(10, "Alasan minimal 10 karakter").max(1000),
  evidenceUrl: z.string().url("URL bukti tidak valid").optional(),
});

const createSpSchema = z.object({
  userId: z.string().uuid(),
  level: z.enum(["sp1", "sp2", "sp3"]),
  subject: z.string().min(3).max(255),
  reason: z.string().min(10).max(2000),
  violationsSummary: z.string().max(2000).optional(),
  consequences: z.string().max(1000).optional(),
  effectiveDate: z.string().date().optional(),
  expiryDate: z.string().date().optional(),
  pointsAtIssue: z.number().int().min(0).default(0),
});

const revokeSpSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().min(10, "Alasan minimal 10 karakter").max(500),
});

// ═══════════════════════════════════════════════════════
// KEGIATAN — CRUD
// ═══════════════════════════════════════════════════════

/** Ambil semua kegiatan — semua anggota bisa akses (untuk dashboard) */
export async function getKomdisEvents(): Promise<ActionResult<KomdisEvent[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as KomdisEvent[]);
  } catch (err) {
    console.error("[getKomdisEvents]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil kegiatan mendatang — untuk semua dashboard */
export async function getUpcomingKomdisEvents(): Promise<
  ActionResult<KomdisEvent[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .select("*")
      .in("status", ["upcoming", "ongoing"])
      .order("event_date", { ascending: true });

    if (error) return fail(error.message);
    return ok(data as KomdisEvent[]);
  } catch (err) {
    console.error("[getUpcomingKomdisEvents]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil detail kegiatan by ID */
export async function getKomdisEventById(
  id: string,
): Promise<ActionResult<KomdisEvent>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .select("*")
      .eq("id", id)
      .single();

    if (error) return fail(error.message);
    return ok(data as KomdisEvent);
  } catch (err) {
    console.error("[getKomdisEventById]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Buat kegiatan baru — khusus komdis */
export async function createKomdisEvent(
  input: z.infer<typeof createEventSchema>,
): Promise<ActionResult<KomdisEvent>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = createEventSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .insert({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        location: parsed.data.location ?? null,
        event_date: parsed.data.eventDate,
        start_time: parsed.data.startTime,
        end_time: parsed.data.endTime ?? null,
        late_tolerance: parsed.data.lateTolerance,
        points_per_late: parsed.data.pointsPerLate,
        status: "draft" as const,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as KomdisEvent);
  } catch (err) {
    console.error("[createKomdisEvent]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update kegiatan — khusus komdis */
export async function updateKomdisEvent(
  id: string,
  input: z.infer<typeof updateEventSchema>,
): Promise<ActionResult<KomdisEvent>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const idParsed = z.string().uuid().safeParse(id);
    if (!idParsed.success) return fail("ID kegiatan tidak valid.");

    const parsed = updateEventSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    // Remap camelCase ke snake_case
    const updates: Record<string, unknown> = {};
    if (parsed.data.title !== undefined) updates.title = parsed.data.title;
    if (parsed.data.description !== undefined)
      updates.description = parsed.data.description;
    if (parsed.data.location !== undefined)
      updates.location = parsed.data.location;
    if (parsed.data.eventDate !== undefined)
      updates.event_date = parsed.data.eventDate;
    if (parsed.data.startTime !== undefined)
      updates.start_time = parsed.data.startTime;
    if (parsed.data.endTime !== undefined)
      updates.end_time = parsed.data.endTime;
    if (parsed.data.lateTolerance !== undefined)
      updates.late_tolerance = parsed.data.lateTolerance;
    if (parsed.data.pointsPerLate !== undefined)
      updates.points_per_late = parsed.data.pointsPerLate;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as KomdisEvent);
  } catch (err) {
    console.error("[updateKomdisEvent]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Ubah status kegiatan — khusus komdis.
 * Saat diubah ke 'completed', trigger database akan
 * otomatis insert absent untuk anggota yang belum hadir.
 */
export async function updateKomdisEventStatus(
  id: string,
  status: z.infer<typeof updateEventStatusSchema>["status"],
): Promise<ActionResult<KomdisEvent>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = updateEventStatusSchema.safeParse({ id, status });
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_events")
      .update({ status: parsed.data.status })
      .eq("id", parsed.data.id)
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as KomdisEvent);
  } catch (err) {
    console.error("[updateKomdisEventStatus]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Hapus kegiatan (hanya draft) — khusus komdis */
export async function deleteKomdisEvent(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();

    // Hanya boleh hapus yang masih draft
    const { data: event } = await supabase
      .from("komdis_events")
      .select("status")
      .eq("id", id)
      .single();

    if (event?.status !== "draft") {
      return fail("Hanya kegiatan berstatus draft yang bisa dihapus.");
    }

    const { error } = await supabase
      .from("komdis_events")
      .delete()
      .eq("id", id);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[deleteKomdisEvent]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// QR TOKEN DINAMIS
// ═══════════════════════════════════════════════════════

/**
 * Generate atau refresh QR token — untuk semua anggota.
 * Token lama di-invalidate, token baru TTL 5 menit.
 */
export async function generateAttendanceToken(
  eventId: string,
): Promise<ActionResult<KomdisAttendanceToken>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(eventId);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();

    // Cek apakah sudah hadir
    const { data: existing } = await supabase
      .from("komdis_attendances")
      .select("id")
      .eq("event_id", eventId)
      .eq("user_id", auth.userId)
      .maybeSingle();

    if (existing) return fail("Anda sudah tercatat hadir di kegiatan ini.");

    // Cek event masih ongoing
    const { data: event } = await supabase
      .from("komdis_events")
      .select("status")
      .eq("id", eventId)
      .single();

    if (event?.status !== "ongoing") {
      return fail(
        "Absensi hanya bisa dilakukan saat kegiatan sedang berlangsung.",
      );
    }

    // Invalidate token lama
    await supabase
      .from("komdis_attendance_tokens")
      .update({ is_used: true })
      .eq("event_id", eventId)
      .eq("user_id", auth.userId)
      .eq("is_used", false);

    // Buat token baru
    const token = generateToken();
    const expiresAt = new Date(
      Date.now() + TOKEN_TTL_MINUTES * 60 * 1000,
    ).toISOString();

    const { data, error } = await supabase
      .from("komdis_attendance_tokens")
      .insert({
        event_id: eventId,
        user_id: auth.userId,
        token,
        expires_at: expiresAt,
      })
      .select()
      .single();

    if (error) return fail(error.message);
    return ok(data as KomdisAttendanceToken);
  } catch (err) {
    console.error("[generateAttendanceToken]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Scan QR token — khusus komdis.
 * Validasi token → catat kehadiran → deteksi telat.
 */
export async function scanAttendanceToken(
  input: z.infer<typeof scanAttendanceSchema>,
): Promise<
  ActionResult<{ userId: string; isLate: boolean; lateMinutes: number }>
> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = scanAttendanceSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const now = new Date();

    // Ambil token + event sekaligus
    const { data: tokenData, error: tErr } = await supabase
      .from("komdis_attendance_tokens")
      .select("*, komdis_events!inner(start_time, late_tolerance, status)")
      .eq("token", parsed.data.token)
      .eq("is_used", false)
      .single();

    if (tErr || !tokenData)
      return fail("Token tidak valid atau sudah digunakan.");

    // Cek expired
    if (new Date(tokenData.expires_at) < now) {
      return fail("Token sudah kadaluarsa. Minta anggota generate ulang QR.");
    }

    const event = Array.isArray(tokenData.komdis_events)
      ? tokenData.komdis_events[0]
      : tokenData.komdis_events;

    if (event.status !== "ongoing") {
      return fail("Kegiatan tidak sedang berlangsung.");
    }

    // Hitung keterlambatan
    const [startHour, startMin] = event.start_time.split(":").map(Number);
    const startMs = (startHour * 60 + startMin) * 60 * 1000;
    const nowMs = (now.getHours() * 60 + now.getMinutes()) * 60 * 1000;
    const diffMin = Math.floor((nowMs - startMs) / 60000);
    const tolerance = event.late_tolerance ?? 0;
    const isLate = diffMin > tolerance;
    const lateMin = isLate ? diffMin - tolerance : 0;

    // Tandai token sudah digunakan
    await supabase
      .from("komdis_attendance_tokens")
      .update({ is_used: true, used_at: now.toISOString() })
      .eq("id", tokenData.id);

    // Catat kehadiran
    const { error: attErr } = await supabase.from("komdis_attendances").insert({
      event_id: tokenData.event_id,
      user_id: tokenData.user_id,
      status: isLate ? "late" : "present",
      is_late: isLate,
      late_minutes: lateMin,
      scanned_at: now.toISOString(),
      scanned_by: auth.userId,
    });

    if (attErr) return fail(attErr.message);
    return ok({ userId: tokenData.user_id, isLate, lateMinutes: lateMin });
  } catch (err) {
    console.error("[scanAttendanceToken]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Absensi manual — khusus komdis.
 * Untuk metode non-QR atau koreksi data.
 */
export async function setManualAttendance(
  input: z.infer<typeof manualAttendanceSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = manualAttendanceSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("komdis_attendances").upsert(
      {
        event_id: parsed.data.eventId,
        user_id: parsed.data.userId,
        status: parsed.data.status,
        is_late: parsed.data.status === "late",
        late_minutes: parsed.data.lateMinutes,
        scanned_at: new Date().toISOString(),
        scanned_by: auth.userId,
      },
      { onConflict: "event_id,user_id" },
    );

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[setManualAttendance]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil data kehadiran per kegiatan — khusus komdis */
export async function getEventAttendances(
  eventId: string,
): Promise<ActionResult<KomdisAttendanceWithUser[]>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(eventId);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_attendances")
      .select(
        `
        *,
        profiles!komdis_attendances_user_id_fkey(full_name, nickname, avatar_url),
        komdis_sanctions(sanction_type, points, notes)
      `,
      )
      .eq("event_id", eventId)
      .order("scanned_at");

    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
      } as unknown as KomdisAttendanceWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getEventAttendances]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil kehadiran sendiri — untuk anggota */
export async function getMyAttendances(): Promise<
  ActionResult<KomdisAttendanceWithUser[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_attendances")
      .select(
        `
        *,
        komdis_events!inner(title, event_date, start_time)
      `,
      )
      .eq("user_id", auth.userId)
      .order("scanned_at", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as unknown as KomdisAttendanceWithUser[]);
  } catch (err) {
    console.error("[getMyAttendances]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// SANKSI KETERLAMBATAN
// ═══════════════════════════════════════════════════════

/**
 * Beri sanksi pada anggota yang telat — khusus komdis.
 * Jika sanksi poin, otomatis insert ke komdis_violations.
 */
export async function giveSanction(
  input: z.infer<typeof giveSanctionSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = giveSanctionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    if (parsed.data.sanctionType === "points" && parsed.data.points <= 0) {
      return fail("Sanksi poin harus lebih dari 0.");
    }

    const supabase = await createClient();

    // Ambil data attendance untuk validasi
    const { data: attendance, error: aErr } = await supabase
      .from("komdis_attendances")
      .select("user_id, event_id, is_late, status")
      .eq("id", parsed.data.attendanceId)
      .single();

    if (aErr || !attendance) return fail("Data kehadiran tidak ditemukan.");
    if (!attendance.is_late)
      return fail("Sanksi hanya untuk anggota yang terlambat.");

    // Insert sanksi
    const { data: sanction, error: sErr } = await supabase
      .from("komdis_sanctions")
      .insert({
        event_id: attendance.event_id,
        user_id: attendance.user_id,
        attendance_id: parsed.data.attendanceId,
        sanction_type: parsed.data.sanctionType,
        points:
          parsed.data.sanctionType === "physical" ? 0 : parsed.data.points,
        notes: parsed.data.notes ?? null,
        given_by: auth.userId,
      })
      .select("id")
      .single();

    if (sErr) return fail(sErr.message);

    // Jika sanksi poin, langsung insert ke violations
    if (parsed.data.sanctionType === "points" && parsed.data.points > 0) {
      const { error: vErr } = await supabase.from("komdis_violations").insert({
        user_id: attendance.user_id,
        category: "attendance",
        description: "Terlambat hadir kegiatan",
        points: parsed.data.points,
        event_id: attendance.event_id,
        sanction_id: sanction.id,
        given_by: auth.userId,
      });

      if (vErr) return fail(vErr.message);
    }

    return ok({ success: true });
  } catch (err) {
    console.error("[giveSanction]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// PELANGGARAN & POIN
// ═══════════════════════════════════════════════════════

/** Ambil semua pelanggaran — khusus komdis */
export async function getViolations(filters?: {
  userId?: string;
  category?: string;
}): Promise<ActionResult<KomdisViolationWithUser[]>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    let query = supabase
      .from("komdis_violations")
      .select(
        `
        *,
        profiles!komdis_violations_user_id_fkey(full_name, nickname, avatar_url)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.userId) query = query.eq("user_id", filters.userId);
    if (filters?.category)
      query = query.eq("category", filters.category as KomdisViolationCategory);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
      } as unknown as KomdisViolationWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getViolations]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Konfirmasi poin untuk anggota absent — khusus komdis.
 * Dipanggil setelah komdis review daftar absent dari kegiatan selesai.
 */
export async function confirmAbsentViolation(
  attendanceId: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(attendanceId);
    if (!parsed.success) return fail("ID kehadiran tidak valid.");

    const supabase = await createClient();

    // Ambil data attendance + poin default event
    const { data: att, error: aErr } = await supabase
      .from("komdis_attendances")
      .select(
        `
        user_id, event_id, status,
        komdis_events!inner(points_per_late, title)
      `,
      )
      .eq("id", attendanceId)
      .single();

    if (aErr || !att) return fail("Data kehadiran tidak ditemukan.");
    if (att.status !== "absent")
      return fail("Hanya untuk anggota yang tidak hadir.");

    const event = Array.isArray(att.komdis_events)
      ? att.komdis_events[0]
      : att.komdis_events;

    // Cek apakah sudah ada violations untuk attendance ini
    const { data: existing } = await supabase
      .from("komdis_violations")
      .select("id")
      .eq("event_id", att.event_id)
      .eq("user_id", att.user_id)
      .eq("category", "attendance")
      .maybeSingle();

    if (existing) return fail("Poin untuk anggota ini sudah dikonfirmasi.");

    const { error: vErr } = await supabase.from("komdis_violations").insert({
      user_id: att.user_id,
      category: "attendance",
      description: `Tidak hadir: ${event.title}`,
      points: event.points_per_late,
      event_id: att.event_id,
      given_by: auth.userId,
    });

    if (vErr) return fail(vErr.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[confirmAbsentViolation]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Input pelanggaran manual — khusus komdis */
export async function createViolation(
  input: z.infer<typeof createViolationSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = createViolationSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("komdis_violations").insert({
      user_id: parsed.data.userId,
      category: parsed.data.category,
      description: parsed.data.description,
      points: parsed.data.points,
      event_id: parsed.data.eventId ?? null,
      sanction_id: parsed.data.sanctionId ?? null,
      given_by: auth.userId,
    });

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[createViolation]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update pelanggaran — khusus komdis */
export async function updateViolation(
  id: string,
  input: {
    category?: KomdisViolationCategory;
    description?: string;
    points?: number;
  },
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID pelanggaran tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_violations")
      .update(input)
      .eq("id", id);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[updateViolation]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Hapus pelanggaran — khusus komdis */
export async function deleteViolation(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID pelanggaran tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_violations")
      .delete()
      .eq("id", id);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[deleteViolation]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil total poin per anggota — khusus komdis */
export async function getMemberPointSummaries(): Promise<
  ActionResult<KomdisMemberPointSummary[]>
> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const [{ data: violations }, { data: reductions }] = await Promise.all([
      supabase.from("komdis_violations").select(`
          user_id, points,
          profiles!komdis_violations_user_id_fkey(full_name, nickname, avatar_url)
        `),
      supabase
        .from("komdis_point_reductions")
        .select("user_id, approved_points")
        .eq("status", "approved"),
    ]);

    // Agregasi violations
    const summaryMap = new Map<string, KomdisMemberPointSummary>();

    for (const d of violations ?? []) {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      if (!summaryMap.has(d.user_id)) {
        summaryMap.set(d.user_id, {
          user_id: d.user_id,
          full_name: profile?.full_name ?? "",
          nickname: profile?.nickname ?? null,
          avatar_url: profile?.avatar_url ?? null,
          email: "",
          total_violations: 0,
          total_points: 0,
          total_reductions: 0,
          net_points: 0,
        });
      }
      const entry = summaryMap.get(d.user_id)!;
      entry.total_violations += 1;
      entry.total_points += d.points;
    }

    // Agregasi reductions
    for (const r of reductions ?? []) {
      if (summaryMap.has(r.user_id)) {
        const entry = summaryMap.get(r.user_id)!;
        entry.total_reductions += r.approved_points ?? 0;
      }
    }

    // Hitung net_points
    for (const entry of summaryMap.values()) {
      entry.net_points = Math.max(
        0,
        entry.total_points - entry.total_reductions,
      );
    }

    return ok(Array.from(summaryMap.values()));
  } catch (err) {
    console.error("[getMemberPointSummaries]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil semua anggota aktif — khusus komdis */
export async function getAllMembers(): Promise<
  ActionResult<{ id: string; full_name: string; email: string }[]>
> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      // 1. HAPUS 'email' dari dalam select
      .select("user_id, full_name")
      .in("role", ["anggota", "pengurus", "admin"])
      .order("full_name");

    if (error) return fail(error.message);

    return ok(
      (data ?? []).map((d) => ({
        id: d.user_id,
        full_name: d.full_name ?? "",
        // 2. Karena email tidak ada di profil, kita berikan string kosong sementara
        // Jika email wajib ada, kamu harus mengubah arsitektur database untuk men-sinkronisasi email ke tabel profiles
        email: "",
      })),
    );
  } catch (err) {
    console.error("[getAllMembers]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil statistik kehadiran per kegiatan — khusus komdis */
export async function getEventStats(eventId: string): Promise<
  ActionResult<{
    totalPresent: number;
    totalLate: number;
    totalAbsent: number;
    totalSanctionPhysical: number;
    totalSanctionPoints: number;
  }>
> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(eventId);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();

    const [{ data: attendances }, { data: sanctions }] = await Promise.all([
      supabase
        .from("komdis_attendances")
        .select("status")
        .eq("event_id", eventId),
      supabase
        .from("komdis_sanctions")
        .select("sanction_type, points")
        .eq("event_id", eventId),
    ]);

    const att = attendances ?? [];
    const san = sanctions ?? [];

    return ok({
      totalPresent: att.filter((a) => a.status === "present").length,
      totalLate: att.filter((a) => a.status === "late").length,
      totalAbsent: att.filter((a) => a.status === "absent").length,
      totalSanctionPhysical: san.filter((s) => s.sanction_type === "physical")
        .length,
      totalSanctionPoints: san
        .filter((s) => s.sanction_type === "points")
        .reduce((sum, s) => sum + (s.points ?? 0), 0),
    });
  } catch (err) {
    console.error("[getEventStats]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil total poin sendiri — untuk anggota */
export async function getMyPoints(): Promise<
  ActionResult<{ totalPoints: number; violations: KomdisViolationWithUser[] }>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_violations")
      .select("*")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);

    const violations = (data ?? []) as unknown as KomdisViolationWithUser[];
    const totalPoints = violations.reduce((sum, v) => sum + v.points, 0);

    return ok({ totalPoints, violations });
  } catch (err) {
    console.error("[getMyPoints]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// PENEBUSAN POIN
// ═══════════════════════════════════════════════════════

/** Ajukan penebusan poin — untuk anggota */
export async function submitPointReduction(
  input: z.infer<typeof submitReductionSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = submitReductionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase.from("komdis_point_reductions").insert({
      user_id: auth.userId,
      points: parsed.data.points,
      reason: parsed.data.reason,
      evidence_url: parsed.data.evidenceUrl ?? null,
      status: "pending",
    });

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[submitPointReduction]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil semua pengajuan penebusan — khusus komdis */
export async function getPointReductions(filters?: {
  status?: string;
}): Promise<ActionResult<KomdisPointReductionWithUser[]>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    let query = supabase
      .from("komdis_point_reductions")
      .select(
        `
        *,
        profiles!komdis_point_reductions_user_id_fkey(full_name, nickname, avatar_url)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.status)
      query = query.eq("status", filters.status as KomdisReductionStatus);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
      } as unknown as KomdisPointReductionWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getPointReductions]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Review pengajuan penebusan poin — khusus komdis */
export async function reviewPointReduction(
  input: z.infer<typeof reviewReductionSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = reviewReductionSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    if (parsed.data.status === "approved" && !parsed.data.approvedPoints) {
      return fail("Jumlah poin yang disetujui harus diisi.");
    }

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_point_reductions")
      .update({
        status: parsed.data.status,
        reviewed_by: auth.userId,
        reviewed_at: new Date().toISOString(),
        review_notes: parsed.data.reviewNotes ?? null,
        approved_points: parsed.data.approvedPoints ?? null,
      })
      .eq("id", parsed.data.reductionId)
      .eq("status", "pending");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[reviewPointReduction]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// SURAT PERINGATAN (SP)
// ═══════════════════════════════════════════════════════

/** Ambil semua SP — khusus komdis */
export async function getWarningLetters(filters?: {
  userId?: string;
  level?: string;
  status?: string;
}): Promise<ActionResult<KomdisWarningLetterWithUser[]>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    let query = supabase
      .from("komdis_warning_letters")
      .select(
        `
        *,
        profiles!komdis_warning_letters_user_id_fkey(full_name, nickname, avatar_url)
      `,
      )
      .order("created_at", { ascending: false });

    if (filters?.userId) query = query.eq("user_id", filters.userId);
    if (filters?.level)
      query = query.eq("level", filters.level as KomdisSpLevel);
    if (filters?.status)
      query = query.eq("status", filters.status as KomdisSpStatus);

    const { data, error } = await query;
    if (error) return fail(error.message);

    const mapped = (data ?? []).map((d) => {
      const profile = Array.isArray(d.profiles) ? d.profiles[0] : d.profiles;
      return {
        ...d,
        full_name: profile?.full_name ?? "",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        profiles: undefined,
      } as unknown as KomdisWarningLetterWithUser;
    });

    return ok(mapped);
  } catch (err) {
    console.error("[getWarningLetters]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil SP milik sendiri — untuk anggota */
export async function getMySP(): Promise<
  ActionResult<KomdisWarningLetterWithUser[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("komdis_warning_letters")
      .select("*")
      .eq("user_id", auth.userId)
      .in("status", ["issued", "acknowledged"])
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as unknown as KomdisWarningLetterWithUser[]);
  } catch (err) {
    console.error("[getMySP]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Akui SP yang diterima — untuk anggota */
export async function acknowledgeSP(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID SP tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_warning_letters")
      .update({
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", auth.userId) // Pastikan milik sendiri
      .eq("status", "issued");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[acknowledgeSP]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Update SP draft — khusus komdis */
export async function updateWarningLetter(
  id: string,
  input: {
    level?: KomdisSpLevel;
    subject?: string;
    reason?: string;
    violations_summary?: string | null;
    consequences?: string | null;
    effective_date?: string | null;
    expiry_date?: string | null;
  },
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID SP tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_warning_letters")
      .update(input)
      .eq("id", id)
      .eq("status", "draft");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[updateWarningLetter]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Buat SP baru (draft) — khusus komdis */
export async function createWarningLetter(
  input: z.infer<typeof createSpSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = createSpSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();

    // Generate nomor surat berdasarkan sequence
    const { count } = await supabase
      .from("komdis_warning_letters")
      .select("id", { count: "exact", head: true });

    const letterNumber = generateLetterNumber(
      parsed.data.level,
      (count ?? 0) + 1,
    );

    const { error } = await supabase.from("komdis_warning_letters").insert({
      user_id: parsed.data.userId,
      letter_number: letterNumber,
      level: parsed.data.level,
      status: "draft",
      subject: parsed.data.subject,
      reason: parsed.data.reason,
      violations_summary: parsed.data.violationsSummary ?? null,
      consequences: parsed.data.consequences ?? null,
      effective_date: parsed.data.effectiveDate ?? null,
      expiry_date: parsed.data.expiryDate ?? null,
      points_at_issue: parsed.data.pointsAtIssue,
      issued_by: auth.userId,
    });

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[createWarningLetter]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Terbitkan SP (draft → issued) — khusus komdis */
export async function issueWarningLetter(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID SP tidak valid.");

    const today = new Date().toISOString().split("T")[0];
    const supabase = await createClient();

    const { error } = await supabase
      .from("komdis_warning_letters")
      .update({
        status: "issued",
        issued_date: today,
        effective_date: today,
      })
      .eq("id", id)
      .eq("status", "draft");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[issueWarningLetter]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Cabut SP — khusus komdis */
export async function revokeWarningLetter(
  input: z.infer<typeof revokeSpSchema>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = revokeSpSchema.safeParse(input);
    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_warning_letters")
      .update({
        status: "revoked",
        revoked_by: auth.userId,
        revoked_at: new Date().toISOString(),
        revoke_reason: parsed.data.reason,
      })
      .eq("id", parsed.data.id)
      .in("status", ["issued", "acknowledged"]);

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[revokeWarningLetter]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Hapus SP (hanya draft) — khusus komdis */
export async function deleteWarningLetter(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID SP tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase
      .from("komdis_warning_letters")
      .delete()
      .eq("id", id)
      .eq("status", "draft");

    if (error) return fail(error.message);
    return ok({ success: true });
  } catch (err) {
    console.error("[deleteWarningLetter]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// DASHBOARD STATISTIK
// ═══════════════════════════════════════════════════════

export interface KomdisDashboardStats {
  totalEvents: number;
  ongoingEvents: number;
  upcomingEvents: number;
  completedEvents: number;
  totalPresent: number;
  totalLate: number;
  totalViolations: number;
  totalPoints: number;
  totalReductions: number;
  pendingReductions: number;
  totalSp: number;
  activeSp: number;
  sp1Count: number;
  sp2Count: number;
  sp3Count: number;
}

/** Ambil statistik gabungan dashboard komdis */
export async function getKomdisDashboardStats(): Promise<
  ActionResult<KomdisDashboardStats>
> {
  try {
    const auth = await requireModule("komisi-disiplin");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const [
      { data: events },
      { data: attendances },
      { data: violations },
      { data: reductions },
      { data: sps },
    ] = await Promise.all([
      supabase.from("komdis_events").select("status"),
      supabase.from("komdis_attendances").select("status"),
      supabase.from("komdis_violations").select("points"),
      supabase
        .from("komdis_point_reductions")
        .select("status, approved_points"),
      supabase.from("komdis_warning_letters").select("level, status"),
    ]);

    const ev = events ?? [];
    const att = attendances ?? [];
    const viol = violations ?? [];
    const red = reductions ?? [];
    const sp = sps ?? [];

    return ok({
      totalEvents: ev.length,
      ongoingEvents: ev.filter((e) => e.status === "ongoing").length,
      upcomingEvents: ev.filter((e) => e.status === "upcoming").length,
      completedEvents: ev.filter((e) => e.status === "completed").length,
      totalPresent: att.filter((a) => a.status === "present").length,
      totalLate: att.filter((a) => a.status === "late").length,
      totalViolations: viol.length,
      totalPoints: viol.reduce((sum, v) => sum + v.points, 0),
      totalReductions: red
        .filter((r) => r.status === "approved")
        .reduce((sum, r) => sum + (r.approved_points ?? 0), 0),
      pendingReductions: red.filter((r) => r.status === "pending").length,
      totalSp: sp.length,
      activeSp: sp.filter(
        (s) => s.status === "issued" || s.status === "acknowledged",
      ).length,
      sp1Count: sp.filter((s) => s.level === "sp1" && s.status !== "revoked")
        .length,
      sp2Count: sp.filter((s) => s.level === "sp2" && s.status !== "revoked")
        .length,
      sp3Count: sp.filter((s) => s.level === "sp3" && s.status !== "revoked")
        .length,
    });
  } catch (err) {
    console.error("[getKomdisDashboardStats]", err);
    return fail("Terjadi kesalahan.");
  }
}
