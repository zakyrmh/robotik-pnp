"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { CaangRegistration } from "@/types/caang";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { User } from "firebase/auth";
import { Loader2 } from "lucide-react";

export default function DataPribadiPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [formData, setFormData] = useState<CaangRegistration>({
    namaLengkap: "",
    namaPanggilan: "",
    jenisKelamin: "",
    agama: "",
    tempatLahir: "",
    tanggalLahir: "",
    noHp: "",
    instagram: "",
    alamatAsal: "",
    alamatDomisili: "",
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
          const data = snap.data() as CaangRegistration;
          setFormData((prev) => ({
            ...prev,
            namaLengkap: data.namaLengkap ?? "",
            namaPanggilan: data.namaPanggilan ?? "",
            jenisKelamin: data.jenisKelamin ?? "",
            agama: data.agama ?? "",
            tempatLahir: data.tempatLahir ?? "",
            tanggalLahir:
              (data.tanggalLahir as unknown as Timestamp) instanceof Timestamp
                ? (data.tanggalLahir as unknown as Timestamp)
                    .toDate()
                    .toISOString()
                    .split("T")[0]
                : data.tanggalLahir ?? "",
            noHp: data.noHp ?? "",
            instagram: data.instagram ?? "",
            alamatAsal: data.alamatAsal ?? "",
            alamatDomisili: data.alamatDomisili ?? "",
          }));
        }
      } catch (err) {
        console.error("Gagal load data pribadi:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
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
        await setDoc(doc(db, "caang_registration", user.uid), {
          ...formData,
          tanggalLahir: formData.tanggalLahir
            ? Timestamp.fromDate(
                typeof formData.tanggalLahir === "string"
                  ? new Date(formData.tanggalLahir)
                  : formData.tanggalLahir
              )
            : null,
          createdAt: Timestamp.now(),
          uid: user.uid,
        });

        setSuccess("Data pribadi berhasil disimpan ✅");
        router.push("/pendaftaran");
      } else {
        setError("User tidak ditemukan, silakan login ulang.");
      }
    } catch (err) {
      console.error(err);
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
      className="max-w-3xl mx-auto p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Form Data Pribadi</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap & Nama Panggilan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaLengkap">Nama Lengkap</Label>
                <Input
                  className="mt-3"
                  id="namaLengkap"
                  name="namaLengkap"
                  value={formData.namaLengkap}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div>
                <Label htmlFor="namaPanggilan">Nama Panggilan</Label>
                <Input
                  className="mt-3"
                  id="namaPanggilan"
                  name="namaPanggilan"
                  value={formData.namaPanggilan}
                  onChange={handleChange}
                  placeholder="Contoh: Budi"
                  required
                />
              </div>
            </div>

            {/* Jenis Kelamin & Agama */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="jenisKelamin">Jenis Kelamin</Label>
                <select
                  id="jenisKelamin"
                  name="jenisKelamin"
                  value={formData.jenisKelamin}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background p-2 mt-3"
                  required
                >
                  <option value="">Pilih...</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <Label htmlFor="agama">Agama</Label>
                <select
                  id="agama"
                  name="agama"
                  value={formData.agama}
                  onChange={handleChange}
                  className="w-full rounded-md border border-input bg-background p-2 mt-3"
                  required
                >
                  <option value="">Pilih...</option>
                  <option value="islam">Islam</option>
                  <option value="kristen">Kristen</option>
                  <option value="katolik">Katolik</option>
                  <option value="hindu">Hindu</option>
                  <option value="budha">Budha</option>
                  <option value="konghucu">Konghucu</option>
                  <option value="lainnya">Lainnya</option>
                </select>
              </div>
            </div>

            {/* Tempat & Tanggal Lahir */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tempatLahir">Tempat Lahir</Label>
                <Input
                  className="mt-3"
                  id="tempatLahir"
                  name="tempatLahir"
                  value={formData.tempatLahir}
                  onChange={handleChange}
                  placeholder="Kota/Kabupaten"
                  required
                />
              </div>
              <div>
                <Label htmlFor="tanggalLahir">Tanggal Lahir</Label>
                <Input
                  className="mt-3"
                  id="tanggalLahir"
                  type="date"
                  name="tanggalLahir"
                  value={
                    typeof formData.tanggalLahir === "object" &&
                    (formData.tanggalLahir as Timestamp | string) instanceof
                      Timestamp
                      ? (formData.tanggalLahir as Timestamp)
                          .toDate()
                          .toISOString()
                          .split("T")[0]
                      : formData.tanggalLahir
                  }
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Nomor HP & Instagram */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="noHp">No HP</Label>
                <Input
                  className="mt-3"
                  id="noHp"
                  name="noHp"
                  type="tel"
                  value={formData.noHp}
                  onChange={handleChange}
                  placeholder="08xx..."
                  required
                />
              </div>
              <div>
                <Label htmlFor="instagram">Instagram</Label>
                <Input
                  className="mt-3"
                  id="instagram"
                  name="instagram"
                  value={formData.instagram}
                  onChange={handleChange}
                  placeholder="@username"
                  required
                />
              </div>
            </div>

            {/* Alamat Asal */}
            <div>
              <Label htmlFor="alamatAsal">Alamat Asal</Label>
              <Textarea
                className="mt-3"
                id="alamatAsal"
                name="alamatAsal"
                value={formData.alamatAsal}
                onChange={handleChange}
                placeholder="Masukkan alamat asal"
                required
              />
            </div>

            {/* Alamat Domisili */}
            <div>
              <Label htmlFor="alamatDomisili">Alamat Domisili</Label>
              <Textarea
                className="mt-3"
                id="alamatDomisili"
                name="alamatDomisili"
                value={formData.alamatDomisili}
                onChange={handleChange}
                placeholder="Masukkan alamat domisili"
                required
              />
            </div>

            {/* Pesan success & error */}
            {success && <p className="text-green-600">{success}</p>}
            {error && <p className="text-red-600">{error}</p>}

            {/* Tombol Submit */}
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
