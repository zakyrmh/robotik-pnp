"use client";

import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import { useAuth } from "@/hooks/useAuth";
import { db } from "@/lib/firebaseConfig";
import { doc, getDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { FormData } from "@/types/pendaftaran";
import ViewInput from "@/components/FormElements/View";
import Image from "next/image";

export default function ReviewPendaftaran() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [data, setData] = useState<FormData | null>(null);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/login");
        return; // penting biar ga lanjut ke bawah
      }
    }

    const checkRegistration = async () => {
      try {
        if (!user?.uid) return; // pastikan UID ada

        const docRef = doc(db, "caang_registration", user.uid);
        const snap = await getDoc(docRef);

        if (snap.exists()) {
          setData(snap.data() as FormData);
          if (snap.data().registration !== true) {
            router.push("/review-pendaftaran");
          }
        } else {
          setData(null);
          router.push("/review-pendaftaran");
        }
      } catch (err) {
        console.error("Gagal cek pendaftaran:", err);
      }
    };

    checkRegistration();
  }, [authLoading, user, router]);

  return (
    <>
      <ShowcaseSection title="Review Pendaftaran">
        <h3 className="mb-4.5 text-xl font-semibold">Data Pribadi</h3>
        <div className="mb-4.5 flex flex-col gap-4.5">
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
            <div className="w-full">
              <ViewInput
                className="w-full"
                label="Nama Lengkap"
                value={data?.namaLengkap}
              />
              <ViewInput
                className="w-full"
                label="Nama Panggilan"
                value={data?.namaPanggilan}
              />
              <ViewInput
                className="w-full"
                label="Jenis Kelamin"
                value={data?.jenisKelamin}
              />
              <ViewInput className="w-full" label="Agama" value={data?.agama} />
            </div>
            <div>
              <Image
                src={data?.pasFoto || "/images/Loading_icon.gif"}
                alt="bukti pembayaran"
                width={300}
                height={300}
              />
            </div>
          </div>
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
            <ViewInput
              className="w-full"
              label="Tempat Lahir"
              value={data?.tempatLahir}
            />
            <ViewInput
              className="w-full"
              label="Tanggal Lahir"
              value={data?.tanggalLahir}
            />
          </div>
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
            <ViewInput className="w-full" label="No HP" value={data?.noHp} />
            <ViewInput
              className="w-full"
              label="Instagram"
              value={data?.instagram}
            />
          </div>
        </div>

        <ViewInput
          className="w-full"
          label="Alamat Asal"
          value={data?.alamatAsal}
        />
        <ViewInput
          className="w-full mt-4.5"
          label="Alamat Domisili"
          value={data?.alamatDomisili}
        />

        <h3 className="mb-4.5 mt-6 text-xl font-semibold">Data Pendidikan</h3>
        <div className="mb-4.5 flex flex-col gap-4.5">
          <div className="flex flex-col gap-4.5 xl:flex-row xl:gap-4">
            <ViewInput
              className="w-full"
              label="Asal Sekolah"
              value={data?.asalSekolah}
            />
            <ViewInput className="w-full" label="NIM" value={data?.nim} />
          </div>
          <ViewInput className="w-full" label="Jurusan" value={data?.jurusan} />
          <ViewInput
            className="w-full"
            label="Program Studi"
            value={data?.prodi}
          />
        </div>

        <ViewInput
          className="w-full"
          label="Riwayat Organisasi"
          value={data?.riwayatOrganisasi}
        />
        <ViewInput
          className="w-full mt-4.5"
          label="Riwayat Prestasi"
          value={data?.riwayatPrestasi}
        />
        <ViewInput
          className="w-full mt-4.5"
          label="Tujuan Masuk"
          value={data?.tujuanMasuk}
        />

        <h3 className="mb-4.5 mt-6 text-xl font-semibold">Dokumen Pendukung</h3>
        <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
          <div className="flex flex-col gap-4.5 xl:w-1/2">
            <div className="w-full">
              <h4 className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Pembayaran
              </h4>

              <div className="relative mt-2 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:-translate-y-1/2">
                <Image
                  src={data?.buktiPembayaran || "/images/Loading_icon.gif"}
                  alt="bukti pembayaran"
                  width={400}
                  height={400}
                />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4.5 xl:w-1/2">
            <div className="w-full">
              <h4 className="text-body-sm font-medium text-dark dark:text-white">
                Bukti Follow Sosmed
              </h4>

              <div className="relative mt-2 [&_svg]:absolute [&_svg]:top-1/2 [&_svg]:-translate-y-1/2">
                <Image
                  src={data?.buktiFollowSosmed || "/images/Loading_icon.gif"}
                  alt="bukti pembayaran"
                  width={400}
                  height={400}
                />
              </div>
            </div>
          </div>
        </div>

        <h3 className="mb-4.5 mt-6 text-xl font-semibold">Data Orang Tua</h3>
        <div className="mb-4.5 flex flex-col gap-4.5 xl:flex-row">
          <div className="flex flex-col gap-4.5 xl:w-1/2">
            <ViewInput
              className="w-full"
              label="Nama Orang Tua"
              value={data?.namaOrangTua}
            />
          </div>

          <div className="flex flex-col gap-4.5 xl:w-1/2">
            <ViewInput
              className="w-full"
              label="No HP Orang Tua"
              value={data?.noHpOrangTua}
            />
          </div>
        </div>
      </ShowcaseSection>
    </>
  );
}
