"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import InputGroup from "@/components/FormElements/InputGroup";
import Link from "next/link";

export default function DataPribadi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // State untuk tiap file
  const [pasFoto, setPasFoto] = useState<File | null>(null);
  const [igRobotik, setIgRobotik] = useState<File | null>(null);
  const [igMrc, setIgMrc] = useState<File | null>(null);
  const [youtube, setYoutube] = useState<File | null>(null);

  // State umum
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const isFormComplete = pasFoto && igRobotik && igMrc && youtube;

  // Redirect login & cek registrasi
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
        if (snap.exists() && snap.data()?.followIgRobotik) {
          router.push("/pendaftaran");
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  // Helper: upload file ke Supabase & return public URL
  const uploadFile = async (file: File, fieldName: string) => {
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      throw new Error(`${fieldName} harus format .jpg atau .png`);
    }
    if (file.size > 2 * 1024 * 1024) {
      throw new Error(`${fieldName} maksimal 2MB`);
    }

    const filePath = `upload/${user?.uid}_${fieldName}_${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from("pendaftaran")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) throw uploadError;

    const { data: publicUrlData } = supabase.storage
      .from("pendaftaran")
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      throw new Error(`Gagal membuat URL publik untuk ${fieldName}`);
    }

    return publicUrlData.publicUrl;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!user?.uid) throw new Error("Autentikasi gagal");

      // Upload semua file
      const pasFotoUrl = await uploadFile(pasFoto!, "pasFoto");
      const igRobotikUrl = await uploadFile(igRobotik!, "igRobotik");
      const igMrcUrl = await uploadFile(igMrc!, "igMrc");
      const youtubeUrl = await uploadFile(youtube!, "youtube");

      // Simpan ke Firestore
      await setDoc(
        doc(db, "caang_registration", user.uid),
        {
          pasFoto: pasFotoUrl,
          followIgRobotik: igRobotikUrl,
          followIgMrc: igMrcUrl,
          youtubeRobotik: youtubeUrl,
        },
        { merge: true }
      );

      setSuccess("Data berhasil disimpan");
      router.push("/pendaftaran");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
      <form onSubmit={handleSubmit}>
        <h3 className="mb-4.5 text-xl font-semibold">Dokumen Pendukung</h3>
        <div className="mb-4.5 flex flex-col gap-4.5">
          {/* Baris 1 */}
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4 xl:justify-around xl:items-center">
            <div className="flex flex-col">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Pas Foto"
                placeholder="Masukkan Pas Foto"
                handleChange={(e) => setPasFoto(e.target.files?.[0] ?? null)}
                required
              />
              <p className="text-sm mt-1">Maksimal ukuran file 2MB</p>
            </div>

            <div className="flex flex-col">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Follow Instagram Robotik"
                placeholder="Upload Bukti IG Robotik"
                handleChange={(e) => setIgRobotik(e.target.files?.[0] ?? null)}
                required
              />
              <Link className="text-sm mt-2 text-primary" target="_blank" href="https://www.instagram.com/robotikpnp/">@robotikpnp</Link>
              <p className="text-sm mt-1">Maksimal ukuran file 2MB</p>
            </div>
          </div>

          {/* Baris 2 */}
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4 xl:justify-around xl:items-center">
            <div className="flex flex-col">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Follow Instagram MRC"
                placeholder="Upload Bukti IG MRC"
                handleChange={(e) => setIgMrc(e.target.files?.[0] ?? null)}
                required
              />
              <Link className="text-sm mt-2 text-primary" target="_blank" href="https://www.instagram.com/mrcpnp/">@mrcpnp</Link>
              <p className="text-sm mt-1">Maksimal ukuran file 2MB</p>
            </div>

            <div className="flex flex-col">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Youtube Robotik"
                placeholder="Upload Bukti Youtube Robotik"
                handleChange={(e) => setYoutube(e.target.files?.[0] ?? null)}
                required
              />
              <Link className="text-sm mt-2 text-primary" target="_blank" href="https://www.youtube.com/@robotikpnp">UKM Robotik</Link>
              <p className="text-sm mt-1">Maksimal ukuran file 2MB</p>
            </div>
          </div>
        </div>

        {success && (
          <p className="text-green-500 my-4">
            <span className="font-semibold">Success:</span> {success}
          </p>
        )}

        {error && (
          <p className="text-red-500 my-4">
            <span className="font-semibold">Error:</span> {error}, silahkan coba lagi
          </p>
        )}

        <button
          type="submit"
          disabled={loading || !isFormComplete}
          className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
        >
          {!isFormComplete
            ? "Lengkapi Semua Upload"
            : loading
            ? "Loading..."
            : "Simpan"}
        </button>
      </form>
    </ShowcaseSection>
  );
}
