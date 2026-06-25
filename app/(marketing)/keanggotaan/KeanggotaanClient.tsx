"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronDown, ChevronUp } from "lucide-react";

type Member = {
  id: string;
  name: string;
  role: string;
  level: "Ketua" | "Wakil" | "Anggota" | "Koordinator";
};

type Department = {
  name: string;
  coordinator?: Member;
  viceCoordinator?: Member;
  divisions: {
    name: string;
    head?: Member;
    members: Member[];
  }[];
};

// Hardcoded mock data based on keanggotaan.md specs
const INTI_PRESIDIUM = [
  { id: "1", name: "Ahmad Rizky", role: "Ketua Umum", level: "Ketua" },
  { id: "2", name: "Budi Santoso", role: "Wakil Ketua Umum 1", level: "Wakil" },
  { id: "3", name: "Citra Kirana", role: "Wakil Ketua Umum 2", level: "Wakil" },
  { id: "4", name: "Dina Fitri", role: "Sekretaris 1", level: "Anggota" },
  { id: "5", name: "Eko Pratama", role: "Sekretaris 2", level: "Anggota" },
  { id: "6", name: "Fajar Maulana", role: "Bendahara 1", level: "Anggota" },
  { id: "7", name: "Gita Savitri", role: "Bendahara 2", level: "Anggota" },
] as Member[];

const ADHOC = {
  komdis: {
    head: { id: "8", name: "Hendra Wijaya", role: "Ketua Komisi Disiplin", level: "Ketua" },
    members: [
      { id: "9", name: "Irfan Hakim", role: "Anggota Komdis", level: "Anggota" },
      { id: "10", name: "Joko Anwar", role: "Anggota Komdis", level: "Anggota" },
    ]
  },
  oprec: {
    head: { id: "11", name: "Kevin Julio", role: "Ketua Pelaksana Oprec", level: "Ketua" },
    members: [
      { id: "12", name: "Luna Maya", role: "Sekretaris Oprec", level: "Anggota" },
      { id: "13", name: "Maudy Ayunda", role: "Bendahara Oprec", level: "Anggota" },
    ]
  }
};

const DEPARTMENTS: Department[] = [
  {
    name: "Kesekretariatan",
    coordinator: { id: "14", name: "Nina Zatulini", role: "Ketua Departemen Kesekretariatan", level: "Ketua" },
    viceCoordinator: { id: "15", name: "Oka Antara", role: "Wakil Departemen Kesekretariatan", level: "Wakil" },
    divisions: [
      {
        name: "Anggota Departemen Kesekretariatan",
        members: [
          { id: "16", name: "Putri Titian", role: "Anggota", level: "Anggota" },
          { id: "17", name: "Qory Sandioriva", role: "Anggota", level: "Anggota" },
        ]
      }
    ]
  },
  {
    name: "Informasi dan Komunikasi (Infokom)",
    coordinator: { id: "18", name: "Raffi Ahmad", role: "Koordinator Infokom", level: "Koordinator" },
    viceCoordinator: { id: "19", name: "Syahrini", role: "Wakil Koordinator Infokom", level: "Wakil" },
    divisions: [
      {
        name: "Hubungan Masyarakat",
        head: { id: "20", name: "Tara Basro", role: "Ketua Bidang Humas", level: "Ketua" },
        members: [
          { id: "21", name: "Ucok Baba", role: "Anggota Humas", level: "Anggota" },
        ]
      },
      {
        name: "Publikasi dan Dokumentasi",
        head: { id: "22", name: "Vino G. Bastian", role: "Ketua Bidang Pubdok", level: "Ketua" },
        members: [
          { id: "23", name: "Wulan Guritno", role: "Anggota Pubdok", level: "Anggota" },
        ]
      }
    ]
  },
  {
    name: "Penelitian dan Pengembangan (Litbang)",
    coordinator: { id: "24", name: "Xavier", role: "Koordinator Litbang", level: "Koordinator" },
    viceCoordinator: { id: "25", name: "Yayan Ruhian", role: "Wakil Koordinator Litbang", level: "Wakil" },
    divisions: [
      {
        name: "Komisi Pemberdayaan SDM",
        head: { id: "26", name: "Zaskia Adya Mecca", role: "Ketua Bidang SDM", level: "Ketua" },
        members: [
          { id: "27", name: "Afgan Syahreza", role: "Anggota SDM", level: "Anggota" },
        ]
      },
      {
        name: "Riset dan Teknologi",
        head: { id: "28", name: "Bunga Citra Lestari", role: "Ketua Bidang Ristek", level: "Ketua" },
        members: [
          { id: "29", name: "Chelsea Islan", role: "Anggota Ristek", level: "Anggota" },
        ]
      }
    ]
  },
  {
    name: "Mekanik Elektronika Lapangan",
    coordinator: { id: "30", name: "Deddy Corbuzier", role: "Koordinator Mekanik", level: "Koordinator" },
    viceCoordinator: { id: "31", name: "Ernest Prakasa", role: "Wakil Koordinator Mekanik", level: "Wakil" },
    divisions: [
      {
        name: "Maintenance",
        head: { id: "32", name: "Fedi Nuril", role: "Ketua Bidang Maintenance", level: "Ketua" },
        members: [
          { id: "33", name: "Gading Marten", role: "Anggota Maintenance", level: "Anggota" },
        ]
      },
      {
        name: "Produksi",
        head: { id: "34", name: "Hesti Purwadinata", role: "Ketua Bidang Produksi", level: "Ketua" },
        members: [
          { id: "35", name: "Indro Warkop", role: "Anggota Produksi", level: "Anggota" },
        ]
      }
    ]
  }
];

