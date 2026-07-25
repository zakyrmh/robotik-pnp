"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { RegisterState } from "@/lib/types/auth";

// ============================================================
// Register Action
// ============================================================
export async function register(prevState: RegisterState, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  // Validasi
  if (!email || !password || !confirmPassword) {
    return { error: "Semua field harus diisi." };
  }

  if (password !== confirmPassword) {
    return { error: "Password tidak cocok." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format email tidak valid." };
  }

  const supabase = await createClient();

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured");
    return { error: "Konfigurasi server tidak valid. Hubungi administrator." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${siteUrl}/callback`,
    },
  });

  if (error) {
    if (error.message.includes("already registered")) {
      return { error: "Email sudah terdaftar. Silahkan login." };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/verify-email");
}

// ============================================================
// Login Action
// ============================================================
export async function login(prevState: RegisterState, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email dan password wajib diisi." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Penanganan error spesifik untuk pengalaman pengguna yang lebih baik
    if (error.message.includes("Invalid login credentials")) {
      return { error: "Email atau password salah." };
    }
    if (error.message.includes("Email not confirmed")) {
      return {
        error: "Email Anda belum dikonfirmasi. Silahkan cek inbox Anda.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

// ============================================================
// Auth Callback (Email Verification)
// ============================================================
export async function exchangeCodeForSession(code: string) {
  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  return { success: true };
}

// ============================================================
// Get Current User Profile (Server-side)
// ============================================================
export async function getCurrentUser() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  let name = "";
  let photoUrl = "";

  // 1. Cek registrations untuk caang/pendaftar
  const { data: reg } = await supabase
    .from("registrations")
    .select("full_name, photo_url")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (reg) {
    name = reg.full_name || "";
    photoUrl = reg.photo_url || "";
  }

  // 2. Cek legacy_members untuk anggota
  if (!name && profile.nim) {
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data: legacy } = await supabaseAdmin
      .from("legacy_members")
      .select("full_name")
      .eq("profile_id", user.id)
      .maybeSingle();

    if (legacy) {
      name = legacy.full_name || "";
    }
  }

  // Fallback ke metadata atau email jika nama masih kosong
  if (!name) {
    name =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split("@")[0] ||
      "User";
  }

  return {
    id: user.id,
    email: user.email,
    name,
    role: profile.role,
    photo_url: photoUrl,
    nim: profile.nim,
    is_onboarded: profile.is_onboarded,
  };
}

// ============================================================
// Sign Out
// ============================================================
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/register");
}

// ============================================================
// Forgot Password Action
// ============================================================
export async function forgotPassword(
  prevState: RegisterState,
  formData: FormData,
) {
  const rawEmail = formData.get("email") as string;
  const rawNim = formData.get("nim") as string;

  const email = rawEmail?.trim();
  const nim = rawNim?.trim();

  if (!email || !nim) {
    return { error: "NIM dan Email wajib diisi." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: "Format email tidak valid." };
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, nim")
    .eq("nim", nim)
    .maybeSingle();

  if (profileError || !profile) {
    return { error: "NIM tidak ditemukan." };
  }

  if (profile.email?.toLowerCase() !== email.toLowerCase()) {
    return { error: "Email tidak terdaftar atau tidak cocok dengan NIM." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  if (!siteUrl) {
    console.error("NEXT_PUBLIC_SITE_URL is not configured");
    return { error: "Konfigurasi server tidak valid. Hubungi administrator." };
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/callback?next=/update-password`,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/forgot-password/waiting");
}

// ============================================================
// Update Password Action
// ============================================================
export async function updatePassword(
  prevState: RegisterState,
  formData: FormData,
) {
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    return { error: "Semua field harus diisi." };
  }

  if (password !== confirmPassword) {
    return { error: "Password tidak cocok." };
  }

  if (password.length < 8) {
    return { error: "Password minimal 8 karakter." };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      error:
        "Sesi reset password tidak valid atau telah kadaluwarsa. Silakan minta link reset password baru.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    return { error: error.message };
  }

  // Logout dari sesi recovery agar pengguna login secara normal
  await supabase.auth.signOut();

  redirect("/login?message=Password+berhasil+diperbarui.+Silakan+login.");
}
