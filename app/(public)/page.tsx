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
        className="w-full min-h-screen flex flex-col justify-center items-center bg-slate-50 text-center px-4"
      >
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-4xl md:text-6xl font-bold text-slate-900 mb-6"
        >
          Selamat Datang di <span className="text-slate-600">UKM Robotik</span>
        </motion.h1>
        <p className="text-lg md:text-xl text-slate-700 max-w-2xl mb-6">
          Wadah bagi mahasiswa Politeknik Negeri Padang untuk mengembangkan
          minat, bakat, dan kreativitas di bidang robotika.
        </p>
        <Link
          href="/caang/register"
          className="bg-slate-800 text-white px-6 py-3 rounded-lg hover:bg-slate-700 transition"
        >
          Gabung Sekarang
        </Link>
      </section>

      {/* Ketua Umum */}
      <section id="ketua" className="w-full py-20 bg-white px-6">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <Image
            src="/images/ketua_umum.jpg"
            alt="Ketua Umum UKM Robotik"
            width={400}
            height={400}
            className="rounded-2xl object-contain shadow-md"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4 text-slate-900">
              Ketua Umum
            </h2>
            <p className="text-lg text-slate-700 mb-2">
              Nama: M. Fadhil Muzaffar Guci
            </p>
            <p className="text-lg text-slate-700 mb-2">
              Prodi: D4 Teknik Elektronika &apos;23
            </p>
            {/* <p className="text-lg text-slate-700">
              Visi: Membawa UKM Robotik menjadi pusat inovasi teknologi dan
              juara kompetisi robotik nasional.
            </p> */}
          </div>
        </div>
      </section>

      {/* Video Perkenalan */}
      <section id="video" className="w-full py-20 bg-slate-50 px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">
          Video Perkenalan
        </h2>
        <div className="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow-md">
          <iframe
            width="100%"
            height="100%"
            src="https://www.youtube.com/embed/Jnej-7H-1Q4?si=zMyFxG7bsL90UMb-"
            title="Video Perkenalan UKM Robotik"
            allowFullScreen
          ></iframe>
        </div>
      </section>

      {/* Timeline Open Recruitment */}
      <section
        id="recruitment"
        className="w-full py-20 bg-white px-6 text-center"
      >
        <h2 className="text-3xl font-bold text-slate-900 mb-12">
          Timeline Open Recruitment
        </h2>
        <div className="max-w-4xl mx-auto grid md:grid-cols-3 gap-6">
          {timeline.map((item) => (
            <div
              key={item.step}
              className="bg-slate-50 p-6 rounded-xl shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {item.title}
              </h3>
              <p className="text-slate-600">{item.date}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Daftar Tim KRI */}
      <section id="kri" className="w-full py-20 bg-slate-50 px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-12">
          Daftar Tim KRI
        </h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-8">
          {teams.map((team) => (
            <div
              key={team.name}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition"
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                {team.name}
              </h3>
              <p className="text-slate-600">{team.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Lokasi */}
      <section id="lokasi" className="w-full py-20 bg-white px-6 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-8">Lokasi</h2>
        <div className="max-w-4xl mx-auto rounded-xl overflow-hidden shadow-md">
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d349.56666415621277!2d100.46807153132339!3d-0.9146811910768018!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2fd4b7bbfa1dfc99%3A0xf0984f8a51acdad!2s3FP9%2B47V%2C%20Limau%20Manis%2C%20Kec.%20Pauh%2C%20Kota%20Padang%2C%20Sumatera%20Barat%2025175!5e0!3m2!1sid!2sid!4v1756969691580!5m2!1sid!2sid"
            width="100%"
            height="450"
            loading="lazy"
            className="w-full"
          ></iframe>
        </div>
      </section>

      {/* Footer */}
      <footer
        id="footer"
        className="w-full bg-slate-800 text-white py-8 text-center"
      >
        <p className="mb-2 font-semibold">UKM Robotik</p>
        <p>Email: infokomrobotikpnp2024@gmail.com</p>
        <p>Instagram: <Link href="https://www.instagram.com/robotikpnp/" target="_blank">@robotikpnp</Link></p>
        <p className="mt-4 text-slate-400 text-sm">
          © {new Date().getFullYear()} UKM Robotik PNP. All rights reserved.
        </p>
      </footer>
    </main>
  );
}
