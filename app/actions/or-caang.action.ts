"use server";

import { createClient } from "@/lib/supabase/server";
import {
  OrEvent,
  OrAttendanceToken,
  OrEventAttendance,
} from "@/lib/db/schema/or";

interface ActionResult<T> {
  data: T | null;
  error: string | null;
}

/**
 * Mengambil daftar kegiatan yang dipublikasikan untuk caang
 */
export async function caangGetEvents(): Promise<ActionResult<OrEvent[]>> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .eq("status", "published")
      .order("event_date", { ascending: true })
      .order("start_time", { ascending: true });

    if (error) return { data: null, error: error.message };
    return { data: data as OrEvent[], error: null };
  } catch (error) {
    console.error("[caangGetEvents]", error);
    return { data: null, error: "Gagal memuat jadwal kegiatan." };
  }
}

/**
 * Generate atau ambil token QR absensi yang masih valid (5 menit)
 */
export async function caangGenerateAttendanceToken(
  eventId: string,
): Promise<ActionResult<OrAttendanceToken>> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    // 1. Cek apakah sudah ada token yang belum expired
    const now = new Date().toISOString();
    const { data: existing } = await supabase
      .from("or_attendance_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("event_id", eventId)
      .gt("expires_at", now)
      .maybeSingle();

    if (existing) {
      return { data: existing as OrAttendanceToken, error: null };
    }

    // 2. Jika tidak ada, generate token baru
    const randomSuffix = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase();
    const tokenStr = `ATT-${user.id.substring(0, 4)}-${randomSuffix}`;
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString(); // 5 menit

    const { data: newToken, error: insertErr } = await supabase
      .from("or_attendance_tokens")
      .insert([
        {
          user_id: user.id,
          event_id: eventId,
          token: tokenStr,
          expires_at: expiresAt,
        },
      ])
      .select()
      .single();

    if (insertErr) return { data: null, error: insertErr.message };

    return { data: newToken as OrAttendanceToken, error: null };
  } catch (error) {
    console.error("[caangGenerateAttendanceToken]", error);
    return { data: null, error: "Gagal generate token absensi." };
  }
}

/**
 * Mengambil rekap absensi milik caang sendiri
 */
export async function caangGetMyAttendance(): Promise<
  ActionResult<(OrEventAttendance & { or_events: OrEvent })[]>
> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: null, error: "Unauthorized" };

    const { data, error } = await supabase
      .from("or_event_attendances")
      .select(
        `
        *,
        or_events (*)
      `,
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return {
      data: data as (OrEventAttendance & { or_events: OrEvent })[],
      error: null,
    };
  } catch (error) {
    console.error("[caangGetMyAttendance]", error);
    return { data: null, error: "Gagal memuat rekap absensi." };
  }
}
