"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { setDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { useEffect, useState, useCallback } from "react";
import { initialFormData } from "@/types/pendaftaran";
import type { FormData } from "@/types/pendaftaran";
import { useRouter } from "next/navigation";
import JurusanProdiSelect from "@/components/Pendaftaran/JurusanProdiSelect";

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [files, setFiles] = useState<{ [key: string]: File | null }>({
    pasFoto: null,
    buktiPembayaran: null,
    buktiFollowSosmed: null,
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
      } else {
        const checkVerificationStatus = async () => {
          try {
            const userDoc = await getDoc(doc(db, "users", user.uid));
            if (userDoc.exists() && userDoc.data()?.role === "members") {
              router.push("/dashboard");
            } else if (userDoc.exists() && !userDoc.data()?.role) {
              router.push("/verification");
            } else if (userDoc.data()?.registration === true) {
              router.push("/review-pendaftaran");
            }
          } catch (err) {
            console.error("Gagal cek role:", err);
          }
        };
        checkVerificationStatus();
      }
    }
  }, [authLoading, user, router]);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi Ukuran File (5MB)
      const maxSizeInBytes = 5 * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        setError(`Ukuran file ${fieldName} tidak boleh lebih dari 5MB.`);
        e.target.value = ""; // Reset input file
        return;
      }

      // Validasi Tipe File
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "application/pdf",
      ];
      if (!allowedTypes.includes(file.type)) {
        setError(`Tipe file ${fieldName} harus gambar (JPG, PNG) atau PDF.`);
        e.target.value = ""; // Reset input file
        return;
      }

      // Jika valid, simpan ke state
      setFiles((prev) => ({ ...prev, [fieldName]: file }));
      setError(""); // Hapus pesan error jika berhasil
    }
  };

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  // Ambil preview nama dari users (sekali) — hanya untuk mengisi namaLengkap awal
  useEffect(() => {
    if (!user?.uid) return;

    const fetchUserPreview = async () => {
      try {
        setIsLoading(true);
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const namaDariDoc =
            (data?.namaLengkap as string | undefined) ??
            (data?.name as string | undefined) ??
            (data?.displayName as string | undefined);

          if (namaDariDoc) {
            // hanya atur nama jika saat ini masih kosong (tidak menimpa input user)
            setFormData((prev) => ({
              ...prev,
              namaLengkap: prev.namaLengkap || namaDariDoc,
            }));
          }
        }
      } catch (error) {
        console.error("Gagal mengambil user data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserPreview();
  }, [user?.uid]);

  const removeUndefined = (obj: Record<string, unknown>) => {
    return Object.fromEntries(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      Object.entries(obj).filter(([_, v]) => v !== undefined)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.namaLengkap || !formData.nim || !formData.noHp) {
      setError("Lengkapi Nama Lengkap, NIM, dan No HP sebelum submit.");
      return;
    }

    if (!files.pasFoto || !files.buktiPembayaran || !files.buktiFollowSosmed) {
      setError(
        "Lengkapi semua file dokumen pendukung (Pas Foto, Bukti Bayar, Bukti Follow)."
      );
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const uploadedFileUrls: { [key: string]: string } = {};

      // Proses unggah untuk setiap file
      for (const key of Object.keys(files)) {
        const file = files[key];
        if (file) {
          // 1. Mengubah Nama File
          const fileExtension = file.name.split(".").pop();
          const cleanUserName = formData.namaLengkap.replace(
            /[^a-zA-Z0-9]/g,
            "_"
          ); // Bersihkan nama user
          const newFileName = `${cleanUserName}-${key}.${fileExtension}`;

          // 2. Kirim ke API
          const uploadFormData = new FormData();
          uploadFormData.append("file", file);
          uploadFormData.append("newFileName", newFileName); // Kirim nama baru ke API

          const response = await fetch("/api/upload", {
            method: "POST",
            body: uploadFormData,
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.message || "Gagal mengunggah file.");
          }

          // 3. Simpan URL yang dikembalikan API
          uploadedFileUrls[key] = result.fileUrl; // Asumsikan API mengembalikan { success: true, fileUrl: '...' }
        }
      }

      // 4. Gabungkan data form dengan URL file
      const finalData = {
        ...formData,
        ...uploadedFileUrls, // Menimpa/menambah field pasFoto, dll. dengan URL
        userId: user?.uid,
        createdAt: serverTimestamp(),
      };

      const cleanedData = removeUndefined(finalData);

      // 5. Simpan semua data ke Firestore
      const docRef = doc(db, "caang_registration", user!.uid);
      await setDoc(docRef, cleanedData);
      const userDocRef = doc(db, "users", user!.uid);
      await updateDoc(userDocRef, {
        registration: true,
      });

      console.log("Data berhasil disimpan ke Firestore:", cleanedData);

      alert("Pendaftaran berhasil!");
      router.push("/review-pendaftaran");
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error dalam proses pendaftaran: ", error);
        setError(error.message || "Terjadi kesalahan saat mengirim data.");
      } else {
        console.error("Unknown error: ", error);
        setError("Terjadi kesalahan tidak diketahui.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <>
      <ShowcaseSection title="Formulir Pendaftaran CAANG" className="!p-6.5">
        <form onSubmit={handleSubmit}>
          <h3 className="mb-4.5 text-xl font-semibold">Data Pribadi</h3>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                label="Nama Lengkap"
                type="text"
                placeholder="Contoh: Budi Santoso"
                value={formData.namaLengkap}
                handleChange={(e) =>
                  handleChange("namaLengkap", e.target.value)
                }
                className="w-full"
                required
              />
              <InputGroup
                label="Nama Panggilan"
                type="text"
                placeholder="Masukkan Nama Panggilan"
                className="w-full"
                value={formData.namaPanggilan}
                handleChange={(e) =>
                  handleChange("namaPanggilan", e.target.value)
                }
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
                onChange={(value) => handleChange("jenisKelamin", value)}
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
                onChange={(value) => handleChange("agama", value)}
                required
              />
            </div>
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                label="Tempat Lahir"
                type="text"
                placeholder="Masukkan Tempat Lahir"
                className="w-full"
                value={formData.tempatLahir}
                handleChange={(e) =>
                  handleChange("tempatLahir", e.target.value)
                }
                required
              />
              <InputGroup
                label="Tanggal Lahir"
                type="date"
                placeholder="Masukkan Tanggal Lahir"
                className="w-full"
                value={formData.tanggalLahir}
                handleChange={(e) =>
                  handleChange("tanggalLahir", e.target.value)
                }
                required
              />
            </div>
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                label="No HP"
                type="tel"
                placeholder="08xx..."
                className="w-full xl:w-1/2"
                value={formData.noHp}
                handleChange={(e) => handleChange("noHp", e.target.value)}
                required
              />
              <InputGroup
                label="Instagram"
                type="text"
                placeholder="@username"
                className="w-full xl:w-1/2"
                value={formData.instagram}
                handleChange={(e) => handleChange("instagram", e.target.value)}
                required
              />
            </div>
          </div>

          <TextAreaGroup
            label="Alamat Asal"
            placeholder="Masukkan Alamat Asal"
            className="mb-4.5"
            value={formData.alamatAsal}
            onChange={(value) => handleChange("alamatAsal", value)}
            required
          />

          <TextAreaGroup
            label="Alamat Domisili"
            placeholder="Masukkan Alamat Domisili"
            value={formData.alamatDomisili}
            onChange={(value) => handleChange("alamatDomisili", value)}
            required
          />

          <h3 className="mb-4.5 mt-6 text-xl font-semibold">Data Pendidikan</h3>
          <div className="mb-4.5 flex flex-col gap-4.5">
            <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <InputGroup
                label="Asal Sekolah"
                type="text"
                placeholder="Masukkan Asal Sekolah"
                value={formData.asalSekolah}
                handleChange={(e) =>
                  handleChange("asalSekolah", e.target.value)
                }
                className="w-full"
                required
              />
              <InputGroup
                label="NIM"
                type="text"
                placeholder="Masukkan NIM"
                className="w-full"
                value={formData.nim}
                handleChange={(e) => handleChange("nim", e.target.value)}
                required
              />
            </div>
            <JurusanProdiSelect
              valueJurusan={formData.jurusan}
              valueProdi={formData.prodi}
              onChangeJurusan={(j) => handleChange("jurusan", j)}
              onChangeProdi={(p) => handleChange("prodi", p)}
            />
            {/* <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
              <Select
                label="Jurusan"
                placeholder="Pilih Jurusan"
                className="w-full"
                items={[
                  { label: "Elektro", value: "elektro" },
                  {
                    label: "Teknologi Informasi",
                    value: "teknologiInformasi",
                  },
                ]}
                value={formData.jurusan ?? ""}
                onChange={(value) => handleChange("jurusan", value)}
                required
              />
              <Select
                label="Program Studi"
                placeholder="Pilih Program Studi"
                className="w-full"
                items={[
                  { label: "D4 Elektronika", value: "d4Elektronika" },
                  { label: "D3 Elektronika", value: "d3Elektronika" },
                ]}
                value={formData.prodi ?? ""}
                onChange={(value) => handleChange("prodi", value)}
                required
              />
            </div> */}
          </div>

          <TextAreaGroup
            label="Riwayat Organisasi"
            placeholder="Masukkan Riwayat Organisasi"
            className="mb-4.5"
            value={formData.riwayatOrganisasi}
            onChange={(value) => handleChange("riwayatOrganisasi", value)}
          />

          <TextAreaGroup
            label="Riwayat Prestasi"
            placeholder="Masukkan Riwayat Prestasi"
            className="mb-4.5"
            value={formData.riwayatPrestasi}
            onChange={(value) => handleChange("riwayatPrestasi", value)}
          />

          <TextAreaGroup
            label="Tujuan Masuk UKM-R"
            placeholder="Masukkan Tujuan Masuk UKM-R"
            className="mb-4.5"
            value={formData.tujuanMasuk}
            onChange={(value) => handleChange("tujuanMasuk", value)}
            required
          />

          <h3 className="mb-4.5 mt-6 text-xl font-semibold">
            Dokumen Pendukung
          </h3>
          <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
            <div className="flex flex-col gap-4.5 xl:w-1/2">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Pas Foto"
                placeholder="Masukkan Pas Foto"
                handleChange={(e) => handleFileChange(e, "pasFoto")}
                required
              />

              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Pembayaran"
                placeholder="Masukkan Bukti Pembayaran"
                handleChange={(e) => handleFileChange(e, "buktiPembayaran")}
                required
              />
            </div>

            <div className="flex flex-col gap-4.5 xl:w-1/2">
              <InputGroup
                type="file"
                fileStyleVariant="style1"
                label="Bukti Follow Sosmed"
                placeholder="Masukkan Bukti Follow Sosmed"
                handleChange={(e) => handleFileChange(e, "buktiFollowSosmed")}
                required
              />
            </div>
          </div>

          <h3 className="mb-4.5 mt-6 text-xl font-semibold">Data Orang Tua</h3>
          <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
            <div className="flex flex-col gap-4.5 xl:w-1/2">
              <InputGroup
                label="Nama Orang Tua"
                type="text"
                placeholder="Masukkan Nama Orang Tua"
                className="w-full"
                value={formData.namaOrangTua}
                handleChange={(e) =>
                  handleChange("namaOrangTua", e.target.value)
                }
                required
              />
            </div>

            <div className="flex flex-col gap-4.5 xl:w-1/2">
              <InputGroup
                label="No HP Orang Tua"
                type="tel"
                placeholder="08xx..."
                className="w-full"
                value={formData.noHpOrangTua}
                handleChange={(e) =>
                  handleChange("noHpOrangTua", e.target.value)
                }
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500">
              <span className="font-semibold">Error:</span> {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="mt-6 flex w-full justify-center rounded-lg bg-primary p-[13px] font-medium text-white hover:bg-opacity-90 disabled:opacity-60"
          >
            {isLoading ? "Loading..." : "Daftar"}
          </button>
        </form>
      </ShowcaseSection>
    </>
  );
}
