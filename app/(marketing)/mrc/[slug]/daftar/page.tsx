import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { untypedFrom } from "@/lib/supabase/untyped";
import { isRegistrationHoldingSlot } from "@/lib/event-quota";
import { RegistrationForm } from "@/components/event/registration-form";
import {
  getActiveBatch,
  getCategoryBatchFee,
  BATCH_LABELS,
} from "@/lib/event-batch";
import type {
  EventCategory,
  EventRulesVersion,
  EventSettings,
} from "@/types/event-registration";

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Halaman ini publik. Cukup memakai client anon — ketiga tabel di bawah
  // sudah punya RLS policy "public read" untuk role anon, sehingga tidak perlu
  // (dan tidak seharusnya) memakai service_role yang melewati RLS.
  const supabase = await createClient();

  const { data: category } = await (untypedFrom(supabase, "event_categories")
    .select("*")
    .eq("slug", slug)
    .single() as unknown as Promise<{ data: EventCategory | null }>);

  if (!category) {
    notFound();
  }

  const { data: rulesVersion } = await (untypedFrom(
    supabase,
    "event_rules_versions",
  )
    .select("*")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: EventRulesVersion | null }>);

  const { data: settings } = await (untypedFrom(supabase, "event_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle() as unknown as Promise<{ data: EventSettings | null }>);

  const activeBatch = getActiveBatch(settings);

  // Hitung sisa kuota kategori ini agar pengunjung tidak mengisi formulir
  // panjang hanya untuk ditolak di akhir. Kriteria penahanan slot dipakai
  // bersama dengan `register_team` (lib/event-quota.ts).
  const { data: holdingRegs } = await (untypedFrom(
    supabase,
    "event_registrations",
  )
    .select("payment_status, created_at")
    .eq("category_id", category.id) as unknown as Promise<{
    data: { payment_status: string; created_at: string }[] | null;
  }>);

  const takenQuota = (holdingRegs ?? []).filter((r) =>
    isRegistrationHoldingSlot(r),
  ).length;
  const remainingQuota = Math.max(0, category.quota - takenQuota);

  // Alasan formulir tidak dapat ditampilkan; null berarti boleh mendaftar.
  const blockedReason: string | null = !category.is_active
    ? "Pendaftaran untuk kategori lomba ini sedang ditutup oleh panitia."
    : remainingQuota <= 0
      ? "Kuota pendaftaran untuk kategori ini sudah penuh."
      : !activeBatch
        ? "Saat ini berada di luar periode Pendaftaran Batch 1 maupun Batch 2. Silakan kembali saat periode pendaftaran dibuka."
        : null;

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-warning-soft text-warning border border-warning/30 rounded-full text-xs font-semibold uppercase tracking-wider">
            Minangkabau Robot Contest
            {activeBatch ? ` • ${BATCH_LABELS[activeBatch]}` : ""}
          </span>
          <h1 className="text-balance">Formulir Pendaftaran {category.name}</h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {category.description ||
              "Silakan lengkapi data tim dan pas foto anggota untuk verifikasi kokarde peserta."}
          </p>
          {!blockedReason && (
            <p className="font-mono text-xs text-muted-foreground">
              Sisa kuota: {remainingQuota} dari {category.quota} slot
            </p>
          )}
        </div>

        {blockedReason ? (
          <div className="bg-card p-8 rounded-lg border border-border shadow-soft text-center space-y-3">
            <h2 className="text-balance">
              {!category.is_active || remainingQuota <= 0
                ? "Pendaftaran Tidak Tersedia"
                : "Pendaftaran Sedang Ditutup"}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              {blockedReason}
            </p>
            <a
              href="/mrc"
              className="inline-block min-h-[44px] px-5 py-2.5 bg-primary hover:bg-primary-hover text-primary-foreground text-xs font-semibold rounded-md transition-colors"
            >
              Kembali ke Portal MRC
            </a>
          </div>
        ) : (
          <RegistrationForm
            category={category}
            rulesVersion={rulesVersion}
            activeBatch={activeBatch}
            activeFee={getCategoryBatchFee(category, activeBatch)}
          />
        )}
      </div>
    </div>
  );
}
