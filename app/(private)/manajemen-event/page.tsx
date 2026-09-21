import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getEventCategoriesAction,
  getEventRegistrationsAction,
  getEventSettingsAction,
} from "@/lib/actions/event-admin";
import { EventDashboardTabs } from "@/components/event/event-dashboard-tabs";
import type { RoleEvent } from "@/types/event-registration";

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
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <h2 className="text-xl font-bold text-foreground">Akses Terbatas</h2>
        <p className="text-sm text-muted-foreground">
          Akun Anda tidak terdaftar dalam kepanitiaan Minangkabau Robot Contest
          (`role_event`).
        </p>
      </div>
    );
  }

  const [categoriesRes, registrationsRes, settingsRes] = await Promise.all([
    getEventCategoriesAction(),
    getEventRegistrationsAction(),
    getEventSettingsAction(),
  ]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      <EventDashboardTabs
        settings={settingsRes.success ? settingsRes.data : null}
        categories={categoriesRes.success ? categoriesRes.data : []}
        registrations={registrationsRes.success ? registrationsRes.data : []}
        isSuperAdmin={isSuperAdmin}
        roleEvent={roleEvent}
      />
    </div>
  );
}
