"use client";

import { useState } from "react";
import { Menu, X } from "lucide-react";
import { animate } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const navItems = [
  { label: "Home", href: "#home" },
  { label: "Ketua Umum", href: "#ketua" },
  { label: "Video", href: "#video" },
  { label: "Open Recruitment", href: "#recruitment" },
  { label: "Tim KRI", href: "#kri" },
  { label: "Lokasi", href: "#lokasi" },
];

function scrollToSection(id: string) {
  const section = document.getElementById(id);
  if (section) {
    const y = section.getBoundingClientRect().top + window.scrollY - 80; // offset header
    animate(window.scrollY, y, {
      duration: 0.8,
      onUpdate: (latest) => window.scrollTo(0, latest),
    });
  }
}

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full bg-white text-slate-800 shadow-md z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <Link href="#home" className="text-xl font-bold text-slate-900">
            UKM Robotik PNP
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Button
                key={item.href}
                variant="link"
                onClick={() => scrollToSection(item.href.replace("#",""))}
                className="hover:text-slate-500 transition-colors"
              >
                {item.label}
              </Button>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 rounded-md hover:bg-slate-100 focus:outline-none"
          >
            {isOpen ? (
              <X size={24} className="text-slate-800" />
            ) : (
              <Menu size={24} className="text-slate-800" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-slate-200">
          <div className="space-y-2 px-4 py-3">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-slate-800 hover:bg-slate-100 px-3 py-2 rounded-md"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
