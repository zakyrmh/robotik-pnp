import { Timestamp } from "firebase/firestore";

export type FormDataCaang = {
  uid?: string;
  namaLengkap?: string;
  namaPanggilan?: string;
  jenisKelamin?: string;
  agama?: string;
  tempatLahir?: string;
  tanggalLahir?: string | Timestamp;
  noHp?: string;
  instagram?: string;
  alamatAsal?: string;
  alamatDomisili?: string;
  nim?: string;
  prodi?: string;
  jurusan?: string;
  asalSekolah?: string;
  riwayatOrganisasi?: string;
  riwayatPrestasi?: string;
  tujuanMasuk?: string;
  namaOrangTua?: string;
  noHpOrangTua?: string;
  pasFoto?: string; // image url
  followIgRobotik?: string; // image url
  followIgMrc?: string; // image url
  youtubeRobotik?: string; // image url
  pembayaran?: string; // image url
  payment_verification?: boolean;
  payment_message?: string;
};