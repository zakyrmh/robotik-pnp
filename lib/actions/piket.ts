"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";
import { extractExifDateTime } from "@/lib/utils/exif";
import { getPiketWeekInfo } from "@/lib/utils/piket-date";
import { uploadToR2 } from "@/lib/storage/r2";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";

/**
 * ACT-03: Submit piket report.
 * Validates scheduling, checks weekly cycles, extracts JPEG EXIF DateTimeOriginal,
 * and uploads files to Cloudflare R2 bucket.
 */
export async function submitPiketReport(
  formData: FormData,
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    // Verify user role
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError || !profile) {
      return {
        success: false,
        message: "Profil tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Profile not found" },
      };
    }

    const allowedRoles = [
      "anggota",
      "super-admin",
      "admin-komdis",
      "admin-or",
      "admin-kestari",
      "admin-divisi",
    ];
    if (
      !allowedRoles.includes(profile.role) ||
      profile.role === "caang" ||
      profile.role === "alumni"
    ) {
      return {
        success: false,
        message:
          "Pengguna dengan role ini tidak diizinkan mengunggah laporan piket kebersihan ruang kesekretariatan dan workshop.",
        error: { code: "FORBIDDEN", details: "Role is not authorized" },
      };
    }

    const scheduleId = formData.get("schedule_id") as string;
    const notes = formData.get("notes") as string;
    const photoBefore = formData.get("photo_before") as File | null;
    const photoAfter = formData.get("photo_after") as File | null;

    if (!scheduleId || !notes || !photoBefore || !photoAfter) {
      return {
        success: false,
        message: "Semua kolom input wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing required fields" },
      };
    }

    // 2. Schedule Validation
    const { data: schedule, error: schedError } = await supabase
      .from("piket_schedules")
      .select("id, week_number, room_target, academic_period")
      .eq("id", scheduleId)
      .single();

    if (schedError || !schedule) {
      return {
        success: false,
        message: "Jadwal piket tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Schedule not found" },
      };
    }

    const weekInfo = getPiketWeekInfo(new Date());

    // Verify current week matches the scheduled week
    if (schedule.week_number !== weekInfo.weekNumber) {
      return {
        success: false,
        message: `Pekan ini adalah Pekan ${weekInfo.weekNumber} (${weekInfo.dateRangeFormatted}), sedangkan jadwal piket Anda adalah Pekan ${schedule.week_number}.`,
        error: { code: "BAD_REQUEST", details: "Week mismatch" },
      };
    }

    // Verify if user is registered in this schedule
    const { data: membership, error: memError } = await supabase
      .from("piket_members")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", user.id)
      .maybeSingle();

    if (memError || !membership) {
      return {
        success: false,
        message: "Anda tidak terdaftar untuk jadwal piket pekan ini.",
        error: {
          code: "FORBIDDEN",
          details: "User is not a member of this piket schedule",
        },
      };
    }

    // 3. Weekly Cycle Limit Verification (one submission per Monday-Sunday week)
    const { data: existingLog, error: logCheckError } = await supabase
      .from("piket_logs")
      .select("id")
      .eq("reported_by", user.id)
      .gte("duty_date", weekInfo.startIsoDate)
      .lte("duty_date", weekInfo.endIsoDate)
      .maybeSingle();

    if (logCheckError) {
      return {
        success: false,
        message: "Gagal memvalidasi riwayat laporan piket.",
        error: { code: "DATABASE_ERROR", details: logCheckError.message },
      };
    }

    if (existingLog) {
      return {
        success: false,
        message: `Anda sudah mengunggah laporan piket untuk Pekan ${weekInfo.weekNumber} (${weekInfo.dateRangeFormatted}).`,
        error: {
          code: "BAD_REQUEST",
          details: "Duplicate submission for current week",
        },
      };
    }

    // 4. EXIF Verification
    const bufferBefore = Buffer.from(await photoBefore.arrayBuffer());
    const bufferAfter = Buffer.from(await photoAfter.arrayBuffer());

    const dateBefore = extractExifDateTime(bufferBefore);
    const dateAfter = extractExifDateTime(bufferAfter);

    if (!dateBefore || !dateAfter) {
      return {
        success: false,
        message:
          "Gagal mendeteksi metadata EXIF foto. Pastikan Anda mengunggah foto asli (bukan screenshot atau kompresi eksternal).",
        error: {
          code: "INVALID_METADATA",
          details: "Could not parse DateTimeOriginal from photo EXIF",
        },
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const dateBeforeStr = dateBefore.toISOString().split("T")[0];
    const dateAfterStr = dateAfter.toISOString().split("T")[0];

    if (dateBeforeStr !== todayStr || dateAfterStr !== todayStr) {
      return {
        success: false,
        message:
          "Tanggal pengambilan foto (EXIF) tidak cocok dengan tanggal hari ini. Silakan gunakan foto real-time terbaru.",
        error: {
          code: "METADATA_MISMATCH",
          details: `Before photo date: ${dateBeforeStr}, After photo date: ${dateAfterStr}, Current date: ${todayStr}`,
        },
      };
    }

    // 5. Upload files to Cloudflare R2 bucket
    const uploadFile = async (file: File, type: "before" | "after") => {
      const fileExt = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const key = `piket-proofs/${scheduleId}/${user.id}/${fileName}`;
      const fileBuffer = type === "before" ? bufferBefore : bufferAfter;

      return await uploadToR2({
        fileBuffer,
        key,
        contentType: file.type || "image/jpeg",
      });
    };

    let beforeUrl = "";
    let afterUrl = "";

    try {
      beforeUrl = await uploadFile(photoBefore, "before");
      afterUrl = await uploadFile(photoAfter, "after");
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      return {
        success: false,
        message: "Gagal mengunggah foto bukti piket ke Cloudflare R2 storage.",
        error: { code: "STORAGE_ERROR", details: errorMsg },
      };
    }

    // 6. Record to piket_logs
    const { error: insertError } = await supabase.from("piket_logs").insert({
      schedule_id: scheduleId,
      reported_by: user.id,
      duty_date: todayStr,
      notes: notes.trim(),
      proof_image_before_url: beforeUrl,
      proof_image_url: afterUrl,
      is_verified: true,
      verified_by: null,
    });

    if (insertError) {
      console.error("[PIKET_SUBMIT_ERROR] DB insert error:", insertError);
      return {
        success: false,
        message: `Gagal menyimpan laporan piket ke database: ${insertError.message}`,
        error: { code: "DATABASE_ERROR", details: insertError.message },
      };
    }

    revalidatePath("/piket");

    return {
      success: true,
      message:
        "Laporan piket kebersihan berhasil diverifikasi otomatis oleh sistem dan disimpan.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses laporan piket.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Create a new piket academic period (e.g. "2027/2028") and initialize its 4 master week schedules.
 */
export async function createPiketPeriod(
  academicPeriod: string,
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      (profile.role !== "super-admin" && profile.role !== "admin-kestari")
    ) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat membuat periode piket baru.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    const trimmedPeriod = academicPeriod.trim();
    if (!trimmedPeriod || !/^\d{4}\/\d{4}$/.test(trimmedPeriod)) {
      return {
        success: false,
        message:
          "Format periode DPH tidak valid. Gunakan format YYYY/YYYY (contoh: 2027/2028).",
        error: {
          code: "BAD_REQUEST",
          details: "Invalid academic period format",
        },
      };
    }

    // Insert 4 master week schedules
    const newSchedules = [1, 2, 3, 4].map((weekNum) => ({
      academic_period: trimmedPeriod,
      week_number: weekNum,
      room_target: "workshop_dan_sekretariat",
    }));

    const { error: insertError } = await supabase
      .from("piket_schedules")
      .upsert(newSchedules, {
        onConflict: "academic_period,week_number,room_target",
      });

    if (insertError) {
      return {
        success: false,
        message: "Gagal membuat periode piket baru: " + insertError.message,
        error: { code: "DATABASE_ERROR", details: insertError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "CREATE_PIKET_PERIOD",
      newValue: { academicPeriod: trimmedPeriod, totalWeeks: 4 },
      details: `Membuat periode piket DPH baru ${trimmedPeriod} beserta master 4 pekannya.`,
    });

    revalidatePath("/piket");
    revalidatePath("/piket/kelola");

    return {
      success: true,
      message: `Periode DPH ${trimmedPeriod} berhasil dibuat beserta master 4 pekannya.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal membuat periode piket baru.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Assign an active member/pengurus to a piket schedule (Admin Kestari & Super Admin only).
 */
export async function assignPiketMember(
  scheduleId: string,
  profileId: string,
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      (profile.role !== "super-admin" && profile.role !== "admin-kestari")
    ) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat menempatkan anggota piket.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    // Check if already assigned to this schedule
    const { data: existing } = await supabase
      .from("piket_members")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (existing) {
      return {
        success: false,
        message: "Anggota sudah terdaftar pada pekan piket ini.",
        error: {
          code: "BAD_REQUEST",
          details: "Member already assigned to schedule",
        },
      };
    }

    const { error: insertError } = await supabase.from("piket_members").insert({
      schedule_id: scheduleId,
      profile_id: profileId,
    });

    if (insertError) {
      return {
        success: false,
        message: "Gagal menambahkan anggota ke jadwal piket.",
        error: { code: "DATABASE_ERROR", details: insertError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "ASSIGN_PIKET_MEMBER",
      targetUserId: profileId,
      newValue: { scheduleId, profileId },
      details: `Menambahkan anggota ke jadwal piket (scheduleId: ${scheduleId}).`,
    });

    revalidatePath("/piket");
    revalidatePath("/piket/kelola");

    return {
      success: true,
      message: "Anggota berhasil ditambahkan ke jadwal piket.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal menambahkan anggota ke jadwal piket.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Remove a member assignment from a piket schedule (Admin Kestari & Super Admin only).
 */
export async function removePiketMember(
  memberId: string,
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (
      !profile ||
      (profile.role !== "super-admin" && profile.role !== "admin-kestari")
    ) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat mengedit jadwal piket.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    // Fetch existing member details for audit log before delete
    const { data: existingMember } = await supabase
      .from("piket_members")
      .select("profile_id, schedule_id")
      .eq("id", memberId)
      .maybeSingle();

    const { error: deleteError } = await supabase
      .from("piket_members")
      .delete()
      .eq("id", memberId);

    if (deleteError) {
      return {
        success: false,
        message: "Gagal menghapus penugasan piket anggota.",
        error: { code: "DATABASE_ERROR", details: deleteError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "REMOVE_PIKET_MEMBER",
      targetUserId: existingMember?.profile_id || null,
      oldValue: {
        memberId,
        profileId: existingMember?.profile_id,
        scheduleId: existingMember?.schedule_id,
      },
      details: `Menghapus penugasan piket anggota (memberId: ${memberId}).`,
    });

    revalidatePath("/piket");
    revalidatePath("/piket/kelola");

    return {
      success: true,
      message: "Penugasan piket anggota berhasil dihapus.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal menghapus penugasan piket anggota.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}
