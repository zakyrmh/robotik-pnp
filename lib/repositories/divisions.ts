import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export interface Division {
  id: string;
  name: string;
  description: string | null;
  slug: string;
  short_description: string;
  badge_label: string | null;
  badge_color: string | null;
  accent_color: string | null;
  sort_order: number;
  is_active: boolean;
  tags: string[];
}

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

/**
 * Retrieves all active divisions sorted by sort_order.
 * Bypasses RLS by using the service role client.
 *
 * @returns Promise resolving to the list of divisions.
 */
export async function getDivisions(): Promise<Division[]> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data, error } = await supabase
    .from("divisions")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("Failed to fetch divisions:", error.message);
    throw new Error(error.message);
  }

  return (data as Division[]) || [];
}
