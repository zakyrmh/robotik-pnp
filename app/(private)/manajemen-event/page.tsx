import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEventCategoriesAction,
  getEventRegistrationsAction,
  getEventSettingsAction,
} from "@/lib/actions/event-admin";
import { EventDashboardTabs } from "@/components/event/event-dashboard-tabs";
import type { RoleEvent } from "@/types/event-registration";
import { ShieldAlert } from "lucide-react";

export default async function EventManagementPage() {
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

  if (!isSuperAdmin && !roleEvent) {
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

  const [categoriesRes, registrationsRes, settingsRes] = await Promise.all([
    getEventCategoriesAction(),
    getEventRegistrationsAction(),
    getEventSettingsAction(),
  ]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-6">
      <EventDashboardTabs
        settings={settingsRes.success ? settingsRes.data : null}
        categories={categoriesRes.success ? categoriesRes.data : []}
        registrations={registrationsRes.success ? registrationsRes.data : []}
        isSuperAdmin={isSuperAdmin}
        roleEvent={roleEvent}
      />
    </main>
  );
}
