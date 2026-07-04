"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

// --- Shared types (exported for use in page.tsx) ---
export type OrgMember = {
  id: string;
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

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`p-4 rounded-sm border bg-surface-card-dark transition-all duration-300 ${
        isLeader
          ? "border-cyber-blue shadow-[0_0_12px_rgba(0,102,177,0.15)]"
          : isVice
            ? "border-tech-navy/50"
            : "border-hairline-dark hover:border-hairline-light"
      }`}
    >
      <div className="flex items-center gap-4">
        {member.avatarUrl ? (
          <img
            src={member.avatarUrl}
            alt={member.name}
            className="w-12 h-12 rounded-none object-cover shrink-0 border border-hairline-dark"
          />
        ) : (
          <div className="w-12 h-12 rounded-none bg-canvas-dark border border-hairline-dark flex items-center justify-center shrink-0">
            <span className="font-jetbrains text-muted-foreground text-sm uppercase">
              {member.name.charAt(0)}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h4 className="text-body-md font-bold text-foreground truncate">
            {member.name}
          </h4>
          <p className="text-xs font-jetbrains text-muted-foreground truncate">
            {member.role}
          </p>
        </div>
      </div>
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
      <h2 className="text-display-md font-bold text-center mb-8 uppercase text-foreground">
        Pengurus Harian Inti
      </h2>
      {/* Top leader: first member */}
      <div className="flex justify-center mb-6">
        <div className="w-full md:w-1/2 lg:w-1/3">
          <MemberCard member={filtered[0]} />
        </div>
      </div>
      {/* Vice leaders */}
      {filtered.slice(1, 3).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
          {filtered.slice(1, 3).map((m) => (
            <MemberCard key={m.id} member={m} />
          ))}
        </div>
      )}
      {/* Rest */}
      {filtered.slice(3).length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
  // Each adhoc section is one "box" (e.g. Komdis, Oprec)
  const visible = sections.filter((sec) => sec.members.some(matchesSearch));
  if (visible.length === 0) return null;

  const accentClass: Record<string, string> = {
    komdis: "text-crimson-red/80",
    oprec: "text-cyber-blue/80",
  };

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {visible.map((sec) => {
        const subKey = sec.members[0]?.subSection?.toLowerCase() ?? "";
        const filtered = sec.members.filter(matchesSearch);
        const [head, ...rest] = filtered;
        return (
          <div
            key={sec.deptName}
            className="bg-surface-card-dark/30 border border-hairline-dark p-6 rounded-sm"
          >
            <h3
              className={`text-display-sm font-bold uppercase mb-6 text-center border-b border-hairline-dark pb-4 ${
                accentClass[subKey] ?? "text-muted-foreground"
              }`}
            >
              {sec.deptName}
            </h3>
            <div className="space-y-4">
              {head && <MemberCard member={head} />}
              {rest.length > 0 && (
                <div className="grid grid-cols-2 gap-4">
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

  // Other 3 departments: 'Informasi dan Komunikasi', 'Penelitian dan Pengembangan', 'Mekanik Elektronika Lapangan'
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
      <h2 className="text-display-md font-bold text-center mb-8 uppercase text-foreground">
        Departemen
      </h2>
      {visible.map((dept) => {
        const isOpen = openDepts[dept.deptName] || !!searchQuery;

        return (
          <div
            key={dept.deptName}
            className="border border-hairline-dark rounded-sm overflow-hidden bg-surface-card-dark"
          >
            <button
              onClick={() => toggleDept(dept.deptName)}
              className="w-full flex items-center justify-between p-6 bg-canvas-dark hover:bg-surface-card-dark transition-colors text-left"
            >
              <h3 className="text-display-sm font-bold uppercase text-cyber-blue">
                {dept.deptName}
              </h3>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden border-t border-hairline-dark"
                >
                  <motion.div
                    className="p-6 space-y-8"
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
                      <div key={rowIdx} className="space-y-4">
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-jetbrains uppercase tracking-wider text-cyber-blue font-semibold bg-cyber-blue/10 px-2 py-0.5 rounded-sm">
                            {row.title}
                          </span>
                          <div className="h-[1px] flex-1 bg-hairline-dark/40" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

  // Flatten presidium members from all presidium dept entries
  const presidiumMembers = presidiumSections.flatMap((s) => s.members);

  return (
    <div className="container mx-auto px-4 max-w-5xl pb-24">
      {/* Hero Section */}
      <section className="py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <span className="inline-block px-3 py-1 bg-cyber-blue/10 text-cyber-blue font-jetbrains text-mono-eyebrow rounded-sm uppercase tracking-wider">
            Struktur Organisasi
          </span>
          <h1 className="text-display-lg md:text-display-xl font-bold uppercase tracking-tight text-foreground leading-tight">
            Sinergi di Balik Inovasi
          </h1>
          <p className="text-body-md text-muted-foreground">
            Talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan
            roda organisasi, riset, dan pengembangan teknologi robotika.
          </p>

          <div className="relative mt-8 max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Cari anggota atau jabatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-card-dark border border-hairline-dark rounded-none pl-10 pr-4 py-3 font-jetbrains text-sm focus:border-cyber-blue focus:outline-none transition-colors"
            />
          </div>
        </motion.div>
      </section>

      <div className="space-y-16">
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
            <div className="text-center py-20 text-muted-foreground font-jetbrains">
              <p className="text-lg">Tidak ditemukan anggota untuk</p>
              <p className="text-cyber-blue mt-1">
                &ldquo;{searchQuery}&rdquo;
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
