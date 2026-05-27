"use server";

import fs from "fs";
import path from "path";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { ServerActionResponse } from "@/lib/types/action";

const settingsPath = path.join(process.cwd(), "lib/actions/internship_settings.json");

/**
 * Helper to check if internship registration is open.
 */
export async function isInternshipRegistrationOpen(): Promise<boolean> {
  try {
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf8");
      const parsed = JSON.parse(data) as { isOpen?: boolean };
      return !!parsed.isOpen;
    }
  } catch (e) {
    console.error("Gagal membaca status pendaftaran magang:", e);
  }
  return false;
}

/**
 * ACT-06 (3.2): Toggle internship registration open/close status.
 * Accessible only by Admin OR or Super Admin.
 * Persists status in a local workspace JSON configuration file.
 */
export async function toggleInternshipRegistration(
  isOpen: boolean
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

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

    const allowedRoles = ["admin-or", "super-admin"];
    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat membuka/menutup pendaftaran magang.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" }
      };
    }

    // 2. Persist status in local workspace JSON file
    const dir = path.dirname(settingsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(settingsPath, JSON.stringify({ isOpen }), "utf8");

    return {
      success: true,
      message: `Pendaftaran magang berhasil ${isOpen ? "dibuka" : "ditutup"}.`,
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal mengubah status pendaftaran magang.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

/**
 * ACT-06 (3.2): Apply for an internship division by Caang.
 * Requires registration to be open.
 * Uses service role to bypass database insert RLS.
 */
export async function applyInternship(
  divisionId: string
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated caang
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

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

    if (profile.role !== "caang") {
      return {
        success: false,
        message: "Hanya Calon Anggota (Caang) yang dapat mendaftar magang.",
        error: { code: "FORBIDDEN", details: "Role is not authorized" }
      };
    }

    // 2. Check if registration is open
    const isOpen = await isInternshipRegistrationOpen();
    if (!isOpen) {
      return {
        success: false,
        message: "Pendaftaran magang saat ini sedang ditutup.",
        error: { code: "FORBIDDEN", details: "Internship registration is closed" }
      };
    }

    // 3. Upsert selection in internships table.
    // Since caang cannot insert/update internships table directly via RLS,
    // we use supabaseAdmin service client.
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: existing, error: selectError } = await supabaseAdmin
      .from("internships")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (selectError) {
      return {
        success: false,
        message: "Gagal memeriksa status magang.",
        error: { code: "DATABASE_ERROR", details: selectError.message }
      };
    }

    if (existing) {
      const { error: updateError } = await supabaseAdmin
        .from("internships")
        .update({ division_id: divisionId })
        .eq("profile_id", user.id);

      if (updateError) {
        return {
          success: false,
          message: "Gagal memperbarui pilihan divisi magang.",
          error: { code: "DATABASE_ERROR", details: updateError.message }
        };
      }
    } else {
      const { error: insertError } = await supabaseAdmin
        .from("internships")
        .insert({
          profile_id: user.id,
          division_id: divisionId
        });

      if (insertError) {
        return {
          success: false,
          message: "Gagal mendaftar divisi magang.",
          error: { code: "DATABASE_ERROR", details: insertError.message }
        };
      }
    }

    return {
      success: true,
      message: "Pendaftaran divisi magang berhasil disimpan.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses pendaftaran magang.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}

interface PlottingData {
  profileId: string;
  divisionId: string;
  mentorId: string;
  taskDescription: string;
}

/**
 * ACT-06 (3.2): Official verification and plotting of Caang internships.
 * Accessible only by Admin OR or Super Admin.
 */
export async function verifyInternshipPlotting(
  data: PlottingData
): Promise<ServerActionResponse> {
  try {
    const supabase = await createClient();

    // 1. Verify authenticated admin
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return {
        success: false,
        message: "Sesi tidak ditemukan. Silakan login kembali.",
        error: { code: "UNAUTHORIZED", details: "User is not logged in" }
      };
    }

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

    const allowedRoles = ["admin-or", "super-admin"];
    if (!allowedRoles.includes(profile.role)) {
      return {
        success: false,
        message: "Hanya Admin OR atau Super Admin yang dapat melakukan plotting magang.",
        error: { code: "FORBIDDEN", details: "User role is not authorized" }
      };
    }

    const { profileId, divisionId, mentorId, taskDescription } = data;
    if (!profileId || !divisionId || !mentorId || !taskDescription) {
      return {
        success: false,
        message: "Semua kolom input wajib diisi.",
        error: { code: "BAD_REQUEST", details: "Missing required fields" }
      };
    }

    // 2. Upsert official internship plotting (admin client bypasses RLS naturally due to policy)
    const { error: upsertError } = await supabase
      .from("internships")
      .upsert({
        profile_id: profileId,
        division_id: divisionId,
        mentor_id: mentorId,
        task_description: taskDescription
      }, {
        onConflict: "profile_id"
      });

    if (upsertError) {
      return {
        success: false,
        message: "Gagal menetapkan plotting magang resmi.",
        error: { code: "DATABASE_ERROR", details: upsertError.message }
      };
    }

    return {
      success: true,
      message: "Plotting magang resmi berhasil diverifikasi dan disimpan.",
    };
  } catch (err: unknown) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: "Gagal memproses plotting magang.",
      error: { code: "SERVER_ERROR", details: errMsg }
    };
  }
}
