"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type OrEventMode = "offline" | "online" | "hybrid";
export type OrEventStatus = "draft" | "published" | "completed";
export type OrAttendanceStatus = "present" | "absent" | "excused" | "late";

export interface OrEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  event_date: string;
  start_time: string;
  end_time: string | null;
  location: string | null;
  execution_mode: OrEventMode;
  meeting_link: string | null;
  status: OrEventStatus;
  created_at: string;
}

export interface OrAttendance {
  id: string;
  event_id: string;
  user_id: string;
  status: OrAttendanceStatus;
  checked_in_at: string | null;
  notes: string | null;
  event?: OrEvent;
}

/**
 * Mengambil 3 kegiatan terdekat yang sudah dipublish untuk caang
 */
export async function getUpcomingEventsForCaang(): Promise<{
  data: OrEvent[];
  error: string | null;
}> {
  try {
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

    if (error) return { data: [], error: error.message };
    return { data: data as OrEvent[], error: null };
  } catch (error) {
    console.error("[getUpcomingEventsForCaang]", error);
    return { data: [], error: "Gagal memuat jadwal kegiatan." };
  }
}

/**
 * Mengambil seluruh kegiatan (published/completed) untuk caang
 */
export async function getAllEventsForCaang(): Promise<{
  data: OrEvent[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .in("status", ["published", "completed"])
      .order("event_date", { ascending: false })
      .order("start_time", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as OrEvent[], error: null };
  } catch (error) {
    console.error("[getAllEventsForCaang]", error);
    return { data: [], error: "Gagal memuat daftar kegiatan." };
  }
}

/**
 * Mengambil rekap absensi milik caang sendiri
 */
export async function getMyAttendances(): Promise<{
  data: OrAttendance[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { data: [], error: "Unauthorized" };

    const { data, error } = await supabase
      .from("or_event_attendances")
      .select("*, event:or_events(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as OrAttendance[], error: null };
  } catch (error) {
    console.error("[getMyAttendances]", error);
    return { data: [], error: "Gagal memuat rekap absensi." };
  }
}

// ── Admin Actions ──

/**
 * Mengambil seluruh kegiatan untuk admin
 */
export async function adminGetEvents(): Promise<{
  data: OrEvent[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("or_events")
      .select("*")
      .order("event_date", { ascending: false });

    if (error) return { data: [], error: error.message };
    return { data: data as OrEvent[], error: null };
  } catch (error) {
    console.error("[adminGetEvents]", error);
    return { data: [], error: "Gagal memuat kegiatan." };
  }
}

/**
 * Membuat atau mengupdate kegiatan (Admin)
 */
export async function adminSaveEvent(
  event: Partial<OrEvent>,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { success: false, error: "Unauthorized" };

    const payload = {
      ...event,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from("or_events")
      .upsert(payload)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/or/kegiatan/jadwal");
    revalidatePath("/dashboard/kegiatan");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (error) {
    console.error("[adminSaveEvent]", error);
    return { success: false, error: "Gagal menyimpan kegiatan." };
  }
}

/**
 * Menghapus kegiatan (Admin)
 */
export async function adminDeleteEvent(
  id: string,
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { error } = await supabase.from("or_events").delete().eq("id", id);
    if (error) return { success: false, error: error.message };

    revalidatePath("/dashboard/or/kegiatan/jadwal");
    revalidatePath("/dashboard/kegiatan");
    revalidatePath("/dashboard");

    return { success: true, error: null };
  } catch (error) {
    console.error("[adminDeleteEvent]", error);
    return { success: false, error: "Gagal menghapus kegiatan." };
  }
}
