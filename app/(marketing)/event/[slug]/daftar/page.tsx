import { notFound } from "next/navigation";
import Script from "next/script";
import { createAdminClient } from "@/lib/supabase/server";
import { RegistrationForm } from "@/components/event/registration-form";
import type { EventCategory, EventRulesVersion } from "@/types/event-registration";

export default async function EventRegistrationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const adminSupabase = createAdminClient();

  const { data: category } = await (adminSupabase
    .from("event_categories" as any)
    .select("*")
    .eq("slug", slug)
    .single() as unknown as Promise<{ data: EventCategory | null }>);

  if (!category) {
    notFound();
  }

  const { data: rulesVersion } = await (adminSupabase
    .from("event_rules_versions" as any)
    .select("*")
    .eq("category_id", category.id)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle() as unknown as Promise<{ data: EventRulesVersion | null }>);

  const isProduction = process.env.MIDTRANS_IS_PRODUCTION === "true";
  const snapScriptUrl = isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";

  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";

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
          </span>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Formulir Pendaftaran {category.name}
          </h1>
          <p className="text-sm text-slate-600 max-w-xl mx-auto">
            {category.description || "Silakan lengkapi data tim dan pas foto anggota untuk verifikasi kokarde peserta."}
          </p>
        </div>

        <RegistrationForm category={category} rulesVersion={rulesVersion} />
      </div>
    </div>
  );
}
