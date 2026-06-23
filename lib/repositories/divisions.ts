import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Counts the total number of divisions in the database.
 * Bypasses RLS by using the service role client.
 *
 * @returns Promise resolving to the number of divisions.
 */
export async function countDivisions(): Promise<number> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count, error } = await supabase
    .from("divisions")
    .select("*", { count: "exact", head: true });

  if (error) {
    console.error("Failed to count divisions:", error.message);
    throw new Error(error.message);
  }

  return count ?? 0;
}
