"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import {
  updateProfileSchema,
  updateEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  type UpdateProfileInput,
  type UpdateEmailInput,
  type ChangePasswordInput,
  type DeleteAccountInput,
} from "@/lib/schemas/settings";

export type ServerActionResponse<T = unknown> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  return (
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "127.0.0.1"
  );
}

/**
 * Retrieves consolidated data for rendering the Settings page.
 */
export async function getSettingsDataAction() {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { error: "Sesi tidak valid atau telah berakhir." };
  }

  // Fetch Profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profil pengguna tidak ditemukan." };
  }

  // Fetch Registration detail
  const { data: registration } = await supabase
    .from("registrations")
    .select("*")
    .eq("profile_id", user.id)
    .maybeSingle();

  // Fetch Study Programs & Majors list for select dropdowns
  const { data: studyPrograms } = await supabase
    .from("study_programs")
    .select("id, name, degree, major_id, majors(name)")
    .order("name", { ascending: true });

  // Role-specific data
  let caangGroup = null;
  let orgHistories = null;

  if (profile.role === "caang") {
    const { data: groupMember } = await supabase
      .from("group_members")
      .select("caang_groups(id, name, mentor_id, profiles(full_name))")
      .eq("profile_id", user.id)
      .maybeSingle();
    caangGroup = groupMember?.caang_groups || null;
  }

  if (
    profile.role === "anggota" ||
    profile.role === "admin-or" ||
    profile.role === "admin-komdis" ||
    profile.role === "super-admin"
  ) {
    if (profile.nim) {
      const { data: histories } = await supabase
        .from("organizational_histories")
        .select(
          "id, role_name, sub_section, departments(name), membership_periods(period_name)",
        )
        .eq("nim_member", profile.nim);
      orgHistories = histories || [];
    }
  }

  return {
    user: {
      id: user.id,
      email: user.email,
    },
    profile,
    registration,
    studyPrograms: studyPrograms || [],
    roleData: {
      caangGroup,
      orgHistories,
    },
  };
}

/**
 * Updates personal profile & registration biodata.
 */
export async function updateProfileAction(
  rawInput: UpdateProfileInput,
): Promise<ServerActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Anda harus login terlebih dahulu." };
  }

  const validation = updateProfileSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  const data = validation.data;

  // 1. Update Profiles table
  const profileUpdateData: Record<string, unknown> = {};
  if (data.full_name !== undefined && data.full_name !== "") {
    profileUpdateData.full_name = data.full_name;
  }
  if (data.avatar_url !== undefined) {
    profileUpdateData.avatar_url = data.avatar_url;
  }

  if (Object.keys(profileUpdateData).length > 0) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update(profileUpdateData)
      .eq("id", user.id);

    if (profileErr) {
      return { success: false, message: profileErr.message };
    }
  }

  // 2. Check if Registrations record exists
  const { data: existingReg } = await supabase
    .from("registrations")
    .select("id")
    .eq("profile_id", user.id)
    .maybeSingle();

  const regFields = {
    nickname: data.nickname || "",
    gender: data.gender || "L",
    pob: data.pob || "",
    dob: data.dob || "2000-01-01",
    phone_number: data.phone_number || "",
    study_program_id: data.study_program_id || null,
    entry_year: data.entry_year || new Date().getFullYear(),
    current_class: data.current_class || null,
    high_school: data.high_school || null,
    origin_address: data.origin_address || "-",
    domicile_address: data.domicile_address || "-",
    motivation: data.motivation || null,
    org_experience: data.org_experience || null,
    achievements: data.achievements || null,
    updated_at: new Date().toISOString(),
  };

  if (existingReg) {
    const { error: regErr } = await supabase
      .from("registrations")
      .update(regFields)
      .eq("profile_id", user.id);

    if (regErr) {
      return { success: false, message: regErr.message };
    }
  } else {
    // Insert new registration record linked to profile_id
    const { error: insertErr } = await supabase.from("registrations").insert({
      profile_id: user.id,
      full_name: data.full_name || user.email?.split("@")[0] || "User",
      ...regFields,
    });

    if (insertErr) {
      return { success: false, message: insertErr.message };
    }
  }

  revalidatePath("/settings");
  return { success: true, message: "Profil berhasil diperbarui." };
}

/**
 * Updates account email address with password confirmation.
 */
