import { Suspense } from 'react'
import { ShieldCheck } from 'lucide-react'

import { getActivePeriod, getPiketSubmissions } from '@/app/actions/kestari.action'
import { PiketVerificationManager, VerificationSkeleton } from '@/components/kestari/piket-verification-manager'

export default function VerifikasiPiketPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <ShieldCheck className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Verifikasi Bukti Piket</h1>
          <p className="text-sm text-muted-foreground">
            Periksa dan verifikasi bukti piket yang disubmit anggota.
          </p>
        </div>
      </div>

      <Suspense fallback={<VerificationSkeleton />}>
        <VerificationLoader />
      </Suspense>
    </div>
  )
}

async function VerificationLoader() {
  const periodRes = await getActivePeriod()
  if (!periodRes.data) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada periode piket aktif.</p>
      </div>
    )
  }

  const subsRes = await getPiketSubmissions(periodRes.data.id)

  return (
    <PiketVerificationManager
      period={periodRes.data}
      initialSubmissions={subsRes.data ?? []}
    />
  )
}
