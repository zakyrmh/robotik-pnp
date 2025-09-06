// app/(private)/pendaftaran/data-pendidikan/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { auth } from "@/lib/firebaseConfig";
import { FormDataCaang } from "@/types/caang";
import JurusanProdiSelect from "@/app/(private)/pendaftaran/data-pendidikan/JurusanProdiSelect";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { User } from "firebase/auth";

export default function DataPendidikanPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<FormDataCaang>({
    asalSekolah: "",
    nim: "",
    jurusan: "",
    prodi: "",
    riwayatOrganisasi: "",
    riwayatPrestasi: "",
    tujuanMasuk: "",
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const snap = await getDoc(doc(db, "caang_registration", u.uid));
        if (snap.exists()) {
          const data = snap.data() as FormDataCaang;
          setFormData((prev) => ({
            ...prev,
            asalSekolah: data.asalSekolah ?? "",
            nim: data.nim ?? "",
            jurusan: data.jurusan ?? "",
            prodi: data.prodi ?? "",
            riwayatOrganisasi: data.riwayatOrganisasi ?? "",
            riwayatPrestasi: data.riwayatPrestasi ?? "",
            tujuanMasuk: data.tujuanMasuk ?? "",
          }));
        }
      } catch (err) {
        console.error("Gagal load data pendidikan:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess("");
    setError("");

    try {
      if (user?.uid) {
        await setDoc(
          doc(db, "caang_registration", user.uid),
          { ...formData },
          { merge: true }
        );
        setSuccess("Data pendidikan berhasil disimpan ✅");
        router.push("/pendaftaran");
      } else {
        setError("User tidak ditemukan, silakan login ulang.");
      }
    } catch (err) {
      console.error("Gagal simpan data pendidikan:", err);
      setError("Terjadi kesalahan saat menyimpan data.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-lg font-medium">Memuat formulir...</span>
      </div>
    );
  }

  return (
    <motion.div
      className="max-w-3xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <h1 className="text-2xl font-bold">Form Data Pendidikan</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Asal Sekolah & NIM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="asalSekolah">Asal Sekolah</Label>
            <Input
              className="mt-3"
              id="asalSekolah"
              name="asalSekolah"
              placeholder="Masukkan asal sekolah"
              value={formData.asalSekolah}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="nim">NIM</Label>
            <Input
              className="mt-3"
              id="nim"
              name="nim"
              placeholder="Masukkan NIM"
              value={formData.nim}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Jurusan & Prodi */}
        <JurusanProdiSelect
          valueJurusan={formData.jurusan ?? ""}
          valueProdi={formData.prodi ?? ""}
          onChangeJurusan={(val) =>
            setFormData((prev) => ({ ...prev, jurusan: val }))
          }
          onChangeProdi={(val) =>
            setFormData((prev) => ({ ...prev, prodi: val }))
          }
          required
        />

        {/* Riwayat Organisasi */}
        <div>
          <Label htmlFor="riwayatOrganisasi">Riwayat Organisasi</Label>
          <Textarea
            className="mt-3"
            id="riwayatOrganisasi"
            name="riwayatOrganisasi"
            placeholder="Tuliskan riwayat organisasi Anda"
            value={formData.riwayatOrganisasi}
            onChange={handleChange}
          />
        </div>

        {/* Riwayat Prestasi */}
        <div>
          <Label htmlFor="riwayatPrestasi">Riwayat Prestasi</Label>
          <Textarea
            className="mt-3"
            id="riwayatPrestasi"
            name="riwayatPrestasi"
            placeholder="Tuliskan riwayat prestasi Anda"
            value={formData.riwayatPrestasi}
            onChange={handleChange}
          />
        </div>

        {/* Tujuan Masuk */}
        <div>
          <Label htmlFor="tujuanMasuk">Tujuan Masuk UKM-R</Label>
          <Textarea
            className="mt-3"
            id="tujuanMasuk"
            name="tujuanMasuk"
            placeholder="Mengapa Anda ingin bergabung dengan UKM Robotik?"
            value={formData.tujuanMasuk}
            onChange={handleChange}
            required
          />
        </div>

        {success && <p className="text-green-600">{success}</p>}
        {error && <p className="text-red-600">{error}</p>}

        <Button type="submit" disabled={saving} className="w-full">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Menyimpan...
            </>
          ) : (
            "Simpan Data Pendidikan"
          )}
        </Button>
      </form>
    </motion.div>
  );
}
