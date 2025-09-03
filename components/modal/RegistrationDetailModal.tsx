/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { FormData } from "@/types/pendaftaran";
import { ScrollArea } from "@/components/ui/scroll-area";
import { doc, deleteDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";

function formatDate(value: unknown): string {
  if (!value) return "-";
  if (typeof value === "string") return value;

  const v: any = value;
  if (typeof v.toDate === "function") {
    try {
      return v.toDate().toLocaleDateString("id-ID");
    } catch {
      return String(value);
    }
  }
  if (typeof v.seconds === "number" && typeof v.nanoseconds === "number") {
    try {
      const ms = v.seconds * 1000 + Math.floor(v.nanoseconds / 1e6);
      return new Date(ms).toLocaleDateString("id-ID");
    } catch {
      return String(value);
    }
  }
  return String(value);
}

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: FormData | null;
};

export default function RegistrationDetailModal({
  open,
  onOpenChange,
  data,
}: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  if (!data) return null;

  // Fungsi hapus data Firestore
  const handleDelete = async () => {
    if (!data.uid) return;
    try {
      setLoading(true);

      // hapus dokumen di caang_registration
      await deleteDoc(doc(db, "caang_registration", data.uid));

      // hapus dokumen di users
      await deleteDoc(doc(db, "users", data.uid));

      alert("Data calon anggota berhasil dihapus ✅");
      setConfirmOpen(false);
      onOpenChange(false);
      router.push("/dashboard");
    } catch (err) {
      console.error("Gagal hapus data:", err);
      alert("Gagal hapus data ❌");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Detail Calon Anggota</DialogTitle>
          </DialogHeader>

          {/* Scrollable content */}
          <ScrollArea className="flex-1 overflow-y-auto pr-2">
            <div className="space-y-8">
              {/* Foto */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="flex flex-col items-center text-center">
                  <p className="font-medium mb-2">Pas Foto</p>
                  {data.pasFoto ? (
                    <Image
                      src={data.pasFoto}
                      alt="Pas Foto"
                      width={180}
                      height={180}
                      className="rounded-lg object-cover max-h-48 shadow"
                    />
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="font-medium mb-2">Bukti Pembayaran</p>
                  {data.pembayaran ? (
                    <Image
                      src={data.pembayaran}
                      alt="Bukti Pembayaran"
                      width={220}
                      height={160}
                      className="rounded-lg object-contain max-h-48 shadow"
                    />
                  ) : (
                    <p>-</p>
                  )}
                </div>

                <div className="flex flex-col items-center text-center">
                  <p className="font-medium mb-2">Follow Sosmed</p>
                  {data.followIgRobotik ? (
                    <Image
                      src={data.followIgRobotik}
                      alt="Bukti Follow"
                      width={180}
                      height={140}
                      className="rounded-lg object-contain max-h-48 shadow"
                    />
                  ) : (
                    <p>-</p>
                  )}
                </div>
              </div>

              {/* Data teks */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm break-words">
                <div>
                  <p className="font-medium">Nama Lengkap</p>
                  <p>{data.namaLengkap || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Nama Panggilan</p>
                  <p>{data.namaPanggilan || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Jenis Kelamin</p>
                  <p>{data.jenisKelamin || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Agama</p>
                  <p>{data.agama || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Tempat, Tanggal Lahir</p>
                  <p>
                    {data.tempatLahir || "-"},{" "}
                    {formatDate((data as any).tanggalLahir)}
                  </p>
                </div>
                <div>
                  <p className="font-medium">No. HP</p>
                  <p>{data.noHp || "-"}</p>
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="font-medium">Alamat Asal</p>
                  <p>{data.alamatAsal || "-"}</p>
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="font-medium">Alamat Domisili</p>
                  <p>{data.alamatDomisili || "-"}</p>
                </div>
                <div>
                  <p className="font-medium">Prodi / Jurusan</p>
                  <p>
                    {data.prodi || "-"} / {data.jurusan || "-"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">NIM</p>
                  <p>{data.nim || "-"}</p>
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="font-medium">Riwayat Organisasi</p>
                  <p>{data.riwayatOrganisasi || "-"}</p>
                </div>
                <div className="sm:col-span-2 md:col-span-3">
                  <p className="font-medium">Riwayat Prestasi</p>
                  <p>{data.riwayatPrestasi || "-"}</p>
                </div>
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="flex gap-2 justify-end pt-2 border-t">
            <Button variant="secondary">Edit</Button>
            <Button
              variant="destructive"
              onClick={() => setConfirmOpen(true)}
              disabled={loading}
            >
              {loading ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pop up konfirmasi hapus */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Yakin ingin menghapus?</AlertDialogTitle>
            <AlertDialogDescription>
              Data calon anggota <b>{data.namaLengkap}</b> akan dihapus dari
              sistem. Tindakan ini tidak bisa dibatalkan!
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
