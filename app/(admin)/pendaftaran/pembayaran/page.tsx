"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import InputGroup from "@/components/FormElements/InputGroup";

export default function DataPribadi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

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
        if (snap.exists() && snap.data()?.pembayaran) {
          router.push("/pendaftaran");
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess("");
    setError("");

    try {
      if (!user?.uid) {
        setError("Terjadi kesalahan autentikasi");
        return;
      }

      if (!file) {
        setError("File belum dipilih");
        return;
      }

      // Validasi ukuran (maks 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError("Ukuran file maksimal 2MB");
        return;
      }

      // Validasi tipe file
      if (!["image/jpeg", "image/png"].includes(file.type)) {
        setError("Format file harus .jpg atau .png");
        return;
      }

      // Path unik biar tidak tabrakan
      const filePath = `upload/${user.uid}_${Date.now()}_${file.name}`;

      // Upload ke Supabase
      const { error: uploadError } = await supabase.storage
        .from("pendaftaran")
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        console.error(uploadError);
        throw uploadError;
      }

      // Ambil public URL
      const { data: publicUrlData } = supabase.storage
        .from("pendaftaran")
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        throw new Error("Gagal membuat public URL");
      }

      // Simpan ke Firestore
      await setDoc(
        doc(db, "caang_registration", user.uid),
        {
          pembayaran: publicUrl,
        },
        { merge: true }
      );

      setSuccess("Data berhasil disimpan");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error saat submit:", err);
      setError("Terjadi kesalahan saat menyimpan data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4.5 text-xl font-semibold">Pembayaran</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3">
            <p className="font-semibold">Bank BSI</p>
            <p>
              No. Rekening: <span className="font-mono">7324452887</span>
            </p>
            <p>a.n. Dewinda Kurnia Oktari</p>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md mb-3">
            <p className="font-semibold">Dana</p>
            <p>
              No. Rekening: <span className="font-mono">083181565767</span>
            </p>
            <p>a.n. Dewinda Kurnia Oktari</p>
          </div>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="flex flex-col">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Pembayaran"
                placeholder="Masukkan Bukti Pembayaran"
                handleChange={(e) => setFile(e.target.files?.[0] ?? null)}
                required
              />
              <p className="text-sm mt-2">Jenis file: .jpg, .jpeg, .png</p>
              <p className="text-sm mt-1">Maksimal ukuran file 2MB</p>
            </div>
          </div>

          {success && (
            <p className="text-green-500 my-4">
              <span className="font-semibold">Success:</span> {success}
            </p>
          )}

          {error && (
            <p className="text-red-500 my-4">
              <span className="font-semibold">Error:</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !file}
            className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {!file
              ? "Pilih Bukti Pembayaran"
              : loading
              ? "Loading..."
              : "Simpan"}
          </button>
        </form>
      </ShowcaseSection>
    </>
  );
}
