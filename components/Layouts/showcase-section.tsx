"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ShowcaseSectionProps = {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function ShowcaseSection({
  title,
  description,
  children,
  className,
}: ShowcaseSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        "w-full rounded-2xl bg-card shadow-md p-6 md:p-8 space-y-6",
        className
      )}
    >
      {(title || description) && (
        <header className="space-y-2">
          {title && (
            <h2 className="text-xl md:text-2xl font-bold tracking-tight">
              {title}
            </h2>
          )}
          {description && (
            <p className="text-muted-foreground text-sm md:text-base">
              {description}
            </p>
          )}
        </header>
      )}

      <div className="space-y-4">{children}</div>
    </motion.section>
  );
}
