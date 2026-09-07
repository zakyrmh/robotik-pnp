"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

// ============================================================
// Get Registration Status
// Dipakai oleh halaman /waiting untuk polling status
// ============================================================
export async function getRegistrationStatus() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { success: false, error: "Sesi tidak ditemukan." };
  }

  const { data, error } = await supabase
    .from("registrations")
    .select("status, full_name, created_at, updated_at")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (error) {
    return { success: false, error: "Gagal mengambil data registrasi." };
  }

  // Belum ada registrasi sama sekali → kembalikan ke onboarding
  if (!data) {
    return {
      success: false,
      error: "Registrasi tidak ditemukan.",
      redirect: "/onboarding",
    };
  }

  return {
    success: true,
    status: data.status as "pending" | "verified" | "rejected",
    fullName: data.full_name,
    submittedAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

// ============================================================
// Guard: Server-side redirect berdasarkan status registrasi
// Dipanggil dari page.tsx (Server Component) halaman /waiting
// ============================================================
export async function guardWaitingPage() {
  const supabase = await createClient();

  // 1. Pastikan sudah login
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 2. Ambil profile + registrasi paralel — hemat 1 round-trip
  const [{ data: profile }, { data: reg }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role, is_onboarded")
      .eq("id", user.id)
      .single(),
    supabase
      .from("registrations")
      .select("status")
      .eq("profile_id", user.id)
      .maybeSingle(),
  ]);

  if (!profile) redirect("/login");

  // 3. Sudah jadi anggota/admin resmi → ke dashboard
  //    (role bukan caang = sudah diverifikasi dan dipromote)
  if (reg?.status === "verified") {
    redirect("/dashboard");
  }

  // 4. Belum ada registrasi sama sekali → belum mulai onboarding
  if (!reg) {
    redirect("/onboarding");
  }

  // 5. Registrasi verified tapi role belum terupdate (edge case race condition)
  if (reg.status === "verified") {
    redirect("/dashboard");
  }

  // 6. Status pending atau rejected → render halaman waiting ✓
}
