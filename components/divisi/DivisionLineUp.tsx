import React from 'react'
import { TeamMember } from '@/lib/data/divisions'

export interface DivisionLineUpProps {
  members: TeamMember[]
}

export const DivisionLineUp: React.FC<DivisionLineUpProps> = ({ members }) => {
  return (
    <section className="bg-[#0a0f24] text-white py-20 border-t border-[#222b54]">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <h2 className="font-sans text-[40px] font-bold mb-10 tracking-[-0.5px]">
          Struktur Tim Teknis
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((member) => (
            <div key={member.id} className="bg-[#131a3a] border border-[#222b54] rounded-sm p-6 hover:shadow-[0_0_12px_rgba(0,102,177,0.2)] transition-shadow duration-300">
              <div className="w-20 h-20 bg-gray-800 rounded-sm mb-4 mx-auto overflow-hidden border border-[#222b54]">
                {/* Fallback image if source is broken */}
                <div className="w-full h-full bg-[#1c69d4]/20 flex items-center justify-center text-xs font-mono text-[#0066b1]">
                  [IMG]
                </div>
              </div>
              <div className="text-center">
                <h3 className="font-sans text-[16px] font-bold mb-1 text-white">
                  {member.name}
                </h3>
                <p className="font-mono text-[12px] uppercase tracking-[1.5px] text-[#0066b1] font-medium">
                  {member.role}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
