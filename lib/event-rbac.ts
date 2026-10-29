const EVENT_COMMITTEE_ROLES = new Set([
  "panitia-pendaftaran",
  "panitia-verifikasi",
  "panitia-pertandingan",
]);

export function isEventCommittee(
  role: string | null | undefined,
  roleEvent: string | null | undefined,
) {
  return role === "super-admin" || EVENT_COMMITTEE_ROLES.has(roleEvent ?? "");
}

export function resolveEventAwareNavigationRole(
  role: string | null | undefined,
  roleEvent: string | null | undefined,
) {
  return role === "super-admin" ? role : roleEvent || role;
}
