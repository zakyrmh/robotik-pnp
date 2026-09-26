import { ShieldAlert } from "lucide-react";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import { getEventSettingsAction } from "@/lib/actions/event-admin";
import { EventPaymentForm } from "@/components/event/event-payment-form";

export default async function EventPaymentPage() {
  const auth = await requireEventAdminOrRedirect(["panitia-pendaftaran"]);

  if (!auth.isAuthorized) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="rounded-lg border border-border bg-card p-6 text-center shadow-xs space-y-3">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Akses Terbatas
          </h2>
          <p className="text-sm text-muted-foreground">
            Hanya Panitia Pendaftaran (
            <code className="font-mono text-xs font-semibold text-foreground">
              panitia-pendaftaran
            </code>
            ) atau Super Admin yang dapat mengelola metode pembayaran event.
          </p>
        </div>
      </main>
    );
  }

  const settingsRes = await getEventSettingsAction();

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <EventPaymentForm
        initialSettings={settingsRes.success ? settingsRes.data : null}
      />
    </main>
  );
}
