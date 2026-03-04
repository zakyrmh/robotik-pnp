/**
 * Halaman Verifikasi Pembayaran — /dashboard/mrc/peserta/pembayaran
 *
 * Halaman ini digunakan oleh panitia MRC untuk:
 * - Memverifikasi bukti pembayaran dari tim peserta
 * - Melihat detail pembayaran (nominal, metode, bukti)
 * - Menyetujui atau menolak pembayaran
 *
 * Alur:
 * - Tim yang berkasnya sudah terverifikasi mengupload bukti bayar
 * - Panitia memeriksa bukti dan memverifikasi/menolak
 * - Jika diverifikasi, status tim naik ke payment_verified
 * - Tim yang sudah payment_verified siap untuk hari-H
 */

import { Suspense } from 'react'
import { Banknote } from 'lucide-react'

import { getMrcEvents } from '@/app/actions/mrc.action'
import {
  PaymentVerificationTable,
  PaymentVerificationSkeleton,
} from '@/components/mrc/payment-verification-table'

export default function VerifikasiPembayaranPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10">
          <Banknote className="size-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Verifikasi Pembayaran
          </h1>
          <p className="text-sm text-muted-foreground">
            Konfirmasi bukti pembayaran pendaftaran tim peserta MRC.
          </p>
        </div>
      </div>

      <Suspense fallback={<PaymentVerificationSkeleton />}>
        <PembayaranLoader />
      </Suspense>
    </div>
  )
}

async function PembayaranLoader() {
  const result = await getMrcEvents()

  if (result.error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">{result.error}</p>
      </div>
    )
  }

  const events = result.data ?? []

  if (events.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-12 text-center shadow-sm">
        <p className="text-sm font-medium">Belum ada event MRC</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Buat event terlebih dahulu di halaman{' '}
          <a href="/dashboard/mrc/pengaturan/pendaftaran" className="text-blue-600 hover:underline">
            Buka/Tutup Pendaftaran
          </a>.
        </p>
      </div>
    )
  }

  return <PaymentVerificationTable events={events} />
}
