'use client'

/**
 * RegistrationClosed — Tampilan ketika pendaftaran sedang ditutup
 *
 * Ditampilkan di halaman /register ketika:
 * - is_open = false (admin menutup pendaftaran secara manual)
 * - Waktu sekarang sudah melewati end_date (pendaftaran berakhir)
 * - Data tidak dapat dibaca (fallback aman)
 */

import Link from 'next/link'
import { LockKeyhole } from 'lucide-react'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export function RegistrationClosed() {
  return (
    <Card className="border-0 shadow-none sm:border sm:shadow-sm">
      <CardHeader className="text-center">
        {/* Ikon */}
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-2xl bg-muted">
          <LockKeyhole className="size-8 text-muted-foreground" />
        </div>

        <CardTitle className="text-2xl font-bold">Pendaftaran Ditutup</CardTitle>
        <CardDescription className="mt-1 text-sm leading-relaxed">
          Saat ini pendaftaran anggota baru UKM Robotik PNP sedang tidak
          dibuka. Pantau terus informasi terbaru dari kami untuk mengetahui
          kapan pendaftaran berikutnya dibuka.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Info tambahan */}
        <div className="rounded-lg border border-muted bg-muted/30 px-4 py-3 text-center text-xs text-muted-foreground">
          Untuk informasi lebih lanjut, hubungi pengurus UKM Robotik PNP
          melalui media sosial resmi kami.
        </div>
      </CardContent>

      <CardFooter className="flex-col gap-3">
        {/* Tombol ke halaman login */}
        <Button asChild className="w-full" size="lg">
          <Link href="/login">Masuk ke Akun</Link>
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Sudah punya akun?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-4 hover:underline"
          >
            Masuk di sini
          </Link>
        </p>
      </CardFooter>
    </Card>
  )
}
