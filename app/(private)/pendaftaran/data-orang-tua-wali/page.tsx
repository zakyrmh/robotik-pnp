"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseConfig";
import { FormDataCaang } from "@/types/caang";
import { Input } from "@/components/ui/input";
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
  const [formData, setFormData] = useState<FormDataCaang>({
    namaOrangTua: "",
    noHpOrangTua: "",
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
            namaOrangTua: data.namaOrangTua ?? "",
            noHpOrangTua: data.noHpOrangTua ?? "",
          }));
        }
      } catch (err) {
        console.error("Gagal load data orang tua / wali:", err);
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
        await setDoc(
          doc(db, "caang_registration", user.uid),
          { ...formData },
          { merge: true }
        );
        setSuccess("Data orang tua / wali berhasil disimpan ✅");
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
          <CardTitle>Form Data Orang Tua / Wali</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nama Lengkap & Nama Panggilan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="namaOrangTua">Nama Orang Tua / Wali</Label>
                <Input
                  className="mt-3"
                  id="namaOrangTua"
                  name="namaOrangTua"
                  value={formData.namaOrangTua}
                  onChange={handleChange}
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>
              <div>
                <Label htmlFor="noHpOrangTua">No Hp Orang Tua / Wali</Label>
                <Input
                  className="mt-3"
                  id="noHpOrangTua"
                  name="noHpOrangTua"
                  type="tel"
                  value={formData.noHpOrangTua}
                  onChange={handleChange}
                  placeholder="08xx..."
                  required
                />
              </div>
            </div>

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
