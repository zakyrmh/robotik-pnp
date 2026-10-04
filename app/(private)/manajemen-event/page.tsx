import { ShieldAlert } from "lucide-react";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import {
  getEventCategoriesAction,
  getEventRegistrationsSummaryAction,
  getEventSettingsAction,
} from "@/lib/actions/event-admin";
import { getEventFinanceSummaryByBankAction } from "@/lib/actions/event-finance";
import { MrcDashboardOverview } from "@/components/event/mrc-dashboard-overview";
import { QuotaOverflowBanner } from "@/components/event/quota-overflow-banner";

export default async function EventManagementDashboardPage() {
  const auth = await requireEventAdminOrRedirect();

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
            Akun Anda tidak terdaftar dalam kepanitiaan Minangkabau Robot
            Contest (
            <code className="font-mono text-xs font-semibold text-foreground">
              role_event
            </code>
            ).
          </p>
        </div>
      </main>
    );
  }

  const [categoriesRes, registrationsRes, settingsRes, financeRes] =
    await Promise.all([
      getEventCategoriesAction(),
      getEventRegistrationsSummaryAction(),
      getEventSettingsAction(),
      getEventFinanceSummaryByBankAction(),
    ]);

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <QuotaOverflowBanner />
      <MrcDashboardOverview
        settings={settingsRes.success ? settingsRes.data : null}
        categories={categoriesRes.success ? categoriesRes.data : []}
        registrations={registrationsRes.success ? registrationsRes.data : []}
        roleEvent={auth.roleEvent}
        bankFinances={financeRes.success ? financeRes.data : []}
      />
    </main>
  );
}
