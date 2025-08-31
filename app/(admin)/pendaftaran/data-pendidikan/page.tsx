"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import JurusanProdiSelect from "@/components/Pendaftaran/JurusanProdiSelect";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DataPendidikan() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    asalSekolah: "",
    nim: "",
    jurusan: "",
    prodi: "",
    riwayatOrganisasi: "",
    riwayatPrestasi: "",
    tujuanMasuk: "",
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
        if (snap.exists() && snap.data()?.prodi) {
          router.push("/pendaftaran");
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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
      asalSekolah: "",
      nim: "",
      jurusan: "",
      prodi: "",
      riwayatOrganisasi: "",
      riwayatPrestasi: "",
      tujuanMasuk: "",
    });
  };

  return (
    <>
      <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4.5 text-xl font-semibold">Data Pendidikan</h3>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                name="asalSekolah"
                label="Asal Sekolah"
                type="text"
                placeholder="Masukkan Asal Sekolah"
                value={formData.asalSekolah}
                handleChange={handleChange}
                className="w-full"
                required
              />
              <InputGroup
                name="nim"
                label="NIM"
                type="text"
                placeholder="Masukkan NIM"
                className="w-full"
                value={formData.nim}
                handleChange={handleChange}
                required
              />
            </div>
            <JurusanProdiSelect
              valueJurusan={formData.jurusan}
              valueProdi={formData.prodi}
              onChangeJurusan={(value) =>
                setFormData((prev) => ({ ...prev, jurusan: value }))
              }
              onChangeProdi={(value) =>
                setFormData((prev) => ({ ...prev, prodi: value }))
              }
            />
          </div>

          <TextAreaGroup
            label="Riwayat Organisasi"
            placeholder="Masukkan Riwayat Organisasi"
            className="mb-4.5"
            value={formData.riwayatOrganisasi}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, riwayatOrganisasi: value }))
            }
          />

          <TextAreaGroup
            label="Riwayat Prestasi"
            placeholder="Masukkan Riwayat Prestasi"
            className="mb-4.5"
            value={formData.riwayatPrestasi}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, riwayatPrestasi: value }))
            }
          />

          <TextAreaGroup
            label="Tujuan Masuk UKM-R"
            placeholder="Masukkan Tujuan Masuk UKM-R"
            className="mb-4.5"
            value={formData.tujuanMasuk}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, tujuanMasuk: value }))
            }
            required
          />

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
            disabled={loading}
            className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {loading ? "Loading..." : "Simpan"}
          </button>
        </form>
      </ShowcaseSection>
    </>
  );
}
