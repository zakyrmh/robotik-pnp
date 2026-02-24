export type EducationDetail = {
  user_id: string;
  nim: string;
  study_program_id: string;
  class: string | null;
  created_at: string;
  updated_at: string;
};

export type EducationDetailInsert = Omit<EducationDetail, 'created_at' | 'updated_at'>;
export type EducationDetailUpdate = Partial<Omit<EducationDetailInsert, 'user_id'>>;