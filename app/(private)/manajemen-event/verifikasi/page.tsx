import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { FaceVerificationScanner } from "@/components/event/face-verification-scanner";
import type { RoleEvent } from "@/types/event-registration";
import { ArrowLeft, ShieldAlert } from "lucide-react";

export default async function FaceVerificationPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, role_event")
    .eq("id", user.id)
    .single();

  const isSuperAdmin = profile?.role === "super-admin";
  const roleEvent = profile?.role_event as RoleEvent | undefined;

  if (
    !isSuperAdmin &&
    roleEvent !== "panitia-verifikasi" &&
    roleEvent !== "panitia-pendaftaran"
  ) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-xs">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Akses Terbatas
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Hanya Panitia Verifikasi (
            <code className="font-mono text-xs font-semibold text-foreground">
              panitia-verifikasi
            </code>
            ) atau Super Admin yang dapat mengakses halaman ini.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 space-y-6">
      <div className="space-y-4">
        <Link
          href="/manajemen-event"
          className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="size-4" aria-hidden="true" /> Kembali ke
          Dashboard Event
        </Link>

        <div className="rounded-lg border border-border bg-card p-5 text-center space-y-1.5 shadow-xs">
          <span className="block font-display text-micro font-semibold uppercase tracking-wider text-accent-strong">
            Verifikasi Lapangan Venue
          </span>
          <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground text-balance">
            Scan QR Kokarde & Pencocokan Wajah (Anti-Joki)
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            Bandingkan pas foto terdaftar dengan peserta fisik di lokasi venue
            sebelum pertandingan dimulai.
          </p>
        </div>
      </div>

      <div className="divider" />

      <FaceVerificationScanner />
    </main>
  );
}
