"use server";

import { createClient } from "@/lib/supabase/server";
import { encryptToken, decryptToken } from "@/lib/utils/crypto";
import { ServerActionResponse } from "@/lib/types/action";

interface DecryptedPayload {
  profile_id: string;
  activity_id: string;
  generated_at: number;
  coordinates?: { latitude?: number; longitude?: number };
}

/**
 * ACT-01: Generate encrypted short-string QR token for attendance check-in.
 * Only accessible by "caang" or "anggota" within the activity's time window.
 */
export async function generateAttendanceQR(
  activityId: string,
  coordinates?: { latitude?: number; longitude?: number; lat?: number; lng?: number }
): Promise<ServerActionResponse<{ qrString: string; expiresAt: string }>> {
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

    // 2. Verify role
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

    if (profile.role !== "caang" && profile.role !== "anggota") {
      return {
        success: false,
        message: "Hanya Calon Anggota (Caang) dan Anggota yang dapat melakukan absensi.",
        error: { code: "FORBIDDEN", details: "Role is not authorized" }
      };
    }

    // 3. Verify activity time window
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("start_date, end_date")
      .eq("id", activityId)
      .single();

    if (activityError || !activity) {
      return {
        success: false,
        message: "Kegiatan tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Activity not found" }
      };
    }

    const now = new Date();
    const startDate = new Date(activity.start_date);
    const endDate = new Date(activity.end_date);

    // Absensi dibuka 2 jam sebelum kegiatan dimulai
    const attendanceOpen = new Date(startDate.getTime() - 2 * 60 * 60 * 1000);
    // Absensi ditutup 2 jam setelah kegiatan berakhir
    const attendanceClose = new Date(endDate.getTime() + 2 * 60 * 60 * 1000);

    if (now < attendanceOpen) {
      return {
        success: false,
        message: "Absensi belum dibuka. Absensi dapat diakses mulai 2 jam sebelum kegiatan.",
        error: { code: "BAD_REQUEST", details: "Activity has not reached its attendance window yet" }
      };
    }

    if (now > attendanceClose) {
      return {
        success: false,
        message: "Absensi sudah ditutup. Batas akhir absensi adalah 2 jam setelah kegiatan selesai.",
        error: { code: "BAD_REQUEST", details: "Activity attendance window has already closed" }
      };
    }

    // Extract coordinates if present
    const coords = coordinates
      ? {
          latitude: coordinates.latitude ?? coordinates.lat,
          longitude: coordinates.longitude ?? coordinates.lng,
        }
      : undefined;

    // 4. Generate encrypted token payload
    const payload = {
      profile_id: user.id,
      activity_id: activityId,
      generated_at: Date.now(),
      coordinates: coords
    };

    const qrString = encryptToken(payload);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    return {
      success: true,
      message: "QR Code berhasil dibuat.",
      data: {
        qrString,
        expiresAt
      }
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal membuat QR Code absensi.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * ACT-01: Scan QR Code string and insert/update attendance log.
 * Only accessible by admins. Computes lateness and upserts.
 */
export async function scanAttendanceQR(
  qrString: string
): Promise<ServerActionResponse<{ name: string; status: "hadir" | "telat" }>> {
  console.log("=== SERVER DEBUG: scanAttendanceQR STARTED ===");
  console.log("qrString received:", qrString);
  try {
    const supabase = await createClient();

    // 1. Verify that the scanning user is an admin
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
    console.log("Auth user retrieval completed. adminUser ID:", adminUser?.id, "Error if any:", authError);
    if (authError || !adminUser) {
      console.warn("Auth check failed or no user logged in.");
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "Admin is not logged in" }
      };
    }

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    console.log("Admin profile check completed. Role:", adminProfile?.role, "Error if any:", adminProfileError);
    if (adminProfileError || !adminProfile) {
      console.warn("Failed to find admin profile in DB.");
      return {
        success: false,
        message: "Profil admin tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Admin profile not found" }
      };
    }

    const allowedRoles = ["admin-komdis", "admin-or", "super-admin"];
    if (!allowedRoles.includes(adminProfile.role)) {
      console.warn("Role not authorized. Required: admin, got:", adminProfile.role);
      return {
        success: false,
        message: "Hanya Admin yang dapat memindai QR Code absensi.",
        error: { code: "FORBIDDEN", details: "User role is not admin" }
      };
    }

    // 2. Decrypt token and validate expiration
    let payload: DecryptedPayload;
    try {
      payload = decryptToken(qrString) as unknown as DecryptedPayload;
      console.log("Successfully decrypted token. Payload:", payload);
    } catch (e: unknown) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      console.error("Token decryption failed. Error details:", errorMsg);
      return {
        success: false,
        message: "QR Code tidak valid.",
        error: { code: "INVALID_TOKEN", details: errorMsg }
      };
    }

    const { profile_id, activity_id, generated_at, coordinates } = payload;
    if (!profile_id || !activity_id || !generated_at) {
      console.warn("Payload is missing required parameters.");
      return {
        success: false,
        message: "Struktur QR Code tidak valid.",
        error: { code: "INVALID_STRUCTURE", details: "Missing required payload fields" }
      };
    }

    const now = Date.now();
    console.log("Checking token age. Token generated_at:", generated_at, "Current time:", now, "Diff (ms):", now - generated_at);
    if (now > generated_at + 5 * 60 * 1000) {
      console.warn("Token has expired. Age exceeds 5 minutes limit.");
      return {
        success: false,
        message: "QR Code Expired.",
        error: { code: "TOKEN_EXPIRED", details: "Token is older than 5 minutes" }
      };
    }

    // 3. Fetch activity details to determine status (hadir or telat)
    const { data: activity, error: activityError } = await supabase
      .from("activities")
      .select("start_date")
      .eq("id", activity_id)
      .single();

    console.log("Fetched activity details. Start date:", activity?.start_date, "Error if any:", activityError);
    if (activityError || !activity) {
      console.warn("Activity not found in DB.");
      return {
        success: false,
        message: "Kegiatan tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Activity not found" }
      };
    }

    const checkInTime = new Date();
    const startTime = new Date(activity.start_date);
    // Batas toleransi: 15 menit setelah start_date
    const toleranceLimit = new Date(startTime.getTime() + 15 * 60 * 1000);

    const status: "hadir" | "telat" = checkInTime > toleranceLimit ? "telat" : "hadir";
    console.log("Check-in calculation. Time:", checkInTime.toISOString(), "Limit:", toleranceLimit.toISOString(), "Status assigned:", status);

    // 4. Fetch user's profile and name
    const { data: targetProfile, error: targetProfileError } = await supabase
      .from("profiles")
      .select("role, nim")
      .eq("id", profile_id)
      .single();

    console.log("Fetched target student profile. Role:", targetProfile?.role, "NIM:", targetProfile?.nim, "Error if any:", targetProfileError);
    if (targetProfileError || !targetProfile) {
      console.warn("Student profile not found in DB.");
      return {
        success: false,
        message: "Profil mahasiswa tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Target profile not found" }
      };
    }

    let name = "Mahasiswa";
    if (targetProfile.role === "caang") {
      const { data: reg } = await supabase
        .from("registrations")
        .select("full_name")
        .eq("profile_id", profile_id)
        .maybeSingle();
      name = reg?.full_name || "Caang";
    } else {
      const { data: legacy } = await supabase
        .from("legacy_members")
        .select("full_name")
        .eq("profile_id", profile_id)
        .maybeSingle();
      name = legacy?.full_name || "Anggota";
    }
    console.log("Resolved target student name:", name);

    // 5. Upsert attendance record
    console.log("Attempting database upsert on attendances table...");
    const { error: upsertError } = await supabase
      .from("attendances")
      .upsert({
        activity_id,
        profile_id,
        check_in_at: checkInTime.toISOString(),
        status,
        notes: coordinates ? `Coordinates: ${JSON.stringify(coordinates)}` : null,
        verified_by: adminUser.id
      }, {
        onConflict: "activity_id,profile_id"
      });

    if (upsertError) {
      console.error("=== SERVER DATABASE UPSERT ERROR ===");
      console.error("Message:", upsertError.message);
      console.error("Full details object:", JSON.stringify(upsertError, null, 2));
      return {
        success: false,
        message: "Gagal mencatat absensi ke database.",
        error: { code: "DATABASE_ERROR", details: upsertError.message }
      };
    }

    console.log("Database upsert success! Attendance logged successfully.");
    return {
      success: true,
      message: "Absensi berhasil dicatat.",
      data: {
        name,
        status
      }
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error("=== SERVER UNEXPECTED EXCEPTION ===");
    console.error(errMsg);
    return {
      success: false,
      message: "Gagal memproses pemindaian QR Code absensi.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  } finally {
    console.log("=== SERVER DEBUG: scanAttendanceQR FINISHED ===");
  }
}

