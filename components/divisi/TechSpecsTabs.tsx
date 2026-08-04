"use client";

import React, { useState } from "react";
import { TechSpec, TabType } from "@/lib/data/divisions";
import { HugeiconsIcon } from "@hugeicons/react";
import { Tick02Icon, CpuIcon } from "@hugeicons/core-free-icons";

export interface TechSpecsTabsProps {
  specs: Record<TabType, TechSpec>;
}

export const TechSpecsTabs: React.FC<TechSpecsTabsProps> = ({ specs }) => {
  const [activeTab, setActiveTab] = useState<TabType>("mekanik");

  const tabs: { id: TabType; label: string }[] = [
    { id: "mekanik", label: "Mekanik" },
    { id: "elektronik", label: "Elektronik" },
    { id: "software", label: "Software" },
  ];

  return (
    <section className="bg-background text-foreground py-16 sm:py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-md bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 text-pnp-orange">
            <HugeiconsIcon icon={CpuIcon} size={20} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground uppercase">
            Spesifikasi Teknis Core
          </h2>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-border/60 mb-8 overflow-x-auto gap-2 pb-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-2.5 font-mono text-xs uppercase tracking-[1.5px] font-semibold rounded-md border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? "bg-dongker-surface text-white dark:bg-pnp-orange dark:text-white border-transparent shadow-xs"
                    : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content Panel */}
        <div className="bg-card border border-border rounded-xl p-6 sm:p-10 shadow-xs">
          <h3 className="font-display text-xl sm:text-2xl font-bold uppercase mb-8 text-foreground pb-4 border-b border-border/40">
            {specs[activeTab].title}
          </h3>

          <ul className="space-y-6">
            {specs[activeTab].items.map((item, index) => (
              <li key={index} className="flex gap-4 items-start">
                <div className="size-6 rounded-md bg-pnp-orange/10 border border-pnp-orange/30 text-pnp-orange flex items-center justify-center shrink-0 mt-0.5">
                  <HugeiconsIcon icon={Tick02Icon} size={14} />
                </div>
                <div>
                  <h4 className="font-mono text-xs font-semibold uppercase tracking-[1.5px] text-foreground mb-1">
                    {item.label}
                  </h4>
                  <p className="font-sans text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
};
