import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getEventRegistrationsAction } from "@/lib/actions/event-admin";
import { ManualPaymentVerificationList } from "@/components/event/manual-payment-verification-list";
import type { RoleEvent } from "@/types/event-registration";
import { ArrowLeft, CreditCard } from "lucide-react";

export default async function ManualPaymentVerificationPage() {
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

  if (
    !isSuperAdmin &&
    roleEvent !== "panitia-pendaftaran" &&
    roleEvent !== "panitia-verifikasi"
  ) {
    return (
      <div className="p-8 text-center max-w-md mx-auto space-y-3">
        <h2 className="text-xl font-bold text-slate-800">Akses Terbatas</h2>
        <p className="text-sm text-slate-600">
          Hanya Panitia Pendaftaran (`panitia-pendaftaran`) atau Super Admin
          yang dapat mengakses halaman ini.
        </p>
      </div>
    );
  }

  const registrationsRes = await getEventRegistrationsAction();

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <Link
            href="/manajemen-event"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#3b5b84] hover:underline mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Dashboard Event
          </Link>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-[#3b5b84] rounded-lg">
              <CreditCard className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">
                Verifikasi Pembayaran Transfer Manual
              </h1>
              <p className="text-xs text-slate-500">
                Tinjau bukti transfer bank peserta, setujui status pembayaran,
                atau kirim penolakan beserta alasan.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ManualPaymentVerificationList
        initialRegistrations={
          registrationsRes.success ? registrationsRes.data : []
        }
      />
    </div>
  );
}
