import React from "react";
import Image from "next/image";
import { GalleryItem } from "@/lib/data/divisions";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Image01Icon,
  PlayIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

export interface ResearchGalleryProps {
  items: GalleryItem[];
}

export const ResearchGallery: React.FC<ResearchGalleryProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const mainItem = items.find((i) => i.type === "video") || items[0];
  const secondaryItems = items.filter((i) => i.id !== mainItem.id);

  return (
    <section className="bg-background text-foreground py-16 sm:py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 rounded-md bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 text-pnp-orange">
            <HugeiconsIcon icon={SparklesIcon} size={20} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground uppercase">
            Galeri Riset &amp; Uji Coba
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Large Media Card */}
          <div className="lg:col-span-2 flex flex-col">
            <div className="bg-card border border-border rounded-xl aspect-video w-full relative flex items-center justify-center overflow-hidden shadow-blueprint group hover:border-pnp-orange/60 transition-all duration-300">
              {mainItem.url &&
              mainItem.url.startsWith("/") &&
              !mainItem.url.includes("placeholder") &&
              !mainItem.url.endsWith(".mp4") ? (
                <Image
                  src={mainItem.url}
                  alt={mainItem.caption}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="w-full h-full bg-muted/60 flex flex-col items-center justify-center relative p-6 text-center">
                  <div className="size-16 rounded-full bg-pnp-orange/10 border border-pnp-orange/30 text-pnp-orange flex items-center justify-center mb-3 shadow-xs group-hover:scale-110 transition-transform">
                    <HugeiconsIcon
                      icon={mainItem.type === "video" ? PlayIcon : Image01Icon}
                      size={28}
                    />
                  </div>
                  <span className="font-mono text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                    {mainItem.type === "video"
                      ? "DOKUMENTASI VIDEO UJI COBA"
                      : "FOTO DOKUMENTASI RISET"}
                  </span>
                </div>
              )}

              {/* Badge Type */}
              <div className="absolute top-4 left-4 font-mono text-micro uppercase tracking-widest bg-background/90 backdrop-blur-md px-3 py-1 rounded-md border border-border text-foreground font-semibold flex items-center gap-1.5 shadow-xs">
                <HugeiconsIcon
                  icon={mainItem.type === "video" ? PlayIcon : Image01Icon}
                  size={14}
                  className="text-pnp-orange"
                />
                <span>{mainItem.type === "video" ? "VIDEO" : "FOTO"}</span>
              </div>
            </div>
            <p className="mt-3 font-mono text-micro uppercase tracking-[1.5px] font-semibold text-muted-foreground flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-pnp-orange" />
              {mainItem.caption}
            </p>
          </div>

          {/* Secondary Grid Column */}
          <div className="flex flex-col gap-6">
            {secondaryItems.slice(0, 2).map((item) => (
              <div key={item.id} className="w-full flex flex-col">
                <div className="bg-card border border-border rounded-xl aspect-[4/3] w-full relative flex items-center justify-center overflow-hidden shadow-xs hover:border-pnp-orange/60 transition-all duration-300 group">
                  {item.url &&
                  item.url.startsWith("/") &&
                  !item.url.includes("placeholder") &&
                  !item.url.endsWith(".mp4") ? (
                    <Image
                      src={item.url}
                      alt={item.caption}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full bg-muted/50 flex flex-col items-center justify-center p-4 text-center">
                      <div className="size-12 rounded-full bg-pnp-orange/10 border border-pnp-orange/30 text-pnp-orange flex items-center justify-center mb-2 shadow-xs group-hover:scale-110 transition-transform">
                        <HugeiconsIcon
                          icon={item.type === "video" ? PlayIcon : Image01Icon}
                          size={20}
                        />
                      </div>
                      <span className="font-mono text-micro uppercase tracking-wider font-semibold text-muted-foreground/80">
                        {item.type === "video"
                          ? "VIDEO TEST"
                          : "DOKUMENTASI RISET"}
                      </span>
                    </div>
                  )}

                  <div className="absolute top-3 left-3 font-mono text-[10px] uppercase tracking-widest bg-background/90 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-border text-foreground font-semibold flex items-center gap-1 shadow-xs">
                    <HugeiconsIcon
                      icon={item.type === "video" ? PlayIcon : Image01Icon}
                      size={12}
                      className="text-pnp-orange"
                    />
                    <span>{item.type === "video" ? "VIDEO" : "FOTO"}</span>
                  </div>
                </div>
                <p className="mt-2.5 font-mono text-micro uppercase tracking-[1.5px] font-semibold text-muted-foreground truncate">
                  {item.caption}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
