"use server";

import { revalidatePath } from "next/cache";
import { checkEventAdmin } from "@/lib/event-auth";
import {
  countCheckinMetrics,
  csvCell,
  eventCheckinErrorMessage,
} from "@/lib/event-checkin";
import {
  correctEventCheckinSchema,
  eventCheckinRegistrationIdSchema,
  eventCheckinSearchSchema,
  recordAdvisorBadgeSchema,
  recordEventCheckinSchema,
  type CorrectEventCheckinInput,
  type EventCheckinSearchInput,
  type RecordAdvisorBadgeInput,
  type RecordEventCheckinInput,
} from "@/lib/schemas/event-checkin";
import { createAdminClient, createClient } from "@/lib/supabase/server";
import { untypedFrom, untypedRpc } from "@/lib/supabase/untyped";
import type { ActionResult } from "@/types/event-registration";
import type {
  EventCheckinMetrics,
  EventCheckinRegistration,
  EventCheckinSearchRow,
} from "@/types/event-checkin";

type RpcResponse<T> = {
  data: T | null;
  error: { message: string } | null;
};

const CHECKIN_DETAIL_SELECT = `
  id,
  registration_code,
  team_name,
  institution,
  advisor_name,
  payment_status,
  advisor_badge_handed_at,
  advisor_badge_handed_by,
  advisor_badge_handoff_type,
  advisor_badge_recipient_name,
  advisor_badge_recipient_role,
  advisor_badge_version,
  category:event_categories(id, name),
  members:event_team_members(
    id,
    full_name,
    photo_url,
    member_qr_token,
    role_in_team,
    checkin:event_member_checkins(
      checked_in_at,
      checked_in_by,
      badge_handed_at,
      badge_handed_by,
      badge_handoff_type,
      badge_recipient_name,
      badge_recipient_role,
      version
    )
  )
`;

export async function searchEventCheckinsAction(
  rawInput: Partial<EventCheckinSearchInput>,
): Promise<ActionResult<{ rows: EventCheckinSearchRow[]; total: number }>> {
  const auth = await checkEventAdmin([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!auth.isAuthorized) {
    return { success: false, error: "Akses daftar ulang MRC ditolak." };
  }

  const validated = eventCheckinSearchSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error:
        validated.error.issues[0]?.message || "Filter pencarian tidak valid.",
    };
  }

  const input = validated.data;
  const supabase = await createClient();
  const response = await untypedRpc<RpcResponse<EventCheckinSearchRow[]>>(
    supabase,
    "search_event_checkins",
    {
      p_query: input.query,
      p_category_id: input.categoryId === "all" ? null : input.categoryId,
      p_attendance: input.attendance,
      p_badge: input.badge,
      p_limit: input.pageSize,
      p_offset: input.page * input.pageSize,
    },
  );

  if (response.error) {
    return {
      success: false,
      error: eventCheckinErrorMessage(response.error.message),
    };
  }
  const rows = response.data ?? [];
  return {
    success: true,
    data: { rows, total: Number(rows[0]?.total_count ?? 0) },
  };
}

export async function getEventCheckinRegistrationAction(
  registrationId: string,
): Promise<ActionResult<EventCheckinRegistration>> {
  const auth = await checkEventAdmin([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (
    !auth.isAuthorized ||
    !eventCheckinRegistrationIdSchema.safeParse(registrationId).success
  ) {
    return { success: false, error: "Data pendaftaran tidak dapat diakses." };
  }

  const admin = createAdminClient();
  const { data, error } = await (untypedFrom(admin, "event_registrations")
    .select(CHECKIN_DETAIL_SELECT)
    .eq("id", registrationId)
    .single() as unknown as Promise<{
    data: EventCheckinRegistration | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Data pendaftaran tidak ditemukan." };
  }

  if (!auth.isSuperAdmin && auth.roleEvent === "panitia-pertandingan") {
    data.members = data.members.map((member) => ({
      ...member,
      photo_url: "",
      member_qr_token: "",
      checkin: member.checkin
        ? {
            ...member.checkin,
            checked_in_by: null,
            badge_handed_by: null,
            badge_recipient_name: null,
          }
        : null,
    }));
    data.advisor_badge_handed_by = null;
    data.advisor_badge_recipient_name = null;
  }

  return { success: true, data };
}

export async function getEventCheckinMetricsAction(): Promise<
  ActionResult<EventCheckinMetrics>
> {
  const auth = await checkEventAdmin([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);
  if (!auth.isAuthorized) return { success: false, error: "Akses ditolak." };

  const admin = createAdminClient();
  const { data, error } = await (untypedFrom(admin, "event_registrations")
    .select(CHECKIN_DETAIL_SELECT)
    .eq("payment_status", "paid") as unknown as Promise<{
    data: EventCheckinRegistration[] | null;
    error: unknown;
  }>);

  if (error || !data) {
    return { success: false, error: "Ringkasan daftar ulang gagal dimuat." };
  }
  return { success: true, data: countCheckinMetrics(data) };
}

export async function recordEventCheckinsAction(
  rawInput: RecordEventCheckinInput,
): Promise<ActionResult<{ changed: number; total: number }>> {
  const auth = await checkEventAdmin([
    "panitia-pendaftaran",
    "panitia-verifikasi",
  ]);
  if (!auth.isAuthorized) return { success: false, error: "Akses ditolak." };

  const validated = recordEventCheckinSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Data aksi tidak valid.",
    };
  }

  const input = validated.data;
  const supabase = await createClient();
  const response = await untypedRpc<
    RpcResponse<{ changed: number; total: number }>
  >(supabase, "record_event_member_checkins", {
    p_registration_id: input.registrationId,
    p_member_ids: input.memberIds,
    p_action: input.action,
    p_expected_versions: input.expectedVersions,
    p_proxy_role: input.proxyRole ?? null,
    p_proxy_member_id: input.proxyMemberId ?? null,
  });

  if (response.error || !response.data) {
    return {
      success: false,
      error: eventCheckinErrorMessage(response.error?.message ?? "unknown"),
    };
  }
  revalidatePath("/manajemen-event/presensi");
  return {
    success: true,
    data: response.data,
    message: `${response.data.changed} dari ${response.data.total} peserta diperbarui.`,
  };
}

export async function recordAdvisorBadgeAction(
  rawInput: RecordAdvisorBadgeInput,
): Promise<ActionResult<{ changed: number }>> {
  const auth = await checkEventAdmin([
    "panitia-pendaftaran",
    "panitia-verifikasi",
  ]);
  if (!auth.isAuthorized) return { success: false, error: "Akses ditolak." };

  const validated = recordAdvisorBadgeSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Data tidak valid.",
    };
  }
  const input = validated.data;
  const supabase = await createClient();
  const response = await untypedRpc<RpcResponse<{ changed: number }>>(
    supabase,
    "record_event_advisor_badge",
    {
      p_registration_id: input.registrationId,
      p_recipient_role: input.recipientRole,
      p_proxy_member_id: input.proxyMemberId ?? null,
      p_expected_version: input.expectedVersion,
    },
  );

  if (response.error || !response.data) {
    return {
      success: false,
      error: eventCheckinErrorMessage(response.error?.message ?? "unknown"),
    };
  }
  revalidatePath("/manajemen-event/presensi");
  return {
    success: true,
    data: response.data,
    message: "Status kokarde pembimbing disimpan.",
  };
}

