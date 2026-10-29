import { ShieldAlert } from "lucide-react";
import { MrcCheckinDesk } from "@/components/event/mrc-checkin-desk";
import { getEventCategoriesAction } from "@/lib/actions/event-admin";
import {
  getEventCheckinMetricsAction,
  searchEventCheckinsAction,
} from "@/lib/actions/event-checkin";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import type { EventCheckinMetrics } from "@/types/event-checkin";

const EMPTY_METRICS: EventCheckinMetrics = {
  eligibleMembers: 0,
  presentMembers: 0,
  handedBadges: 0,
  representedBadges: 0,
  teamsNone: 0,
  teamsPartial: 0,
  teamsComplete: 0,
  advisorBadgesHanded: 0,
  advisorBadgesPending: 0,
};

export default async function EventCheckinPage() {
  const auth = await requireEventAdminOrRedirect([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);

  if (!auth.isAuthorized) {
    return (
      <main className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6 text-center shadow-xs">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
            <ShieldAlert className="size-6" aria-hidden="true" />
          </div>
          <h1 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Akses Terbatas
          </h1>
          <p className="text-sm text-muted-foreground">
            Hanya panitia MRC atau Super Admin yang dapat membuka meja daftar
            ulang.
          </p>
        </div>
      </main>
    );
  }

  const [searchResult, metricsResult, categoriesResult] = await Promise.all([
    searchEventCheckinsAction({ page: 0, pageSize: 20 }),
    getEventCheckinMetricsAction(),
    getEventCategoriesAction(),
  ]);

  return (
    <main className="mx-auto max-w-7xl">
      <MrcCheckinDesk
        initialRows={searchResult.success ? searchResult.data.rows : []}
        initialTotal={searchResult.success ? searchResult.data.total : 0}
        initialMetrics={
          metricsResult.success ? metricsResult.data : EMPTY_METRICS
        }
        categories={
          categoriesResult.success
            ? categoriesResult.data.map(({ id, name }) => ({ id, name }))
            : []
        }
        access={{
          isSuperAdmin: auth.isSuperAdmin,
          roleEvent: auth.roleEvent,
          canRecord:
            auth.isSuperAdmin ||
            auth.roleEvent === "panitia-pendaftaran" ||
            auth.roleEvent === "panitia-verifikasi",
          canCorrect:
            auth.isSuperAdmin || auth.roleEvent === "panitia-pendaftaran",
          canSeeSensitive:
            auth.isSuperAdmin || auth.roleEvent !== "panitia-pertandingan",
        }}
      />
    </main>
  );
}
