"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { useRouter } from "next/navigation";
import InputGroup from "@/components/FormElements/InputGroup";
import { doc, updateDoc, setDoc, getDoc, where, collection, query, getDocs, deleteDoc } from "firebase/firestore";

export default function Verification() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [name, setName] = useState("");
  const [memberNo, setMemberNo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      }
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (user && !authLoading) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data()?.role) {
          router.push("/dashboard");
        }
      }
    };
    checkVerificationStatus();
  }, [user, authLoading, router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return alert("Silakan login terlebih dahulu.");

    try {
      setLoading(true);
      
      const membersRef = collection(db, "members");
      const q = query(
        membersRef,
        where("name", "==", name.trim()),
        where("memberNo", "==", memberNo.trim())
      )
    
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        alert("Nama dan Nomor Anggota tidak ditemukan.");
        setLoading(false);
        return;
      }

      const memberData = querySnapshot.docs[0].data();

      const userRef = doc(db, "users", user.uid);
      await setDoc(userRef, {
        ...memberData,
        email: user.email || "",
        role: "member",
      });

      await deleteDoc(doc(db, "members", querySnapshot.docs[0].id));

      alert("Verifikasi berhasil! Anda terdaftar sebagai anggota.");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat verifikasi.");
    } finally {
      setLoading(false);
    }
  };

  const handleProspective = async () => {
    if (!user) return alert("Silakan login terlebih dahulu.");

    try {
      const userRef = doc(db, "users", user.uid);

      const docSnap = await getDoc(userRef);
      if (!docSnap.exists()) {
        await setDoc(userRef, {
          role: "prospective members",
        });
      } else {
        await updateDoc(userRef, {
          role: "prospective members",
        });
      }

      alert("Anda masuk sebagai calon anggota.");
      router.push("/dashboard");
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat mengatur status calon anggota.");
    }
  };

  return (
    <div className="flex max-h-fit flex-col items-center justify-center overflow-hidden">
      <div className="no-scrollbar overflow-y-auto">
        <div className="mx-auto w-full max-w-[480px]">
          <div className="text-center">
            <div className="rounded-xl bg-white p-4 shadow-card-10 dark:bg-gray-dark lg:p-7.5 xl:p-12.5">
              <Link
                className="flex justify-center items-center gap-2 mx-auto mb-7.5"
                href="/"
              >
                <Image
                  alt="Logo"
                  width={45}
                  height={45}
                  src="/images/logo/logo.webp"
                />
                <span className="font-semibold text-dark dark:text-white">
                  Robotik PNP
                </span>
              </Link>

              <h1 className="mb-2.5 text-3xl font-black leading-[48px] text-dark dark:text-white">
                Verifikasi Keanggotaan
              </h1>

              <p className="mb-7.5 text-dark-4 dark:text-dark-6">
                Masukkan nama dan nomor anggota Anda.
              </p>

              <form onSubmit={handleVerify}>
                <InputGroup
                  type="text"
                  label="Nama"
                  className="text-left mb-4 [&_input]:py-[15px]"
                  placeholder="Masukkan nama Anda"
                  name="name"
                  value={name}
                  handleChange={(e) => setName(e.target.value)}
                />

                <InputGroup
                  type="text"
                  label="No Anggota"
                  className="text-left mb-6 [&_input]:py-[15px]"
                  placeholder="Masukkan nomor anggota Anda"
                  name="memberNo"
                  value={memberNo}
                  handleChange={(e) => setMemberNo(e.target.value)}
                />

                <div className="mb-4.5">
                  <button
                    type="submit"
                    className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary p-4 font-medium text-white transition hover:bg-opacity-90"
                  >
                    {loading ? "Memverifikasi..." : "Verifikasi"}
                    {loading && (
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent dark:border-t-transparent" />
                    )}
                  </button>
                </div>
              </form>
              <div className="mt-6 text-center text-gray-500">
                <button
                  type="button"
                  onClick={handleProspective}
                  className="text-primary cursor-pointer"
                >
                  Masuk sebagai calon anggota
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
