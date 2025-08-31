"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [dataPribadi, setDataPribadi] = useState(false);
  const [dataPendidikan, setDataPendidikan] = useState(false);
  const [dataOrangTua, setDataOrangTua] = useState(false);
  const [dokPendukung, setDokPendukung] = useState(false);
  const [pembayaran, setPembayaran] = useState(false);


  // Redirect ke login jika belum autentikasi & cek pendaftaran
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
        setDataPribadi(snap.data()?.namaLengkap);
        setDataPendidikan(snap.data()?.prodi);
        setDataOrangTua(snap.data()?.namaOrangTua);
        setDokPendukung(snap.data()?.followIgRobotik);
        setPembayaran(snap.data()?.pembayaran);
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex justify-between items-center px-6.5 py-4">
          <h3 className="font-medium text-dark dark:text-white">
            Data Pribadi
          </h3>
          {dataPribadi ? (
            <span className="text-body-sm font-medium text-green-500">
              Sudah diisi
            </span>
          ) : (
          <Link
            href="/pendaftaran/data-pribadi"
            className="inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 transition focus:outline-none border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white rounded-[5px] py-1 px-5 lg:px-4 xl:px-5"
          >
            Isi
          </Link>
          )}
        </div>
      </div>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex justify-between items-center px-6.5 py-4">
          <h3 className="font-medium text-dark dark:text-white">
            Data Pendidikan
          </h3>
          {dataPendidikan ? (
            <span className="text-body-sm font-medium text-green-500">
              Sudah diisi
            </span>
          ) : (
          <Link
            href="/pendaftaran/data-pendidikan"
            className="inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 transition focus:outline-none border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white rounded-[5px] py-1 px-5 lg:px-4 xl:px-5"
          >
            Isi
          </Link>
          )}
        </div>
      </div>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex justify-between items-center px-6.5 py-4">
          <h3 className="font-medium text-dark dark:text-white">
            Data Orang Tua
          </h3>
          {dataOrangTua ? (
            <span className="text-body-sm font-medium text-green-500">
              Sudah diisi
            </span>
          ) : (
          <Link
            href="/pendaftaran/data-orang-tua"
            className="inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 transition focus:outline-none border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white rounded-[5px] py-1 px-5 lg:px-4 xl:px-5"
          >
            Isi
          </Link>
          )}
        </div>
      </div>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex justify-between items-center px-6.5 py-4">
          <h3 className="font-medium text-dark dark:text-white">
            Dokumen Pendukung
          </h3>
          {dokPendukung ? (
            <span className="text-body-sm font-medium text-green-500">
              Sudah upload
            </span>
          ) : (
          <Link
            href="/pendaftaran/dok-pendukung"
            className="inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 transition focus:outline-none border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white rounded-[5px] py-1 px-5 lg:px-4 xl:px-5"
          >
            Isi
          </Link>
          )}
        </div>
      </div>
      <div className="rounded-[10px] border border-stroke bg-white shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card">
        <div className="flex justify-between items-center px-6.5 py-4">
          <h3 className="font-medium text-dark dark:text-white">
            Pembayaran
          </h3>
          {pembayaran ? (
            <span className="text-body-sm font-medium text-green-500">
              Sudah bayar
            </span>
          ) : (
          <Link
            href="/pendaftaran/pembayaran"
            className="inline-flex items-center justify-center gap-2.5 text-center font-medium hover:bg-opacity-90 transition focus:outline-none border border-dark hover:bg-dark/10 text-dark dark:hover:bg-white/10 dark:border-white/25 dark:text-white rounded-[5px] py-1 px-5 lg:px-4 xl:px-5"
          >
            Isi
          </Link>
          )}
        </div>
      </div>
    </div>
    </>
  );
}