function MemberCard({ member }: { member: Member }) {
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
        <div className="w-12 h-12 rounded-none bg-canvas-dark border border-hairline-dark flex items-center justify-center flex-shrink-0">
          <span className="font-jetbrains text-muted-foreground text-sm uppercase">
            {member.name.charAt(0)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-body-md font-bold text-foreground truncate">{member.name}</h4>
          <p className="text-xs font-jetbrains text-muted-foreground truncate">{member.role}</p>
        </div>
      </div>
      {(isLeader || isVice) && (
        <div className="absolute -top-3 -right-2">
          <span className={`px-2 py-0.5 text-[10px] font-jetbrains uppercase rounded-sm ${
            isLeader ? "bg-cyber-blue text-white" : "bg-tech-navy/20 text-cyber-blue border border-tech-navy/30"
          }`}>
            {member.level}
          </span>
        </div>
      )}
    </motion.div>
  );
}

export default function KeanggotaanClient() {
  const [searchQuery, setSearchQuery] = useState("");
  const [openDepts, setOpenDepts] = useState<Record<string, boolean>>({});

  const toggleDept = (deptName: string) => {
    setOpenDepts(prev => ({ ...prev, [deptName]: !prev[deptName] }));
  };

  const matchesSearch = (member: Member) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return member.name.toLowerCase().includes(query) || member.role.toLowerCase().includes(query);
  };

  const filteredInti = INTI_PRESIDIUM.filter(matchesSearch);

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
            Talenta-talenta berbakat Politeknik Negeri Padang yang menggerakkan roda organisasi, riset, dan pengembangan teknologi robotika.
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
        {/* Pengurus Inti */}
        {filteredInti.length > 0 && (
          <section>
            <h2 className="text-display-md font-bold text-center mb-8 uppercase text-foreground">Pengurus Harian Inti</h2>
            <div className="flex justify-center mb-6">
              {filteredInti.slice(0,1).map(member => (
                <div key={member.id} className="w-full md:w-1/2 lg:w-1/3">
                  <MemberCard member={member} />
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6 max-w-2xl mx-auto">
              {filteredInti.slice(1,3).map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {filteredInti.slice(3).map(member => (
                <MemberCard key={member.id} member={member} />
              ))}
            </div>
          </section>
        )}

        {/* AdHoc Section */}
        {(!searchQuery || matchesSearch(ADHOC.komdis.head as Member) || ADHOC.komdis.members.some(m => matchesSearch(m as Member))) && (
           <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="bg-surface-card-dark/30 border border-hairline-dark p-6 rounded-sm">
                <h3 className="text-display-sm font-bold uppercase mb-6 text-center border-b border-hairline-dark pb-4 text-crimson-red/80">Komisi Disiplin</h3>
                <div className="space-y-4">
                  <MemberCard member={ADHOC.komdis.head as Member} />
                  <div className="grid grid-cols-2 gap-4">
                    {ADHOC.komdis.members.map(m => <MemberCard key={m.id} member={m as Member} />)}
                  </div>
                </div>
             </div>
             <div className="bg-surface-card-dark/30 border border-hairline-dark p-6 rounded-sm">
                <h3 className="text-display-sm font-bold uppercase mb-6 text-center border-b border-hairline-dark pb-4 text-cyber-blue/80">Open Recruitment</h3>
                <div className="space-y-4">
                  <MemberCard member={ADHOC.oprec.head as Member} />
                  <div className="grid grid-cols-2 gap-4">
                    {ADHOC.oprec.members.map(m => <MemberCard key={m.id} member={m as Member} />)}
                  </div>
                </div>
             </div>
           </section>
        )}

        {/* Departemen */}
        <section className="space-y-6">
          <h2 className="text-display-md font-bold text-center mb-8 uppercase text-foreground">Departemen</h2>

          {DEPARTMENTS.map((dept) => {
            const isMatch = !searchQuery ||
              dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              (dept.coordinator && matchesSearch(dept.coordinator)) ||
              (dept.viceCoordinator && matchesSearch(dept.viceCoordinator)) ||
              dept.divisions.some(div =>
                div.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (div.head && matchesSearch(div.head)) ||
                div.members.some(matchesSearch)
              );

            if (!isMatch) return null;

            const isOpen = openDepts[dept.name] || !!searchQuery;

            return (
              <div key={dept.name} className="border border-hairline-dark rounded-sm overflow-hidden bg-surface-card-dark">
                <button
                  onClick={() => toggleDept(dept.name)}
                  className="w-full flex items-center justify-between p-6 bg-canvas-dark hover:bg-surface-card-dark transition-colors text-left"
                >
                  <h3 className="text-display-sm font-bold uppercase text-cyber-blue">{dept.name}</h3>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
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
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {dept.coordinator && <MemberCard member={dept.coordinator} />}
                          {dept.viceCoordinator && <MemberCard member={dept.viceCoordinator} />}
                        </div>

                        {dept.divisions.map((div, i) => (
                          <motion.div
                            key={div.name}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="space-y-4"
                          >
                            <h4 className="font-jetbrains text-mono-eyebrow text-muted-foreground uppercase">{div.name}</h4>
                            {div.head && (
                              <div className="w-full md:w-1/2">
                                <MemberCard member={div.head} />
                              </div>
                            )}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {div.members.map((m) => (
                                <MemberCard key={m.id} member={m} />
                              ))}
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </section>

      </div>
    </div>
  );
}
