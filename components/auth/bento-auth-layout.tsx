'use client'

/**
 * BentoAuthLayout — Layout Bento Grid untuk halaman autentikasi
 *
 * Menampilkan layout grid bergaya Bento yang responsif dengan:
 * - Panel kiri: Bento grid dekoratif berisi branding & informasi UKM
 * - Panel kanan: Formulir autentikasi (login/register)
 *
 * Di layar mobile, panel kiri disembunyikan dan hanya form yang ditampilkan.
 */

import Image from 'next/image'
import Link from 'next/link'
import { Bot, Cpu, CircuitBoard, Zap } from 'lucide-react'

/** Tipe properti untuk BentoAuthLayout */
interface BentoAuthLayoutProps {
  /** Konten formulir yang akan ditampilkan di panel kanan */
  children: React.ReactNode
}

/** Data item Bento Grid untuk dekorasi */
const BENTO_ITEMS = [
  {
    icon: Bot,
    title: 'Robotika',
    description: 'Eksplorasi dunia robot dan otomasi',
    className: 'col-span-1 row-span-1',
  },
  {
    icon: Cpu,
    title: 'Mikrokontroler',
    description: 'Arduino, ESP32, STM32, dan lainnya',
    className: 'col-span-1 row-span-1',
  },
  {
    icon: CircuitBoard,
    title: 'IoT',
    description: 'Internet of Things dan sistem cerdas',
    className: 'col-span-2 row-span-1',
  },
  {
    icon: Zap,
    title: 'Kompetisi',
    description: 'Kontes robot nasional dan internasional',
    className: 'col-span-2 row-span-1',
  },
] as const

export function BentoAuthLayout({ children }: BentoAuthLayoutProps) {
  return (
    <div className="flex min-h-svh w-full">
      {/* ============================================================
       * PANEL KIRI — Bento Grid Dekoratif (tersembunyi di mobile)
       * ============================================================ */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-primary p-8 text-primary-foreground lg:flex xl:p-12">
        {/* Latar belakang dekoratif: pola grid halus */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Header — Logo dan nama UKM */}
        <div className="relative z-10 flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Logo UKM Robotik PNP"
            width={44}
            height={44}
            className="rounded-full bg-white/10 p-0.5"
            priority
          />
          <div>
            <p className="text-sm font-bold leading-tight">UKM Robotik</p>
            <p className="text-xs opacity-70">Politeknik Negeri Padang</p>
          </div>
        </div>

        {/* Konten Utama — Bento Grid */}
        <div className="relative z-10 flex-1 flex flex-col justify-center gap-6 py-8">
          <div>
            <h1 className="text-3xl font-bold leading-tight xl:text-4xl">
              Sistem Informasi
              <br />
              <span className="text-primary-foreground/80">UKM Robotik PNP</span>
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-70">
              Platform digital untuk mengelola kegiatan, anggota, dan informasi
              Unit Kegiatan Mahasiswa Robotik Politeknik Negeri Padang.
            </p>
          </div>

          {/* Grid item dekoratif bergaya Bento */}
          <div className="grid grid-cols-2 gap-3 xl:gap-4">
            {BENTO_ITEMS.map((item) => (
              <div
                key={item.title}
                className={`group rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm transition-all duration-300 hover:bg-white/10 hover:border-white/20 ${item.className}`}
              >
                <item.icon className="mb-2 size-5 opacity-70 transition-transform duration-300 group-hover:scale-110" />
                <p className="text-sm font-semibold">{item.title}</p>
                <p className="mt-1 text-xs opacity-60">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs opacity-50">
          © {new Date().getFullYear()} UKM Robotik — Politeknik Negeri Padang
        </p>
      </aside>

      {/* ============================================================
       * PANEL KANAN — Formulir Autentikasi
       * ============================================================ */}
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-8 sm:px-8 lg:w-1/2">
        {/* Logo yang hanya tampil di mobile (panel kiri tersembunyi) */}
        <div className="mb-6 flex flex-col items-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/images/logo.png"
              alt="Logo UKM Robotik PNP"
              width={56}
              height={56}
              className="rounded-full"
              priority
            />
            <div>
              <p className="text-sm font-bold leading-tight">UKM Robotik</p>
              <p className="text-xs text-muted-foreground">
                Politeknik Negeri Padang
              </p>
            </div>
          </Link>
        </div>

        {/* Konten formulir dari halaman login/register */}
        <div className="w-full max-w-md">{children}</div>

        {/* Footer mobile */}
        <p className="mt-8 text-center text-xs text-muted-foreground lg:hidden">
          © {new Date().getFullYear()} UKM Robotik — Politeknik Negeri Padang
        </p>
      </main>
    </div>
  )
}
