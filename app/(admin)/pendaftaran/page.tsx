"use client";

import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { setDoc, doc, getDoc, serverTimestamp } from "firebase/firestore";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import InputGroup from "@/components/FormElements/InputGroup";
import { Select } from "@/components/FormElements/select";
import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { initialFormData } from "@/types/pendaftaran";
import type { FormData } from "@/types/pendaftaran";
import { useRouter } from "next/navigation";
import JurusanProdiSelect from "@/components/Pendaftaran/JurusanProdiSelect";

type FileKeys = "pasFoto" | "buktiPembayaran" | "buktiFollowSosmed";
type FilesState = Record<FileKeys, File | null>;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "application/pdf",
];

export default function Dashboard() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [files, setFiles] = useState<FilesState>({
    pasFoto: null,
    buktiPembayaran: null,
    buktiFollowSosmed: null,
  });
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // States untuk upload progress modal
  const [isUploadModalVisible, setIsUploadModalVisible] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0); // 0 - 100
  const [currentUploadingFile, setCurrentUploadingFile] = useState<string>(""); // Nama file yang sedang diupload

  // Menyimpan progres tiap file sehingga kita bisa hitung rata-rata
  const perFileProgressRef = useRef<Record<string, number>>({});

  // Ref untuk mencegah setState setelah unmount
  const isMounted = useRef(true);
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const maxSizeInBytes = useMemo(() => 5 * 1024 * 1024, []);

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
        if (snap.exists() && snap.data()?.registration === true) {
          router.push("/review-pendaftaran");
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [user, authLoading, router]);

  // Ambil nama dari doc users (sekali)
  useEffect(() => {
    if (!user?.uid) return;
    let cancelled = false;

    const fetchUserPreview = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (!cancelled && docSnap.exists()) {
          const data = docSnap.data() as Record<string, unknown>;
          const namaDariDoc =
            (data?.namaLengkap as string | undefined) ??
            (data?.name as string | undefined) ??
            (data?.displayName as string | undefined);

          if (namaDariDoc) {
            setFormData((prev) => ({
              ...prev,
              namaLengkap: prev.namaLengkap || namaDariDoc,
            }));
          }
        }
      } catch (err) {
        console.error("Gagal mengambil user data:", err);
      } finally {
        if (!cancelled && isMounted.current) setIsLoading(false);
      }
    };

    fetchUserPreview();

    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  const handleChange = useCallback((field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const sanitizeFileName = (s: string) =>
    s.replace(/[^a-zA-Z0-9\-_.]/g, "_").slice(0, 200);

  const getFileExtension = (name: string) => {
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    fieldName: FileKeys
  ) => {
    const input = e.currentTarget;
    const file = input.files?.[0] ?? null;

    if (!file) {
      setFiles((prev) => ({ ...prev, [fieldName]: null }));
      return;
    }

    // Validasi ukuran
    if (file.size > maxSizeInBytes) {
      setError(`Ukuran file ${fieldName} tidak boleh lebih dari 5MB.`);
      input.value = "";
      return;
    }

    // Validasi tipe
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Tipe file ${fieldName} harus JPG/PNG atau PDF.`);
      input.value = "";
      return;
    }

    setFiles((prev) => ({ ...prev, [fieldName]: file }));
    setError("");
  };

  // Hapus properti undefined dari object
  const removeUndefined = (obj: Record<string, unknown>) =>
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Object.fromEntries(Object.entries(obj).filter(([_, v]) => v !== undefined));

  type UploadResponse = {
    success?: boolean;
    message?: string;
    fileUrl?: string;
    [k: string]: unknown;
  };

  /**
   * uploadSingleFile menggunakan XMLHttpRequest sehingga kita dapat memantau upload progress.
   * onProgress dipanggil dengan angka 0..100.
   * PERBAIKAN: Menambahkan callback untuk update nama file yang sedang diupload
   */
  const uploadSingleFile = (
    file: File,
    key: string,
    onProgress?: (p: number) => void,
    onFileNameUpdate?: (fileName: string) => void
  ): Promise<string> => {
    const baseName = formData.namaLengkap || user?.uid || "user";
    const ext = getFileExtension(file.name) || "bin";
    const newFileName = `${sanitizeFileName(baseName)}-${key}.${ext}`;

    // Update nama file yang sedang diupload
    onFileNameUpdate?.(key);

    return new Promise((resolve, reject) => {
      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("newFileName", newFileName);

        const xhr = new XMLHttpRequest();
        xhr.open("POST", "/api/upload");

        // PERBAIKAN: Progress tracking yang lebih akurat
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            // Console log untuk debugging
            console.log(`Upload progress for ${key}: ${percent}%`);
            onProgress?.(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            const text = xhr.responseText;
            let parsed: UploadResponse = {};
            if (text) {
              try {
                parsed = JSON.parse(text) as UploadResponse;
              } catch (parseError) {
                console.error("Gagal parse response upload:", parseError);
                reject(
                  new Error(
                    "Upload gagal: server mengembalikan response tidak valid."
                  )
                );
                return;
              }
            }
            if (!parsed.success) {
              reject(new Error(parsed.message || "Gagal mengunggah file."));
              return;
            }
            if (!parsed.fileUrl) {
              reject(
                new Error(
                  "Upload berhasil tetapi server tidak mengembalikan fileUrl."
                )
              );
              return;
            }
            resolve(parsed.fileUrl);
          } else {
            reject(new Error("Gagal mengunggah file (status error)."));
          }
        };

        xhr.onerror = () => {
          reject(new Error("Terjadi kesalahan jaringan saat upload."));
        };

        xhr.send(fd);
      } catch (err) {
        reject(err);
      }
    });
  };

  // Fungsi updateOverallProgress dihapus karena tidak digunakan lagi
  // Progress sekarang dihitung langsung dalam uploadFilesSequentially

  /**
   * PERBAIKAN: Upload sequential untuk progress yang lebih jelas
   */
  const uploadFilesSequentially = async (
    entries: [FileKeys, File][]
  ): Promise<string[]> => {
    const urls: string[] = [];

    for (let i = 0; i < entries.length; i++) {
      const [key, file] = entries[i];
      
      // Reset progress untuk file ini
      perFileProgressRef.current[key] = 0;
      
      try {
        const url = await uploadSingleFile(
          file,
          key,
          (progress) => {
            // Update progress untuk file ini
            perFileProgressRef.current[key] = progress;
            
            // Hitung overall progress berdasarkan file yang sudah selesai dan sedang berjalan
            const completedFiles = i; // jumlah file yang sudah selesai
            const currentFileProgress = progress; // progress file saat ini
            const totalFiles = entries.length;
            
            const overallProgress = Math.round(
              ((completedFiles * 100) + currentFileProgress) / totalFiles
            );
            
            console.log(`File ${key}: ${progress}%, Overall: ${overallProgress}%`);
            
            if (isMounted.current) {
              setUploadProgress(overallProgress);
            }
          },
          (fileName) => {
            if (isMounted.current) {
              setCurrentUploadingFile(fileName);
            }
          }
        );
        
        urls.push(url);
        
        // Set progress file ini ke 100% setelah selesai
        perFileProgressRef.current[key] = 100;
        
      } catch (error) {
        throw error;
      }
    }

    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi sebelum mulai loading
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

    if (isLoading) return; // cegah double submit
    setIsLoading(true);
    setError("");

    try {
      // Persiapkan entries yang akan diunggah
      const entries = Object.entries(files).filter(([, v]) => v) as [
        FileKeys,
        File
      ][];

      // PERBAIKAN: Reset semua progress tracking
      perFileProgressRef.current = {};
      entries.forEach(([key]) => {
        perFileProgressRef.current[key] = 0;
      });
      
      setUploadProgress(0);
      setCurrentUploadingFile("");
      setIsUploadModalVisible(true); // tampilkan modal progress

      // PERBAIKAN: Upload file secara sequential untuk tracking yang lebih jelas
      console.log("Memulai upload files...");
      const urls = await uploadFilesSequentially(entries);

      // Set progress complete
      if (isMounted.current) {
        setUploadProgress(100);
        setCurrentUploadingFile("Menyelesaikan...");
      }

      const uploadedFileUrls: Record<string, string> = {};
      entries.forEach(([key], idx) => {
        uploadedFileUrls[key] = urls[idx];
      });

      const finalData = {
        ...formData,
        ...uploadedFileUrls,
        userId: user?.uid,
        createdAt: serverTimestamp(),
        registration: true, // simpan flag sekaligus
      };

      const cleanedData = removeUndefined(finalData);

      if (!user?.uid) throw new Error("User tidak ditemukan saat submit.");

      const docRef = doc(db, "caang_registration", user.uid);
      // merge true agar tidak menimpa field lain
      await setDoc(docRef, cleanedData, { merge: true });

      if (isMounted.current) {
        // Berikan waktu untuk user melihat 100% progress
        setTimeout(() => {
          if (isMounted.current) {
            setIsUploadModalVisible(false);
            alert("Pendaftaran berhasil!");
            router.push("/review-pendaftaran");
          }
        }, 1000); // Increase delay to 1 second
      }
    } catch (err: unknown) {
      console.error("Error dalam proses pendaftaran: ", err);
      if (err instanceof Error) setError(err.message);
      else setError("Terjadi kesalahan tidak diketahui.");
      // sembunyikan modal jika terjadi error
      if (isMounted.current) {
        setIsUploadModalVisible(false);
        setUploadProgress(0);
        setCurrentUploadingFile("");
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
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
              <div className="flex flex-col">
                <InputGroup
                  type="file"
                  fileStyleVariant="style1"
                  label="Pas Foto"
                  placeholder="Masukkan Pas Foto"
                  handleChange={(e) => handleFileChange(e, "pasFoto")}
                  required
                />
                <p className="text-sm mt-2">Jenis file: .jpg, .jpeg, .png</p>
                <p className="text-sm mt-1">Maksimal ukuran file 5MB</p>
              </div>
              <div className="flex flex-col">
                <InputGroup
                  type="file"
                  fileStyleVariant="style1"
                  label="Bukti Pembayaran"
                  placeholder="Masukkan Bukti Pembayaran"
                  handleChange={(e) => handleFileChange(e, "buktiPembayaran")}
                  required
                />
                <p className="text-sm mt-2">Jenis file: .jpg, .jpeg, .png</p>
                <p className="text-sm mt-1">Maksimal ukuran file 5MB</p>
              </div>
            </div>
            <div className="flex flex-col gap-4.5 xl:w-1/2">
              <div className="flex flex-col">
                <InputGroup
                  type="file"
                  fileStyleVariant="style1"
                  label="Bukti Follow Sosmed"
                  placeholder="Masukkan Bukti Follow Sosmed"
                  handleChange={(e) => handleFileChange(e, "buktiFollowSosmed")}
                  required
                />
                <p className="text-sm mt-2">Jenis file: .jpg, .jpeg, .png</p>
                <p className="text-sm mt-1">Maksimal ukuran file 5MB</p>
              </div>
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
            <p className="text-red-500 mb-4">
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

      {/* PERBAIKAN: Modal upload progress yang lebih informatif */}
      {isUploadModalVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-[90%] max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h4 className="mb-3 text-lg font-semibold">Mengunggah file...</h4>
            
            {/* Tampilkan file yang sedang diupload */}
            {currentUploadingFile && (
              <p className="text-sm mb-2 text-gray-600">
                Mengupload: <span className="font-medium">{currentUploadingFile}</span>
              </p>
            )}
            
            <p className="text-sm mb-4">Progress: {uploadProgress}%</p>

            {/* Progress bar dengan animasi yang smooth */}
            <div className="w-full h-3 rounded-md bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>

            <p className="mt-3 text-xs text-gray-500">
              Jangan tutup halaman sampai proses selesai.
            </p>
          </div>
        </div>
      )}
    </>
  );
}