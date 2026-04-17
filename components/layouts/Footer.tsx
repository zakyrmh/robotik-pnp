import React from "react";
import Link from "next/link";
import { MapPin, Mail, Instagram, Youtube } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-zinc-50 dark:bg-zinc-950 text-zinc-600 dark:text-zinc-400 py-16 px-6 border-t border-zinc-200 dark:border-white/5 transition-colors duration-300">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
        {/* Branding */}
        <div className="space-y-6">
          <h2 className="text-zinc-900 dark:text-white font-bold text-xl uppercase tracking-tighter">
            UKM Robotik PNP
          </h2>
          <p className="text-sm leading-relaxed max-w-xs">
            Unit Kegiatan Mahasiswa (UKM) Robotik Politeknik Negeri Padang
            adalah pusat kreativitas dan riset teknologi yang berfokus pada
            Kontes Robot Indonesia (KRI), pengabdian masyarakat, serta
            penyelenggara Minangkabau Robot Contest (MRC). We Play with
            Technology.
          </p>
        </div>

        {/* Divisi */}
        <div className="space-y-6">
          <h3 className="text-orange-600 dark:text-orange-400 font-bold text-xs tracking-[0.2em] uppercase">
            Divisi
          </h3>
          <ul className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">KRAI (Kontes Robot ABU Indonesia)</Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">
                KRSBI-B (Kontes Robot Sepak Bola Indonesia - Beroda)
              </Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">
                KRSBI-H (Kontes Robot Sepak Bola Indonesia - Humanoid)
              </Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">KRSTI (Kontes Robot Seni Tari Indonesia)</Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">KRSRI (Kontes Robot SAR Indonesia)</Link>
            </li>
          </ul>
        </div>

        {/* Event & Info */}
        <div className="space-y-6">
          <h3 className="text-orange-600 dark:text-orange-400 font-bold text-xs tracking-[0.2em] uppercase">
            Event & Info
          </h3>
          <ul className="space-y-4 text-sm text-zinc-700 dark:text-zinc-300 font-medium">
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">Minangkabau Robot Contest (MRC)</Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">Member Portal</Link>
            </li>
            <li className="hover:text-blue-600 dark:hover:text-white transition-colors">
              <Link href="#">Open Recruitment Registration</Link>
            </li>
          </ul>
        </div>

        {/* Contact */}
        <div className="space-y-6">
          <h3 className="text-orange-600 dark:text-orange-400 font-bold text-xs tracking-[0.2em] uppercase">
            Contact Us
          </h3>
          <ul className="space-y-4 text-sm font-medium">
            <li className="flex items-start gap-3">
              <MapPin
                size={18}
                className="text-blue-600 dark:text-blue-400 shrink-0"
              />
              <span className="text-zinc-700 dark:text-zinc-300">
                Kampus Politeknik Negeri Padang, Limau Manis, Padang
              </span>
            </li>
            <li className="flex items-center gap-3">
              <Mail
                size={18}
                className="text-blue-600 dark:text-blue-400 shrink-0"
              />
              <Link
                href="mailto:infokomrobotikpnp2024@gmail.com"
                className="text-zinc-700 dark:text-zinc-300"
              >
                infokomrobotikpnp2024@gmail.com
              </Link>
            </li>
          </ul>
          <div className="flex gap-4 pt-2">
            <Link href="https://www.instagram.com/robotikpnp/">
              <Instagram
                className="cursor-pointer text-zinc-500 hover:text-blue-600 dark:hover:text-white transition-colors"
                size={20}
              />
            </Link>
            <Link href="https://www.youtube.com/@robotikpnp">
              <Youtube
                className="cursor-pointer text-zinc-500 hover:text-blue-600 dark:hover:text-white transition-colors"
                size={20}
              />
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto mt-20 pt-8 border-t border-zinc-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] tracking-widest uppercase font-bold opacity-70">
        <p>© 2026 UKM ROBOTIK POLITEKNIK NEGERI PADANG. ALL RIGHTS RESERVED.</p>
        <div className="flex gap-8">
          <Link
            href="#"
            className="hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            href="#"
            className="hover:text-blue-600 dark:hover:text-white transition-colors"
          >
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
