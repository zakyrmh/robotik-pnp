import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export type UserRole =
  | "anggota"
  | "caang"
  | "super-admin"
  | "admin-or"
  | "admin-komdis";

/**
 * Counts the profiles with specific roles.
 * Bypasses RLS by using the service role client.
 *
 * @param roles The roles to count.
 * @returns The count of profiles with the specified roles.
 */
export async function countProfilesByRoles(roles: UserRole[]): Promise<number> {
  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { count, error } = await supabase
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .in("role", roles);

  if (error) {
    console.error(
      `Failed to count profiles with roles [${roles.join(", ")}]:`,
      error.message,
    );
    throw new Error(error.message);
  }

  return count ?? 0;
}
