import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

/**
 * Counts the total number of achievements in the database.
 * Bypasses RLS by using the service role client.
 *
 * @returns Promise resolving to the number of achievements.
 */
export async function countAchievements(): Promise<number> {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count, error } = await supabase
    .from("achievements")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count achievements:", error.message);
    throw new Error(error.message);
  }

  return count ?? 0;
}

export async function getAchievements() {
  const supabase = createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("achievements")
    .select(`
      id,
      title,
      description,
      year,
      level,
      division_id,
      divisions (
        id,
        name,
        slug,
        badge_color
      )
    `)
    .order("year", { ascending: false });

  if (error) {
    console.error("Failed to get achievements:", error.message);
    throw new Error(error.message);
  }

  return data;
}
