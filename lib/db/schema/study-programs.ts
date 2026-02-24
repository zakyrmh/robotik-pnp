export type StudyProgram = {
  id: string;
  major_id: string;
  name: string;
};

export type StudyProgramInsert = StudyProgram;
export type StudyProgramUpdate = Partial<Omit<StudyProgram, 'id'>>;