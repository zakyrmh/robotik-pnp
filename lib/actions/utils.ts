/**
 * Shared utilities untuk Server Actions.
 *
 * Menyediakan:
 * - ActionResult<T>: tipe standar response semua server action
 * - getAuthContext():  ambil user + claims sekaligus, single call
 * - requireAuth():     shorthand guard — return error kalau belum login
 * - requireModule():   shorthand guard — return error kalau tidak punya akses modul
 */

import { createClient } from "@/lib/supabase/server";
import {
  decodeJwtClaims,
  isBypassRole,
  hasRole,
  hasDepartment,
  type AppClaims,
} from "@/lib/supabase/claims";
export { isBypassRole } from "@/lib/supabase/claims";

// ── Tipe standar response server action ──────────────────

export interface ActionResult<T = void> {
  data: T | null;
  error: string | null;
}

export function ok<T>(data: T): ActionResult<T> {
  return { data, error: null };
}

export function fail<T = never>(error: string): ActionResult<T> {
  return { data: null, error };
}

// ── Auth context ──────────────────────────────────────────

export interface AuthContext {
  userId: string;
  claims: AppClaims;
}

/**
 * Ambil user dan JWT claims sekaligus dalam satu fungsi.
 * Gunakan ini di awal setiap server action sebagai pengganti
 * memanggil getUser() dan getSession() secara terpisah.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const [
    {
      data: { user },
    },
    {
      data: { session },
    },
  ] = await Promise.all([supabase.auth.getUser(), supabase.auth.getSession()]);

  if (!user || !session?.access_token) return null;

  const claims = decodeJwtClaims(session.access_token);
  return { userId: user.id, claims };
}

// ── Guard helpers ─────────────────────────────────────────

/**
 * Guard: pastikan user sudah login.
 * Return AuthContext jika valid, ActionResult error jika tidak.
 *
 * @example
 * const auth = await requireAuth()
 * if (isActionError(auth)) return auth
 */
export async function requireAuth(): Promise<
  AuthContext | ActionResult<never>
> {
  const ctx = await getAuthContext();
  if (!ctx) return fail("Sesi tidak valid. Silakan login kembali.");
  return ctx;
}

/**
 * Guard: pastikan user login DAN punya akses ke modul tertentu.
 * Bypass otomatis untuk super_admin dan admin.
 *
 * @param requiredDept - slug departemen yang diperlukan
 * @param requiredRole - role alternatif selain anggota (opsional)
 *
 * @example
 * const auth = await requireModule('kesekretariatan')
 * if (isActionError(auth)) return auth
 */
export async function requireModule(
  requiredDept: string,
  requiredRole?: string,
): Promise<AuthContext | ActionResult<never>> {
  const ctx = await getAuthContext();
  if (!ctx) return fail("Sesi tidak valid. Silakan login kembali.");

  const { claims } = ctx;

  // super_admin dan admin bypass semua pengecekan
  if (isBypassRole(claims)) return ctx;

  // Cek role
  const roles = requiredRole ? ["anggota", requiredRole] : ["anggota"];
  if (!hasRole(claims, ...roles)) {
    return fail("Akses ditolak.");
  }

  // Cek departemen
  if (!hasDepartment(claims, requiredDept)) {
    return fail("Akses ditolak.");
  }

  return ctx;
}

/**
 * Type guard: cek apakah return value dari requireAuth/requireModule
 * adalah error result (bukan AuthContext).
 *
 * @example
 * const auth = await requireModule('kesekretariatan')
 * if (isActionError(auth)) return auth
 */
export function isActionError<T>(
  value: AuthContext | ActionResult<T>,
): value is ActionResult<T> {
  return "error" in value && !("userId" in value);
}
