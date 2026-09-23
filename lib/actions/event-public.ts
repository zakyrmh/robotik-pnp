"use server";

import { createAdminClient } from "@/lib/supabase/server";
import { untypedFrom } from "@/lib/supabase/untyped";
import { isRegistrationHoldingSlot } from "@/lib/event-quota";
import type {
  ActionResult,
  EventCategory,
  EventSettings,
} from "@/types/event-registration";

export interface PublicCategoryWithQuota extends EventCategory {
  taken_quota: number;
  remaining_quota: number;
}

export interface PublicEventStats {
  totalTeams: number;
  totalInstitutions: number;
  totalCities: number;
  topInstitutions: { name: string; count: number }[];
}

export interface PublicEventOverviewData {
  categories: PublicCategoryWithQuota[];
  stats: PublicEventStats;
  settings: EventSettings | null;
}

export async function getPublicEventOverviewAction(): Promise<
  ActionResult<PublicEventOverviewData>
> {
  try {
    const adminSupabase = createAdminClient();

    // 0. Fetch global event settings (rentang batch 1/2 & acara untuk countdown)
    const { data: settings } = await (untypedFrom(
      adminSupabase,
      "event_settings",
    )
      .select("*")
      .eq("id", 1)
      .maybeSingle() as unknown as Promise<{ data: EventSettings | null }>);

    // 1. Fetch categories
    const { data: categories, error: catError } = await (untypedFrom(
      adminSupabase,
      "event_categories",
    )
      .select("*")
      .order("created_at", { ascending: true }) as unknown as Promise<{
      data: EventCategory[] | null;
      error: unknown;
    }>);

    if (catError || !categories) {
      return { success: false, error: "Gagal mengambil data kategori lomba." };
    }

    // 2. Fetch all valid registrations for stats & quota calculations
    //
    // Kriteria penahanan slot dipusatkan di `lib/event-quota.ts` agar konsisten
    // dengan fungsi `register_team` di database (lihat migrasi
    // 20260923000000_fix_quota_manual_bank_and_extend_hold.sql).

    const { data: registrations, error: regError } = await (untypedFrom(
      adminSupabase,
      "event_registrations",
    ).select(
      "id, category_id, institution, origin_city, payment_status, created_at",
    ) as unknown as Promise<{
      data:
        | {
            id: string;
            category_id: string;
            institution: string;
            origin_city: string;
            payment_status: string;
            created_at: string;
          }[]
        | null;
      error: unknown;
    }>);

    if (regError || !registrations) {
      return { success: false, error: "Gagal mengambil data statistik event." };
    }

    // Filter valid registrations for quota & stats
    // (kriteria dipusatkan di lib/event-quota.ts, harus sama dengan `register_team`)
    const validRegs = registrations.filter((r) => isRegistrationHoldingSlot(r));

    // Compute taken & remaining quota per category
    const categoryQuotas = categories.map((cat) => {
      const taken = validRegs.filter((r) => r.category_id === cat.id).length;
      const remaining = Math.max(0, cat.quota - taken);
      return {
        ...cat,
        taken_quota: taken,
        remaining_quota: remaining,
      };
    });

    // Compute stats
    const totalTeams = validRegs.length;

    // Distinct institutions
    const instSet = new Set<string>();
    const instCounts: Record<string, number> = {};

    validRegs.forEach((r) => {
      if (r.institution && r.institution.trim()) {
        const cleanInst = r.institution.trim();
        instSet.add(cleanInst);
        instCounts[cleanInst] = (instCounts[cleanInst] || 0) + 1;
      }
    });

    // Distinct cities
    const citySet = new Set<string>();
    validRegs.forEach((r) => {
      if (r.origin_city && r.origin_city.trim()) {
        citySet.add(r.origin_city.trim());
      }
    });

    // Top 5 institutions
    const topInstitutions = Object.entries(instCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      success: true,
      data: {
        categories: categoryQuotas,
        settings: settings ?? null,
        stats: {
          totalTeams,
          totalInstitutions: instSet.size,
          totalCities: citySet.size,
          topInstitutions,
        },
      },
    };
  } catch (err: unknown) {
    console.error("getPublicEventOverviewAction error:", err);
    return {
      success: false,
      error: (err as Error).message || "Terjadi kesalahan server.",
    };
  }
}
