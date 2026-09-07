"use server";

import "server-only";

import { createClient } from "@/lib/supabase/server";
import { ServerActionResponse } from "@/lib/types/action";

// ============================================================================
// TYPES
// ============================================================================

export interface InAppNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  type: string;
  reference_id: string | null;
  reference_type: string | null;
  is_read: boolean;
  created_at: string;
}

// ============================================================================
// HELPER: Verify authenticated user
// ============================================================================

async function verifyUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: Sesi tidak ditemukan.");
  }

  return { supabase, user };
}

// ============================================================================
// GET: Jumlah Notifikasi Belum Dibaca
// ============================================================================

export async function getUnreadNotificationCount(): Promise<
  ServerActionResponse<{ count: number }>
> {
  try {
    const { supabase, user } = await verifyUser();

    const { count, error } = await supabase
      .from("in_app_notifications")
      .select("*", { count: "exact", head: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      return {
        success: false,
        message: "Gagal mengambil jumlah notifikasi.",
        error: { code: "DB_ERROR", details: error.message },
      };
    }

    return {
      success: true,
      message: "Berhasil.",
      data: { count: count ?? 0 },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================================
// GET: Daftar Notifikasi (dengan limit)
// ============================================================================

export async function getNotifications(
  limit: number = 20,
): Promise<ServerActionResponse<InAppNotification[]>> {
  try {
    const { supabase, user } = await verifyUser();

    const { data, error } = await supabase
      .from("in_app_notifications")
      .select("*")
      .eq("recipient_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      return {
        success: false,
        message: "Gagal mengambil daftar notifikasi.",
        error: { code: "DB_ERROR", details: error.message },
      };
    }

    return {
      success: true,
      message: "Berhasil.",
      data: (data as InAppNotification[]) ?? [],
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================================
// UPDATE: Tandai Satu Notifikasi Sebagai Dibaca
// ============================================================================

export async function markNotificationAsRead(
  notificationId: string,
): Promise<ServerActionResponse> {
  try {
    const { supabase } = await verifyUser();

    if (!notificationId) {
      return { success: false, message: "ID notifikasi tidak valid." };
    }

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    if (error) {
      return {
        success: false,
        message: "Gagal menandai notifikasi sebagai dibaca.",
        error: { code: "DB_ERROR", details: error.message },
      };
    }

    return { success: true, message: "Notifikasi telah ditandai dibaca." };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================================
// UPDATE: Tandai Semua Notifikasi Sebagai Dibaca
// ============================================================================

export async function markAllNotificationsAsRead(): Promise<ServerActionResponse> {
  try {
    const { supabase, user } = await verifyUser();

    const { error } = await supabase
      .from("in_app_notifications")
      .update({ is_read: true })
      .eq("recipient_id", user.id)
      .eq("is_read", false);

    if (error) {
      return {
        success: false,
        message: "Gagal menandai semua notifikasi sebagai dibaca.",
        error: { code: "DB_ERROR", details: error.message },
      };
    }

    return {
      success: true,
      message: "Semua notifikasi telah ditandai dibaca.",
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}

// ============================================================================
// GET: Cek Ketersediaan Kegiatan (Sebelum Navigasi Notifikasi)
// ============================================================================

export async function checkActivityExists(
  activityId: string,
): Promise<ServerActionResponse<{ exists: boolean }>> {
  try {
    const { supabase } = await verifyUser();

    if (!activityId) {
      return { success: true, message: "Berhasil.", data: { exists: false } };
    }

    const { data, error } = await supabase
      .from("activities")
      .select("id")
      .eq("id", activityId)
      .is("deleted_at", null)
      .maybeSingle();

    if (error) {
      return {
        success: false,
        message: "Gagal memeriksa status kegiatan.",
        error: { code: "DB_ERROR", details: error.message },
      };
    }

    return {
      success: true,
      message: "Berhasil.",
      data: { exists: !!data },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: msg,
      error: { code: "SERVER_ERROR", details: msg },
    };
  }
}
