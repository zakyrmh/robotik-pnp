"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [pembayaran, setPembayaran] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.push("/login");
      return;
    }

    const checkRegistration = async () => {
      try {
        const docRef = doc(db, "caang_registration", user.uid);
        const snap = await getDoc(docRef);
        setPembayaran(snap.data()?.pembayaran);
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  return (
    <>
      <div>
        <p>Welcome, {user?.displayName}</p>
      </div>
      {pembayaran && (
        <div>
          <p>
            Silahkan join WhatsApp group :{" "}
            <Link
              href="https://chat.whatsapp.com/J822tPx4E4kCMPaDD88RYv?mode=ems_copy_t"
              className="text-primary"
            >
              Join
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
