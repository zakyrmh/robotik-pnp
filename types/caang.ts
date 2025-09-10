export interface UserAccount {
  uid?: string;
  name?: string;
  email?: string;
  role?: "root" | "admin" | "member" | "caang";
  createdAt?: string;
}

export interface CaangRegistration {
  uid?: string;
  namaLengkap?: string;
  namaPanggilan?: string;
  jenisKelamin?: string;
  agama?: string;
  tempatLahir?: string;
  tanggalLahir?: string;
  noHp?: string;
  instagram?: string;
  alamatAsal?: string;
  alamatDomisili?: string;
  asalSekolah?: string;
  nim?: string;
  jurusan?: string;
  prodi?: string;
  riwayatOrganisasi?: string;
  riwayatPrestasi?: string;
  tujuanMasuk?: string;
  namaOrangTua?: string;
  noHpOrangTua?: string;
  pasFoto?: string;
  followIgRobotik?: string;
  followIgMrc?: string;
  youtubeRobotik?: string;
  pembayaran?: string;
  payment_verification?: boolean;
  payment_message?: string;
  createdAt?: string;
}

// Digabung untuk table
export interface UserWithCaang {
  user?: UserAccount;
  registration?: CaangRegistration;
}
