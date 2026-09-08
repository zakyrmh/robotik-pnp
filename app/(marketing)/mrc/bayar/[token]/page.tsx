import { notFound } from "next/navigation";
import { getRegistrationByAccessTokenAction } from "@/lib/actions/event-registration";
import { getEventSettingsAction } from "@/lib/actions/event-admin";
import { QrisPaymentView } from "@/components/event/qris-payment-view";

export default async function QrisPaymentPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const res = await getRegistrationByAccessTokenAction(token);
  const settingsRes = await getEventSettingsAction();

  if (!res.success || !res.data) {
    notFound();
  }

  const settings = settingsRes.success ? settingsRes.data : null;
  const isManualBank = settings?.payment_mode === "manual_bank";

  return (
    <div className="min-h-screen bg-background pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl mx-auto space-y-6">
        <div className="text-center space-y-2">
          <span className="inline-block px-3 py-1 bg-primary-soft text-primary border border-primary/20 rounded-full text-xs font-semibold uppercase tracking-wider">
            {isManualBank ? "Pembayaran Transfer Bank" : "Pembayaran Midtrans"}
          </span>
          <h1 className="text-balance">
            Pembayaran {res.data.category?.name || "Minangkabau Robot Contest"}
          </h1>
          <p className="text-sm text-muted-foreground max-w-xl mx-auto">
            {isManualBank
              ? "Selesaikan transfer biaya pendaftaran ke rekening panitia dan unggah bukti transfer Anda."
              : "Bayar secara langsung via QRIS, Bank Transfer Virtual Account, atau E-Wallet."}
          </p>
        </div>

        <QrisPaymentView
          initialRegistration={res.data}
          eventSettings={settings}
        />
      </div>
    </div>
  );
}
