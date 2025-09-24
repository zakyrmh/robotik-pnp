"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

// Timeline Data
const timeline = [
  { step: 1, title: "Pendaftaran Dibuka", date: "September" },
  { step: 2, title: "Demo Robot", date: "September" },
  { step: 3, title: "Pelatihan", date: "September" },
];

// Tim KRI
const teams = [
  { name: "KRAI", desc: "Kontes Robot ABU Indonesia" },
  { name: "KRSBI-B", desc: "Kontes Robot Sepak Bola Indonesia - Beroda" },
  { name: "KRSBI-H", desc: "Kontes Robot Sepak Bola Indonesia - Humanoid" },
  { name: "KRSRI", desc: "Kontes Robot SAR Indonesia" },
  { name: "KRSTI", desc: "Kontes Robot Seni Tari Indonesia" },
];

export default function Home() {
  return (
    <main className="flex flex-col items-center">
      {/* Hero Section */}
      <section
        id="home"
        className="w-full min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-slate-900 text-center px-4 transition-colors"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6 transition-colors"
        >
          Selamat Datang di <span className="text-slate-600 dark:text-slate-300">UKM Robotik</span>
        </motion.h1>
        <p className="text-lg md:text-xl text-slate-700 dark:text-slate-300 max-w-2xl mb-6 transition-colors">
          Wadah bagi mahasiswa Politeknik Negeri Padang untuk mengembangkan
          minat, bakat, dan kreativitas di bidang robotika.
        </p>
        <Link
          href="/caang/register"
          className="bg-slate-800 dark:bg-slate-700 text-white px-6 py-3 rounded-lg hover:bg-slate-700 dark:hover:bg-slate-600 transition-colors"
        >
          Gabung Sekarang
        </Link>
      </section>

      {/* Ketua Umum */}
      <section id="ketua" className="w-full py-20 bg-white dark:bg-slate-800 px-6 transition-colors">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Image
            src="/images/ketua_umum.jpg"
            alt="Ketua Umum UKM Robotik"
            width={400}
            height={400}
            className="rounded-2xl object-contain shadow-md dark:shadow-slate-700"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white transition-colors">
              Ketua Umum
            </h2>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2 transition-colors">
              Nama: M. Fadhil Muzaffar Guci
            </p>
            <p className="text-lg text-slate-700 dark:text-slate-300 mb-2 transition-colors">
              Prodi: D4 Teknik Elektronika &apos;23
            </p>
            {/* <p className="text-lg text-slate-700 dark:text-slate-300 transition-colors">
              Visi: Membawa UKM Robotik menjadi pusat inovasi teknologi dan
              juara kompetisi robotik nasional.
            </p> */}
          </div>
        </div>
      </section>

      {/* Video Perkenalan */}
      <section id="video" className="w-full py-20 bg-slate-50 dark:bg-slate-900 px-6 text-center transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 transition-colors">
          Video Perkenalan
        </h2>
        <div className="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-md dark:shadow-slate-700">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/Jnej-7H-1Q4?si=zMyFxG7bsL90UMb-"
            title="Video Perkenalan UKM Robotik"
            allowFullScreen
            className="border-0"
          ></iframe>
        </div>
      </section>

      {/* Timeline Open Recruitment */}
      <section
        id="recruitment"
        className="w-full py-20 bg-white dark:bg-slate-800 px-6 text-center transition-colors"
      >
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 transition-colors">
          Timeline Open Recruitment
        </h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {timeline.map((item) => (
            <div
              key={item.step}
              className="bg-slate-50 dark:bg-slate-700 p-6 rounded-xl shadow hover:shadow-lg dark:shadow-slate-600 dark:hover:shadow-slate-600 transition-all"
            >
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 transition-colors">
                {item.title}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">{item.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daftar Tim KRI */}
      <section id="kri" className="w-full py-20 bg-slate-50 dark:bg-slate-900 px-6 text-center transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-12 transition-colors">
          Daftar Tim KRI
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {teams.map((team) => (
            <div
              key={team.name}
              className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow hover:shadow-lg dark:shadow-slate-700 dark:hover:shadow-slate-600 transition-all"
            >
              <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-2 transition-colors">
                {team.name}
              </h3>
              <p className="text-slate-600 dark:text-slate-300 transition-colors">{team.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lokasi */}
      <section id="lokasi" className="w-full py-20 bg-white dark:bg-slate-800 px-6 text-center transition-colors">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 transition-colors">Lokasi</h2>
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-md dark:shadow-slate-700">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d349.56666415621277!2d100.46807153132339!3d-0.9146811910768018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7bbfa1dfc99%3A0xf0984f8a51acdad!2s3FP9%2B47V%2C%20Limau%20Manis%2C%20Kec.%20Pauh%2C%20Kota%20Padang%2C%20Sumatera%20Barat%2025175!5e0!3m2!1sid!2sid!4v1756969691580!5m2!1sid!2sid"
            width="100%"
            height="450"
            loading="lazy"
            className="w-full border-0"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="w-full bg-slate-800 dark:bg-slate-950 text-white px-6 py-8 text-center transition-colors"
      >
        <p className="mb-2 font-semibold text-white dark:text-slate-100">UKM Robotik</p>
        <p className="text-slate-200 dark:text-slate-300 transition-colors">Email: infokomrobotikpnp2024@gmail.com</p>
        <p className="text-slate-200 dark:text-slate-300 transition-colors">
          Instagram: <Link 
            href="https://www.instagram.com/robotikpnp/" 
            target="_blank"
            className="text-blue-400 dark:text-blue-300 hover:text-blue-300 dark:hover:text-blue-200 transition-colors underline"
          >
            @robotikpnp
          </Link>
        </p>
        <p className="mt-4 text-slate-400 dark:text-slate-500 text-sm transition-colors">
          © {new Date().getFullYear()} UKM Robotik PNP. All rights reserved.
        </p>
      </footer>
    </main>
  );
}