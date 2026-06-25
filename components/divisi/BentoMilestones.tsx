import React from 'react'

export interface Milestone {
  id: string
  title: string
  level: string
  year: number
  description: string | null
}

export interface BentoMilestonesProps {
  milestones: Milestone[]
}

export const BentoMilestones: React.FC<BentoMilestonesProps> = ({ milestones }) => {
  if (!milestones || milestones.length === 0) {
    return null; // Don't render section if no achievements
  }

  return (
    <section className="bg-[#0a0f24] text-white py-20 border-t border-[#222b54]">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <h2 className="font-sans text-[40px] font-bold mb-10 tracking-[-0.5px]">
          Rekam Jejak & Prestasi
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone, index) => {
            // Make the first item larger if desired (bento style)
            const isFeatured = index === 0 && milestones.length > 2;

            return (
              <div
                key={milestone.id}
                className={`bg-[#131a3a] border border-[#222b54] rounded-sm p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden group
                  ${isFeatured ? 'md:col-span-2 md:row-span-2' : ''}
                `}
              >
                {/* Decorative gradient reflecting medal vibes (subtle) */}
                <div className="absolute -right-20 -top-20 w-40 h-40 bg-gradient-to-br from-[#0066b1]/10 to-[#e22718]/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-[#0066b1] bg-[#0066b1]/10 px-2 py-1 border border-[#0066b1]/30 rounded-sm">
                      {milestone.level}
                    </span>
                    <span className="font-mono text-[28px] font-bold text-gray-500 opacity-50">
                      {milestone.year}
                    </span>
                  </div>

                  <h3 className={`font-sans font-bold text-white mb-4 ${isFeatured ? 'text-[28px] lg:text-[40px]' : 'text-[20px]'}`}>
                    {milestone.title}
                  </h3>

                  {milestone.description && (
                    <p className="font-sans text-[16px] font-light text-gray-400">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
