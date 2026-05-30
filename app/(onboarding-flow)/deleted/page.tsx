import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete01Icon, InformationCircleIcon } from "@hugeicons/core-free-icons";

export default async function DeletedPage() {
  const supabase = await createClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    redirect("/login");
  }

  // Fetch the registration details including soft-delete columns
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, registrations(deleted_at, delete_reason)")
    .eq("id", user.id)
    .single();

  const registrationsData = profile?.registrations;
  let deletedAt: string | null = null;
  let deleteReason: string | null = null;

  if (registrationsData) {
    if (Array.isArray(registrationsData)) {
      deletedAt = registrationsData[0]?.deleted_at || null;
      deleteReason = registrationsData[0]?.delete_reason || null;
    } else {
      const reg = registrationsData as unknown as { deleted_at: string | null; delete_reason: string | null };
      deletedAt = reg.deleted_at || null;
      deleteReason = reg.delete_reason || null;
    }
  }

  // If the user has not been soft-deleted, redirect them to dashboard
  if (!deletedAt) {
    redirect("/dashboard");
  }

  const formattedDate = new Date(deletedAt).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Card className="border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-center shadow-xs rounded-none relative overflow-hidden">
          {/* Tricolor Tech Stripe at Top */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-linear-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />
          
          <CardHeader className="pt-8">
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-none bg-red-500/10 text-[#e22718] border border-[#e22718]/30 shadow-[0_0_12px_rgba(226,39,24,0.1)]">
              <HugeiconsIcon icon={Delete01Icon} size={40} />
            </div>
            
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#e22718] block mb-1">
              STATUS: DEACTIVATED
            </span>
            
            <CardTitle className="text-2xl font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-50 font-sans">
              Pendaftaran Dihapus
            </CardTitle>
            
            <span className="text-[9px] font-mono text-zinc-400 dark:text-zinc-500 uppercase mt-0.5 tracking-wider block">
              DIHAPUS PADA: {formattedDate} WIB
            </span>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans">
              Maaf, data pendaftaran Anda sebagai Calon Anggota UKM Robotik Politeknik Negeri Padang telah dinonaktifkan dari sistem.
            </p>

            <div className="bg-zinc-50 dark:bg-zinc-900/30 p-4 border border-zinc-200 dark:border-zinc-900 rounded-none text-left space-y-2">
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
                ALASAN PENONAKTIFAN:
              </span>
              <div className="flex items-start gap-3 bg-red-500/5 dark:bg-red-500/5 p-3 border border-[#e22718]/20">
                <HugeiconsIcon
                  icon={InformationCircleIcon}
                  size={18}
                  className="text-[#e22718] shrink-0 mt-0.5"
                />
                <span className="text-xs font-mono text-zinc-850 dark:text-zinc-200 leading-relaxed uppercase break-all">
                  {deleteReason || "TIDAK ADA ALASAN DIKIRIM OLEH PENGURUS"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center font-sans">
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ada pertanyaan atau ingin mengajukan banding?{" "}
            <a
              href="https://instagram.com/ukmrobotikpnp"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#1c69d4] hover:underline font-mono text-[10px] font-bold uppercase tracking-wider block sm:inline mt-1 sm:mt-0"
            >
              Hubungi Instagram Kami
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
