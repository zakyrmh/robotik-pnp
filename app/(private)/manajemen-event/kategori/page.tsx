import { ShieldAlert } from "lucide-react";
import { requireEventAdminOrRedirect } from "@/lib/event-auth";
import { getEventCategoriesAction } from "@/lib/actions/event-admin";
import { CategoryManager } from "@/components/event/category-manager";

export default async function EventCategoriesPage() {
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
            ) atau Super Admin yang dapat mengelola kategori lomba.
          </p>
        </div>
      </main>
    );
  }

  const categoriesRes = await getEventCategoriesAction();
  const categories = categoriesRes.success ? categoriesRes.data : [];

  return (
    <main className="mx-auto max-w-7xl space-y-6">
      <header className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-xs space-y-2">
        <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-foreground">
          Manajemen Kategori Lomba MRC
        </h1>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Kelola divisi pertandingan, biaya pendaftaran Batch 1 & 2, batas kuota
          tim, dan tautan grup WhatsApp peserta.
        </p>
      </header>

      <section aria-label="Pengelolaan Divisi Kompetisi">
        <CategoryManager initialCategories={categories} />
      </section>
    </main>
  );
}
