"use client";

import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function DataPribadi() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
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
        if (snap.exists() && snap.data()?.namaLengkap) {
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
        await setDoc(doc(db, "caang_registration", user?.uid), {
          ...formData,
          tanggalLahir: Timestamp.fromDate(new Date(formData.tanggalLahir)),
          createdAt: Timestamp.now(),
          uid: user?.uid,
        });
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
  };

  return (
    <>
      <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4.5 text-xl font-semibold">Data Pribadi</h3>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                name="namaLengkap"
                label="Nama Lengkap"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={formData.namaLengkap}
                handleChange={handleChange}
                className="w-full"
                required
              />
              <InputGroup
                name="namaPanggilan"
                label="Nama Panggilan"
                type="text"
                placeholder="Masukkan Nama Panggilan"
                className="w-full"
                value={formData.namaPanggilan}
                handleChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <Select
                label="Jenis Kelamin"
                placeholder="Pilih Jenis Kelamin"
                className="w-full"
                items={[
                  { label: "Laki-laki", value: "laki-laki" },
                  { label: "Perempuan", value: "perempuan" },
                ]}
                value={formData.jenisKelamin ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, jenisKelamin: value }))
                }
                required
              />
              <Select
                label="Agama"
                placeholder="Pilih Agama"
                className="w-full"
                items={[
                  { label: "Islam", value: "islam" },
                  { label: "Kristen", value: "kristen" },
                  { label: "Katolik", value: "katolik" },
                  { label: "Hindu", value: "hindu" },
                  { label: "Budha", value: "budha" },
                  { label: "Konghucu", value: "konghucu" },
                  { label: "Lainnya", value: "lainnya" },
                ]}
                value={formData.agama ?? ""}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, agama: value }))
                }
                required
              />
            </div>
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                name="tempatLahir"
                label="Tempat Lahir"
                type="text"
                placeholder="Masukkan Tempat Lahir"
                className="w-full"
                value={formData.tempatLahir}
                handleChange={handleChange}
                required
              />
              <InputGroup
                name="tanggalLahir"
                label="Tanggal Lahir"
                type="date"
                placeholder="Masukkan Tanggal Lahir"
                className="w-full"
                value={formData.tanggalLahir}
                handleChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                name="noHp"
                label="No HP"
                type="tel"
                placeholder="08xx..."
                className="w-full xl:w-1/2"
                value={formData.noHp}
                handleChange={handleChange}
                required
              />
              <InputGroup
                name="instagram"
                label="Instagram"
                type="text"
                placeholder="@username"
                className="w-full xl:w-1/2"
                value={formData.instagram}
                handleChange={handleChange}
                required
              />
            </div>
          </div>

          <TextAreaGroup
            label="Alamat Asal"
            placeholder="Masukkan Alamat Asal"
            className="mb-4.5"
            value={formData.alamatAsal}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, alamatAsal: value }))
            }
            required
          />

          <TextAreaGroup
            label="Alamat Domisili"
            placeholder="Masukkan Alamat Domisili"
            value={formData.alamatDomisili}
            onChange={(value) =>
              setFormData((prev) => ({ ...prev, alamatDomisili: value }))
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
