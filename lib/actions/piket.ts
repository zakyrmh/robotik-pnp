"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";
import { extractExifDateTime } from "@/lib/utils/exif";

/**
 * ACT-03: Submit piket report.
 * Validates scheduling, checks weekly cycles, extracts JPEG EXIF DateTimeOriginal,
 * and uploads files to the private 'piket-proofs' storage bucket.
 */
export async function submitPiketReport(
  formData: FormData
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
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
        error: { code: "NOT_FOUND", details: "Profile not found" }
      };
    }

    const allowedRoles = ["anggota", "super-admin", "admin-komdis", "admin-or"];
    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        message: "Hanya Anggota yang dapat mengunggah laporan piket.",
        error: { code: "FORBIDDEN", details: "Role is not authorized" }
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
        error: { code: "BAD_REQUEST", details: "Missing required fields" }
      };
    }

    // 2. Schedule Validation
    // Fetch schedule day
    const { data: schedule, error: schedError } = await supabase
      .from("piket_schedules")
      .select("day")
      .eq("id", scheduleId)
      .single();

    if (schedError || !schedule) {
      return {
        success: false,
        message: "Jadwal piket tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Schedule not found" }
      };
    }

    const days = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"] as const;
    const todayDayName = days[new Date().getDay()];

    // Verify today's day matches the scheduled day
    if (schedule.day !== todayDayName) {
      return {
        success: false,
        message: `Hari ini adalah ${todayDayName}, sedangkan jadwal piket Anda adalah hari ${schedule.day}.`,
        error: { code: "BAD_REQUEST", details: "Day mismatch" }
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
        message: "Anda tidak terdaftar piket untuk jadwal hari ini.",
        error: { code: "FORBIDDEN", details: "User is not a member of this piket schedule" }
      };
    }

    // 3. Weekly Cycle Limit Verification (one submission per week)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diffToMonday = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const startOfWeek = new Date(now.setDate(diffToMonday));
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const startOfWeekIso = startOfWeek.toISOString().split("T")[0];
    const endOfWeekIso = endOfWeek.toISOString().split("T")[0];

    const { data: existingLog, error: logCheckError } = await supabase
      .from("piket_logs")
      .select("id")
      .eq("reported_by", user.id)
      .gte("duty_date", startOfWeekIso)
      .lte("duty_date", endOfWeekIso)
      .maybeSingle();

    if (logCheckError) {
      return {
        success: false,
        message: "Gagal memvalidasi riwayat laporan piket.",
        error: { code: "DATABASE_ERROR", details: logCheckError.message }
      };
    }

    if (existingLog) {
      return {
        success: false,
        message: "Anda sudah mengunggah laporan piket untuk minggu aktif berjalan.",
        error: { code: "BAD_REQUEST", details: "Duplicate submission for current week" }
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
        message: "Gagal mendeteksi metadata EXIF foto. Pastikan Anda mengunggah foto asli (bukan screenshot atau kompresi eksternal).",
        error: { code: "INVALID_METADATA", details: "Could not parse DateTimeOriginal from photo EXIF" }
      };
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const dateBeforeStr = dateBefore.toISOString().split("T")[0];
    const dateAfterStr = dateAfter.toISOString().split("T")[0];

    if (dateBeforeStr !== todayStr || dateAfterStr !== todayStr) {
      return {
        success: false,
        message: "Tanggal pengambilan foto (EXIF) tidak cocok dengan tanggal hari ini. Silakan gunakan foto real-time terbaru.",
        error: {
          code: "METADATA_MISMATCH",
          details: `Before photo date: ${dateBeforeStr}, After photo date: ${dateAfterStr}, Current date: ${todayStr}`
        }
      };
    }

    // 5. Upload files to Supabase Storage (bucket: piket-proofs)
    const uploadFile = async (file: File, type: "before" | "after") => {
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}-${type}.${fileExt}`;
      const filePath = `${scheduleId}/${user.id}/${fileName}`;
      const fileBuffer = type === "before" ? bufferBefore : bufferAfter;

      const { error: uploadError } = await supabase.storage
        .from("piket-proofs")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        throw new Error(`Gagal mengunggah foto ${type}: ${uploadError.message}`);
      }

      return filePath;
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
        message: "Gagal mengunggah foto bukti piket ke storage.",
        error: { code: "STORAGE_ERROR", details: errorMsg }
      };
    }

    // 6. Record to piket_logs
    const { error: insertError } = await supabase
      .from("piket_logs")
      .insert({
        schedule_id: scheduleId,
        reported_by: user.id,
        duty_date: todayStr,
        notes: `Before URL: ${beforeUrl} | After URL: ${afterUrl} | Notes: ${notes}`,
        proof_image_url: afterUrl,
        is_verified: true, // auto-verified by EXIF validation
        verified_by: null
      });

    if (insertError) {
      return {
        success: false,
        message: "Gagal menyimpan laporan piket ke database.",
        error: { code: "DATABASE_ERROR", details: insertError.message }
      };
    }

    return {
      success: true,
      message: "Laporan piket berhasil diverifikasi otomatis oleh sistem dan disimpan."
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses laporan piket.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
