import React from "react";
import Image from "next/image";
import { TeamMember } from "@/lib/data/divisions";
import { HugeiconsIcon } from "@hugeicons/react";
import { User02Icon, UserGroupIcon } from "@hugeicons/core-free-icons";

export interface DivisionLineUpProps {
  members: TeamMember[];
}

export const DivisionLineUp: React.FC<DivisionLineUpProps> = ({ members }) => {
  return (
    <section className="bg-muted/30 dark:bg-dongker-ink/50 text-foreground py-16 sm:py-20 border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3 mb-10">
          <div className="p-2 rounded-md bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 text-pnp-orange">
            <HugeiconsIcon icon={UserGroupIcon} size={20} />
          </div>
          <h2 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground uppercase">
            Struktur Tim Teknis
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {members.map((member) => (
            <div
              key={member.id}
              className="bg-card border border-border rounded-xl p-6 hover:border-pnp-orange/60 hover:shadow-blueprint transition-all duration-300 text-center group flex flex-col items-center justify-between"
            >
              <div className="size-20 rounded-full bg-muted border-2 border-border group-hover:border-pnp-orange transition-colors mx-auto mb-4 overflow-hidden relative flex items-center justify-center text-muted-foreground font-mono text-xs font-semibold shadow-xs">
                {member.image && !member.image.includes("placeholder") ? (
                  <Image
                    src={member.image}
                    alt={member.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <HugeiconsIcon
                    icon={User02Icon}
                    size={28}
                    className="text-muted-foreground/60"
                  />
                )}
              </div>
              <div className="text-center w-full">
                <h3 className="font-display text-base font-bold mb-2 text-foreground group-hover:text-pnp-orange transition-colors">
                  {member.name}
                </h3>
                <span className="inline-block font-mono text-micro uppercase tracking-[1.5px] text-orange-deep dark:text-pnp-orange font-semibold bg-orange-wash dark:bg-pnp-orange/15 border border-pnp-orange/30 px-3 py-1 rounded-full">
                  {member.role}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
