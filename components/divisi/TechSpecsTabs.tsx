'use client'

import React, { useState } from 'react'
import { TechSpec, TabType } from '@/lib/data/divisions'

export interface TechSpecsTabsProps {
  specs: Record<TabType, TechSpec>
}

export const TechSpecsTabs: React.FC<TechSpecsTabsProps> = ({ specs }) => {
  const [activeTab, setActiveTab] = useState<TabType>('mekanik')

  const tabs: { id: TabType; label: string }[] = [
    { id: 'mekanik', label: 'Mekanik' },
    { id: 'elektronik', label: 'Elektronik' },
    { id: 'software', label: 'Software' },
  ]

  return (
    <section className="bg-white text-black py-20">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <h2 className="font-sans text-[40px] font-bold mb-10 tracking-[-0.5px]">
          Spesifikasi Teknis Core
        </h2>

        {/* Tab Controls */}
        <div className="flex border-b border-[#e2e8f0] mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-4 px-6 font-mono text-[14px] uppercase tracking-[1.5px] font-medium whitespace-nowrap transition-colors duration-200 border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#0066b1] text-[#0066b1]'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-[#f5f7fa] border border-[#e2e8f0] p-8 lg:p-12">
          <h3 className="font-mono text-[28px] font-bold uppercase mb-8 text-[#000000]">
            {specs[activeTab].title}
          </h3>

          <ul className="space-y-6">
            {specs[activeTab].items.map((item, index) => (
              <li key={index} className="flex gap-4">
                <div className="flex-shrink-0 w-6 h-6 bg-[#0066b1] flex items-center justify-center text-white text-xs mt-1">
                  ✓
                </div>
                <div>
                  <h4 className="font-mono text-[14px] font-medium uppercase tracking-[1.5px] mb-2">
                    {item.label}
                  </h4>
                  <p className="font-sans text-[16px] font-light text-gray-700">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
