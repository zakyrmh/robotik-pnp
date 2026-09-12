import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import {
  getEventCategoriesAction,
  getEventRegistrationsAction,
  getEventSettingsAction,
} from "@/lib/actions/event-admin";
import { CategoryManager } from "@/components/event/category-manager";
import { EventSettingsForm } from "@/components/event/event-settings-form";
import { RegistrationTable } from "@/components/event/registration-table";
import type { RoleEvent } from "@/types/event-registration";
import { CreditCard, QrCode } from "lucide-react";

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
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-sm text-slate-600">
          Akun Anda tidak terdaftar dalam kepanitiaan Minangkabau Robot Contest
          (`role_event`).
        </p>
      </div>
    );
  }

  const categoriesRes = await getEventCategoriesAction();
  const registrationsRes = await getEventRegistrationsAction();
  const settingsRes = await getEventSettingsAction();

  const pendingVerificationCount = registrationsRes.success
    ? registrationsRes.data.filter(
        (r) => r.payment_status === "pending_verification",
      ).length
    : 0;

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-4">
        <div>
          <span className="text-xs font-bold text-[#f0975a] uppercase tracking-wider block">
            Manajemen Event Lomba
          </span>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Dashboard Panitia Minangkabau Robot Contest
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Role Anda:{" "}
            <strong className="text-slate-800">
              {roleEvent || "super-admin"}
            </strong>
          </p>
        </div>

        {/* Quick Nav Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {(isSuperAdmin || roleEvent === "panitia-pendaftaran") && (
            <Link
              href="/manajemen-event/verifikasi-pembayaran"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold transition-colors shadow-sm relative min-h-[40px]"
            >
              <CreditCard className="w-4 h-4" /> Verifikasi Pembayaran Manual
              {pendingVerificationCount > 0 && (
                <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] rounded-full font-extrabold animate-pulse">
                  {pendingVerificationCount}
                </span>
              )}
            </Link>
          )}

          {(isSuperAdmin ||
            roleEvent === "panitia-verifikasi" ||
            roleEvent === "panitia-pendaftaran") && (
            <Link
              href="/manajemen-event/verifikasi"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#3b5b84] hover:bg-[#2f4a6d] text-white rounded-lg text-xs font-bold transition-colors shadow-sm min-h-[40px]"
            >
              <QrCode className="w-4 h-4" /> Scan QR Kokarde
            </Link>
          )}
        </div>
      </div>

      {/* Event Settings: rentang Batch 1 / Batch 2 / Acara & Mode Pembayaran */}
      {(isSuperAdmin || roleEvent === "panitia-pendaftaran") && (
        <section className="space-y-4">
          <EventSettingsForm
            initialSettings={settingsRes.success ? settingsRes.data : null}
          />
        </section>
      )}

      {/* Category CRUD Section (Only panitia-pendaftaran & super-admin) */}
      {(isSuperAdmin || roleEvent === "panitia-pendaftaran") && (
        <section className="space-y-4">
          <CategoryManager
            initialCategories={categoriesRes.success ? categoriesRes.data : []}
          />
        </section>
      )}

      {/* Registration Table Section */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800">
          Daftar Pendaftaran & Pembayaran Tim
        </h2>
        <RegistrationTable
          initialRegistrations={
            registrationsRes.success ? registrationsRes.data : []
          }
          isSuperAdmin={isSuperAdmin}
        />
      </section>
    </div>
  );
}
