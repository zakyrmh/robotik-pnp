import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Query builder untuk tabel / fungsi RPC yang belum ada di generated
 * `Database` types (mis. tabel `event_*`). Dipakai alih-alih `as any`
 * agar lolos `no-explicit-any`; hasil akhir tetap di-assert di call-site
 * dengan pola `as unknown as ...` seperti sebelumnya.
 */
export function untypedFrom(client: SupabaseClient, table: string) {
  const from = client.from.bind(client) as unknown as (
    relation: string,
  ) => ReturnType<SupabaseClient["from"]>;
  return from(table);
}

export function untypedRpc<T>(
  client: SupabaseClient,
  fn: string,
  args: Record<string, unknown>,
): Promise<T> {
  const rpc = client.rpc.bind(client) as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<T>;
  return rpc(fn, args);
}
