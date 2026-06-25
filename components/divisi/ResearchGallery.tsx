import React from 'react'
import { GalleryItem } from '@/lib/data/divisions'

export interface ResearchGalleryProps {
  items: GalleryItem[]
}

export const ResearchGallery: React.FC<ResearchGalleryProps> = ({ items }) => {
  if (!items || items.length === 0) return null

  // Split items for layout: 1 main video/image, rest smaller
  const mainItem = items.find(i => i.type === 'video') || items[0]
  const secondaryItems = items.filter(i => i.id !== mainItem.id)

  return (
    <section className="bg-white text-black py-20 border-t border-[#e2e8f0]">
      <div className="max-w-[1320px] mx-auto px-4 lg:px-8">
        <h2 className="font-sans text-[40px] font-bold mb-10 tracking-[-0.5px]">
          Galeri Riset & Uji Coba
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Large Column */}
          <div className="lg:col-span-2">
            <div className="bg-[#f5f7fa] border border-[#e2e8f0] aspect-video w-full relative flex items-center justify-center overflow-hidden">
              {mainItem.type === 'video' ? (
                <div className="w-full h-full bg-gray-900 flex items-center justify-center relative">
                    <span className="font-mono text-white/50 text-sm absolute">
                      [VIDEO PLAYER EMBED: {mainItem.url}]
                    </span>
                </div>
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="font-mono text-gray-500 text-sm">
                      [IMAGE: {mainItem.url}]
                    </span>
                </div>
              )}
            </div>
            <p className="mt-3 font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-gray-500">
              {mainItem.caption}
            </p>
          </div>

          {/* Secondary Grid Column */}
          <div className="flex flex-col gap-6">
            {secondaryItems.slice(0, 2).map(item => (
              <div key={item.id} className="w-full">
                <div className="bg-[#f5f7fa] border border-[#e2e8f0] aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden hover:border-[#1c69d4] transition-colors duration-300">
                   <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                      <span className="font-mono text-gray-400 text-xs text-center px-4">
                        [IMG: {item.url}]
                      </span>
                  </div>
                </div>
                <p className="mt-3 font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-gray-500 truncate">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
