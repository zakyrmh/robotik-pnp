"use client";

import { UploadButton } from "@/utils/uploadthing";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function DataPribadi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    pasFoto: "",
    followIgRobotik: "",
    followIgMrc: "",
    subscribeYoutube: "",
  });
  const [loading, setLoading] = useState(false); // ✅ default false
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
        if (snap.exists() && snap.data()?.followIgRobotik) {
          // ✅ typo diperbaiki
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
      pasFoto: "",
      followIgRobotik: "",
      followIgMrc: "",
      subscribeYoutube: "",
    });
  };

  const isFormComplete =
    formData.pasFoto &&
    formData.followIgRobotik &&
    formData.followIgMrc &&
    formData.subscribeYoutube;

  return (
    <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
      <form onSubmit={handleSubmit}>
        <h3 className="mb-4.5 text-xl font-semibold">Dokumen Pendukung</h3>
        <div className="mb-4.5 flex flex-col gap-4.5">
          {/* Baris 1 */}
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4 xl:justify-around xl:items-center">
            {/* Pas Foto */}
            <div className="xl:text-center">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Pas Foto
              </label>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const firstFile = res[0];
                  setFormData({
                    ...formData,
                    pasFoto: firstFile.url,
                  });
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
            {/* IG Robotik */}
            <div className="xl:text-center">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Follow Instagram{" "}
                <Link
                  href="https://instagram.com/robotikpnp"
                  target="_blank"
                  className="text-primary"
                >
                  @robotikpnp
                </Link>
              </label>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const firstFile = res[0];
                  setFormData({
                    ...formData,
                    followIgRobotik: firstFile.url,
                  });
                  console.log("Files: ", res);
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
          </div>

          {/* Baris 2 */}
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4 xl:justify-around xl:items-center">
            {/* IG MRC */}
            <div className="xl:text-center">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Follow Instagram{" "}
                <Link
                  href="https://instagram.com/mrcpnp"
                  target="_blank"
                  className="text-primary"
                >
                  @mrcpnp
                </Link>
              </label>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const firstFile = res[0];
                  setFormData({
                    ...formData,
                    followIgMrc: firstFile.url,
                  });
                  console.log("Files: ", res);
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
            </div>
            {/* YouTube */}
            <div className="xl:text-center">
              <label className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Subscribe YouTube{" "}
                <Link
                  href="https://www.youtube.com/@ukmrobotikpnp2230"
                  target="_blank"
                  className="text-primary"
                >
                  UKM Robotik PNP
                </Link>
              </label>
              <UploadButton
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const firstFile = res[0];
                  setFormData({
                    ...formData,
                    subscribeYoutube: firstFile.url,
                  });
                  console.log("Files: ", res);
                }}
                onUploadError={(error: Error) => {
                  alert(`ERROR! ${error.message}`);
                }}
              />
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
            <span className="font-semibold">Error:</span> {error}
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
