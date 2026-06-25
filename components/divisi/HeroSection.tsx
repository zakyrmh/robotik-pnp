import React from 'react'

export interface HeroSectionProps {
  badge: string
  title: string
  subtitle: string
  image: string
}

export const HeroSection: React.FC<HeroSectionProps> = ({ badge, title, subtitle, image }) => {
  return (
    <section className="bg-[#0a0f24] text-white pt-20 pb-20 relative overflow-hidden">
      {/* Tech Tricolor Divider at the top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#0066b1] via-[#1c69d4] to-[#e22718]" />

      <div className="max-w-[1320px] mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left Column: Content */}
        <div className="space-y-6">
          <div className="inline-block border border-[#222b54] px-3 py-1 bg-[#131a3a] rounded-sm">
            <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-[#0066b1]">
              {badge}
            </span>
          </div>

          <h1 className="font-sans text-[40px] md:text-[64px] font-bold uppercase tracking-normal leading-tight text-white">
            {title}
          </h1>

          <p className="font-sans text-[16px] font-light leading-relaxed text-gray-300 max-w-lg">
            {subtitle}
          </p>
        </div>

        {/* Right Column: Visual */}
        <div className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full bg-[#131a3a] border border-[#222b54]">
          {/* We use a placeholder image for now, keeping rounded-none and strict edges */}
          <div className="absolute inset-0 bg-gradient-to-tr from-[#0066b1]/20 to-transparent z-10" />
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
            style={{ borderRadius: '0px' }}
          />
        </div>
      </div>
    </section>
  )
}
