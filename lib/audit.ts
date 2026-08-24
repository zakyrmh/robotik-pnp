import "server-only";

import { headers } from "next/headers";
import { createAdminClient, createClient } from "@/lib/supabase/server";

// ============================================================================
// AUDIT ACTION TYPE DEFINITIONS
// ============================================================================

export type SystemAuditActionType =
  // User Management & Auth
  | "UPDATE_USER_IDENTITY"
  | "SOFT_DELETE_USER"
  | "RESTORE_USER"
  | "RESET_USER_ONBOARDING"
  | "REQUEST_ACCOUNT_DELETION"
  // Disciplinary & Points (Komdis)
  | "ISSUE_DISCIPLINARY_SANCTION"
  | "REVOKE_DISCIPLINARY_SANCTION"
  | "ADJUST_DISCIPLINE_POINTS"
  | "VERIFY_PIKET_FINE"
  | "WAIVE_PIKET_FINE"
  // Organizational Structure & Governance
  | "CREATE_ORG_STRUCTURE"
  | "UPDATE_ORG_STRUCTURE"
  | "DELETE_ORG_STRUCTURE"
  | "CREATE_MEMBERSHIP_PERIOD"
  | "UPDATE_MEMBERSHIP_PERIOD"
  | "CREATE_DEPARTMENT"
  | "UPDATE_DEPARTMENT"
  | "DELETE_DEPARTMENT"
  | "CREATE_DIVISION"
  | "UPDATE_DIVISION"
  | "DELETE_DIVISION"
  // Activities & Dynamic QR Attendance
  | "CREATE_ACTIVITY_SESSION"
  | "UPDATE_ACTIVITY_SESSION"
  | "DELETE_ACTIVITY_SESSION"
  | "OVERRIDE_ATTENDANCE_STATUS"
  // Open Recruitment (Oprec) Progression
  | "UPDATE_RECRUITMENT_WINDOW"
  | "SCORE_RECRUITMENT_STAGE"
  | "UPDATE_APPLICANT_STATUS"
  | "ASSIGN_CAANG_GROUP";

export interface RecordAuditLogParams {
  actorId: string;
  actionType: SystemAuditActionType | string;
  targetUserId?: string | null;
  oldValue?: Record<string, unknown> | null;
  newValue?: Record<string, unknown> | null;
  details?: string | null;
  ipAddress?: string | null;
}

// ============================================================================
// PII MASKING UTILITY (UU PDP NO. 27 TAHUN 2022 COMPLIANT)
// ============================================================================

export function maskPhoneNumber(phone: string): string {
  const clean = phone.replace(/\D/g, "");
  if (clean.length < 8) return "***";
  const start = clean.slice(0, 4);
  const end = clean.slice(-4);
  return `${start}-****-${end}`;
}

export function maskNim(nim: string): string {
  if (nim.length <= 6) return nim.slice(0, 2) + "****";
  return nim.slice(0, 6) + "****";
}

export function maskEmail(email: string): string {
  const parts = email.split("@");
  if (parts.length !== 2) return "***@***";
  const [name, domain] = parts;
  if (name.length <= 2) return `${name[0]}***@${domain}`;
  return `${name[0]}***${name[name.length - 1]}@${domain}`;
}

/**
 * Sanitize and mask sensitive PII attributes inside old_value and new_value JSON payloads
 */
export function sanitizeAuditPayload(
  payload?: Record<string, unknown> | null,
): Record<string, unknown> | null {
  if (!payload || typeof payload !== "object") return null;

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    const lowerKey = key.toLowerCase();

    // Redact absolute secrets
    if (
      lowerKey.includes("password") ||
      lowerKey.includes("token") ||
      lowerKey.includes("secret") ||
      lowerKey.includes("auth")
    ) {
      result[key] = "[REDACTED_SECRET]";
      continue;
    }

    // Mask phone numbers
    if (
      (lowerKey.includes("phone") ||
        lowerKey.includes("wa") ||
        lowerKey.includes("kontak")) &&
      typeof value === "string" &&
      value.trim()
    ) {
      result[key] = maskPhoneNumber(value);
      continue;
    }

    // Mask NIM
    if (lowerKey === "nim" && typeof value === "string" && value.trim()) {
      result[key] = maskNim(value);
      continue;
    }

    // Mask Email
    if (lowerKey === "email" && typeof value === "string" && value.trim()) {
      result[key] = maskEmail(value);
      continue;
    }

    // Pass through primitive and object values
    result[key] = value;
  }

  return result;
}

// ============================================================================
// AUDIT LOG WRITER
// ============================================================================

/**
 * Record an immutable audit log entry into public.system_audit_logs.
 * Automatically captures the client IP and applies PII masking.
 */
export async function recordAuditLog(
  params: RecordAuditLogParams,
): Promise<void> {
  try {
    // 1. Resolve Client IP from Next.js request headers
    let ip = params.ipAddress || null;
    if (!ip) {
      try {
        const headerList = await headers();
        const forwarded = headerList.get("x-forwarded-for");
        ip = forwarded
          ? forwarded.split(",")[0].trim()
          : headerList.get("x-real-ip") || null;
      } catch {
        ip = null;
      }
    }

    // 2. Resolve Database Client (prefer Admin client to guarantee non-blocking write)
    let db;
    if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        db = createAdminClient();
      } catch {
        db = await createClient();
      }
    } else {
      db = await createClient();
    }

    // 3. Mask PII in payload
    const sanitizedOld = sanitizeAuditPayload(params.oldValue);
    const sanitizedNew = sanitizeAuditPayload(params.newValue);

    // 4. Insert into immutable system_audit_logs table
    const { error } = await db.from("system_audit_logs").insert({
      actor_id: params.actorId,
      action_type: params.actionType,
      target_user_id: params.targetUserId || null,
      old_value: sanitizedOld ? JSON.parse(JSON.stringify(sanitizedOld)) : null,
      new_value: sanitizedNew ? JSON.parse(JSON.stringify(sanitizedNew)) : null,
      details: params.details || null,
      ip_address: ip,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("[AUDIT] Gagal menyimpan entri audit log:", error.message);
    }
  } catch (err) {
    console.error(
      "[AUDIT] Terjadi kesalahan tak terduga saat mencatat audit:",
      err,
    );
  }
}
