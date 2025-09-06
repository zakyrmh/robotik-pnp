"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { FormDataCaang } from "@/types/caang";
import Link from "next/link";

export default function CaangDashboard() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FormDataCaang | null>(null);

  const user = auth.currentUser;

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const snap = await getDoc(doc(db, "caang_registration", user.uid));
        if (snap.exists()) {
          setData(snap.data());
        }
      } catch (err) {
        console.error("Error fetching registration:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">
          Memuat status pendaftaran...
        </span>
      </div>
    );
  }

  const registration = data || {};
  const steps = [
    { label: "Data Pribadi", filled: !!registration.namaPanggilan },
    { label: "Data Pendidikan", filled: !!registration.nim },
    { label: "Data Orang Tua / Wali", filled: !!registration.namaOrangTua },
    { label: "Dokumen Pendukung", filled: !!registration.pasFoto },
    { label: "Bukti Pembayaran", filled: !!registration.pembayaran },
  ];

  const allFilled = steps.every((s) => s.filled);
  const paymentVerified = registration.payment_verification === true;

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Sambutan */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Selamat Datang, {user?.displayName || user?.email} 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Ini adalah dashboard calon anggota UKM Robotik PNP. Silakan lengkapi
            semua data pendaftaran Anda.
          </p>
        </CardContent>
      </Card>

      {registration.payment_message && (
        <Card className="shadow-md border">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Notification</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-600 dark:text-slate-400">
              {registration.payment_message}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Status Pendaftaran */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>Status Pendaftaran</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {steps.map((step, idx) => (
              <li key={idx} className="flex items-center">
                {step.filled ? (
                  <CheckCircle2 className="text-green-500 mr-2" />
                ) : (
                  <XCircle className="text-red-500 mr-2" />
                )}
                <span>{step.label}</span>
              </li>
            ))}
          </ul>

          {!registration.pembayaran && (
            <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
              <p className="text-red-600 dark:text-red-400 font-medium mb-2">
                ⚠️ Anda belum mengunggah bukti pembayaran.
              </p>
              <p className="text-slate-700 dark:text-slate-300">
                Silakan lakukan pembayaran ke nomor rekening berikut:
              </p>
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-md shadow">
                <p className="font-semibold">Bank BSI</p>
                <p>
                  No. Rekening: <span className="font-mono">7324452887</span>
                </p>
                <p>a.n Dewinda Kurnia Oktari</p>
              </div>
              <div className="mt-2 p-3 bg-white dark:bg-slate-900 rounded-md shadow">
                <p className="font-semibold">Dana</p>
                <p>
                  No.: <span className="font-mono">083181565767</span>
                </p>
                <p>a.n Dewinda Kurnia Oktari</p>
              </div>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Setelah transfer, silakan unggah bukti pembayaran di form
                pendaftaran.
              </p>
            </div>
          )}

          {allFilled && registration.pembayaran && !paymentVerified && (
            <p className="mt-4 text-yellow-600 dark:text-yellow-400">
              ✅ Semua data sudah terisi. <br />
              Bukti pembayaran sudah dikirim, Silakan tunggu konfirmasi dari
              admin.
            </p>
          )}

          {allFilled && paymentVerified && (
            <div className="mt-4">
              <p className="text-green-600 dark:text-green-400 mb-3">
                🎉 Pendaftaran Anda sudah diverifikasi! Silakan bergabung ke
                group WhatsApp untuk informasi lebih lanjut.
              </p>
              <Button
                asChild
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <a
                  href="https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Join Group WhatsApp
                </a>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Kontak Admin */}
      <Card className="shadow-md border">
        <CardHeader>
          <CardTitle>Kontak Admin</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-600 dark:text-slate-400">
            Jika ada kendala, silakan hubungi admin:
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            <li>📧 Email: infokomrobotikpnp2024@gmail.com</li>
            <li>
              📱 WhatsApp:{" "}
              <Link href="https://wa.me/6285157875233" target="_blank">
                085157875233 (Naufal)
              </Link>
            </li>
            <li>
              📱 WhatsApp:{" "}
              <Link href="https://wa.me/6283181565767" target="_blank">
                083181565767 (Dinda)
              </Link>
            </li>
          </ul>
        </CardContent>
      </Card>
    </motion.div>
  );
}
