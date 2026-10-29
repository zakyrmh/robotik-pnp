import type { EventCheckinRegistration } from "@/types/event-checkin";

export function eventCheckinErrorMessage(message: string): string {
  if (message.includes("registration_not_paid"))
    return "Pembayaran tim belum berstatus lunas. Muat ulang setelah verifikasi.";
  if (message.includes("checkin_conflict"))
    return "Status berubah di meja lain. Muat ulang data sebelum mencoba kembali.";
  if (message.includes("leader_not_found"))
    return "Ketua tim yang dipilih tidak valid.";
  if (message.includes("advisor_not_registered"))
    return "Nama pembimbing belum terdaftar.";
  if (message.includes("event_checkin_correction_forbidden"))
    return "Akun ini tidak memiliki izin koreksi.";
  if (message.includes("event_checkin_forbidden"))
    return "Akun ini tidak memiliki akses daftar ulang MRC.";
  return "Operasi daftar ulang gagal. Muat ulang data lalu coba kembali.";
}

export function csvCell(value: unknown): string {
  const raw = String(value ?? "");
  const safe = /^[=+\-@]/.test(raw) ? `'${raw}` : raw;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function countCheckinMetrics(registrations: EventCheckinRegistration[]) {
  let eligibleMembers = 0;
  let presentMembers = 0;
  let handedBadges = 0;
  let representedBadges = 0;
  let teamsNone = 0;
  let teamsPartial = 0;
  let teamsComplete = 0;
  let advisorBadgesHanded = 0;
  let advisorBadgesPending = 0;

  for (const registration of registrations) {
    const present = registration.members.filter(
      (member) => member.checkin?.checked_in_at,
    ).length;
    eligibleMembers += registration.members.length;
    presentMembers += present;
    handedBadges += registration.members.filter(
      (member) => member.checkin?.badge_handed_at,
    ).length;
    representedBadges += registration.members.filter(
      (member) => member.checkin?.badge_handoff_type === "representative",
    ).length;

    if (present === 0) teamsNone += 1;
    else if (present === registration.members.length) teamsComplete += 1;
    else teamsPartial += 1;

    if (registration.advisor_name) {
      if (registration.advisor_badge_handed_at) advisorBadgesHanded += 1;
      else advisorBadgesPending += 1;
    }
  }

  return {
    eligibleMembers,
    presentMembers,
    handedBadges,
    representedBadges,
    teamsNone,
    teamsPartial,
    teamsComplete,
    advisorBadgesHanded,
    advisorBadgesPending,
  };
}
