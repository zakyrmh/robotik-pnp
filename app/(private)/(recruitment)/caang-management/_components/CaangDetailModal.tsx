"use client";

import Image from "next/image";
import { Timestamp } from "firebase/firestore";
import { User } from "@/types/users";
import { Registration } from "@/types/registrations";
import { Gender } from "@/types/enum"; // Sesuaikan path enum

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School } from "lucide-react";
import FirebaseImage from "@/components/FirebaseImage";

// Helper function untuk tanggal
const formatDate = (timestamp?: Timestamp) => {
  if (!timestamp) return "-";
  return new Date(timestamp.seconds * 1000).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

interface CaangDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  registration: Registration | null | undefined;
  onVerifyPayment: (regId: string) => void;
  onVerifyData: (regId: string) => void;
  onOpenBlacklist: () => void;
}

export default function CaangDetailModal({
  isOpen,
  onClose,
  user,
  registration,
  onVerifyPayment,
  onVerifyData,
  onOpenBlacklist,
}: CaangDetailModalProps) {
  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl">
            {user.profile.fullName}
            <Badge variant="outline" className="text-sm font-normal">
              {user.profile.nim}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Detail data pendaftar, berkas, dan hasil seleksi.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="biodata" className="mt-4">
          <TabsList className="grid w-full h-auto grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger
              value="biodata"
              className="h-full whitespace-normal py-2"
            >
              Biodata
            </TabsTrigger>
            <TabsTrigger
              value="berkas"
              className="h-full whitespace-normal py-2"
            >
              Berkas & Pembayaran
            </TabsTrigger>
            <TabsTrigger
              value="essay"
              className="h-full whitespace-normal py-2"
            >
              Essay & Motivasi
            </TabsTrigger>
            <TabsTrigger
              value="penilaian"
              className="h-full whitespace-normal py-2"
            >
              Riwayat & Nilai
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: BIODATA */}
          <TabsContent value="biodata" className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="Nama Lengkap" value={user.profile.fullName} />
              <InfoRow label="NIM" value={user.profile.nim} />
              <InfoRow label="Jurusan" value={user.profile.major} />
              <InfoRow label="Prodi" value={user.profile.department} />
              <InfoRow
                label="Jenis Kelamin"
                value={
                  user.profile.gender === Gender.MALE
                    ? "Laki-laki"
                    : "Perempuan"
                }
              />
              <InfoRow
                label="Tempat, Tgl Lahir"
                value={`${user.profile.birthPlace}, ${formatDate(
                  user.profile.birthDate
                )}`}
              />
              <InfoRow label="No. HP / WA" value={user.profile.phone} />
              <InfoRow
                label="Alamat Domisili"
                value={user.profile.address}
                className="col-span-2"
              />
            </div>

            {/* ACTION: VERIFIKASI DATA */}
            {registration && !registration.verification?.verified && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-xl border border-yellow-200 dark:border-yellow-800">
                <div className="text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold">Menunggu Verifikasi Data</p>
                  <p className="text-sm">
                    Pastikan data diri peserta sudah benar sebelum melanjutkan
                    ke tahap upload dokumen.
                  </p>
                </div>
                <Button
                  onClick={() => onVerifyData(registration.id)}
                  className="bg-yellow-600 hover:bg-yellow-700 text-white whitespace-nowrap"
                >
                  Verifikasi Data Diri
                </Button>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: BERKAS & PEMBAYARAN */}
          <TabsContent value="berkas" className="space-y-6 py-4">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Pas Foto</CardTitle>
                </CardHeader>
                <CardContent className="flex justify-center">
                  {registration?.documents.photoUrl ? (
                    <FirebaseImage
                      path={registration?.documents.photoUrl}
                      width={100}
                      height={100}
                      alt={user.profile.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <p className="text-muted-foreground italic">Belum upload</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">Bukti Pembayaran</CardTitle>
                  {registration?.payment.verified && (
                    <Badge className="bg-green-600">Terverifikasi</Badge>
                  )}
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="bg-gray-100 rounded h-48 flex items-center justify-center overflow-hidden border">
                    {registration?.payment.proofUrl ? (
                      <a
                        href={registration.payment.proofUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Image
                          src={registration.payment.proofUrl}
                          className="h-full w-full object-contain hover:scale-105 transition-transform"
                          alt="Bukti Bayar"
                          width={100}
                          height={100}
                          unoptimized
                        />
                      </a>
                    ) : (
                      <p className="text-muted-foreground italic">
                        Belum upload bukti bayar
                      </p>
                    )}
                  </div>

                  {/* Action Buttons inside Modal */}
                  {registration?.payment.proofUrl &&
                    !registration.payment.verified && (
                      <div className="flex gap-2">
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={() => onVerifyPayment(registration.id)}
                        >
                          Terima Pembayaran
                        </Button>
                        <Button variant="destructive" className="w-full">
                          Tolak
                        </Button>
                      </div>
                    )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* TAB 3: ESSAY */}
          <TabsContent value="essay" className="space-y-4 py-4">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Motivasi Masuk Robotik</h3>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {registration?.motivation || "Tidak ada data."}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Pengalaman Organisasi</h3>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {registration?.experience || "-"}
                </div>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Prestasi</h3>
                <div className="p-3 bg-muted rounded-md text-sm whitespace-pre-wrap">
                  {registration?.achievement || "-"}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* TAB 4: PENILAIAN */}
          <TabsContent value="penilaian" className="py-4">
            <div className="flex flex-col items-center justify-center h-40 border-2 border-dashed rounded-lg text-muted-foreground">
              <School className="h-8 w-8 mb-2" />
              <p>Data nilai wawancara dan absensi belum tersedia.</p>
              <Button variant="link" size="sm">
                Input Nilai Manual
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-6 border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button
            variant="destructive"
            onClick={onOpenBlacklist}
            disabled={user?.blacklistInfo?.isBlacklisted}
          >
            {user?.blacklistInfo?.isBlacklisted
              ? "Sudah Di-blacklist"
              : "Blacklist Peserta"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function InfoRow({
  label,
  value,
  className = "",
}: {
  label: string;
  value?: string;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <span className="text-xs text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <span className="font-medium text-sm">{value || "-"}</span>
    </div>
  );
}
