import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getEventCategoriesAction, getEventRegistrationsAction } from "@/lib/actions/event-admin";
import { CategoryManager } from "@/components/event/category-manager";
import { RegistrationTable } from "@/components/event/registration-table";
import type { RoleEvent } from "@/types/event-registration";

export default async function EventManagementPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-sm text-slate-600">
          Akun Anda tidak terdaftar dalam kepanitiaan Minangkabau Robot Contest (`role_event`).
        </p>
      </div>
    );
  }

  const categoriesRes = await getEventCategoriesAction();
  const registrationsRes = await getEventRegistrationsAction();

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="border-b pb-4">
        <span className="text-xs font-bold text-[#f0975a] uppercase tracking-wider block">
          Manajemen Event Lomba
        </span>
        <h1 className="text-2xl font-extrabold text-slate-900">
          Dashboard Panitia Minangkabau Robot Contest
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Role Anda: <strong className="text-slate-800">{roleEvent || "super-admin"}</strong>
        </p>
      </div>

      {/* Category CRUD Section (Only panitia-pendaftaran & super-admin) */}
      {(isSuperAdmin || roleEvent === "panitia-pendaftaran") && (
        <section className="space-y-4">
          <CategoryManager initialCategories={categoriesRes.success ? categoriesRes.data : []} />
        </section>
      )}

      {/* Registration Table Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">Daftar Pendaftaran & Pembayaran Tim</h2>
        <RegistrationTable
          initialRegistrations={registrationsRes.success ? registrationsRes.data : []}
          isSuperAdmin={isSuperAdmin}
        />
      </section>
    </div>
  );
}
