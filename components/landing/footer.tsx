import Link from "next/link";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, YoutubeIcon } from "@hugeicons/core-free-icons";
import Image from "next/image";

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
      { href: "/hubungi-kami", label: "Hubungi Kami" },
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
    <footer className="bg-card dark:bg-[#060d19] text-foreground dark:text-white border-t border-border transition-colors duration-200">
      {/* Tricolor Top Stripe */}
      <div className="h-0.75 bg-linear-to-r from-dongker-surface via-pnp-orange to-dongker-ink" />

      <div className="max-w-330 2xl:max-w-384 4k:max-w-[2200px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 4k:px-20 py-16 4k:py-28">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 4k:gap-16">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-2">
            {/* Logo */}
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 4k:w-14 4k:h-14 flex items-center justify-center shrink-0">
                <Image
                  src="/images/logo-ukm-robotik-pnp.webp"
                  alt="Logo UKM Robotik PNP"
                  width={40}
                  height={40}
                  className="h-auto w-auto object-contain"
                />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-mono font-bold text-sm 4k:text-xl uppercase tracking-[2px] text-foreground dark:text-white">
                  ROBOTIK PNP
                </span>
                <span className="font-mono text-micro 4k:text-base uppercase tracking-[1.5px] text-pnp-orange font-semibold">
                  POLITEKNIK NEGERI PADANG
                </span>
              </div>
            </div>

            <p className="text-muted-foreground dark:text-slate-400 text-sm 4k:text-xl font-light leading-relaxed max-w-xs 4k:max-w-md mb-6">
              Unit Kegiatan Mahasiswa Robotika Politeknik Negeri Padang — We
              Play with Technology.
            </p>

            {/* Social Links */}
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/robotikpnp/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 4k:w-12 4k:h-12 rounded-md border border-border dark:border-white/15 flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:text-pnp-orange hover:border-pnp-orange hover:bg-pnp-orange/10 transition-all duration-200"
                aria-label="Instagram"
              >
                <HugeiconsIcon
                  icon={InstagramIcon}
                  size={16}
                  className="4k:w-6 4k:h-6"
                />
              </a>
              <a
                href="https://www.youtube.com/@robotikpnp"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 4k:w-12 4k:h-12 rounded-md border border-border dark:border-white/15 flex items-center justify-center text-muted-foreground dark:text-slate-400 hover:text-pnp-orange hover:border-pnp-orange hover:bg-pnp-orange/10 transition-all duration-200"
                aria-label="YouTube"
              >
                <HugeiconsIcon
                  icon={YoutubeIcon}
                  size={16}
                  className="4k:w-6 4k:h-6"
                />
              </a>
            </div>
          </div>

          {/* Nav Groups */}
          {navGroups.map((group) => (
            <div key={group.title}>
              <p className="font-mono text-micro 4k:text-base font-semibold uppercase tracking-[2px] text-pnp-orange mb-4">
                {group.title}
              </p>
              <ul className="flex flex-col gap-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-mono text-xs 4k:text-base text-muted-foreground dark:text-slate-400 hover:text-foreground dark:hover:text-white uppercase tracking-wider transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-16 4k:mt-24 pt-6 border-t border-border dark:border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-mono text-micro 4k:text-sm uppercase tracking-wider text-muted-foreground dark:text-slate-400">
            © {new Date().getFullYear()} UKM Robotika Politeknik Negeri Padang.
            All Rights Reserved.
          </p>
          <p className="font-mono text-micro 4k:text-sm uppercase tracking-wider text-muted-foreground/70 dark:text-slate-500">
            SYS_VERSION: 2.0.0 — BUILD: STABLE
          </p>
        </div>
      </div>
    </footer>
  );
}
