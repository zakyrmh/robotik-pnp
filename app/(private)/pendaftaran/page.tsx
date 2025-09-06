"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, CheckCircle2, Pencil } from "lucide-react";
import { onAuthStateChanged } from "firebase/auth";

export default function PendaftaranPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState({
    dataPribadi: false,
    dataPendidikan: false,
    dataOrangTua: false,
    dokPendukung: false,
    pembayaran: false,
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "caang_registration", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setStatus({
            dataPribadi: !!data.namaPanggilan,
            dataPendidikan: !!data.nim,
            dataOrangTua: !!data.namaOrangTua,
            dokPendukung: !!data.pasFoto,
            pembayaran: !!data.pembayaran,
          });
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">
          Memuat data pendaftaran...
        </span>
      </div>
    );
  }

  const steps = [
    {
      key: "dataPribadi",
      label: "Data Pribadi",
      link: "/pendaftaran/data-pribadi",
    },
    {
      key: "dataPendidikan",
      label: "Data Pendidikan",
      link: "/pendaftaran/data-pendidikan",
    },
    {
      key: "dataOrangTua",
      label: "Data Orang Tua / Wali",
      link: "/pendaftaran/data-orang-tua-wali",
    },
    {
      key: "dokPendukung",
      label: "Dokumen Pendukung",
      link: "/pendaftaran/dok-pendukung",
    },
    {
      key: "pembayaran",
      label: "Pembayaran",
      link: "/pendaftaran/pembayaran",
    },
  ];

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-4">
        Form Pendaftaran CAANG UKM Robotik PNP
      </h1>
      <p className="text-slate-600 dark:text-slate-400 mb-6">
        Lengkapi semua data berikut agar proses pendaftaran Anda berjalan
        lancar.
      </p>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <Card key={idx} className="border shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">{step.label}</CardTitle>
              {status[step.key as keyof typeof status] ? (
                <Badge className="bg-green-500 text-white flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" /> Sudah diisi
                </Badge>
              ) : (
                <Link
                  href={step.link}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-md border border-slate-300 dark:border-slate-700 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Pencil className="h-4 w-4" /> Isi
                </Link>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {status[step.key as keyof typeof status]
                  ? "Data sudah dilengkapi."
                  : "Klik tombol Isi untuk melengkapi data."}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  );
}
