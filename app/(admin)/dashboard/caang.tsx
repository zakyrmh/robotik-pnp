"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wallet, Phone, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";

export default function DashboardCaang() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState<string>("Peserta");
  const [pembayaran, setPembayaran] = useState<boolean>(false);
  const [buktiPembayaran, setBuktiPembayaran] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(true);

        try {
          // ambil dokumen users
          const userDocRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userDocRef);

          // ambil dokumen caang_registration
          const caangDocRef = doc(db, "caang_registration", currentUser.uid);
          const caangDoc = await getDoc(caangDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setName((data?.name as string) || "Peserta");
          } else {
            console.warn("⚠️ User document tidak ditemukan:", currentUser.uid);
          }

          if (caangDoc.exists()) {
            const dataCaang = caangDoc.data();
            console.log("📄 Data caang_registration:", dataCaang);

            setBuktiPembayaran((dataCaang?.pembayaran as string) || null);
            setPembayaran((dataCaang?.payment_verification as boolean) || false);
          } else {
            console.warn(
              "⚠️ caang_registration document tidak ditemukan:",
              currentUser.uid
            );
          }
        } catch (err) {
          console.error("🔥 Error ambil data Firestore:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setName("Peserta");
        setPembayaran(false);
        setBuktiPembayaran(null);
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-2xl p-6">
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Card salam */}
      <Card className="mb-6 shadow-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
        <CardHeader>
          <CardTitle>Halo, {user?.displayName || name}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 dark:text-gray-300">
            Selamat datang di halaman dashboard Robotik PNP.
          </p>
        </CardContent>
      </Card>

      {/* Card pembayaran */}
      {!pembayaran && (
        <Card className="mb-6 border-red-400 shadow-md bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
          <CardHeader className="flex items-center gap-2">
            <Wallet className="text-red-500" />
            <CardTitle>Pembayaran</CardTitle>
          </CardHeader>
          <CardContent>
            {!buktiPembayaran ? (
              <>
                <p className="mb-2">
                  Silakan lakukan pembayaran ke salah satu rekening berikut:
                </p>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3">
                  <p className="font-semibold">Bank BSI</p>
                  <p>
                    No. Rekening: <span className="font-mono">7324452887</span>
                  </p>
                  <p>a.n. Dewinda Kurnia Oktari</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3">
                  <p className="font-semibold">Dana</p>
                  <p>
                    No. Rekening:{" "}
                    <span className="font-mono">083181565767</span>
                  </p>
                  <p>a.n. Dewinda Kurnia Oktari</p>
                </div>
              </>
            ) : (
              <p className="font-semibold mb-3">
                Bukti pembayaran sudah dikirim ✅ <br />
                Silakan tunggu konfirmasi dari admin.
              </p>
            )}
            <p className="mb-2">Jika ada kendala, hubungi contact person:</p>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
              <Phone className="w-5 h-5" />
              <Link href="https://wa.me/6285157875233" target="_blank">
                085157875233 (Naufal)
              </Link>
            </div>
            <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300 mt-2">
              <Phone className="w-5 h-5" />
              <Link href="https://wa.me/6283181565767" target="_blank">
                083181565767 (Dinda)
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card join grup */}
      {pembayaran && (
        <Card className="shadow-md">
          <CardHeader className="flex items-center gap-2">
            <Users className="text-green-600" />
            <CardTitle>Gabung Grup WhatsApp</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-3">Pembayaran sudah terverifikasi ✅</p>
            <Button asChild>
              <Link
                href="https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
                target="_blank"
              >
                Join Grup
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
