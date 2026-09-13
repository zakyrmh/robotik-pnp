"use server";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";
import { extractExifDateTime } from "@/lib/utils/exif";
import { getPiketWeekInfo, isDateInPiketWeek } from "@/lib/utils/piket-date";
import {
  MAX_PIKET_ATTEMPTS_PER_WEEK,
  DEFAULT_PIKET_FINE_AMOUNT,
} from "@/lib/utils/piket-date";
import { uploadToR2 } from "@/lib/storage/r2";
import { recordAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { createHash } from "node:crypto";

const KESTARI_MANAGERS = ["super-admin", "admin-kestari"] as const;

function sha256Hex(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function toIsoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

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

    // 3. Weekly Cycle Limit Verification (one valid submission per Monday-Sunday week)
    // Laporan yang DITOLAK tidak menghalangi upload ulang (dianggap bukan
    // laporan valid), tetapi total percobaan dibatasi MAX_PIKET_ATTEMPTS_PER_WEEK.
    const { data: existingLog, error: logCheckError } = await supabase
      .from("piket_logs")
      .select("id")
      .eq("reported_by", user.id)
      .gte("duty_date", weekInfo.startIsoDate)
      .lte("duty_date", weekInfo.endIsoDate)
      .neq("is_verified", false)
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

    const { count: attemptCount, error: attemptError } = await supabase
      .from("piket_logs")
      .select("id", { count: "exact", head: true })
      .eq("reported_by", user.id)
      .gte("duty_date", weekInfo.startIsoDate)
      .lte("duty_date", weekInfo.endIsoDate);

    if (attemptError) {
      return {
        success: false,
        message: "Gagal memvalidasi riwayat laporan piket.",
        error: { code: "DATABASE_ERROR", details: attemptError.message },
      };
    }

    if ((attemptCount ?? 0) >= MAX_PIKET_ATTEMPTS_PER_WEEK) {
      return {
        success: false,
        message: `Kesempatan upload laporan pekan ini sudah habis (${MAX_PIKET_ATTEMPTS_PER_WEEK}x). Silakan hubungi admin Kestari.`,
        error: {
          code: "BAD_REQUEST",
          details: "Weekly upload attempts exhausted",
        },
      };
    }

    // 4. EXIF Verification
    // Foto HEIC/HEIF iPhone dikonversi ke JPEG di client via heic2any, dan
    // proses konversi tersebut MENGHILANGKAN EXIF DateTimeOriginal. Untuk foto
    // hasil konversi HEIC, validasi memakai tanggal file perangkat (taken_at)
    // yang dikirim client sebagai fallback, bukan EXIF.
    const bufferBefore = Buffer.from(await photoBefore.arrayBuffer());
    const bufferAfter = Buffer.from(await photoAfter.arrayBuffer());

    const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
    if (
      bufferBefore.length > MAX_UPLOAD_BYTES ||
      bufferAfter.length > MAX_UPLOAD_BYTES
    ) {
      return {
        success: false,
        message: "Ukuran foto melebihi 5MB. Silakan ulangi pengambilan foto.",
        error: { code: "BAD_REQUEST", details: "Uploaded file too large" },
      };
    }

    const beforeWasHeic = formData.get("photo_before_was_heic") === "1";
    const afterWasHeic = formData.get("photo_after_was_heic") === "1";

    const parseTakenAt = (value: FormDataEntryValue | null, file: File) => {
      const fromField = typeof value === "string" ? Number(value) : NaN;
      if (Number.isFinite(fromField) && fromField > 0) return fromField;
      return typeof file.lastModified === "number" && file.lastModified > 0
        ? file.lastModified
        : NaN;
    };

    const dateBefore = extractExifDateTime(bufferBefore);
    const dateAfter = extractExifDateTime(bufferAfter);

    const todayStr = new Date().toISOString().split("T")[0];

    // Tanggal pengambilan foto hasil validasi (EXIF atau fallback taken_at).
    // Disimpan ke kolom photo_taken_at_* agar Kestari bisa menilainya.
    let photoDateBefore: Date | null = null;
    let photoDateAfter: Date | null = null;

    // Kebijakan: bukti foto boleh diambil di hari berbeda, selama masih dalam
    // rentang pekan piket berjalan (Senin–Minggu). Contoh: Naufal piket Pekan 3,
    // foto diambil Senin, baru upload Rabu → tetap diterima.
    // Foto dari pekan lain atau bertanggal masa depan tetap ditolak.
    const isWithinPiketWeek = (d: Date) => isDateInPiketWeek(d, weekInfo);

    // Tanggal file perangkat (jalur HEIC) dianggap valid bila masuk rentang
    // pekan — toleransi UTC/WIB untuk selisih zona waktu client vs server.
    const isTakenAtWithinPiketWeek = (takenAtMs: number) => {
      if (!Number.isFinite(takenAtMs) || takenAtMs <= 0) return false;
      return isDateInPiketWeek(new Date(takenAtMs), weekInfo);
    };

    const isJpeg = (buf: Buffer) =>
      buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xd8;

    if (!dateBefore || !dateAfter) {
      // Jalur fallback: kedua foto berasal dari konversi HEIC client.
      if (beforeWasHeic && afterWasHeic) {
        const beforeTakenAt = parseTakenAt(
          formData.get("photo_before_taken_at"),
          photoBefore,
        );
        const afterTakenAt = parseTakenAt(
          formData.get("photo_after_taken_at"),
          photoAfter,
        );

        if (
          !isTakenAtWithinPiketWeek(beforeTakenAt) ||
          !isTakenAtWithinPiketWeek(afterTakenAt)
        ) {
          return {
            success: false,
            message: `Tanggal file foto (HEIC) tidak berada dalam pekan piket ini (Pekan ${weekInfo.weekNumber}, ${weekInfo.dateRangeFormatted}). Foto boleh diambil di hari berbeda selama masih dalam pekan Senin–Minggu yang sama.`,
            error: {
              code: "METADATA_MISMATCH",
              details: `Before taken_at: ${beforeTakenAt}, After taken_at: ${afterTakenAt}, Week range: ${weekInfo.startIsoDate}..${weekInfo.endIsoDate}`,
            },
          };
        }
        // Lolos via fallback HEIC — lanjut ke upload.
        photoDateBefore = new Date(beforeTakenAt);
        photoDateAfter = new Date(afterTakenAt);
      } else {
        // File HEIC mentah lolos ke server (konversi client gagal): parser
        // EXIF hanya mendukung JPEG, beri pesan yang jelas.
        if (!isJpeg(bufferBefore) || !isJpeg(bufferAfter)) {
          return {
            success: false,
            message:
              "Foto HEIC/HEIF gagal dikonversi otomatis di perangkat Anda. Aktifkan koneksi internet, perbarui browser, atau ubah format kamera iPhone ke JPEG (Settings > Camera > Formats > Most Compatible), lalu coba lagi.",
            error: {
              code: "INVALID_METADATA",
              details: "HEIC conversion failed on client; non-JPEG received",
            },
          };
        }
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
    } else {
      if (!isWithinPiketWeek(dateBefore) || !isWithinPiketWeek(dateAfter)) {
        const dateBeforeStr = dateBefore.toISOString().split("T")[0];
        const dateAfterStr = dateAfter.toISOString().split("T")[0];
        return {
          success: false,
          message: `Tanggal pengambilan foto (EXIF) tidak cocok dengan pekan piket ini (Pekan ${weekInfo.weekNumber}, ${weekInfo.dateRangeFormatted}). Foto boleh diambil di hari berbeda selama masih dalam pekan Senin–Minggu yang sama.`,
          error: {
            code: "METADATA_MISMATCH",
            details: `Before photo date: ${dateBeforeStr}, After photo date: ${dateAfterStr}, Week range: ${weekInfo.startIsoDate}..${weekInfo.endIsoDate}`,
          },
        };
      }
      photoDateBefore = dateBefore;
      photoDateAfter = dateAfter;
    }

    if (!photoDateBefore || !photoDateAfter) {
      return {
        success: false,
        message:
          "Gagal mendeteksi metadata EXIF foto. Pastikan Anda mengunggah foto asli (bukan screenshot atau kompresi eksternal).",
        error: {
          code: "INVALID_METADATA",
          details: "Photo capture date could not be resolved",
        },
      };
    }

    // 4b. Urutan waktu: foto sesudah tidak boleh diambil lebih dulu
    // daripada foto sebelum.
    if (photoDateAfter.getTime() < photoDateBefore.getTime()) {
      return {
        success: false,
        message:
          "Urutan foto tidak valid: foto Sesudah diambil lebih dulu daripada foto Sebelum. Pastikan foto Sebelum adalah kondisi kotor dan foto Sesudah adalah kondisi bersih.",
        error: {
          code: "BAD_REQUEST",
          details: "After photo predates before photo",
        },
      };
    }

    // 4c. Hash anti-duplikat: before vs after identik → tolak; hash yang
    // sudah pernah dipakai di laporan manapun (termasuk anggota lain) → tolak.
    const hashBefore = sha256Hex(bufferBefore);
    const hashAfter = sha256Hex(bufferAfter);

    if (hashBefore === hashAfter) {
      return {
        success: false,
        message:
          "Foto Sebelum dan Sesudah identik. Unggah dua foto berbeda (kondisi sebelum dan sesudah dibersihkan).",
        error: {
          code: "BAD_REQUEST",
          details: "Before and after photos are identical",
        },
      };
    }

    const { data: reusedLogs, error: reuseError } = await supabase
      .from("piket_logs")
      .select("id")
      .or(
        `photo_hash_before.eq.${hashBefore},photo_hash_after.eq.${hashBefore},photo_hash_before.eq.${hashAfter},photo_hash_after.eq.${hashAfter}`,
      )
      .limit(1);

    if (reuseError) {
      return {
        success: false,
        message: "Gagal memvalidasi keaslian foto.",
        error: { code: "DATABASE_ERROR", details: reuseError.message },
      };
    }

    if (reusedLogs && reusedLogs.length > 0) {
      return {
        success: false,
        message:
          "Salah satu foto sudah pernah digunakan pada laporan piket sebelumnya. Gunakan foto dokumentasi yang berbeda atau hubungi admin Kestari.",
        error: {
          code: "BAD_REQUEST",
          details: "Photo hash already used in a previous report",
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

    // 6. Record to piket_logs (auto-terverifikasi sistem, menunggu review Kestari)
    const { error: insertError } = await supabase.from("piket_logs").insert({
      schedule_id: scheduleId,
      reported_by: user.id,
      duty_date: todayStr,
      notes: notes.trim(),
      proof_image_before_url: beforeUrl,
      proof_image_url: afterUrl,
      photo_taken_at_before: toIsoDate(photoDateBefore),
      photo_taken_at_after: toIsoDate(photoDateAfter),
      photo_hash_before: hashBefore,
      photo_hash_after: hashAfter,
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
        "Laporan piket kebersihan berhasil diverifikasi otomatis oleh sistem dan disimpan. Menunggu review admin Kestari.",
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
 * Memastikan pemanggil adalah admin Kestari / Super Admin.
 * Mengembalikan profile bila berwenang, selain itu null.
 */
async function requireKestariManager(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();

  if (
    !profile ||
    !(KESTARI_MANAGERS as readonly string[]).includes(profile.role)
  ) {
    return null;
  }
  return profile;
}

/**
 * Review laporan piket oleh admin Kestari / Super Admin.
 * - approve: laporan sah & final (terverifikasi manusia).
 * - reject: laporan ditolak + alasan wajib; anggota boleh upload ulang
 *   sebagai log baru selama masih dalam pekan & kuota percobaan tersisa.
 */
export async function reviewPiketLog(
  logId: string,
  decision: "approve" | "reject",
  reason?: string,
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
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    if (!(await requireKestariManager(supabase, user.id))) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat mereview laporan piket.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    if (decision !== "approve" && decision !== "reject") {
      return {
        success: false,
        message: "Keputusan review tidak valid.",
        error: { code: "BAD_REQUEST", details: "Invalid decision" },
      };
    }

    const trimmedReason = (reason || "").trim();
    if (decision === "reject" && !trimmedReason) {
      return {
        success: false,
        message: "Alasan penolakan wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Rejection reason required" },
      };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("piket_logs")
      .select("id, is_final, is_verified, reported_by, schedule_id")
      .eq("id", logId)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        message: "Laporan piket tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Log not found" },
      };
    }

    if (existing.is_final) {
      return {
        success: false,
        message: "Laporan sudah final dan tidak dapat diubah lagi.",
        error: { code: "BAD_REQUEST", details: "Log already finalized" },
      };
    }

    const nowIso = new Date().toISOString();
    const patch =
      decision === "approve"
        ? {
            is_verified: true,
            verified_by: user.id,
            verified_at: nowIso,
            rejection_reason: null,
            is_final: true,
            finalized_at: nowIso,
          }
        : {
            is_verified: false,
            verified_by: user.id,
            verified_at: nowIso,
            rejection_reason: trimmedReason,
            is_final: false,
          };

    const { error: updateError } = await supabase
      .from("piket_logs")
      .update(patch)
      .eq("id", logId);

    if (updateError) {
      return {
        success: false,
        message: "Gagal menyimpan hasil review.",
        error: { code: "DATABASE_ERROR", details: updateError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType:
        decision === "approve" ? "APPROVE_PIKET_LOG" : "REJECT_PIKET_LOG",
      targetUserId: existing.reported_by,
      oldValue: {
        logId,
        isVerified: existing.is_verified,
        isFinal: existing.is_final,
      },
      newValue: {
        logId,
        decision,
        reason: decision === "reject" ? trimmedReason : null,
      },
      details:
        decision === "approve"
          ? `Menyetujui laporan piket (logId: ${logId}).`
          : `Menolak laporan piket (logId: ${logId}) dengan alasan: ${trimmedReason}`,
    });

    revalidatePath("/piket");

    return {
      success: true,
      message:
        decision === "approve"
          ? "Laporan piket disetujui dan difinalisasi."
          : "Laporan piket ditolak. Anggota dapat mengunggah ulang sebagai log baru.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses review laporan piket.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Mengenakan denda administratif piket kepada anggota untuk satu jadwal pekan.
 * Satu denda per (anggota, jadwal). Diblokir bila anggota sudah punya
 * laporan valid (non-ditolak) pada jadwal tersebut.
 */
export async function imposePiketFine(
  profileId: string,
  scheduleId: string,
  amount: number = DEFAULT_PIKET_FINE_AMOUNT,
  notes?: string,
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
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    if (!(await requireKestariManager(supabase, user.id))) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat mengenakan denda piket.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    const parsedAmount = Math.floor(Number(amount));
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      return {
        success: false,
        message: "Nominal denda tidak valid.",
        error: { code: "BAD_REQUEST", details: "Invalid fine amount" },
      };
    }

    // Pastikan target adalah anggota jadwal pekan tersebut.
    const { data: membership } = await supabase
      .from("piket_members")
      .select("id")
      .eq("schedule_id", scheduleId)
      .eq("profile_id", profileId)
      .maybeSingle();

    if (!membership) {
      return {
        success: false,
        message: "Anggota tidak terdaftar pada jadwal pekan tersebut.",
        error: {
          code: "BAD_REQUEST",
          details: "Target is not a schedule member",
        },
      };
    }

    // Jangan denda anggota yang sudah punya laporan valid.
    const { data: validLog } = await supabase
      .from("piket_logs")
      .select("id")
      .eq("reported_by", profileId)
      .eq("schedule_id", scheduleId)
      .neq("is_verified", false)
      .maybeSingle();

    if (validLog) {
      return {
        success: false,
        message: "Anggota sudah memiliki laporan valid pada pekan tersebut.",
        error: {
          code: "BAD_REQUEST",
          details: "Member already has a valid report",
        },
      };
    }

    const { data: existingFine } = await supabase
      .from("piket_fines")
      .select("id, status")
      .eq("profile_id", profileId)
      .eq("schedule_id", scheduleId)
      .maybeSingle();

    if (existingFine?.status === "lunas") {
      return {
        success: false,
        message: "Denda pekan tersebut sudah lunas.",
        error: { code: "BAD_REQUEST", details: "Fine already paid" },
      };
    }

    if (existingFine) {
      const { error: updateError } = await supabase
        .from("piket_fines")
        .update({
          amount: parsedAmount,
          imposed_by: user.id,
          notes: (notes || "").trim() || null,
        })
        .eq("id", existingFine.id);

      if (updateError) {
        return {
          success: false,
          message: "Gagal memperbarui denda piket.",
          error: { code: "DATABASE_ERROR", details: updateError.message },
        };
      }
    } else {
      const { error: insertError } = await supabase.from("piket_fines").insert({
        profile_id: profileId,
        schedule_id: scheduleId,
        amount: parsedAmount,
        status: "belum_lunas",
        imposed_by: user.id,
        notes: (notes || "").trim() || null,
      });

      if (insertError) {
        return {
          success: false,
          message: "Gagal mengenakan denda piket.",
          error: { code: "DATABASE_ERROR", details: insertError.message },
        };
      }
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "IMPOSE_PIKET_FINE",
      targetUserId: profileId,
      newValue: { profileId, scheduleId, amount: parsedAmount },
      details: `Mengenakan denda piket Rp${parsedAmount.toLocaleString("id-ID")} kepada anggota (scheduleId: ${scheduleId}).`,
    });

    revalidatePath("/piket");

    return {
      success: true,
      message: `Denda piket Rp${parsedAmount.toLocaleString("id-ID")} berhasil dicatat (status: Belum Lunas).`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal mengenakan denda piket.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Menandai denda piket sebagai lunas (Kestari / Super Admin).
 */
export async function markPiketFinePaid(
  fineId: string,
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
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    if (!(await requireKestariManager(supabase, user.id))) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat menandai pelunasan denda.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    const { data: existing, error: fetchError } = await supabase
      .from("piket_fines")
      .select("id, status, profile_id, schedule_id, amount")
      .eq("id", fineId)
      .single();

    if (fetchError || !existing) {
      return {
        success: false,
        message: "Data denda tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Fine not found" },
      };
    }

    if (existing.status === "lunas") {
      return {
        success: false,
        message: "Denda sudah berstatus lunas.",
        error: { code: "BAD_REQUEST", details: "Fine already paid" },
      };
    }

    const { error: updateError } = await supabase
      .from("piket_fines")
      .update({ status: "lunas", paid_at: new Date().toISOString() })
      .eq("id", fineId);

    if (updateError) {
      return {
        success: false,
        message: "Gagal menandai pelunasan denda.",
        error: { code: "DATABASE_ERROR", details: updateError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "MARK_PIKET_FINE_PAID",
      targetUserId: existing.profile_id,
      oldValue: { fineId, status: existing.status },
      newValue: { fineId, status: "lunas" },
      details: `Menandai lunas denda piket Rp${Number(existing.amount).toLocaleString("id-ID")} (fineId: ${fineId}).`,
    });

    revalidatePath("/piket");

    return {
      success: true,
      message: "Denda piket ditandai lunas.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal menandai pelunasan denda.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Membatalkan (menghapus) denda piket (Kestari / Super Admin).
 */
export async function voidPiketFine(
  fineId: string,
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
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" },
      };
    }

    if (!(await requireKestariManager(supabase, user.id))) {
      return {
        success: false,
        message:
          "Akses ditolak. Hanya Kestari dan Super Admin yang dapat membatalkan denda piket.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    const { data: existing } = await supabase
      .from("piket_fines")
      .select("id, profile_id, schedule_id, amount, status")
      .eq("id", fineId)
      .maybeSingle();

    const { error: deleteError } = await supabase
      .from("piket_fines")
      .delete()
      .eq("id", fineId);

    if (deleteError) {
      return {
        success: false,
        message: "Gagal membatalkan denda piket.",
        error: { code: "DATABASE_ERROR", details: deleteError.message },
      };
    }

    await recordAuditLog({
      actorId: user.id,
      actionType: "VOID_PIKET_FINE",
      targetUserId: existing?.profile_id || null,
      oldValue: {
        fineId,
        profileId: existing?.profile_id,
        scheduleId: existing?.schedule_id,
        amount: existing?.amount,
        status: existing?.status,
      },
      details: `Membatalkan denda piket (fineId: ${fineId}).`,
    });

    revalidatePath("/piket");

    return {
      success: true,
      message: "Denda piket dibatalkan.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal membatalkan denda piket.",
      error: { code: "SERVER_ERROR", details: errMsg },
    };
  }
}

/**
 * Finalisasi otomatis: laporan auto-terverifikasi yang belum direview manusia
 * dan pekannya sudah berakhir (duty_date sebelum Senin pekan berjalan)
 * difinalisasi oleh sistem. Dipanggil lazy dari halaman /piket saat dilihat
 * Kestari / Super Admin (agar patuh RLS UPDATE).
 */
export async function finalizeExpiredPiketReviews(): Promise<
  ServerActionResponse<{ finalized: number }>
> {
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

    if (!(await requireKestariManager(supabase, user.id))) {
      return {
        success: false,
        message: "Akses ditolak.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" },
      };
    }

    const weekInfo = getPiketWeekInfo(new Date());
    const nowIso = new Date().toISOString();

    const { data: finalized, error: updateError } = await supabase
      .from("piket_logs")
      .update({ is_final: true, finalized_at: nowIso })
      .eq("is_final", false)
      .is("verified_by", null)
      .lt("duty_date", weekInfo.startIsoDate)
      .select("id");

    if (updateError) {
      return {
        success: false,
        message: "Gagal memfinalisasi laporan kedaluwarsa.",
        error: { code: "DATABASE_ERROR", details: updateError.message },
      };
    }

    const finalizedCount = finalized?.length ?? 0;
    if (finalizedCount > 0) {
      await recordAuditLog({
        actorId: user.id,
        actionType: "AUTO_FINALIZE_PIKET_LOGS",
        newValue: { finalizedCount, weekStart: weekInfo.startIsoDate },
        details: `Sistem memfinalisasi otomatis ${finalizedCount} laporan piket yang pekannya telah berakhir tanpa review.`,
      });
      revalidatePath("/piket");
    }

    return {
      success: true,
      message: `Finalisasi otomatis selesai (${finalizedCount} laporan).`,
      data: { finalized: finalizedCount },
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memfinalisasi laporan kedaluwarsa.",
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
