"use client";

import React from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Settings,
  Zap,
  Cpu,
  Trophy,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Komponen Stat Card
const StatCard = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center md:items-start">
    <span className="text-4xl md:text-6xl font-black text-zinc-900 dark:text-white transition-colors">
      {value}
    </span>
    <span className="text-[10px] tracking-[0.3em] text-zinc-500 dark:text-zinc-400 uppercase mt-2 font-bold">
      {label}
    </span>
  </div>
);

export default function HomePage() {
  const divisions = [
    {
      title: "KRAI",
      icon: <Settings size={20} />,
      desc: "Fokus pada efisiensi mekanik dan sinkronisasi antar robot untuk misi kompleks.",
    },
    {
      title: "KRSBI-B",
      icon: <Zap size={20} />,
      desc: "Pengembangan robot sepak bola beroda dengan strategi multi-agent system.",
    },
    {
      title: "KRSBI-H",
      icon: <Cpu size={20} />,
      desc: "Riset keseimbangan dinamis dan visi komputer untuk robot humanoid.",
    },
    {
      title: "KRSTI",
      icon: <Trophy size={20} />,
      desc: "Harmonisasi teknologi robotika dengan estetika seni budaya melalui gerakan presisi.",
    },
    {
      title: "KRSRI",
      icon: <Settings size={20} />,
      desc: "Navigasi medan sulit dalam simulasi misi penyelamatan (Search and Rescue).",
    },
  ];

  return (
    <div className="relative min-h-screen transition-colors duration-500">
      {/* Background Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[40px_40px] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)]" />

      {/* --- HERO SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-16 md:pt-32 pb-20 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-flex items-center gap-2 py-1 px-3 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 text-[10px] font-bold tracking-widest uppercase mb-8">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Est. 2005 - UKM Robotik PNP
          </div>

          <h1 className="text-5xl md:text-8xl font-black tracking-tighter leading-[0.9] text-zinc-900 dark:text-white">
            Eksplorasi <br />
            <span className="text-blue-600 dark:text-blue-500">
              Tanpa Batas
            </span>
            , <br />
            Inovasi Tanpa Henti.
          </h1>

          <p className="mt-10 text-zinc-600 dark:text-zinc-400 max-w-lg text-lg leading-relaxed">
            Pusat riset dan kreativitas teknologi di Politeknik Negeri Padang.
            Kami mengubah kompleksitas menjadi solusi robotika yang presisi.
          </p>

          <div className="mt-12 flex flex-wrap gap-5">
            <Button
              size="lg"
              className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600 px-10 rounded-none font-bold tracking-widest h-14 transition-all hover:gap-4"
            >
              JELAJAHI DIVISI <ArrowRight size={20} />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-zinc-300 dark:border-zinc-800 rounded-none px-10 h-14 font-bold tracking-widest hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              GABUNG SEKARANG
            </Button>
          </div>
        </motion.div>

        {/* Abstract Robot Visual Placeholder */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          className="relative aspect-4/5 bg-zinc-100 dark:bg-zinc-900/50 border border-zinc-200 dark:border-white/5 backdrop-blur-sm overflow-hidden group"
        >
          {/* Layer Efek Cahaya di belakang gambar */}
          <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 bg-[radial-gradient(circle_at_center,#2563eb_0,transparent_70%)]" />

          {/* Render Image dari folder public/ */}
          <Image
            src="/images/humanoid-robotic.webp" // Path langsung ke folder public
            alt="UKM Robotik PNP Visual"
            fill // Mengisi container aspect-[4/5]
            className="object-cover object-center transition-transform duration-700 group-hover:scale-105 z-10"
            priority // Mempercepat loading karena ini elemen di atas (above the fold)
          />

          {/* Overlay Gradient agar teks di bawah tetap terbaca jika gambar terang */}
          <div className="absolute inset-0 bg-linear-to-t from-zinc-900/60 via-transparent to-transparent z-20 opacity-0 group-hover:opacity-100 transition-opacity" />

          {/* Label Info */}
          {/* <div className="absolute bottom-8 right-8 text-right z-30">
            <span className="text-[10px] font-black tracking-[0.4em] text-zinc-400 dark:text-zinc-300 uppercase drop-shadow-md">
              System Architecture
            </span>
            <p className="text-xs font-bold text-white drop-shadow-md">
              PNP_BOT_V4.0.1
            </p>
          </div> */}
        </motion.div>
      </section>

      {/* --- STATS SECTION --- */}
      <section className="relative z-10 border-y border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-950 py-16 transition-colors">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
          <StatCard label="Anggota Aktif" value="60+" />
          <StatCard label="Penghargaan Nasional" value="20+" />
          <StatCard label="Tahun Berdiri" value="2005" />
        </div>
      </section>

      {/* --- DIVISI SECTION --- */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 py-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 gap-6">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight text-zinc-900 dark:text-white">
              Divisi KRI
            </h2>
            <p className="text-zinc-500 mt-4 text-lg">
              Spesialisasi teknis yang berkompetisi di ajang Kontes Robot
              Indonesia.
            </p>
          </div>
          <button className="group flex items-center gap-2 text-blue-600 dark:text-blue-400 font-black tracking-[0.2em] text-xs uppercase transition-all">
            Lihat Detail{" "}
            <ChevronRight
              size={16}
              className="group-hover:translate-x-1 transition-transform"
            />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {divisions.map((div) => (
            <motion.div
              key={div.title}
              whileHover={{ y: -5 }}
              className="p-8 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/5 flex flex-col h-full group transition-all hover:border-blue-500/50"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-blue-600 dark:text-blue-400 mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
                {div.icon}
              </div>
              <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">
                {div.title}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed mb-8 grow">
                {div.desc}
              </p>
              <div className="h-[2px] w-8 bg-orange-500 transition-all group-hover:w-full" />
            </motion.div>
          ))}
        </div>
      </section>

      {/* --- IDENTITAS SISTEM SECTION --- */}
      <section className="relative z-10 bg-zinc-50 dark:bg-zinc-950/50 py-32 border-t border-zinc-200 dark:border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
          <div>
            <span className="text-xs font-black tracking-[0.4em] text-blue-600 dark:text-blue-400 uppercase">
              Core Competency
            </span>
            <h2 className="text-5xl md:text-6xl font-black mt-6 mb-8 text-zinc-900 dark:text-white leading-[1.1]">
              Inovasi Berbasis <br /> Presisi
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 text-lg leading-relaxed mb-10">
              Setiap robot di UKM Robotik PNP dibangun atas tiga pilar utama
              disiplin rekayasa yang terintegrasi secara modular.
            </p>
            <Link
              href="/about"
              className="inline-flex items-center gap-4 text-sm font-black tracking-widest uppercase group text-zinc-900 dark:text-white"
            >
              Pelajari Struktur{" "}
              <div className="h-[2px] w-12 bg-blue-600 group-hover:w-20 transition-all" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {["MECHANICAL", "ELECTRICAL", "PROGRAMMING"].map((pilar, idx) => (
              <div
                key={pilar}
                className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 p-10 flex justify-between items-center group hover:bg-blue-600 transition-all duration-500"
              >
                <div>
                  <span className="text-[10px] text-zinc-400 group-hover:text-blue-200 font-bold tracking-widest">
                    PILAR 0{idx + 1}
                  </span>
                  <h4 className="font-black text-2xl text-zinc-900 dark:text-white group-hover:text-white transition-colors">
                    {pilar}
                  </h4>
                </div>
                <ChevronRight
                  className="text-zinc-300 dark:text-zinc-800 group-hover:text-white group-hover:translate-x-2 transition-all"
                  size={32}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
