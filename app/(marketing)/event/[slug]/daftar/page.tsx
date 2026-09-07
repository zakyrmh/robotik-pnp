import { notFound } from "next/navigation";
import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/server";
import { untypedFrom } from "@/lib/supabase/untyped";
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
  const adminSupabase = createAdminClient();

  const { data: category } = await (untypedFrom(
    adminSupabase,
    "event_categories",
  )
    .select("*")
    .eq("slug", slug)
    .single() as unknown as Promise<{ data: EventCategory | null }>);

  if (!category) {
    notFound();
  }

  const { data: rulesVersion } = await (untypedFrom(
    adminSupabase,
    "event_rules_versions",
  )
    .select("*")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: EventRulesVersion | null }>);

  const { data: settings } = await (untypedFrom(adminSupabase, "event_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle() as unknown as Promise<{ data: EventSettings | null }>);

  const activeBatch = getActiveBatch(settings);

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const clientKey =
    process.env.MIDTRANS_CLIENT_KEY ||
    process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY ||
    "";

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      {clientKey && (
        <Script
          src={snapScriptUrl}
          data-client-key={clientKey}
          strategy="lazyOnload"
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-semibold uppercase tracking-wider">
            Minangkabau Robot Contest
            {activeBatch ? ` • ${BATCH_LABELS[activeBatch]}` : ""}
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Formulir Pendaftaran {category.name}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            {category.description ||
              "Silakan lengkapi data tim dan pas foto anggota untuk verifikasi kokarde peserta."}
          </p>
        </div>

        {!activeBatch ? (
          <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center space-y-3">
            <h2 className="text-xl font-bold text-slate-800">
              Pendaftaran Sedang Ditutup
            </h2>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Saat ini berada di luar periode Pendaftaran Batch 1 maupun Batch
              2. Silakan kembali saat periode pendaftaran dibuka.
            </p>
            <a
              href="/mrc"
              className="inline-block px-5 py-2.5 bg-[#3b5b84] text-white text-xs font-semibold rounded-lg"
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
