"use server";

import { createAdminClient } from "@/lib/supabase/server";

/**
 * Server action to retrieve the count of active members.
 * Active members are counted from organizational_histories with an active membership_period (is_active = true).
 *
 * @returns Promise resolving to the number of active member profiles.
 */
export async function getActiveMemberCountAction(): Promise<number> {
  const supabase = createAdminClient();

  const { count, error } = await supabase
    .from("organizational_histories")
    .select("id, membership_periods!inner(is_active)", {
      count: "exact",
      head: true,
    })
    .eq("membership_periods.is_active", true);

  if (error) {
    console.error("Failed to count active members:", error.message);
    throw new Error(error.message);
  }

  return count ?? 0;
}