export async function correctEventCheckinAction(
  rawInput: CorrectEventCheckinInput,
): Promise<ActionResult<{ success: boolean }>> {
  const auth = await checkEventAdmin(["panitia-pendaftaran"]);
  if (!auth.isAuthorized)
    return { success: false, error: "Akses koreksi ditolak." };

  const validated = correctEventCheckinSchema.safeParse(rawInput);
  if (!validated.success) {
    return {
      success: false,
      error: validated.error.issues[0]?.message || "Data tidak valid.",
    };
  }
  const input = validated.data;
  const supabase = await createClient();
  const response = await untypedRpc<RpcResponse<{ success: boolean }>>(
    supabase,
    "correct_event_checkin",
    {
      p_registration_id: input.registrationId,
      p_target: input.target,
      p_field: input.field,
      p_reason: input.reason,
      p_member_id: input.memberId ?? null,
      p_expected_version: input.expectedVersion,
    },
  );

  if (response.error || !response.data) {
    return {
      success: false,
      error: eventCheckinErrorMessage(response.error?.message ?? "unknown"),
    };
  }
  revalidatePath("/manajemen-event/presensi");
  return {
    success: true,
    data: response.data,
    message: "Koreksi berhasil dicatat.",
  };
}

export async function exportEventCheckinsAction(): Promise<
  ActionResult<{ csv: string; filename: string }>
> {
  const auth = await checkEventAdmin(["panitia-pendaftaran"]);
  if (!auth.isAuthorized)
    return { success: false, error: "Akses ekspor ditolak." };

  const admin = createAdminClient();
  const { data, error } = await (untypedFrom(admin, "event_registrations")
    .select(CHECKIN_DETAIL_SELECT)
    .eq("payment_status", "paid")
    .order("team_name") as unknown as Promise<{
    data: EventCheckinRegistration[] | null;
    error: unknown;
  }>);
  if (error || !data) return { success: false, error: "Ekspor gagal dibuat." };

  const rows = [
    [
      "Kode Pendaftaran",
      "Tim",
      "Instansi",
      "Kategori",
      "Jenis",
      "Nama",
      "Status Hadir",
      "Status Kokarde",
      "Penerima Kokarde",
      "Peran Penerima",
      "Waktu Hadir",
      "Waktu Kokarde",
    ],
    ...data.flatMap((registration) => {
      const memberRows = registration.members.map((member) => [
        registration.registration_code,
        registration.team_name,
        registration.institution,
        registration.category?.name ?? "",
        "Peserta",
        member.full_name,
        member.checkin?.checked_in_at ? "Hadir" : "Belum Hadir",
        member.checkin?.badge_handed_at
          ? "Sudah Diserahkan"
          : "Belum Diserahkan",
        member.checkin?.badge_recipient_name ?? "",
        member.checkin?.badge_recipient_role ?? "",
        member.checkin?.checked_in_at ?? "",
        member.checkin?.badge_handed_at ?? "",
      ]);
      if (registration.advisor_name) {
        memberRows.push([
          registration.registration_code,
          registration.team_name,
          registration.institution,
          registration.category?.name ?? "",
          "Pembimbing",
          registration.advisor_name,
          "Tidak Dicatat",
          registration.advisor_badge_handed_at
            ? "Sudah Diserahkan"
            : "Belum Diserahkan",
          registration.advisor_badge_recipient_name ?? "",
          registration.advisor_badge_recipient_role ?? "",
          "",
          registration.advisor_badge_handed_at ?? "",
        ]);
      }
      return memberRows;
    }),
  ];

  return {
    success: true,
    data: {
      csv: `\uFEFF${rows.map((row) => row.map(csvCell).join(",")).join("\n")}`,
      filename: `presensi-mrc-${new Date().toISOString().slice(0, 10)}.csv`,
    },
  };
}
