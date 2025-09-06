"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { auth, db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Upload } from "lucide-react";
import { User } from "firebase/auth";

export default function DokumenPendukung() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  // State untuk tiap file
  const [pembayaran, setPembayaran] = useState<File | null>(null);

  // State umum
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isFormComplete = pembayaran;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }
      setUser(u);

      try {
        const snap = await getDoc(doc(db, "caang_registration", u.uid));
        if (snap.exists() && snap.data()?.pembayaran) {
          router.push("/pendaftaran");
        }
      } catch (err) {
        console.error("Gagal load data pribadi:", err);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Helper: upload file ke Supabase & return public URL
  const uploadFile = async (file: File, fieldName: string) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      throw new Error(`${fieldName} harus format .jpg atau .png`);
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error(`${fieldName} maksimal 2MB`);
    }

    const filePath = `upload/${user?.uid}_${fieldName}_${Date.now()}_${
      file.name
    }`;
    const { error: uploadError } = await supabase.storage
      .from("pendaftaran")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload gagal:", uploadError);
      throw new Error(`Gagal upload ${fieldName}`);
    }

    const { data } = supabase.storage
      .from("pendaftaran")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      throw new Error(`Gagal membuat URL publik untuk ${fieldName}`);
    }

    return data.publicUrl;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (user?.uid) {
        // Upload semua file
        const pembayaranUrl = await uploadFile(pembayaran!, "pembayaran");

        // Simpan ke Firestore
        await setDoc(
          doc(db, "caang_registration", user.uid),
          {
            pembayaran: pembayaranUrl,
          },
          { merge: true }
        );

        await setDoc(
          doc(db, "caang_registration", user.uid),
          {
            payment_message: null,
          },
          { merge: true }
        );

        setSuccess("Data dokumen pendukung berhasil disimpan ✅");
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
    <ShowcaseSection title="Dokumen Pendukung" className="!p-6">
      <div className="mt-4 p-4 rounded-lg bg-slate-100 dark:bg-slate-800">
        <p className="text-slate-700 font-medium dark:text-slate-300">
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
      </div>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col gap-2">
          <label className="font-medium">Bukti Pembayaran</label>
          <Input
            type="file"
            accept="image/*"
            onChange={(e) => setPembayaran(e.target.files?.[0] ?? null)}
            required
          />
          <p className="text-sm text-muted-foreground">Maksimal 2MB</p>
        </div>

        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-green-600"
          >
            {success}
          </motion.p>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-red-600"
          >
            {error}, silakan coba lagi.
          </motion.p>
        )}

        <Button
          type="submit"
          disabled={saving || !isFormComplete}
          className="w-full"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Simpan
            </>
          )}
        </Button>
      </form>
    </ShowcaseSection>
  );
}
