"use client";

import { useEffect, useState } from "react";
import {
  getDocs,
  collection,
  doc,
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { CaangRegistration } from "@/types/caang";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { toast } from "sonner";
import { UserAccount } from "@/types/users";

export default function ShiftAssignPage() {
    const router = useRouter();
  const [morningShift, setMorningShift] = useState<CaangRegistration[]>([]);
  const [afternoonShift, setAfternoonShift] = useState<CaangRegistration[]>([]);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data() as UserAccount;
          if (data?.role !== "admin") {
            toast.error("Akses ditolak. Hanya admin yang dapat mengakses halaman ini.");
            router.push("/dashboard");
            return;
          }
        } else {
          console.log("User data not found");
          toast.error("Data user tidak ditemukan");
          router.push("/login");
          return;
        }
      } catch (err) {
        console.error("Error checking auth:", err);
        toast.error("Gagal memverifikasi akses");
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleGenerate = async () => {
    setLoading(true);
    setSaved(false);

    try {
      // Ambil semua data pendaftar
      const snapshot = await getDocs(collection(db, "caang_registration"));
      const allData: CaangRegistration[] = snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      })) as CaangRegistration[];

      // Pisahkan antara Teknik Elektro dan non-elektro
      const elektro = allData.filter((d) =>
        d.jurusan?.toLowerCase().includes("elektro")
      );
      const nonElektro = allData.filter(
        (d) => !d.jurusan?.toLowerCase().includes("elektro")
      );

      // Acak urutan peserta non-elektro agar pembagian random
      const shuffledNonElektro = nonElektro.sort(() => Math.random() - 0.5);

      // Gabungkan semua data (elektro di awal)
      const pagi = [...elektro];
      let siang: CaangRegistration[] = [];

      // Hitung target pembagian
      const total = allData.length;
      const targetPagi = Math.floor(total / 2);

      // Tambahkan peserta non-elektro ke shift pagi sampai target tercapai
      for (const peserta of shuffledNonElektro) {
        if (pagi.length < targetPagi) {
          pagi.push(peserta);
        } else {
          siang.push(peserta);
        }
      }

      // Jika ternyata peserta Teknik Elektro terlalu banyak dan melebihi 50%,
      // pindahkan kelebihan ke shift siang.
      if (pagi.length > targetPagi) {
        const excess = pagi.splice(targetPagi);
        siang = [...excess, ...siang];
      }

      // Simpan ke Firestore
      const docRef = doc(db, "shift_assignments", "2025-10-12");
      await setDoc(docRef, {
        tanggal: "2025-10-12",
        dibuatPada: serverTimestamp(),
        pagi: pagi.map((p) => ({
          uid: p.uid || "",
          namaLengkap: p.namaLengkap || "",
          jurusan: p.jurusan || "",
          prodi: p.prodi || "",
          nim: p.nim || "",
        })),
        siang: siang.map((s) => ({
          uid: s.uid || "",
          namaLengkap: s.namaLengkap || "",
          jurusan: s.jurusan || "",
          prodi: s.prodi || "",
          nim: s.nim || "",
        })),
      });

      setMorningShift(pagi);
      setAfternoonShift(siang);
      setSaved(true);
    } catch (err) {
      console.error(err);
      alert("Gagal membuat pembagian shift atau menyimpan ke Firestore.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">
        🔧 Pembagian Shift Pelatihan Elektronika Dasar
      </h1>
      <p className="text-gray-600">
        Tanggal: <b>Minggu, 12 Oktober 2025</b> <br />
        Shift Pagi (08.00–11.00) & Shift Siang (13.30–16.00)
      </p>

      <button
        onClick={handleGenerate}
        disabled={loading}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Memproses & Menyimpan..." : "Generate & Simpan Pembagian"}
      </button>

      {saved && (
        <p className="text-green-600 font-medium">
          ✅ Pembagian berhasil disimpan ke Firestore
          (shift_assignment/2025-10-12)
        </p>
      )}

      {morningShift.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold">
              ☀️ Shift Pagi (08.00–11.00)
            </h2>
            <ShiftTable data={morningShift} />
          </div>

          <div>
            <h2 className="text-xl font-semibold">
              🌇 Shift Siang (13.30–16.00)
            </h2>
            <ShiftTable data={afternoonShift} />
          </div>
        </div>
      )}
    </div>
  );
}

function ShiftTable({ data }: { data: CaangRegistration[] }) {
  return (
    <div className="overflow-x-auto mt-2">
      <table className="min-w-full border border-gray-300 rounded-lg text-sm">
        <thead className="bg-gray-100 text-left">
          <tr>
            <th className="p-2 border">No</th>
            <th className="p-2 border">Nama Lengkap</th>
            <th className="p-2 border">Jurusan</th>
            <th className="p-2 border">Prodi</th>
            <th className="p-2 border">NIM</th>
          </tr>
        </thead>
        <tbody>
          {data.map((m, i) => (
            <tr key={m.uid} className="odd:bg-white even:bg-gray-50">
              <td className="p-2 border">{i + 1}</td>
              <td className="p-2 border">{m.namaLengkap}</td>
              <td className="p-2 border">{m.jurusan}</td>
              <td className="p-2 border">{m.prodi}</td>
              <td className="p-2 border">{m.nim}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
