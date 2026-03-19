"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { ZodIssue } from "zod";
import {
  OrEvent,
  OrEventAttendance,
  OrEventAttendanceWithUser,
  OrAttendanceStatus,
} from "@/lib/db/schema/or";
import { orEventUpsertSchema } from "@/lib/db/validations/or-events.validation";

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
  data: (OrEventAttendance & { event: OrEvent })[];
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
    return {
      data: data as (OrEventAttendance & { event: OrEvent })[],
      error: null,
    };
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

    // Validasi dengan Zod
    const validated = orEventUpsertSchema.safeParse(event);
    if (!validated.success) {
      const errorMsg = validated.error.issues
        .map((e: ZodIssue) => e.message)
        .join(", ");
      return { success: false, error: errorMsg };
    }

    const payload = {
      ...validated.data,
      created_by: user.id,
      updated_at: new Date().toISOString(),
    };

    // Jika ada ID, berarti update. Jika tidak, insert.
    if (event.id) {
      const { error } = await supabase
        .from("or_events")
        .update(payload)
        .eq("id", event.id);

      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabase.from("or_events").insert([payload]);

      if (error) return { success: false, error: error.message };
    }

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

/**
 * Mengambil daftar seluruh caang beserta status absensi untuk event tertentu (Admin)
 */
export async function adminGetAttendanceList(
  eventId: string,
  search?: string,
): Promise<{
  data: OrEventAttendanceWithUser[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // 1. Ambil semua caang yang statusnya minimal 'accepted' (lolos berkas)
    // Menggunakan query dari or.action.ts sebagai referensi
    const { data: caangData, error: caangError } = await supabase
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

    if (caangError) return { data: [], error: caangError.message };

    // 2. Ambil data absensi yang sudah ada untuk event ini
    const { data: attendanceData, error: attError } = await supabase
      .from("or_event_attendances")
      .select("*")
      .eq("event_id", eventId);

    if (attError) return { data: [], error: attError.message };

    // 3. Mapping data: Gabungkan list caang dengan data absensi (jika ada)
    const attendanceMap = new Map(attendanceData?.map((a) => [a.user_id, a]));

    const result: OrEventAttendanceWithUser[] = (
      caangData as unknown as {
        user_id: string;
        users: {
          profiles: {
            full_name: string;
            nickname: string | null;
            avatar_url: string | null;
          } | null;
          education_details: { nim: string | null } | null;
        } | null;
      }[]
    ).map((c) => {
      const existing = attendanceMap.get(c.user_id);
      const profile = c.users?.profiles;
      const edu = c.users?.education_details;

      return {
        id: existing?.id || "",
        event_id: eventId,
        user_id: c.user_id,
        status: existing?.status || "absent",
        checked_in_at: existing?.checked_in_at || null,
        notes: existing?.notes || null,
        points: existing?.points || 0,
        created_at: existing?.created_at || "",
        updated_at: existing?.updated_at || "",
        full_name: profile?.full_name || "Tanpa Nama",
        nickname: profile?.nickname || null,
        avatar_url: profile?.avatar_url || null,
        nim: edu?.nim || null,
      };
    });

    // 4. Client-side search
    const filtered = search
      ? result.filter(
          (r) =>
            r.full_name.toLowerCase().includes(search.toLowerCase()) ||
            (r.nim?.toLowerCase().includes(search.toLowerCase()) ?? false),
        )
      : result;

    return { data: filtered, error: null };
  } catch (error) {
    console.error("[adminGetAttendanceList]", error);
    return { data: [], error: "Gagal memuat daftar absensi." };
  }
}

/**
 * Submit absensi manual oleh Admin
 */
export async function adminSubmitAttendance(input: {
  id?: string;
  event_id: string;
  user_id: string;
  status: string;
  notes?: string | null;
  checked_in_at?: string | null;
  points?: number;
}): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();

    const payload = {
      event_id: input.event_id,
      user_id: input.user_id,
      status: input.status,
      notes: input.notes || null,
      checked_in_at: input.checked_in_at || new Date().toISOString(),
      points: input.points || 0,
      updated_at: new Date().toISOString(),
    };

    if (input.id) {
      // Update existing
      const { error } = await supabase
        .from("or_event_attendances")
        .update(payload)
        .eq("id", input.id);
      if (error) return { success: false, error: error.message };
    } else {
      // Insert new
      const { error } = await supabase
        .from("or_event_attendances")
        .insert([payload]);
      if (error) return { success: false, error: error.message };
    }

    revalidatePath("/dashboard/or/kegiatan/absensi");
    return { success: true, error: null };
  } catch (error) {
    console.error("[adminSubmitAttendance]", error);
    return { success: false, error: "Gagal menyimpan absensi." };
  }
}

