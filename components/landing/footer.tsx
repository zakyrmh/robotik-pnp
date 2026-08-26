import Link from "next/link";
import Image from "next/image";
import { Mail, MapPin, ExternalLink } from "lucide-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { InstagramIcon, YoutubeIcon } from "@hugeicons/core-free-icons";

interface FooterLinkGroup {
  title: string;
  links: {
    href: string;
    label: string;
    external?: boolean;
  }[];
}

const footerNavGroups: FooterLinkGroup[] = [
  {
    title: "Navigasi",
    links: [
      { href: "/", label: "Beranda" },
      { href: "/profil", label: "Profil UKM" },
      { href: "/divisi", label: "Divisi Robot" },
      { href: "/prestasi", label: "Rekam Prestasi" },
      { href: "/keanggotaan", label: "Keanggotaan" },
    ],
  },
  {
    title: "Divisi Robotika",
    links: [
      { href: "/divisi/krai", label: "KRAI (Abu Indonesia)" },
      { href: "/divisi/krsbi-b", label: "KRSBI Beroda" },
      { href: "/divisi/krsbi-h", label: "KRSBI Humanoid" },
      { href: "/divisi/krsti", label: "KRSTI (Seni Tari)" },
      { href: "/divisi/krsri", label: "KRSRI (SAR Robot)" },
    ],
  },
  {
    title: "Informasi & SIM",
    links: [
      { href: "/register", label: "Pendaftaran Anggota" },
      { href: "/login", label: "Portal SIM Robotik" },
      { href: "/artikel", label: "Artikel & Riset" },
      { href: "/hubungi-kami", label: "Hubungi Kami" },
      { href: "/privacy", label: "Kebijakan Privasi" },
      { href: "/terms", label: "Syarat & Ketentuan" },
    ],
  },
];

export function LandingFooter() {
  return (
    <footer className="bg-card text-foreground border-t border-border transition-colors duration-200 relative overflow-hidden">
      {/* Top subtle engineering accent line */}
      <div className="h-0.5 w-full bg-linear-to-r from-primary via-accent-strong to-primary/40" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 lg:gap-12">
          {/* Brand & Organization Information */}
          <div className="lg:col-span-2 space-y-4">
            <Link
              href="/"
              className="inline-flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
            >
              <div className="size-10 flex items-center justify-center shrink-0 rounded-lg border border-border bg-background p-1 shadow-2xs group-hover:border-primary transition-colors">
                <Image
                  src="/images/logo-ukm-robotik-pnp.webp"
                  alt="Logo UKM Robotik PNP"
                  width={40}
                  height={40}
                  className="rounded-md object-contain size-full"
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-display font-bold text-base tracking-tight text-foreground group-hover:text-primary transition-colors">
                  UKM ROBOTIK
                </span>
                <span className="font-mono text-[10px] tracking-wider uppercase text-muted-foreground font-medium">
                  POLITEKNIK NEGERI PADANG
                </span>
              </div>
            </Link>

            <div className="space-y-1">
              <p className="font-mono text-xs font-semibold text-accent-strong uppercase tracking-wider">
                Mesin. Logika. Juara.
              </p>
              <p className="font-body text-sm text-muted-foreground leading-relaxed max-w-sm">
                Unit Kegiatan Mahasiswa yang berfokus pada riset, rekayasa
                otomasi, dan pengembangan inovasi teknologi robotika kompetitif
                di Politeknik Negeri Padang.
              </p>
            </div>

            {/* Campus & Secretariat Location */}
            <div className="space-y-2 pt-1">
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <MapPin className="size-3.5 mt-0.5 shrink-0 text-primary" />
                <span>
                  Gedung P, Lt 2, Kampus Politeknik Negeri Padang, Limau Manis,
                  Padang 25164
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="size-3.5 shrink-0 text-primary" />
                <a
                  href="mailto:infokomrobotikpnp2024@gmail.com"
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  infokomrobotikpnp2024@gmail.com
                </a>
              </div>
            </div>

            {/* Social Media Links */}
            <div className="flex items-center gap-2.5 pt-2">
              <a
                href="https://www.instagram.com/robotikpnp/"
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-colors flex items-center justify-center shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Instagram Resmi UKM Robotik PNP"
              >
                <HugeiconsIcon icon={InstagramIcon} size={16} />
              </a>
              <a
                href="https://www.youtube.com/@robotikpnp"
                target="_blank"
                rel="noopener noreferrer"
                className="size-9 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-primary transition-colors flex items-center justify-center shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Kanal YouTube Resmi UKM Robotik PNP"
              >
                <HugeiconsIcon icon={YoutubeIcon} size={16} />
              </a>
              <a
                href="https://www.pnp.ac.id"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-background hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-body transition-colors shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Portal Resmi Politeknik Negeri Padang"
              >
                <span>pnp.ac.id</span>
                <ExternalLink className="size-3 text-muted-foreground" />
              </a>
            </div>
          </div>

          {/* Navigation Links Columns */}
          {footerNavGroups.map((group) => (
            <div key={group.title} className="space-y-3.5">
              <h3 className="font-display font-semibold text-xs uppercase tracking-wider text-foreground">
                {group.title}
              </h3>
              <ul className="space-y-2.5">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="font-body text-sm text-muted-foreground hover:text-primary transition-colors inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-xs"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright & System Status */}
        <div className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="font-body text-xs text-muted-foreground text-center sm:text-left">
            © {new Date().getFullYear()} UKM Robotik Politeknik Negeri Padang.
            Seluruh hak cipta dilindungi.
          </p>
        </div>
      </div>
    </footer>
  );
}
