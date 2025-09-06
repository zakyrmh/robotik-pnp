// components/admin/UserDetailModal.tsx
"use client";

import { FormDataCaang } from "@/types/caang";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  Phone,
  MapPin,
  GraduationCap,
  Users,
  Trophy,
  Camera,
  Instagram,
  CreditCard,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import { Timestamp } from "firebase/firestore";

interface UserData {
  uid: string;
  email: string;
  role: string;
  namaLengkap?: string;
  caang?: FormDataCaang;
}

interface UserDetailModalProps {
  user: UserData;
  onClose: () => void;
}

export default function UserDetailModal({
  user,
  onClose,
}: UserDetailModalProps) {
  const formatDate = (date?: string | Timestamp) => {
    if (!date) return "Tidak diisi";

    try {
      // Handle Firestore Timestamp
      if (typeof date === "object" && date.seconds) {
        return new Date(date.seconds * 1000).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      // Handle string date
      if (typeof date === "string") {
        return new Date(date).toLocaleDateString("id-ID", {
          day: "2-digit",
          month: "long",
          year: "numeric",
        });
      }

      return "Format tanggal tidak valid";
    } catch (error) {
      console.error("Error parsing date:", error);
      return "Tidak diisi";
    }
  };

  const formatValue = (value?: string | boolean) => {
    if (value === undefined || value === null || value === "") {
      return "Tidak diisi";
    }
    if (typeof value === "boolean") {
      return value ? "Ya" : "Tidak";
    }
    return value;
  };

  const getPaymentStatus = () => {
    const pembayaran = user.caang?.pembayaran;
    const verified = user.caang?.payment_verification;

    if (!pembayaran) {
      return {
        status: "not_paid",
        label: "Belum Bayar",
        color: "destructive",
        icon: XCircle,
      };
    }
    if (pembayaran && verified === false) {
      return {
        status: "rejected",
        label: "Ditolak",
        color: "destructive",
        icon: XCircle,
      };
    }
    if (pembayaran && verified === undefined) {
      return {
        status: "pending",
        label: "Menunggu Verifikasi",
        color: "secondary",
        icon: AlertCircle,
      };
    }
    if (pembayaran && verified === true) {
      return {
        status: "verified",
        label: "Terverifikasi",
        color: "outline",
        icon: CheckCircle,
      };
    }
    return {
      status: "unknown",
      label: "Status Tidak Diketahui",
      color: "secondary",
      icon: AlertCircle,
    };
  };

  const paymentStatus = getPaymentStatus();
  const StatusIcon = paymentStatus.icon;

  const ImagePreview = ({
    src,
    alt,
    title,
  }: {
    src?: string;
    alt: string;
    title: string;
  }) => {
    if (!src) {
      return (
        <div className="text-sm text-muted-foreground">
          {title}: <span className="italic">Tidak diupload</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <p className="text-sm font-medium">{title}:</p>
        <div className="border rounded-md p-2 bg-muted/20">
          <Image
            src={src}
            alt={alt}
            width={200}
            height={150}
            className="rounded-md object-cover mx-auto"
          />
        </div>
      </div>
    );
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Detail Data Calon Anggota
          </DialogTitle>
          <DialogDescription>
            Informasi lengkap untuk{" "}
            <span className="font-semibold">
              {user.namaLengkap || user.email}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Data Pribadi */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="w-4 h-4" />
                Data Pribadi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Email:
                </label>
                <p className="font-mono text-sm text-wrap">{user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nama Lengkap:
                </label>
                <p>{formatValue(user.caang?.namaLengkap)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nama Panggilan:
                </label>
                <p>{formatValue(user.caang?.namaPanggilan)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Jenis Kelamin:
                </label>
                <p>{formatValue(user.caang?.jenisKelamin)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Agama:
                </label>
                <p>{formatValue(user.caang?.agama)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tempat Lahir:
                </label>
                <p>{formatValue(user.caang?.tempatLahir)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tanggal Lahir:
                </label>
                <p className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(user.caang?.tanggalLahir)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Kontak & Alamat */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Phone className="w-4 h-4" />
                Kontak & Alamat
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  No. HP:
                </label>
                <p className="font-mono">{formatValue(user.caang?.noHp)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Instagram:
                </label>
                <p className="flex items-center gap-1">
                  <Instagram className="w-3 h-3" />
                  {formatValue(user.caang?.instagram)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Alamat Asal:
                </label>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                  <span>{formatValue(user.caang?.alamatAsal)}</span>
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Alamat Domisili:
                </label>
                <p className="flex items-start gap-1">
                  <MapPin className="w-3 h-3 mt-1 flex-shrink-0" />
                  <span>{formatValue(user.caang?.alamatDomisili)}</span>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Data Akademik */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <GraduationCap className="w-4 h-4" />
                Data Akademik
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  NIM:
                </label>
                <p className="font-mono">{formatValue(user.caang?.nim)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Program Studi:
                </label>
                <p>{formatValue(user.caang?.prodi)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Jurusan:
                </label>
                <p>{formatValue(user.caang?.jurusan)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Asal Sekolah:
                </label>
                <p>{formatValue(user.caang?.asalSekolah)}</p>
              </div>
            </CardContent>
          </Card>

          {/* Data Orang Tua */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Users className="w-4 h-4" />
                Data Orang Tua/Wali
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Nama Orang Tua:
                </label>
                <p>{formatValue(user.caang?.namaOrangTua)}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  No. HP Orang Tua:
                </label>
                <p className="font-mono">
                  {formatValue(user.caang?.noHpOrangTua)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Riwayat & Motivasi */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Trophy className="w-4 h-4" />
                Riwayat & Motivasi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Riwayat Organisasi:
                </label>
                <p className="text-sm bg-muted/20 p-3 rounded-md mt-1">
                  {formatValue(user.caang?.riwayatOrganisasi)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Riwayat Prestasi:
                </label>
                <p className="text-sm bg-muted/20 p-3 rounded-md mt-1">
                  {formatValue(user.caang?.riwayatPrestasi)}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Tujuan Masuk UKM:
                </label>
                <p className="text-sm bg-muted/20 p-3 rounded-md mt-1">
                  {formatValue(user.caang?.tujuanMasuk)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dokumen & Media */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="w-4 h-4" />
                Dokumen & Media
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <ImagePreview
                src={user.caang?.pasFoto}
                alt="Pas foto"
                title="Pas Foto"
              />
              <ImagePreview
                src={user.caang?.followIgRobotik}
                alt="Screenshot follow IG Robotik"
                title="Follow IG Robotik"
              />
              <ImagePreview
                src={user.caang?.followIgMrc}
                alt="Screenshot follow IG MRC"
                title="Follow IG MRC"
              />
              <ImagePreview
                src={user.caang?.youtubeRobotik}
                alt="Screenshot subscribe YouTube"
                title="Subscribe YouTube"
              />
            </CardContent>
          </Card>

          {/* Status Pembayaran */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <CreditCard className="w-4 h-4" />
                Status Pembayaran
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Status:</span>
                  <Badge
                    variant={
                      paymentStatus.color as
                        | "default"
                        | "secondary"
                        | "destructive"
                        | "outline"
                    }
                    className={
                      paymentStatus.status === "verified"
                        ? "text-green-600 border-green-600"
                        : paymentStatus.status === "pending"
                        ? "text-yellow-600 border-yellow-600"
                        : ""
                    }
                  >
                    <StatusIcon className="w-3 h-3 mr-1" />
                    {paymentStatus.label}
                  </Badge>
                </div>
              </div>

              {user.caang?.payment_message && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    {user.caang.payment_message}
                  </p>
                </div>
              )}

              {user.caang?.pembayaran ? (
                <div className="space-y-2">
                  <p className="text-sm font-medium">Bukti Pembayaran:</p>
                  <div className="border rounded-md p-4 bg-muted/20">
                    <Image
                      src={user.caang.pembayaran}
                      alt="Bukti pembayaran"
                      width={300}
                      height={200}
                      className="rounded-md object-cover mx-auto"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic">
                  Bukti pembayaran belum diupload
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
