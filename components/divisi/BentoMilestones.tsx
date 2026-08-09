import React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Award01Icon } from "@hugeicons/core-free-icons";

export interface Milestone {
  id: string;
  title: string;
  level: string;
  year: number;
  description: string | null;
}

export interface BentoMilestonesProps {
  milestones: Milestone[];
}

export const BentoMilestones: React.FC<BentoMilestonesProps> = ({
  milestones,
}) => {
  if (!milestones || milestones.length === 0) {
    return null;
  }

  return (
    <section className="bg-background text-foreground py-16 sm:py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 rounded-md bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 text-pnp-orange">
            <HugeiconsIcon icon={Award01Icon} size={20} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground uppercase">
            Rekam Jejak &amp; Prestasi
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {milestones.map((milestone, index) => {
            const isFeatured = index === 0 && milestones.length > 2;

            return (
              <div
                key={milestone.id}
                className={`bg-card border border-border rounded-xl p-6 lg:p-8 flex flex-col justify-between relative overflow-hidden group hover:border-pnp-orange/60 hover:shadow-blueprint transition-all duration-300 ${
                  isFeatured ? "md:col-span-2 md:row-span-2" : ""
                }`}
              >
                {/* Background Glow */}
                <div className="absolute -right-20 -top-20 size-40 bg-gradient-to-br from-pnp-orange/10 via-dongker-surface/5 to-transparent rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700 pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className="font-mono text-micro uppercase tracking-[1.5px] font-semibold text-orange-deep dark:text-pnp-orange bg-orange-wash dark:bg-pnp-orange/15 px-3 py-1 border border-pnp-orange/30 rounded-full shadow-xs">
                      {milestone.level}
                    </span>
                    <span className="font-mono text-2xl sm:text-3xl font-bold text-muted-foreground/30 group-hover:text-pnp-orange/40 transition-colors">
                      {milestone.year}
                    </span>
                  </div>

                  <h3
                    className={`font-display font-bold text-foreground group-hover:text-pnp-orange transition-colors mb-3 ${
                      isFeatured
                        ? "text-2xl sm:text-3xl lg:text-4xl"
                        : "text-lg sm:text-xl"
                    }`}
                  >
                    {milestone.title}
                  </h3>

                  {milestone.description && (
                    <p className="font-sans text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed">
                      {milestone.description}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
