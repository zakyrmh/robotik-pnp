import { Suspense } from 'react'
import { Receipt } from 'lucide-react'

import { getActivePeriod, getPiketFines } from '@/app/actions/kestari.action'
import { PaymentVerificationManager, PaymentSkeleton } from '@/components/kestari/payment-verification-manager'

export default function PembayaranPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/10">
          <Receipt className="size-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Pembayaran Denda</h1>
          <p className="text-sm text-muted-foreground">
            Verifikasi bukti pembayaran denda piket dari anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<PaymentSkeleton />}>
        <PaymentLoader />
      </Suspense>
    </div>
  )
}

async function PaymentLoader() {
  const periodRes = await getActivePeriod()
  if (!periodRes.data) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada periode piket aktif.</p>
      </div>
    )
  }

  // Ambil yang menunggu verifikasi + unpaid
  const finesRes = await getPiketFines(periodRes.data.id)

  return (
    <PaymentVerificationManager
      period={periodRes.data}
      initialFines={finesRes.data ?? []}
    />
  )
}
