"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseConfig";
import { User as FirebaseUser } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";
import Link from "next/link";
import {
  FillDataFormValues,
  getFillData,
  saveFillData,
  getJurusanProdi,
} from "@/lib/firebase/services/fill-data-service";
import PersonalDataForm from "@/components/Dashboard/caang/fill-data/PersonalDataForm";
import AcademicDataForm from "@/components/Dashboard/caang/fill-data/AcademicDataForm";
import RegistrationForm from "@/components/Dashboard/caang/fill-data/RegistrationForm";
import { Jurusan } from "@/types/jurusan-prodi";

export default function FillDataPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FillDataFormValues>({
    fullName: "",
    nickname: "",
    nim: "",
    phone: "",
    gender: "",
    birthPlace: "",
    birthDate: "",
    address: "",
    major: "",
    department: "",
    entryYear: new Date().getFullYear().toString(),
    motivation: "",
    experience: "",
    achievement: "",
  });

  const [jurusanList, setJurusanList] = useState<Jurusan[]>([]);
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const [data, jurusanData] = await Promise.all([
            getFillData(currentUser.uid),
            getJurusanProdi(),
          ]);
          setFormData(data);
          setJurusanList(jurusanData);
        } catch (error) {
          console.error(error);
          toast.error("Gagal memuat data");
        } finally {
          setLoading(false);
        }
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribe();
  }, [router]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => {
      const updates: Partial<FillDataFormValues> = {
        [name as keyof FillDataFormValues]: value,
      };
      // Reset department if major changes
      if (name === "major") {
        updates.department = "";
      }
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validasi sederhana
    if (
      !formData.fullName ||
      !formData.phone ||
      !formData.nim ||
      !formData.motivation ||
      !formData.major || // Major wajib
      !formData.department // Department wajib
    ) {
      toast.error(
        "Mohon lengkapi field wajib (Nama, HP, NIM, Jurusan, Prodi, Motivasi)"
      );
      return;
    }

    try {
      setSaving(true);
      await saveFillData(user.uid, formData);

      toast.success("Data berhasil disimpan", {
        description: "Anda akan dialihkan kembali ke dashboard",
      });

      // Redirect back to dashboard after short delay
      setTimeout(() => {
        router.push("/dashboard");
      }, 1500);
    } catch (error) {
      console.error("Error saving data:", error);
      toast.error("Gagal menyimpan data");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 flex items-center gap-2 mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Kembali ke Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Lengkapi Data Diri
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Silakan isi formulir di bawah ini dengan data yang sebenar-benarnya.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <PersonalDataForm
            formData={formData}
            handleChange={handleInputChange}
            handleSelectChange={handleSelectChange}
          />

          <AcademicDataForm
            formData={formData}
            handleChange={handleInputChange}
            handleSelectChange={handleSelectChange}
            jurusanList={jurusanList}
          />

          <RegistrationForm
            formData={formData}
            handleChange={handleInputChange}
          />

          <div className="flex justify-end gap-4 pt-4 dark:border-gray-700">
            <Link href="/dashboard">
              <Button variant="outline" type="button">
                Batal
              </Button>
            </Link>
            <Button
              type="submit"
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Simpan & Lanjutkan
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
