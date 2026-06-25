"use client";

import React from "react";
import { motion } from "framer-motion";

export interface HeroSectionProps {
  badge: string;
  title: string;
  subtitle: string;
  image: string;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  badge,
  title,
  subtitle,
  image,
}) => {
  return (
    <section className="bg-canvas-dark text-white pt-20 pb-20 relative overflow-hidden">
      {/* Tech Tricolor Divider at the top */}
      <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

      <div className="max-w-[1320px] mx-auto px-4 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
        {/* Left Column: Content */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-block border border-hairline-dark px-3 py-1 bg-surface-card-dark rounded-sm"
          >
            <span className="font-mono text-[12px] uppercase tracking-[1.5px] font-medium text-cyber-blue">
              {badge}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="font-sans text-[40px] md:text-[64px] font-bold uppercase tracking-normal leading-tight text-white"
          >
            {title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.2 }}
            className="font-sans text-[16px] font-light leading-relaxed text-gray-300 max-w-lg"
          >
            {subtitle}
          </motion.p>
        </div>

        {/* Right Column: Visual */}
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          className="relative h-[300px] sm:h-[400px] lg:h-[500px] w-full bg-surface-card-dark border border-hairline-dark"
        >
          {/* We use a placeholder image for now, keeping rounded-none and strict edges */}
          <div className="absolute inset-0 bg-linear-to-tr from-cyber-blue/20 to-transparent z-10" />
          <img
            src={image}
            alt={title}
            className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-500"
            style={{ borderRadius: "0px" }}
          />
        </motion.div>
      </div>
    </section>
  );
};
