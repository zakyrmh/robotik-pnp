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
   *   "departemen" → Departemen (with nested divisions)
   */
  category: "presidium" | "adhoc" | "departemen";
  deptName: string;
  members: OrgMember[];
  divisions?: { divName: string; members: OrgMember[] }[];
};

// --- Sub-components ---

function MemberCard({ member }: { member: OrgMember }) {
  const isLeader = member.level === "Ketua" || member.level === "Koordinator";
  const isVice = member.level === "Wakil";

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className={`relative p-4 rounded-sm border bg-surface-card-dark transition-all duration-300 ${
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
      {(isLeader || isVice) && (
        <div className="absolute -top-3 -right-2">
          <span
            className={`px-2 py-0.5 text-[10px] font-jetbrains uppercase rounded-sm ${
              isLeader
                ? "bg-cyber-blue text-white"
                : "bg-tech-navy/20 text-cyber-blue border border-tech-navy/30"
            }`}
          >
            {member.level}
          </span>
        </div>
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
    const divsMatch = (sec.divisions ?? []).some(
      (d) =>
        d.divName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        d.members.some(matchesSearch),
    );
    return nameMatch || membersMatch || divsMatch;
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
                  <div className="p-6 space-y-8">
                    {/* Dept-level members (coordinator / vice) */}
                    {dept.members.filter(matchesSearch).length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dept.members.filter(matchesSearch).map((m) => (
                          <MemberCard key={m.id} member={m} />
                        ))}
                      </div>
                    )}

                    {/* Divisions */}
                    {(dept.divisions ?? []).map((div, i) => {
                      const divMembers = div.members.filter(matchesSearch);
                      if (searchQuery && divMembers.length === 0) return null;
                      const [head, ...rest] = divMembers;

                      return (
                        <motion.div
                          key={div.divName}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="space-y-4"
                        >
                          <h4 className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">
                            {div.divName}
                          </h4>
                          {head && head.level !== "Anggota" && (
                            <div className="w-full md:w-1/2">
                              <MemberCard member={head} />
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {(head?.level !== "Anggota"
                              ? rest
                              : divMembers
                            ).map((m) => (
                              <MemberCard key={m.id} member={m} />
                            ))}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
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
          departemenSections.every(
            (s) =>
              s.members.every((m) => !matchesSearch(m)) &&
              (s.divisions ?? []).every((d) =>
                d.members.every((m) => !matchesSearch(m)),
              ),
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
