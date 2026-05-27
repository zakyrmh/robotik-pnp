"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { generateGroupsAlgorithmic } from "@/lib/actions/groups";

// Custom SVG Icons
const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-indigo-400">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.109A11.386 11.386 0 0 1 10.089 18H8.25c-.242 0-.48-.02-.709-.057m10.089-12.783a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm-5 11.5a19.17 19.17 0 0 0 6 0M4 19.235A10.114 10.114 0 0 0 7.25 19.5c.896 0 1.761-.116 2.584-.335m-8.134-2.73a4.125 4.125 0 0 1 7.533-2.493M3 16.25c-.29 0-.573-.027-.85-.078m10.089-11.62a5.002 5.002 0 0 0-9.288 0M7 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
  </svg>
);

const ChartBarIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
  </svg>
);

const ShuffleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12c0-1.232-.046-2.453-.138-3.662a4.006 4.006 0 0 0-3.7-3.7 48.656 48.656 0 0 0-7.324 0 4.006 4.006 0 0 0-3.7 3.7c-.017.22-.032.441-.046.662M19.5 12l3-3m-3 3-3-3M3 12a48.73 48.73 0 0 0 16.5 4.5M3 12c0 1.232.046 2.453.138 3.662a4.006 4.006 0 0 0 3.7 3.7 48.656 48.656 0 0 0 7.324 0 4.006 4.006 0 0 0 3.7-3.7c.017-.22.032-.441.046-.662M3 12l3 3M3 12l-3 3" />
  </svg>
);

interface GroupsClientProps {
  caangCount: number;
  initialGroups: {
    id: string;
    name: string;
    members: {
      profile_id: string;
      nim: string;
      name: string;
    }[];
  }[];
}

