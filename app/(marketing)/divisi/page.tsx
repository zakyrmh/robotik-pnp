import React from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { divisionsData } from '@/lib/data/divisions'
import { cn } from '@/lib/utils'

export const metadata = {
  title: 'Divisi Kompetisi | UKM Robotik PNP',
  description: 'Eksplorasi mendalam divisi-divisi kompetisi robotika yang ada di UKM Robotik PNP.',
}

export default async function DivisiIndexPage() {
  const supabase = await createClient()

  // Try to fetch active divisions from Supabase to get the description, id etc.
  const { data: dbDivisions } = await supabase
    .from('divisions')
    .select('*')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })

  // Fallback to static mapping if database is empty/fails
  const slugs = ['krai', 'krsbi-b', 'krsbi-h', 'krsti', 'krsri']

  const divisions = slugs.map(slug => {
    const staticData = divisionsData[slug]
    const dbData = dbDivisions?.find(d => d.slug === slug)

    return {
      slug,
      name: dbData?.name || staticData.hero.title,
      description: dbData?.short_description || staticData.hero.subtitle,
      badge_label: dbData?.badge_label || staticData.hero.badge,
    }
  })

  return (
    <div className="bg-[#0a0f24] min-h-screen text-white pt-24 pb-20">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">

        {/* Header Section */}
        <div className="mb-16">
          <div className="inline-block border border-[#222b54] px-3 py-1 bg-[#131a3a] rounded-sm mb-6">
            <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-[#0066b1]">
              Divisi Riset & Kompetisi
            </span>
          </div>
          <h1 className="font-sans text-[40px] md:text-[64px] font-bold uppercase tracking-tight text-white mb-6">
            Eksplorasi Divisi
          </h1>
          <p className="font-sans text-[16px] font-light leading-relaxed text-gray-400 max-w-2xl">
            Sistem klasifikasi riset terpusat UKM Robotik PNP. Jelajahi spesifikasi teknis,
            dokumentasi, dan rekam jejak dari setiap divisi robotika di bawah standar
            Kontes Robot Indonesia (KRI).
          </p>
        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {divisions.map((div, i) => (
            <Link
              key={div.slug}
              href={`/divisi/${div.slug}`}
              className={cn(
                "group block bg-[#131a3a] border border-[#222b54] rounded-sm p-8 transition-all duration-300",
                "hover:border-[#1c69d4] hover:shadow-[0_0_12px_rgba(0,102,177,0.2)]",
                "relative overflow-hidden"
              )}
            >
              {/* Card Accent Strip */}
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718] opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="mb-8">
                <span className="font-mono text-[28px] font-bold text-gray-600 opacity-30 group-hover:opacity-50 transition-opacity duration-300">
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>

              <h2 className="font-sans text-[28px] font-bold uppercase mb-4 text-white group-hover:text-[#0066b1] transition-colors duration-300">
                {div.name}
              </h2>

              <p className="font-sans text-[14px] font-light text-gray-400 line-clamp-3 mb-6">
                {div.description}
              </p>

              <div className="flex items-center text-[#0066b1] font-mono text-[12px] uppercase tracking-[1.5px] font-medium group-hover:text-[#1c69d4] transition-colors">
                <span>Akses Data Teknis</span>
                <span className="ml-2 transform group-hover:translate-x-2 transition-transform duration-300">→</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
