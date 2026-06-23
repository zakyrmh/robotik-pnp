"use server";

import { countProfilesByRoles } from "@/lib/repositories/profiles";

/**
 * Server action to retrieve the count of active members.
 * Active members include roles: 'anggota', 'super-admin', 'admin-or', and 'admin-komdis'.
 *
 * @returns Promise resolving to the number of active member profiles.
 */
export async function getActiveMemberCountAction(): Promise<number> {
  return countProfilesByRoles([
    "anggota",
    "super-admin",
    "admin-or",
    "admin-komdis",
  ]);
}
