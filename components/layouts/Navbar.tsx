"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

const navLinks = [
  { name: "BERANDA", href: "/" },
  { name: "STRUKTUR", href: "/struktur" },
  { name: "TIM KRI", href: "/tim" },
  { name: "OPEN RECRUITMENT", href: "/oprec" },
  { name: "GALERI", href: "/galeri" },
  { name: "CONTACT", href: "/contact" },
  { name: "ABOUT", href: "/about" },
];

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 border-b border-zinc-200 dark:border-white/10 bg-white/80 dark:bg-zinc-950/50 backdrop-blur-md px-6 py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tighter text-zinc-900 dark:text-white"
        >
          UKM ROBOTIK{" "}
          <span className="text-orange-600 dark:text-orange-500">PNP</span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[12px] font-semibold tracking-widest text-zinc-600 dark:text-zinc-400 hover:text-orange-600 dark:hover:text-orange-400 transition-colors relative group"
            >
              {link.name}
              {link.name === "BERANDA" && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute -bottom-1 left-0 w-full h-[2px] bg-orange-500"
                />
              )}
            </Link>
          ))}
        </div>

        {/* Login Button - Menggunakan warna biru PNP */}
        <Button className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-200 dark:text-blue-900 dark:hover:bg-blue-300 font-bold px-8 rounded-lg transition-all shadow-md dark:shadow-none">
          <Link href="/login">LOGIN</Link>
        </Button>
      </div>
    </nav>
  );
}
