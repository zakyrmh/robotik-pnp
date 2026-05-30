"use server";

import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ServerActionResponse } from "@/lib/types/action";
import { revalidatePath } from "next/cache";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ActivityItem {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  location: string | null;
  banner_url: string | null;
  target_audience: "caang" | "anggota";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  created_by_name: string | null;
}

export interface AttendanceSummaryItem {
  profileId: string;
  fullName: string;
  nim: string;
  photoUrl: string | null;
  studyProgramName: string;
  majorName: string;
  attendances: Record<string, "hadir" | "izin" | "sakit" | "alfa" | null>;
  totals: {
    hadir: number;
    izin: number;
    sakit: number;
    alfa: number;
  };
}

// ─── Helper: Verify Admin OR / Super-Admin ────────────────────────────────────

async function verifyAdminOrAccess() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false as const, error: "Sesi tidak ditemukan. Silakan login kembali.", supabase, user: null };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const allowedRoles = ["admin-or", "super-admin"];
  if (!profile || !allowedRoles.includes(profile.role)) {
    return { authorized: false as const, error: "Akses ditolak. Anda tidak memiliki izin.", supabase, user: null };
  }

  return { authorized: true as const, error: null, supabase, user };
}

// ─── GET: Daftar Kegiatan Aktif (belum di-soft-delete) ────────────────────────

export async function getActivities(): Promise<
  ServerActionResponse<ActivityItem[]>
> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  try {
    const { data, error } = await auth.supabase
      .from("activities")
      .select(`
        id, title, description, start_date, end_date, location,
        banner_url, target_audience, created_at, updated_at, deleted_at,
        creator:profiles!activities_created_by_fkey(full_name:id)
      `)
      .eq("target_audience", "caang")
      .is("deleted_at", null)
      .order("start_date", { ascending: false });

    if (error) {
      return { success: false, message: "Gagal memuat daftar kegiatan.", error: { code: "DB_ERROR", details: error.message } };
    }

    const activities: ActivityItem[] = (data ?? []).map((row) => ({
      id: row.id,
      title: row.title,
      description: row.description,
      start_date: row.start_date,
      end_date: row.end_date,
      location: row.location,
      banner_url: row.banner_url,
      target_audience: row.target_audience,
      created_at: row.created_at,
      updated_at: row.updated_at,
      deleted_at: row.deleted_at,
      created_by_name: null,
    }));

    return { success: true, message: "Berhasil.", data: activities };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── GET: Daftar Kegiatan yang Sudah Di-Soft-Delete (Trash) ───────────────────

export async function getDeletedActivities(): Promise<
  ServerActionResponse<ActivityItem[]>
> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  try {
    const { data, error } = await auth.supabase
      .from("activities")
      .select(`
        id, title, description, start_date, end_date, location,
        banner_url, target_audience, created_at, updated_at, deleted_at
      `)
      .eq("target_audience", "caang")
      .not("deleted_at", "is", null)
      .order("deleted_at", { ascending: false });

    if (error) {
      return { success: false, message: "Gagal memuat daftar kegiatan terhapus.", error: { code: "DB_ERROR", details: error.message } };
    }

    const activities: ActivityItem[] = (data ?? []).map((row) => ({
      ...row,
      created_by_name: null,
    }));

    return { success: true, message: "Berhasil.", data: activities };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── CREATE: Tambah Kegiatan Baru ─────────────────────────────────────────────

export async function createActivity(
  formData: FormData
): Promise<ServerActionResponse<{ id: string }>> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const startDate = formData.get("start_date") as string | null;
  const endDate = formData.get("end_date") as string | null;
  const location = (formData.get("location") as string | null)?.trim() || null;
  const bannerFile = formData.get("banner") as File | null;

  if (!title || !startDate || !endDate) {
    return { success: false, message: "Judul, Waktu Mulai, dan Waktu Berakhir wajib diisi." };
  }

  if (new Date(endDate) < new Date(startDate)) {
    return { success: false, message: "Waktu berakhir tidak boleh lebih awal dari waktu mulai." };
  }

  try {
    let bannerUrl: string | null = null;

    // Upload banner jika ada
    if (bannerFile && bannerFile.size > 0) {
      const ext = bannerFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const arrayBuffer = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await auth.supabase.storage
        .from("activity-banners")
        .upload(fileName, buffer, { contentType: bannerFile.type, upsert: false });

      if (uploadError) {
        return { success: false, message: "Gagal mengunggah banner.", error: { code: "STORAGE_ERROR", details: uploadError.message } };
      }

      const { data: urlData } = auth.supabase.storage
        .from("activity-banners")
        .getPublicUrl(fileName);

      bannerUrl = urlData.publicUrl;
    }

    const { data: inserted, error: insertError } = await auth.supabase
      .from("activities")
      .insert({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        location,
        banner_url: bannerUrl,
        target_audience: "caang",
        created_by: auth.user!.id,
      })
      .select("id")
      .single();

    if (insertError) {
      return { success: false, message: "Gagal menyimpan kegiatan.", error: { code: "DB_ERROR", details: insertError.message } };
    }

    revalidatePath("/kegiatan-absensi-caang");
    return { success: true, message: "Kegiatan berhasil ditambahkan.", data: { id: inserted.id } };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── UPDATE: Edit Kegiatan ─────────────────────────────────────────────────────

export async function updateActivity(
  activityId: string,
  formData: FormData
): Promise<ServerActionResponse> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  const title = (formData.get("title") as string | null)?.trim();
  const description = (formData.get("description") as string | null)?.trim() || null;
  const startDate = formData.get("start_date") as string | null;
  const endDate = formData.get("end_date") as string | null;
  const location = (formData.get("location") as string | null)?.trim() || null;
  const bannerFile = formData.get("banner") as File | null;
  const existingBannerUrl = formData.get("existing_banner_url") as string | null;

  if (!title || !startDate || !endDate) {
    return { success: false, message: "Judul, Waktu Mulai, dan Waktu Berakhir wajib diisi." };
  }

  if (new Date(endDate) < new Date(startDate)) {
    return { success: false, message: "Waktu berakhir tidak boleh lebih awal dari waktu mulai." };
  }

  try {
    let bannerUrl: string | null = existingBannerUrl || null;

    // Replace banner jika ada file baru
    if (bannerFile && bannerFile.size > 0) {
      const ext = bannerFile.name.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const arrayBuffer = await bannerFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await auth.supabase.storage
        .from("activity-banners")
        .upload(fileName, buffer, { contentType: bannerFile.type, upsert: false });

      if (uploadError) {
        return { success: false, message: "Gagal mengunggah banner baru.", error: { code: "STORAGE_ERROR", details: uploadError.message } };
      }

      const { data: urlData } = auth.supabase.storage
        .from("activity-banners")
        .getPublicUrl(fileName);

      bannerUrl = urlData.publicUrl;
    }

    const { error: updateError } = await auth.supabase
      .from("activities")
      .update({
        title,
        description,
        start_date: startDate,
        end_date: endDate,
        location,
        banner_url: bannerUrl,
        updated_at: new Date().toISOString(),
      })
      .eq("id", activityId);

    if (updateError) {
      return { success: false, message: "Gagal memperbarui kegiatan.", error: { code: "DB_ERROR", details: updateError.message } };
    }

    revalidatePath("/kegiatan-absensi-caang");
    return { success: true, message: "Kegiatan berhasil diperbarui." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── SOFT DELETE: Arsipkan Kegiatan ──────────────────────────────────────────

export async function softDeleteActivity(
  activityId: string
): Promise<ServerActionResponse> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  try {
    const { error } = await auth.supabase
      .from("activities")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", activityId);

    if (error) {
      return { success: false, message: "Gagal menghapus kegiatan.", error: { code: "DB_ERROR", details: error.message } };
    }

    revalidatePath("/kegiatan-absensi-caang");
    return { success: true, message: "Kegiatan berhasil dipindahkan ke Trash." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── RESTORE: Pulihkan Kegiatan dari Trash ────────────────────────────────────

export async function restoreActivity(
  activityId: string
): Promise<ServerActionResponse> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  try {
    const { error } = await auth.supabase
      .from("activities")
      .update({ deleted_at: null })
      .eq("id", activityId);

    if (error) {
      return { success: false, message: "Gagal memulihkan kegiatan.", error: { code: "DB_ERROR", details: error.message } };
    }

    revalidatePath("/kegiatan-absensi-caang");
    revalidatePath("/kegiatan-absensi-caang/trash");
    return { success: true, message: "Kegiatan berhasil dipulihkan." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── HARD DELETE: Hapus Permanen ─────────────────────────────────────────────

export async function hardDeleteActivity(
  activityId: string
): Promise<ServerActionResponse> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  try {
    // Ambil banner_url sebelum dihapus
    const { data: activity } = await auth.supabase
      .from("activities")
      .select("banner_url")
      .eq("id", activityId)
      .single();

    // Hapus baris dari database
    const { error: deleteError } = await auth.supabase
      .from("activities")
      .delete()
      .eq("id", activityId);

    if (deleteError) {
      return { success: false, message: "Gagal menghapus kegiatan secara permanen.", error: { code: "DB_ERROR", details: deleteError.message } };
    }

    // Hapus banner dari storage jika ada
    if (activity?.banner_url) {
      const url = new URL(activity.banner_url);
      const pathSegments = url.pathname.split("/");
      const fileName = pathSegments[pathSegments.length - 1];
      if (fileName) {
        await auth.supabase.storage.from("activity-banners").remove([fileName]);
      }
    }

    revalidatePath("/kegiatan-absensi-caang");
    revalidatePath("/kegiatan-absensi-caang/trash");
    return { success: true, message: "Kegiatan berhasil dihapus secara permanen." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── GET: Rekap Absensi Semua Caang ──────────────────────────────────────────

export async function getAttendanceSummary(): Promise<
  ServerActionResponse<{
    activities: { id: string; title: string; start_date: string }[];
    summary: AttendanceSummaryItem[];
  }>
> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  // Use service-role client to bypass RLS (mirrors caang.ts pattern)
  const supabaseAdmin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    // 1. Ambil semua kegiatan caang yang aktif
    const { data: activitiesData, error: activitiesError } = await auth.supabase
      .from("activities")
      .select("id, title, start_date")
      .eq("target_audience", "caang")
      .is("deleted_at", null)
      .order("start_date", { ascending: true });

    if (activitiesError) {
      return { success: false, message: "Gagal memuat data kegiatan.", error: { code: "DB_ERROR", details: activitiesError.message } };
    }

    // 2. Ambil semua Caang yang sudah onboarding — query dari registrations seperti caang.ts
    //    Gunakan service-role client agar RLS tidak memblokir akses ke photo_url
    const { data: registrationsData, error: registrationsError } = await supabaseAdmin
      .from("registrations")
      .select(`
        full_name,
        photo_url,
        deleted_at,
        study_programs (
          name,
          degree,
          majors ( name )
        ),
        profiles!inner (
          id,
          nim,
          role,
          is_onboarded
        )
      `)
      .eq("profiles.role", "caang")
      .eq("profiles.is_onboarded", true)
      .is("deleted_at", null)
      .order("full_name", { ascending: true });

    if (registrationsError) {
      return { success: false, message: "Gagal memuat data Caang.", error: { code: "DB_ERROR", details: registrationsError.message } };
    }

    // 3. Ambil semua record absensi untuk kegiatan-kegiatan di atas
    const activityIds = (activitiesData ?? []).map((a) => a.id);

    let attendancesData: { activity_id: string; profile_id: string; status: string }[] = [];
    if (activityIds.length > 0) {
      const { data: attData, error: attError } = await supabaseAdmin
        .from("attendances")
        .select("activity_id, profile_id, status")
        .in("activity_id", activityIds);

      if (attError) {
        return { success: false, message: "Gagal memuat data absensi.", error: { code: "DB_ERROR", details: attError.message } };
      }
      attendancesData = attData ?? [];
    }

    // 4. Build lookup map: { [profileId]: { [activityId]: status } }
    const attendanceMap: Record<string, Record<string, string>> = {};
    for (const att of attendancesData) {
      if (!attendanceMap[att.profile_id]) {
        attendanceMap[att.profile_id] = {};
      }
      attendanceMap[att.profile_id][att.activity_id] = att.status;
    }

    // 5. Susun summary per Caang — mirroring caang.ts mapping pattern
    type RawRegistration = {
      full_name: string | null;
      photo_url: string | null;
      deleted_at: string | null;
      study_programs: {
        name: string;
        degree: string;
        majors: { name: string } | { name: string }[] | null;
      } | null;
      profiles:
        | { id: string; nim: string | null; role: string; is_onboarded: boolean }
        | { id: string; nim: string | null; role: string; is_onboarded: boolean }[]
        | null;
    };

    const summary: AttendanceSummaryItem[] = (
      (registrationsData as unknown as RawRegistration[]) ?? []
    ).map((reg) => {
      // Normalize profiles (may be array or object per Supabase join)
      const profile = Array.isArray(reg.profiles)
        ? reg.profiles[0]
        : reg.profiles;

      const sp = Array.isArray(reg.study_programs)
        ? reg.study_programs[0]
        : reg.study_programs;

      const major = sp?.majors
        ? Array.isArray(sp.majors)
          ? sp.majors[0]
          : sp.majors
        : null;

      const profileId = profile?.id ?? "";

      const userAttendances: Record<string, "hadir" | "izin" | "sakit" | "alfa" | null> = {};
      const totals = { hadir: 0, izin: 0, sakit: 0, alfa: 0 };

      for (const activity of activitiesData ?? []) {
        const status = (attendanceMap[profileId]?.[activity.id] ?? null) as
          | "hadir"
          | "izin"
          | "sakit"
          | "alfa"
          | null;
        userAttendances[activity.id] = status;
        if (status && status in totals) {
          totals[status as keyof typeof totals]++;
        } else if (!status) {
          totals.alfa++;
        }
      }

      return {
        profileId,
        fullName: reg.full_name || "—",
        nim: profile?.nim || "—",
        // photo_url disimpan sebagai full URL di tabel registrations
        photoUrl: reg.photo_url || "",
        studyProgramName: sp ? `${sp.degree} ${sp.name}` : "—",
        majorName: major?.name || "—",
        attendances: userAttendances,
        totals,
      };
    });

    return {
      success: true,
      message: "Berhasil memuat rekap absensi.",
      data: {
        activities: activitiesData ?? [],
        summary,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}

// ─── UPSERT: Update Status Absensi Caang (Admin) ─────────────────────────────

export async function upsertAttendanceStatus(
  activityId: string,
  profileId: string,
  status: "hadir" | "izin" | "sakit" | "alfa"
): Promise<ServerActionResponse> {
  const auth = await verifyAdminOrAccess();
  if (!auth.authorized) {
    return { success: false, message: auth.error! };
  }

  const validStatuses = ["hadir", "izin", "sakit", "alfa"];
  if (!validStatuses.includes(status)) {
    return { success: false, message: "Status absensi tidak valid." };
  }

  try {
    const { error } = await auth.supabase
      .from("attendances")
      .upsert(
        {
          activity_id: activityId,
          profile_id: profileId,
          status,
          check_in_at: new Date().toISOString(),
          verified_by: auth.user!.id,
        },
        { onConflict: "activity_id,profile_id" }
      );

    if (error) {
      return { success: false, message: "Gagal memperbarui status absensi.", error: { code: "DB_ERROR", details: error.message } };
    }

    revalidatePath("/kegiatan-absensi-caang");
    return { success: true, message: `Status absensi berhasil diperbarui menjadi "${status}".` };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { success: false, message: "Terjadi kesalahan tidak terduga.", error: { code: "SERVER_ERROR", details: msg } };
  }
}
