import type { GenderType } from './enums';

export type Profile = {
  user_id: string;
  membership_id: string | null;
  full_name: string;
  nickname: string | null;
  gender: GenderType | null;
  birth_place: string | null;
  birth_date: string | null;   // ISO date: YYYY-MM-DD
  phone: string | null;
  avatar_url: string | null;
  address_domicile: string | null;
  address_origin: string | null;
  updated_at: string;
};

export type ProfileInsert = Omit<Profile, 'updated_at'>;
export type ProfileUpdate = Partial<Omit<ProfileInsert, 'user_id'>>;