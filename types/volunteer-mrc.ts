// types/volunteer-mrc.ts

export interface VolunteerData {
  commitmentDocUrl: null;
  userId: string;
  pilihanPertama: string;
  pilihanKedua: string;
  bidangDitempatkan: string | null;
  hari: string;
  alasan: string | null;
  timestamp: string;
  createdAt: string;
}

export interface VolunteerRegistrationFormProps {
  onRegistrationSuccess?: () => void;
}

export type RegistrationStatusType = "not-started" | "open" | "closed";