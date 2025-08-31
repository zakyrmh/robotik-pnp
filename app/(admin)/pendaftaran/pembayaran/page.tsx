"use client";

import { UploadButton } from "@/utils/uploadthing";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DataPribadi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    pembayaran: "",
  });
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
      if (user?.uid) {
        await setDoc(
          doc(db, "caang_registration", user?.uid),
          {
            ...formData,
          },
          { merge: true }
        );
      } else {
        setError("Terjadi kesalahan");
      }
      setSuccess("Data berhasil disimpan");
      clear();
      router.push("/pendaftaran");
    } catch (err) {
      console.error(err);
      setError("Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setFormData({
      pembayaran: "",
    });
  };

  return (
    <>
      <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4.5 text-xl font-semibold">Pembayaran</h3>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="xl:text-center">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Pembayaran
              </label>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const firstFile = res[0];
                  setFormData({
                    ...formData,
                    pembayaran: firstFile.url,
                  });
                  console.log("Files: ", res);
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
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
            disabled={loading || !formData.pembayaran}
            className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {!formData.pembayaran ? "Pilih Bukti Pembayaran" : loading ? "Loading..." : "Simpan"}
          </button>
        </form>
      </ShowcaseSection>
    </>
  );
}
