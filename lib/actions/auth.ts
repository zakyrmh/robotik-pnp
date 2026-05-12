"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://127.0.0.1:3000"}/callback`,
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

  return { user, profile };
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