export async function updateEmailAction(
  rawInput: UpdateEmailInput,
): Promise<ServerActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { success: false, message: "Sesi tidak valid." };
  }

  const validation = updateEmailSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  // 1. Verify current password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validation.data.currentPassword,
  });

  if (signInErr) {
    return {
      success: false,
      message: "Kata sandi saat ini salah.",
    };
  }

  // 2. Request email update via Supabase Auth
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const { error: updateErr } = await supabase.auth.updateUser(
    { email: validation.data.newEmail },
    { emailRedirectTo: siteUrl ? `${siteUrl}/callback?next=/settings` : undefined },
  );

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath("/settings");
  return {
    success: true,
    message:
      "Tautan konfirmasi perubahan email telah dikirim ke email baru Anda.",
  };
}

/**
 * Changes account password with current password verification.
 */
export async function changePasswordAction(
  rawInput: ChangePasswordInput,
): Promise<ServerActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { success: false, message: "Sesi tidak valid." };
  }

  const validation = changePasswordSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  // 1. Re-authenticate current password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validation.data.currentPassword,
  });

  if (signInErr) {
    return {
      success: false,
      message: "Kata sandi saat ini salah.",
    };
  }

  // 2. Update password
  const { error: updateErr } = await supabase.auth.updateUser({
    password: validation.data.newPassword,
  });

  if (updateErr) {
    return { success: false, message: updateErr.message };
  }

  revalidatePath("/settings");
  return { success: true, message: "Kata sandi berhasil diperbarui." };
}

/**
 * Requests soft deletion of account (Danger Zone / UU PDP & ISMS Compliance).
 */
export async function requestAccountDeletionAction(
  rawInput: DeleteAccountInput,
): Promise<ServerActionResponse> {
  const clientIp = await getClientIp();
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user || !user.email) {
    return { success: false, message: "Sesi tidak valid." };
  }

  const validation = deleteAccountSchema.safeParse(rawInput);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Input tidak valid.",
    };
  }

  // 1. Re-authenticate current password
  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: validation.data.currentPassword,
  });

  if (signInErr) {
    return {
      success: false,
      message: "Kata sandi saat ini salah.",
    };
  }

  const nowStr = new Date().toISOString();

  // 2. Soft delete on profiles
  const { error: profErr } = await supabase
    .from("profiles")
    .update({
      deleted_at: nowStr,
      delete_reason: validation.data.deleteReason,
    })
    .eq("id", user.id);

  if (profErr) {
    return { success: false, message: profErr.message };
  }

  // 3. Soft delete on registrations
  await supabase
    .from("registrations")
    .update({
      deleted_at: nowStr,
      delete_reason: validation.data.deleteReason,
    })
    .eq("profile_id", user.id);

  // 4. Audit Log Entry (Immutable Audit Trail)
  await supabase.from("system_audit_logs").insert({
    actor_id: user.id,
    target_user_id: user.id,
    action_type: "ACCOUNT_SELF_DELETION",
    details: `Pengguna mengajukan soft delete akun. Alasan: ${validation.data.deleteReason}`,
    ip_address: clientIp,
  });

  // 5. Sign out user
  await supabase.auth.signOut();

  revalidatePath("/", "layout");
  return {
    success: true,
    message: "Akun Anda telah berhasil dinonaktifkan.",
  };
}

/**
 * Exports user's personal data (Data Portability under UU PDP No. 27/2022).
 */
export async function exportUserDataAction(): Promise<ServerActionResponse> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return { success: false, message: "Anda harus login terlebih dahulu." };
  }

  const [
    profileRes,
    regRes,
    attendanceRes,
    taskRes,
    piketRes,
    notificationRes,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    supabase
      .from("registrations")
      .select("*")
      .eq("profile_id", user.id)
      .maybeSingle(),
    supabase.from("attendances").select("*").eq("profile_id", user.id),
    supabase.from("task_submissions").select("*").eq("profile_id", user.id),
    supabase.from("piket_logs").select("*").eq("reported_by", user.id),
    supabase
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_id", user.id),
  ]);

  const exportPayload = {
    exported_at: new Date().toISOString(),
    user: {
      id: user.id,
      email: user.email,
    },
    profile: profileRes.data,
    registration: regRes.data,
    attendances: attendanceRes.data || [],
    task_submissions: taskRes.data || [],
    piket_logs: piketRes.data || [],
    notifications: notificationRes.data || [],
  };

  return {
    success: true,
    message: "Data berhasil diekspor.",
    data: exportPayload,
  };
}