export function GroupsClient({ caangCount, initialGroups }: GroupsClientProps) {
  const router = useRouter();
  const [totalGroups, setTotalGroups] = useState<number>(4);
  const [strategy, setStrategy] = useState<"random" | "score">("score");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (caangCount === 0) {
      toast.error("Tidak ada Caang aktif untuk dibagikan.");
      return;
    }

    if (totalGroups > caangCount) {
      toast.error(`Jumlah kelompok tidak boleh melebihi jumlah Caang (${caangCount}).`);
      return;
    }

    setIsGenerating(true);
    const loadToast = toast.loading("Membagi kelompok Caang...");

    try {
      const res = await generateGroupsAlgorithmic(totalGroups, strategy);
      toast.dismiss(loadToast);

      if (res.success) {
        toast.success(res.message);
        router.refresh();
      } else {
        toast.error(res.message || "Gagal memproses pembagian.");
      }
    } catch (err: unknown) {
      toast.dismiss(loadToast);
      const errMsg = err instanceof Error ? err.message : String(err);
      toast.error("Terjadi kesalahan jaringan: " + errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
        <div>
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Pembagian Kelompok Caang
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gunakan algoritma semi-queue tiering berbasis skor akumulatif atau pembagian acak.
          </p>
        </div>
        <Badge className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 text-xs flex items-center gap-1">
          <UsersIcon />
          <span>{caangCount} Calon Anggota</span>
        </Badge>
      </div>

      <div className="grid gap-6 lg:grid-cols-4 items-start">
        {/* Left Side: Controls Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-xl">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-slate-300">Konfigurasi Algoritma</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Group Count Slider */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Label htmlFor="total-groups" className="text-slate-300">Jumlah Kelompok</Label>
                  <span className="font-mono text-indigo-400 font-bold text-sm bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    {totalGroups}
                  </span>
                </div>
                <input
                  id="total-groups"
                  type="range"
                  min={1}
                  max={Math.max(1, Math.min(20, caangCount))}
                  value={totalGroups}
                  onChange={(e) => setTotalGroups(parseInt(e.target.value))}
                  disabled={isGenerating || caangCount === 0}
                  className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground">
                  <span>1</span>
                  <span>{Math.max(1, Math.min(20, caangCount))}</span>
                </div>
              </div>

              {/* Strategy selector */}
              <div className="space-y-3">
                <Label className="text-xs text-slate-300">Strategi Distribusi</Label>
                <div className="space-y-2">
                  {/* Strategy Option: Score */}
                  <button
                    type="button"
                    onClick={() => setStrategy("score")}
                    disabled={isGenerating}
                    className={`w-full p-3 rounded-xl border text-left flex gap-3 transition-all ${
                      strategy === "score"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-transparent text-slate-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${strategy === "score" ? "bg-indigo-500/20" : "bg-white/5"}`}>
                      <ChartBarIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Skor Akumulatif</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        Semi-queue tiering. Membagi rata Caang berprestasi & caang ber-nilai rendah ke setiap kelompok.
                      </p>
                    </div>
                  </button>

                  {/* Strategy Option: Random */}
                  <button
                    type="button"
                    onClick={() => setStrategy("random")}
                    disabled={isGenerating}
                    className={`w-full p-3 rounded-xl border text-left flex gap-3 transition-all ${
                      strategy === "random"
                        ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/30"
                        : "bg-transparent text-slate-400 border-white/5 hover:bg-white/5"
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${strategy === "random" ? "bg-indigo-500/20" : "bg-white/5"}`}>
                      <ShuffleIcon />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold">Acak (Random)</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">
                        Mengacak seluruh Caang menggunakan Fisher-Yates shuffle lalu membaginya secara rata.
                      </p>
                    </div>
                  </button>
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-black/10 border-t border-white/5 py-4">
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || caangCount === 0}
                className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium shadow-lg hover:shadow-indigo-500/20 py-5 rounded-xl transition-all"
              >
                {isGenerating ? "Memproses..." : "Bagi Kelompok"}
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Right Side: Results Display */}
        <div className="lg:col-span-3">
          {initialGroups.length === 0 ? (
            <Card className="border border-dashed border-white/10 bg-white/5 backdrop-blur-md rounded-2xl p-12 text-center">
              <CardContent className="space-y-3 pt-6">
                <div className="inline-flex p-4 rounded-full bg-white/5 text-muted-foreground">
                  <UsersIcon />
                </div>
                <h3 className="font-semibold text-foreground text-lg">Belum Ada Kelompok Terbentuk</h3>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                  Kelompok Caang belum dibagikan. Tentukan jumlah kelompok di sisi kiri lalu klik tombol &quot;Bagi Kelompok&quot;.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <AnimatePresence mode="popLayout">
                {initialGroups.map((group, idx) => (
                  <motion.div
                    key={group.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3, delay: idx * 0.05 }}
                  >
                    <Card className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl overflow-hidden shadow-lg group">
                      <CardHeader className="pb-3 flex flex-row items-center justify-between">
                        <CardTitle className="text-base font-bold text-slate-100 group-hover:text-indigo-400 transition-colors">
                          {group.name}
                        </CardTitle>
                        <Badge className="bg-white/5 text-slate-300 border border-white/10 text-[10px]">
                          {group.members.length} Caang
                        </Badge>
                      </CardHeader>
                      <CardContent className="pb-4 pt-1">
                        <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                          {group.members.length === 0 ? (
                            <p className="text-xs text-muted-foreground py-4 text-center">Kelompok kosong.</p>
                          ) : (
                            group.members.map((member) => (
                              <div
                                key={member.profile_id}
                                className="p-2 rounded-xl bg-black/15 border border-white/5 hover:border-white/10 transition-colors flex justify-between items-center text-xs"
                              >
                                <span className="font-medium text-foreground truncate max-w-[170px]" title={member.name}>
                                  {member.name}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-mono bg-white/5 px-1.5 py-0.5 rounded border border-white/5">
                                  {member.nim || "NIM -"}
                                </span>
                              </div>
                            ))
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
