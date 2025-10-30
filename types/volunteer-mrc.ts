// types/volunteer-mrc.ts

export interface VolunteerData {
  commitmentDocUrl: string | null;
  userId: string;
  pilihanPertama: string;
  pilihanKedua: string;
  bidangDitempatkan: string | null;
  alasanPilihanPertama: string | null;
  alasanPilihanKedua: string | null;
  timestamp: string;
  createdAt: string;
}

export interface VolunteerRegistrationFormProps {
  onRegistrationSuccess?: () => void;
}

export type RegistrationStatusType = "not-started" | "open" | "closed";