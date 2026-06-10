import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, YoutubeIcon } from "@hugeicons/core-free-icons";

const navGroups = [
  {
    title: "Navigasi",
    links: [
      { href: "/", label: "Beranda" },
      { href: "/profil", label: "Profil UKM" },
      { href: "/divisi", label: "Divisi Robot" },
      { href: "/prestasi", label: "Prestasi" },
    ],
  },
  {
    title: "Komunitas",
    links: [
      { href: "/keanggotaan", label: "Keanggotaan" },
      { href: "/artikel", label: "Artikel & Blog" },
      { href: "/hubungi", label: "Hubungi Kami" },
    ],
  },
  {
    title: "Divisi",
    links: [
      { href: "/divisi/krai", label: "KRAI" },
      { href: "/divisi/krsbi-b", label: "KRSBI-B" },
      { href: "/divisi/krsbi-h", label: "KRSBI-H" },
      { href: "/divisi/krsti", label: "KRSTI" },
      { href: "/divisi/krsri", label: "KRSRI" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-surface-card-dark border-t border-hairline-dark">
      {/* Tricolor top stripe */}
      <div className="h-[3px] bg-linear-to-r from-cyber-blue via-tech-navy to-crimson-red" />

      <div className="max-w-[1320px] mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-linear-to-br from-cyber-blue to-tech-navy flex items-center justify-center shrink-0">
                <span className="text-white font-mono font-bold text-sm tracking-wider">
                  R
                </span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-mono font-bold text-sm uppercase tracking-[2px] text-white">
                  Robotika PNP
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[1.5px] text-cyber-blue">
                  Politeknik Negeri Padang
                </span>
              </div>
            </div>

            <p className="text-white/40 text-sm font-light leading-relaxed max-w-xs mb-6">
              Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang —
              Bergerak dengan Presisi, Bersaing di Pentas Nasional.
            </p>

            {/* Social links */}
            <div className="flex gap-3">
              <a
                href="https://instagram.com/robotika_pnp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-hairline-dark flex items-center justify-center text-white/40 hover:text-white hover:border-cyber-blue hover:bg-cyber-blue/10 transition-all duration-200"
                aria-label="Instagram"
              >
                <HugeiconsIcon icon={InstagramIcon} size={16} />
              </a>
              <a
                href="https://youtube.com/@robotika_pnp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 border border-hairline-dark flex items-center justify-center text-white/40 hover:text-white hover:border-crimson-red hover:bg-crimson-red/10 transition-all duration-200"
                aria-label="YouTube"
              >
                <HugeiconsIcon icon={YoutubeIcon} size={16} />
              </a>
            </div>
          </div>

          {/* Nav groups */}
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="font-mono text-[10px] uppercase tracking-[2px] text-cyber-blue mb-5">
                {group.title}
              </p>
              <ul className="flex flex-col gap-3">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-mono text-[11px] text-white/40 hover:text-white uppercase tracking-[1px] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-16 pt-6 border-t border-hairline-dark flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-white/25">
            © {new Date().getFullYear()} UKM Robotika Politeknik Negeri Padang.
            All Rights Reserved.
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[1px] text-white/20">
            SYS_VERSION: 4.2.0 — BUILD: STABLE
          </p>
        </div>
      </div>
    </footer>
  );
}
