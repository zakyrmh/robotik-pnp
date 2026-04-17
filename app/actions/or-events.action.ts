"use server";

/**
 * Server Actions — Kegiatan & Absensi OR
 *
 * Guard akses:
 * - requireModule('open-recruitment') → OR admin, admin, super_admin
 * - requireAuth()                     → caang (read-only)
 */

import { z } from "zod";
import { revalidatePath } from "next/cache";
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
  OrEvent,
  OrEventAttendance,
  OrEventAttendanceWithUser,
  OrAttendanceStatus,
} from "@/lib/db/schema/or";
import { orEventUpsertSchema } from "@/lib/validations/or-events.validation";
import { ZodIssue } from "zod";

// ═══════════════════════════════════════════════════════
// READ — UNTUK CAANG
// ═══════════════════════════════════════════════════════

/** Ambil 3 kegiatan terdekat untuk caang */
export async function getUpcomingEventsForCaang(): Promise<
  ActionResult<OrEvent[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .eq("status", "published")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true })
      .limit(3);

    if (error) return fail(error.message);
    return ok(data as OrEvent[]);
  } catch (err) {
    console.error("[getUpcomingEventsForCaang]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil semua kegiatan published/completed untuk caang */
export async function getAllEventsForCaang(): Promise<ActionResult<OrEvent[]>> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .in("status", ["published", "completed"])
      .order("event_date", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as OrEvent[]);
  } catch (err) {
    console.error("[getAllEventsForCaang]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Ambil rekap absensi caang sendiri */
export async function getMyAttendances(): Promise<
  ActionResult<(OrEventAttendance & { event: OrEvent })[]>
> {
  try {
    const auth = await requireAuth();
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_event_attendances")
      .select("*, event:or_events(*)")
      .eq("user_id", auth.userId)
      .order("created_at", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as unknown as (OrEventAttendance & { event: OrEvent })[]);
  } catch (err) {
    console.error("[getMyAttendances]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// CRUD KEGIATAN — KHUSUS OR ADMIN
// ═══════════════════════════════════════════════════════

/** Ambil semua kegiatan — khusus OR admin */
export async function adminGetEvents(): Promise<ActionResult<OrEvent[]>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) return fail(error.message);
    return ok(data as OrEvent[]);
  } catch (err) {
    console.error("[adminGetEvents]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Buat atau update kegiatan — khusus OR admin */
export async function adminSaveEvent(
  event: Partial<OrEvent>,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const validated = orEventUpsertSchema.safeParse(event);
    if (!validated.success) {
      const msg = validated.error.issues
        .map((e: ZodIssue) => e.message)
        .join(", ");
      return fail(msg);
    }

    const payload = {
      ...validated.data,
      created_by: auth.userId,
      updated_at: new Date().toISOString(),
    };

    const supabase = await createClient();

    if (event.id) {
      const { error } = await supabase
        .from("or_events")
        .update(payload)
        .eq("id", event.id);
      if (error) return fail(error.message);
    } else {
      const { error } = await supabase.from("or_events").insert([payload]);
      if (error) return fail(error.message);
    }

    revalidatePath("/dashboard/or/kegiatan/jadwal");
    revalidatePath("/dashboard/caang/kegiatan");
    revalidatePath("/dashboard/caang");
    return ok({ success: true });
  } catch (err) {
    console.error("[adminSaveEvent]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Hapus kegiatan — khusus OR admin */
export async function adminDeleteEvent(
  id: string,
): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(id);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();
    const { error } = await supabase.from("or_events").delete().eq("id", id);

    if (error) return fail(error.message);

    revalidatePath("/dashboard/or/kegiatan/jadwal");
    revalidatePath("/dashboard/caang/kegiatan");
    return ok({ success: true });
  } catch (err) {
    console.error("[adminDeleteEvent]", err);
    return fail("Terjadi kesalahan.");
  }
}

// ═══════════════════════════════════════════════════════
// ABSENSI — KHUSUS OR ADMIN
// ═══════════════════════════════════════════════════════

/**
 * Ambil daftar absensi per kegiatan — khusus OR admin.
 * Mencakup semua caang yang sudah lolos verifikasi berkas (accepted ke atas).
 */
export async function adminGetAttendanceList(
  eventId: string,
  search?: string,
): Promise<ActionResult<OrEventAttendanceWithUser[]>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z.string().uuid().safeParse(eventId);
    if (!parsed.success) return fail("ID kegiatan tidak valid.");

    const supabase = await createClient();

    // Ambil semua caang yang sudah lolos verifikasi berkas
    const { data: caangData, error: caangErr } = await supabase
      .from("or_registrations")
      .select(
        `
        user_id,
        users (
          profiles (full_name, nickname, avatar_url),
          education_details (nim)
        )
      `,
      )
      .not("status", "in", '("draft","submitted","revision","rejected")');

    if (caangErr) return fail(caangErr.message);

    // Ambil data absensi yang sudah ada
    const { data: attendanceData, error: attErr } = await supabase
      .from("or_event_attendances")
      .select("*")
      .eq("event_id", eventId);

    if (attErr) return fail(attErr.message);

    const attendanceMap = new Map(
      (attendanceData ?? []).map((a) => [a.user_id, a]),
    );

    const result: OrEventAttendanceWithUser[] = (caangData ?? []).map((c) => {
      const existing = attendanceMap.get(c.user_id);
      const usr = c.users as unknown as {
        profiles: {
          full_name: string;
          nickname: string | null;
          avatar_url: string | null;
        } | null;
        education_details: { nim: string | null } | null;
      } | null;
      const profile = usr?.profiles;
      const edu = usr?.education_details;

      return {
        id: existing?.id ?? "",
        event_id: eventId,
        user_id: c.user_id,
        status: (existing?.status ?? "absent") as OrAttendanceStatus,
        checked_in_at: existing?.checked_in_at ?? null,
        notes: existing?.notes ?? null,
        points: existing?.points ?? 0,
        created_at: existing?.created_at ?? "",
        updated_at: existing?.updated_at ?? "",
        full_name: profile?.full_name ?? "Tanpa Nama",
        nickname: profile?.nickname ?? null,
        avatar_url: profile?.avatar_url ?? null,
        nim: edu?.nim ?? null,
      };
    });

    // Client-side search
    const filtered = search
      ? result.filter(
          (r) =>
            r.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (r.nim?.toLowerCase().includes(search.toLowerCase()) ?? false),
        )
      : result;

    return ok(filtered);
  } catch (err) {
    console.error("[adminGetAttendanceList]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Submit absensi manual — khusus OR admin */
export async function adminSubmitAttendance(input: {
  id?: string;
  event_id: string;
  user_id: string;
  status: OrAttendanceStatus;
  notes?: string | null;
  checked_in_at?: string | null;
  points?: number;
}): Promise<ActionResult<{ success: boolean }>> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsed = z
      .object({
        id: z.string().uuid().optional(),
        event_id: z.string().uuid(),
        user_id: z.string().uuid(),
        status: z.enum(["present", "late", "absent"]),
        notes: z.string().max(500).nullable().optional(),
        checked_in_at: z.string().nullable().optional(),
        points: z.number().int().min(0).optional(),
      })
      .safeParse(input);

    if (!parsed.success) return fail(parsed.error.issues[0].message);

    const supabase = await createClient();
    const payload = {
      event_id: parsed.data.event_id,
      user_id: parsed.data.user_id,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
      checked_in_at: parsed.data.checked_in_at ?? new Date().toISOString(),
      points: parsed.data.points ?? 0,
      updated_at: new Date().toISOString(),
    };

    if (parsed.data.id) {
      const { error } = await supabase
        .from("or_event_attendances")
        .update(payload)
        .eq("id", parsed.data.id);
      if (error) return fail(error.message);
    } else {
      const { error } = await supabase
        .from("or_event_attendances")
        .insert([payload]);
      if (error) return fail(error.message);
    }

    revalidatePath("/dashboard/or/kegiatan/absensi");
    return ok({ success: true });
  } catch (err) {
    console.error("[adminSubmitAttendance]", err);
    return fail("Terjadi kesalahan.");
  }
}

/**
 * Scan token QR absensi caang — khusus OR admin.
 * Token di-invalidate setelah scan (one-time use).
 */
export async function adminScanAttendanceToken(
  token: string,
  eventId: string,
): Promise<
  ActionResult<{ fullName: string; status: OrAttendanceStatus; points: number }>
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const parsedToken = z.string().min(1).safeParse(token);
    const parsedEventId = z.string().uuid().safeParse(eventId);
    if (!parsedToken.success || !parsedEventId.success) {
      return fail("Token atau ID kegiatan tidak valid.");
    }

    const supabase = await createClient();
    const now = new Date();

    // Cari token yang valid
    const { data: tokenData, error: tokenErr } = await supabase
      .from("or_attendance_tokens")
      .select("*, users:user_id(profiles(full_name))")
      .eq("token", token)
      .eq("event_id", eventId)
      .gt("expires_at", now.toISOString())
      .single();

    if (tokenErr || !tokenData) {
      return fail("Token tidak valid atau sudah kadaluarsa.");
    }

    // Ambil konfigurasi event
    const { data: event, error: eventErr } = await supabase
      .from("or_events")
      .select(
        "event_date, start_time, late_tolerance, points_present, points_late",
      )
      .eq("id", eventId)
      .single();

    if (eventErr || !event) return fail("Kegiatan tidak ditemukan.");

    // Hitung status telat
    const eventStart = new Date(`${event.event_date}T${event.start_time}`);
    const diffMinutes = (now.getTime() - eventStart.getTime()) / (1000 * 60);
    const isLate = diffMinutes > (event.late_tolerance ?? 0);
    const status: OrAttendanceStatus = isLate ? "late" : "present";
    const points = isLate
      ? (event.points_late ?? 0)
      : (event.points_present ?? 1);

    // Catat absensi
    const { error: upsertErr } = await supabase
      .from("or_event_attendances")
      .upsert(
        {
          event_id: eventId,
          user_id: tokenData.user_id,
          status,
          points,
          checked_in_at: now.toISOString(),
          notes: "Scan QR Digital",
          updated_at: now.toISOString(),
        },
        { onConflict: "event_id,user_id" },
      );

    if (upsertErr) return fail("Gagal mencatat absensi.");

    // Invalidate token (one-time use)
    await supabase.from("or_attendance_tokens").delete().eq("id", tokenData.id);

    const users = tokenData.users as unknown as {
      profiles: { full_name: string } | null;
    } | null;
    const fullName = users?.profiles?.full_name ?? "Caang";

    return ok({ fullName, status, points });
  } catch (err) {
    console.error("[adminScanAttendanceToken]", err);
    return fail("Terjadi kesalahan.");
  }
}

/** Rekapitulasi poin seluruh caang — khusus OR admin */
export async function adminGetAttendanceSummary(): Promise<
  ActionResult<
    {
      user_id: string;
      full_name: string;
      nim: string | null;
      total_points: number;
      present_count: number;
      late_count: number;
      absent_count: number;
      total_events: number;
    }[]
  >
> {
  try {
    const auth = await requireModule("open-recruitment");
    if (isActionError(auth)) return auth;

    const supabase = await createClient();

    const [
      { data: registrations, error: regErr },
      { data: attendances, error: attErr },
    ] = await Promise.all([
      supabase
        .from("or_registrations")
        .select(
          `
          user_id,
          users:user_id (
            profiles (full_name),
            education_details (nim)
          )
        `,
        )
        .not("status", "eq", "rejected"),
      supabase.from("or_event_attendances").select("user_id, status, points"),
    ]);

    if (regErr) return fail(regErr.message);
    if (attErr) return fail(attErr.message);

    const summaryMap = new Map<
      string,
      {
        user_id: string;
        full_name: string;
        nim: string | null;
        total_points: number;
        present_count: number;
        late_count: number;
        absent_count: number;
        total_events: number;
      }
    >();

    for (const r of registrations ?? []) {
      const usr = r.users as unknown as {
        profiles: { full_name: string } | null;
        education_details: { nim: string | null } | null;
      } | null;
      summaryMap.set(r.user_id, {
        user_id: r.user_id,
        full_name: usr?.profiles?.full_name ?? "Tanpa Nama",
        nim: usr?.education_details?.nim ?? null,
        total_points: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        total_events: 0,
      });
    }

    for (const a of attendances ?? []) {
      const entry = summaryMap.get(a.user_id);
      if (!entry) continue;
      entry.total_points += a.points ?? 0;
      entry.total_events += 1;
      if (a.status === "present") entry.present_count += 1;
      else if (a.status === "late") entry.late_count += 1;
      else if (a.status === "absent") entry.absent_count += 1;
    }

    const result = Array.from(summaryMap.values()).sort(
      (a, b) => b.total_points - a.total_points,
    );

    return ok(result);
  } catch (err) {
    console.error("[adminGetAttendanceSummary]", err);
    return fail("Terjadi kesalahan.");
  }
}
