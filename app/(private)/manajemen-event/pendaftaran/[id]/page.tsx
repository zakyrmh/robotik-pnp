import { notFound } from "next/navigation";
import { ShieldAlert } from "lucide-react";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import { getEventRegistrationByIdAction } from "@/lib/actions/event-admin";
import { RegistrationDetailView } from "@/components/event/registration-detail-view";

export default async function EventRegistrationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const auth = await requireEventAdminOrRedirect([
    "panitia-pendaftaran",
    "panitia-verifikasi",
    "panitia-pertandingan",
  ]);

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

  const res = await getEventRegistrationByIdAction(id);
  if (!res.success || !res.data) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <RegistrationDetailView
        registration={res.data}
        roleEvent={auth.roleEvent}
        isSuperAdmin={auth.isSuperAdmin}
      />
    </main>
  );
}