/**
 * Menghandle scan token QR dari caang (Admin)
 */
export async function adminScanAttendanceToken(
  token: string,
  eventId: string,
): Promise<{
  success: boolean;
  error: string | null;
  data?: {
    full_name: string;
    status: OrAttendanceStatus;
    points: number;
  };
}> {
  try {
    const supabase = await createClient();

    // 1. Cari token yang valid (belum expired)
    const now = new Date().toISOString();
    const { data: tokenData, error: tokenErr } = await supabase
      .from("or_attendance_tokens")
      .select(
        `
        *,
        users:user_id (full_name:profiles(full_name))
      `,
      )
      .eq("token", token)
      .eq("event_id", eventId)
      .gt("expires_at", now)
      .single();

    if (tokenErr || !tokenData) {
      return { success: false, error: "Token tidak valid atau sudah expired." };
    }

    const userId = tokenData.user_id;

    // 2. Ambil konfigurasi event untuk tentukan poin/status (telat atau tidak)
    const { data: event, error: eventErr } = await supabase
      .from("or_events")
      .select("*")
      .eq("id", eventId)
      .single();

    if (eventErr || !event)
      return { success: false, error: "Event tidak ditemukan." };

    // Tentukan status berdasarkan waktu
    const eventStartTime = new Date(`${event.event_date}T${event.start_time}`);
    const checkinTime = new Date();
    const diffMinutes =
      (checkinTime.getTime() - eventStartTime.getTime()) / (1000 * 60);

    let status: OrAttendanceStatus = "present";
    let points = event.points_present;

    if (diffMinutes > event.late_tolerance) {
      status = "late";
      points = event.points_late;
    }

    // 3. Simpan atau Update absensi
    const { error: upsertErr } = await supabase
      .from("or_event_attendances")
      .upsert(
        {
          event_id: eventId,
          user_id: userId,
          status: status,
          points: points,
          checked_in_at: checkinTime.toISOString(),
          notes: "Scan QR Digital",
        },
        { onConflict: "event_id,user_id" },
      );

    if (upsertErr) return { success: false, error: "Gagal mencatat absensi." };

    // 4. Hapus token setelah berhasil digunakan (one-time use)
    await supabase.from("or_attendance_tokens").delete().eq("id", tokenData.id);

    return {
      success: true,
      error: null,
      data: {
        full_name:
          (tokenData.users as { full_name: { full_name: string } | null })
            .full_name?.full_name || "Caang",
        status: status,
        points: points,
      },
    };
  } catch (error) {
    console.error("[adminScanAttendanceToken]", error);
    return { success: false, error: "Gagal memproses QR." };
  }
}

/**
 * Rekapitulasi poin seluruh Caang
 */
export async function adminGetAttendanceSummary(): Promise<{
  data: {
    user_id: string;
    full_name: string;
    nim: string | null;
    total_points: number;
    present_count: number;
    late_count: number;
    absent_count: number;
    total_events: number;
  }[];
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // 1. Ambil pendaftar (caang) lolos seleksi berkas/aktif
    // Kita gunakan logika yang mirip dengan getRegistrations tapi lebih simpel
    const { data: registrations, error: regErr } = await supabase
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
      .not("status", "eq", "rejected"); // Hindari yang sudah ditolak permanen

    if (regErr) return { data: [], error: regErr.message };

    // 2. Ambil akumulasi poin dari or_event_attendances
    const { data: attendances, error: attErr } = await supabase
      .from("or_event_attendances")
      .select("user_id, status, points");

    if (attErr) return { data: [], error: attErr.message };

    // 3. Mapping aggregation
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

    registrations.forEach((r) => {
      const user = r.users as unknown as {
        profiles: { full_name: string } | null;
        education_details: { nim: string | null } | null;
      } | null;
      const profile = user?.profiles;
      const edu = user?.education_details;

      summaryMap.set(r.user_id, {
        user_id: r.user_id,
        full_name: profile?.full_name || "Tanpa Nama",
        nim: edu?.nim || null,
        total_points: 0,
        present_count: 0,
        late_count: 0,
        absent_count: 0,
        total_events: 0,
      });
    });

    attendances.forEach((a) => {
      const entry = summaryMap.get(a.user_id);
      if (entry) {
        entry.total_points += a.points || 0;
        entry.total_events += 1;
        if (a.status === "present") entry.present_count += 1;
        else if (a.status === "late") entry.late_count += 1;
        else if (a.status === "absent") entry.absent_count += 1;
      }
    });

    const result = Array.from(summaryMap.values()).sort(
      (a, b) => b.total_points - a.total_points,
    );

    return { data: result, error: null };
  } catch (error) {
    console.error("[adminGetAttendanceSummary]", error);
    return { data: [], error: "Gagal memuat rekapitulasi poin." };
  }
}
