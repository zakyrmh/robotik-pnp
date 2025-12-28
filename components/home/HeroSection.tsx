"use client";

import { motion } from "framer-motion";

export function HeroSection() {
  return (
    <section
      id="home"
      className="w-full min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 text-center px-4 transition-colors"
    >
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 transition-colors"
      >
        Selamat Datang di{" "}
        <span className="text-slate-600 dark:text-slate-300">UKM Robotik</span>
      </motion.h1>
      <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mb-6 transition-colors">
        Wadah bagi mahasiswa Politeknik Negeri Padang untuk mengembangkan minat,
        bakat, dan kreativitas di bidang robotika.
      </p>
    </section>
  );
}
