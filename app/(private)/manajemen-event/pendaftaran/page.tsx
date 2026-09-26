import { ShieldAlert } from "lucide-react";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import {
  getEventCategoriesAction,
  getEventRegistrationsAction,
} from "@/lib/actions/event-admin";
import { RegistrationTable } from "@/components/event/registration-table";

export default async function EventRegistrationsPage() {
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

  const [registrationsRes, categoriesRes] = await Promise.all([
    getEventRegistrationsAction(),
    getEventCategoriesAction(),
  ]);

  const registrations = registrationsRes.success ? registrationsRes.data : [];
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-2">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Data Pendaftar & Transaksi Tim
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Pantau seluruh tim terdaftar, filter berdasarkan kategori/batch/status
          pembayaran, dan verifikasi bukti transfer manual.
        </p>
      </header>

      <section aria-labelledby="pendaftar-heading" className="space-y-4">
        <h2 id="pendaftar-heading" className="sr-only">
          Daftar Pendaftaran Tim
        </h2>
        <RegistrationTable
          initialRegistrations={registrations}
          categories={categories}
          isSuperAdmin={auth.isSuperAdmin}
        />
      </section>
    </main>
  );
}
