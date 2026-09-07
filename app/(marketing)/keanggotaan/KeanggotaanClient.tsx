"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp, Users, User } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// --- Shared types (exported for use in page.tsx) ---
export type OrgMember = {
  id: string;
  slug: string | null;
  name: string;
  avatarUrl: string | null;
  role: string;
  level: "Ketua" | "Wakil" | "Koordinator" | "Anggota";
  subSection: string | null;
  sortOrder: number;
};

export type OrgSection = {
  /**
   * Maps to `departments.category`:
   *   "presidium"  → Pengurus Harian Inti
   *   "adhoc"      → Badan Ad-Hoc (Komdis / Oprec, via subSection)
   *   "departemen" → Departemen
   */
  category: "presidium" | "adhoc" | "departemen";
  deptName: string;
  members: OrgMember[];
};

// --- Sub-components ---

function MemberCard({ member }: { member: OrgMember }) {
  const isLeader = member.level === "Ketua" || member.level === "Koordinator";
  const isVice = member.level === "Wakil";

  const cardContent = (
    <div className="flex items-center gap-3.5 w-full">
      {member.avatarUrl ? (
        <div className="size-12 rounded-lg overflow-hidden border border-border shrink-0 bg-secondary relative">
          <Image
            src={member.avatarUrl}
            alt={member.name}
            fill
            className="object-cover"
            sizes="48px"
          />
        </div>
      ) : (
        <div className="size-12 rounded-lg bg-secondary border border-border flex items-center justify-center shrink-0 text-primary">
          <User className="size-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-bold text-sm text-foreground truncate group-hover:text-primary transition-colors">
          {member.name}
        </h4>
        <p className="font-body text-xs text-muted-foreground truncate mt-0.5">
          {member.role}
        </p>
      </div>
    </div>
  );

  return (
    <motion.div
      whileHover={member.slug ? { y: -2 } : undefined}
      className={`group p-4 rounded-xl border bg-card shadow-2xs hover:shadow-soft transition-all duration-200 relative overflow-hidden flex items-center ${
        isLeader
          ? "border-accent-strong/40 hover:border-accent-strong"
          : isVice
            ? "border-primary/40 hover:border-primary"
            : "border-border hover:border-primary/50"
      }`}
    >
      {/* Top subtle accent for leaders */}
      {isLeader && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />
      )}
      {isVice && (
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
      )}

      {member.slug ? (
        <Link href={`/member/${member.slug}`} className="w-full">
          {cardContent}
        </Link>
      ) : (
        cardContent
      )}
    </motion.div>
  );
}

// --- Presidium Section ---

function PresidiumSection({
  members,
  matchesSearch,
}: {
  members: OrgMember[];
  matchesSearch: (m: OrgMember) => boolean;
}) {
  const filtered = members.filter(matchesSearch);
  if (filtered.length === 0) return null;

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
          Pengurus Harian Inti
        </h2>
        <div className="h-0.5 w-12 bg-accent-strong mx-auto mt-2 rounded-full" />
      </div>

      {/* Top leader: first member */}
      <div className="flex justify-center mb-5">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <MemberCard member={filtered[0]} />
        </div>
      </div>

      {/* Vice leaders */}
      {filtered.slice(1, 3).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5 max-w-2xl mx-auto">
          {filtered.slice(1, 3).map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}

      {/* Rest */}
      {filtered.slice(3).length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.slice(3).map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
    </section>
  );
}

// --- AdHoc Section ---

function AdHocSection({
  sections,
  matchesSearch,
}: {
  sections: OrgSection[];
  matchesSearch: (m: OrgMember) => boolean;
}) {
  const visible = sections.filter((sec) => sec.members.some(matchesSearch));
  if (visible.length === 0) return null;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
      {visible.map((sec) => {
        const filtered = sec.members.filter(matchesSearch);
        const [head, ...rest] = filtered;
        return (
          <div
            key={sec.deptName}
            className="bg-card border border-border p-6 sm:p-7 rounded-xl shadow-2xs relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-accent-strong" />

            <h3 className="font-display text-base sm:text-lg font-bold uppercase tracking-tight mb-5 text-center border-b border-border pb-3 text-foreground">
              {sec.deptName}
            </h3>

            <div className="space-y-4">
              {head && <MemberCard member={head} />}
              {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {rest.map((m) => (
                    <MemberCard key={m.id} member={m} />
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}

// --- Departemen Section ---

function getHierarchicalRows(deptName: string, members: OrgMember[]) {
  const name = deptName.toLowerCase();

  if (name.includes("kesekretariatan")) {
    const row1 = members.filter((m) => {
      const r = m.role.toLowerCase();
      return (
        r.includes("ketua") || r.includes("wakil") || r.includes("koordinator")
      );
    });
    const row2 = members.filter((m) => {
      const r = m.role.toLowerCase();
      return r.includes("anggota");
    });
    return [
      { title: "Koordinator & Wakil", members: row1 },
      { title: "Anggota", members: row2 },
    ].filter((r) => r.members.length > 0);
  }

  let bidang1Keywords: string[] = [];
  let bidang2Keywords: string[] = [];
  let bidang1Label = "Bidang 1";
  let bidang2Label = "Bidang 2";

  if (name.includes("informasi dan komunikasi") || name.includes("infokom")) {
    bidang1Keywords = ["hubungan masyarakat", "humas", "bidang 1", "bidang i"];
    bidang2Keywords = [
      "publikasi",
      "dokumentasi",
      "pubdok",
      "bidang 2",
      "bidang ii",
    ];
    bidang1Label = "Hubungan Masyarakat";
    bidang2Label = "Publikasi & Dokumentasi";
  } else if (
    name.includes("penelitian dan pengembangan") ||
    name.includes("litbang")
  ) {
    bidang1Keywords = ["pemberdayaan sdm", "sdm", "bidang 1", "bidang i"];
    bidang2Keywords = [
      "riset dan teknologi",
      "riset",
      "teknologi",
      "bidang 2",
      "bidang ii",
    ];
    bidang1Label = "Komisi Pemberdayaan SDM";
    bidang2Label = "Riset & Teknologi";
  } else if (name.includes("mekanik elektronika lapangan")) {
    bidang1Keywords = ["maintenance", "pemeliharaan", "bidang 1", "bidang i"];
    bidang2Keywords = ["produksi", "bidang 2", "bidang ii"];
    bidang1Label = "Maintenance";
    bidang2Label = "Produksi";
  }

  const checkBidang = (role: string, keywords: string[]) => {
    const r = role.toLowerCase();
    return keywords.some((k) => r.includes(k));
  };

  const row1: OrgMember[] = [];
  const row2: OrgMember[] = [];
  const row3: OrgMember[] = [];
  const row4: OrgMember[] = [];
  const row5: OrgMember[] = [];

  for (const m of members) {
    const r = m.role.toLowerCase();
    const isKoordinatorOrWakil =
      r.includes("koordinator") ||
      (r.includes("wakil") && !r.includes("bidang"));

    if (isKoordinatorOrWakil) {
      row1.push(m);
      continue;
    }

    const isLeader =
      r.includes("ketua") ||
      r.includes("kabid") ||
      r.includes("kepala") ||
      r.includes("wakil ketua bidang");

    if (isLeader) {
      if (checkBidang(m.role, bidang1Keywords)) {
        row2.push(m);
      } else if (checkBidang(m.role, bidang2Keywords)) {
        row4.push(m);
      } else {
        row2.push(m);
      }
    } else {
      if (checkBidang(m.role, bidang1Keywords)) {
        row3.push(m);
      } else if (checkBidang(m.role, bidang2Keywords)) {
        row5.push(m);
      } else {
        row3.push(m);
      }
    }
  }

  return [
    { title: "Koordinator & Wakil", members: row1 },
    { title: `Kabid ${bidang1Label}`, members: row2 },
    { title: `Anggota ${bidang1Label}`, members: row3 },
    { title: `Kabid ${bidang2Label}`, members: row4 },
    { title: `Anggota ${bidang2Label}`, members: row5 },
  ].filter((r) => r.members.length > 0);
}

function DepartemenSection({
  sections,
  matchesSearch,
  searchQuery,
}: {
  sections: OrgSection[];
  matchesSearch: (m: OrgMember) => boolean;
  searchQuery: string;
}) {
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});
  const toggleDept = (name: string) =>
    setOpenDepts((prev) => ({ ...prev, [name]: !prev[name] }));

  const visible = sections.filter((sec) => {
    if (!searchQuery) return true;
    const nameMatch = sec.deptName
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const membersMatch = sec.members.some(matchesSearch);
    return nameMatch || membersMatch;
  });

  if (visible.length === 0) return null;

  return (
    <section className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="font-display text-xl sm:text-2xl font-bold uppercase tracking-tight text-foreground">
          Departemen
        </h2>
        <div className="h-0.5 w-12 bg-primary mx-auto mt-2 rounded-full" />
      </div>

      {visible.map((dept) => {
        const isOpen = openDepts[dept.deptName] || !!searchQuery;

        return (
          <div
            key={dept.deptName}
            className="border border-border rounded-xl overflow-hidden bg-card shadow-2xs"
          >
            <button
              onClick={() => toggleDept(dept.deptName)}
              className="w-full flex items-center justify-between p-5 sm:p-6 bg-card hover:bg-secondary/60 transition-colors text-left min-h-[44px]"
            >
              <h3 className="font-display text-base sm:text-lg font-bold uppercase text-foreground">
                {dept.deptName}
              </h3>
              <div className="size-8 rounded-lg bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0">
                {isOpen ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </div>
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-border"
                >
                  <motion.div
                    className="p-6 sm:p-7 space-y-8 bg-secondary/30"
                    initial="hidden"
                    animate="visible"
                    variants={{
                      visible: {
                        transition: {
                          staggerChildren: 0.05,
                        },
                      },
                    }}
                  >
                    {getHierarchicalRows(
                      dept.deptName,
                      dept.members.filter(matchesSearch),
                    ).map((row, rowIdx) => (
                      <div key={rowIdx} className="space-y-3.5">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-accent-strong font-semibold bg-accent dark:bg-accent/20 px-2.5 py-0.5 rounded-md border border-border">
                            {row.title}
                          </span>
                          <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          {row.members.map((m) => (
                            <MemberCard key={m.id} member={m} />
                          ))}
                        </div>
                      </div>
                    ))}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </section>
  );
}

// --- Main Client Component ---

export default function KeanggotaanClient({
  sections,
}: {
  sections: OrgSection[];
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const matchesSearch = (member: OrgMember) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      member.name.toLowerCase().includes(q) ||
      member.role.toLowerCase().includes(q)
    );
  };

  const presidiumSections = sections.filter((s) => s.category === "presidium");
  const adhocSections = sections.filter((s) => s.category === "adhoc");
  const departemenSections = sections.filter(
    (s) => s.category === "departemen",
  );

  const presidiumMembers = presidiumSections.flatMap((s) => s.members);

  return (
    <div className="container mx-auto px-4 max-w-5xl pb-24">
      {/* Hero Section */}
      <section className="py-12 sm:py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-4"
        >
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-border bg-card/80 dark:bg-card/40 backdrop-blur-xs text-xs font-mono text-accent-strong shadow-2xs">
            <span className="size-2 rounded-full bg-accent-strong animate-pulse" />
            <span className="font-semibold uppercase tracking-wider">
              Struktur Organisasi
            </span>
          </div>

          <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold uppercase tracking-tight text-foreground leading-tight text-balance">
            Sinergi di Balik Inovasi
          </h1>

          <p className="font-body text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl mx-auto text-pretty">
            Talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan
            roda organisasi, riset, dan pengembangan teknologi robotika.
          </p>

          <div className="relative mt-6 max-w-md mx-auto">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Cari anggota atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-2.5 font-body text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-1 focus:ring-primary focus:outline-hidden transition-all shadow-2xs min-h-[42px]"
            />
          </div>
        </motion.div>
      </section>

      <div className="space-y-14 sm:space-y-16">
        {/* Pengurus Harian Inti */}
        <PresidiumSection
          members={presidiumMembers}
          matchesSearch={matchesSearch}
        />

        {/* Ad-Hoc (Komdis, Oprec, dll) */}
        <AdHocSection sections={adhocSections} matchesSearch={matchesSearch} />

        {/* Departemen */}
        <DepartemenSection
          sections={departemenSections}
          matchesSearch={matchesSearch}
          searchQuery={searchQuery}
        />

        {/* Empty state */}
        {searchQuery &&
          presidiumMembers.filter(matchesSearch).length === 0 &&
          adhocSections.every((s) =>
            s.members.every((m) => !matchesSearch(m)),
          ) &&
          departemenSections.every((s) =>
            s.members.every((m) => !matchesSearch(m)),
          ) && (
            <div className="text-center py-16 bg-card border border-border rounded-xl p-8 shadow-2xs">
              <Users className="size-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="font-body text-sm sm:text-base text-muted-foreground">
                Tidak ditemukan anggota untuk
              </p>
              <p className="font-display font-bold text-foreground text-lg mt-1">
                &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