/**
 * ACT-02: Submit leave request (sakit / izin).
 * Uploads a document/proof to registrations private storage bucket.
 * Inserts/upserts an attendance record with verified_by = null.
 */
export async function submitLeaveRequest(
  formData: FormData
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

    const activityId = formData.get("activity_id") as string;
    const status = formData.get("status") as "sakit" | "izin";
    const notes = formData.get("notes") as string;
    const file = formData.get("file") as File | null;

    if (!activityId || !status || !notes) {
      return {
        success: false,
        message: "Semua kolom input wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing required fields" }
      };
    }

    if (status !== "sakit" && status !== "izin") {
      return {
        success: false,
        message: "Status tidak valid.",
        error: { code: "BAD_REQUEST", details: "Status must be sakit or izin" }
      };
    }

    let proofUrl = "";
    if (file && file.size > 0) {
      // Create path: leaves/[userId]/[activityId]/[filename]
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `leaves/${user.id}/${activityId}/${fileName}`;

      // Convert file to Buffer
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadError } = await supabase.storage
        .from("registrations")
        .upload(filePath, buffer, {
          contentType: file.type,
          upsert: true
        });

      if (uploadError) {
        return {
          success: false,
          message: "Gagal mengunggah file bukti.",
          error: { code: "STORAGE_ERROR", details: uploadError.message }
        };
      }

      proofUrl = filePath;
    } else {
      return {
        success: false,
        message: "File bukti izin atau sakit wajib diunggah.",
        error: { code: "BAD_REQUEST", details: "File is missing" }
      };
    }

    // 2. Record attendance in database
    const { error: upsertError } = await supabase
      .from("attendances")
      .upsert({
        activity_id: activityId,
        profile_id: user.id,
        check_in_at: new Date().toISOString(),
        status,
        notes,
        proof_url: proofUrl,
        verified_by: null // waiting for admin intervention
      }, {
        onConflict: "activity_id,profile_id"
      });

    if (upsertError) {
      return {
        success: false,
        message: "Gagal mencatat pengajuan izin.",
        error: { code: "DATABASE_ERROR", details: upsertError.message }
      };
    }

    return {
      success: true,
      message: "Pengajuan izin berhasil dikirim. Menunggu verifikasi admin."
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal mengirim pengajuan izin.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * ACT-02: Manual override attendance status by Admin.
 * Admin notes must be provided.
 */
export async function manualOverrideAttendance(
  attendanceId: string,
  status: string,
  adminNotes: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Get current user and verify admin role
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser();
    if (authError || !adminUser) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "Admin is not logged in" }
      };
    }

    const { data: adminProfile, error: adminProfileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", adminUser.id)
      .single();

    if (adminProfileError || !adminProfile) {
      return {
        success: false,
        message: "Profil admin tidak ditemukan.",
        error: { code: "NOT_FOUND", details: "Admin profile not found" }
      };
    }

    const allowedRoles = ["admin-komdis", "admin-or", "super-admin"];
    if (!allowedRoles.includes(adminProfile.role)) {
      return {
        success: false,
        message: "Hanya Admin yang dapat memodifikasi absensi secara manual.",
        error: { code: "FORBIDDEN", details: "User role is not admin" }
      };
    }

    // 2. Validate input notes
    if (!adminNotes || adminNotes.trim().length === 0) {
      return {
        success: false,
        message: "Catatan penyesuaian wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Admin notes cannot be empty" }
      };
    }

    // Validate status value
    const validStatuses = ["hadir", "izin", "sakit", "alfa"];
    if (!validStatuses.includes(status)) {
      return {
        success: false,
        message: "Status absensi tidak valid.",
        error: { code: "BAD_REQUEST", details: `Status must be one of: ${validStatuses.join(", ")}` }
      };
    }

    // 3. Update attendance
    const { error: updateError } = await supabase
      .from("attendances")
      .update({
        status: status as "hadir" | "izin" | "sakit" | "alfa",
        notes: adminNotes,
        verified_by: adminUser.id
      })
      .eq("id", attendanceId);

    if (updateError) {
      return {
        success: false,
        message: "Gagal menyesuaikan status absensi.",
        error: { code: "DATABASE_ERROR", details: updateError.message }
      };
    }

    return {
      success: true,
      message: "Status absensi berhasil diperbarui secara manual."
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses penyesuaian absensi manual.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
