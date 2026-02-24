export type Major = {
  id: string;
  name: string;
};

export type MajorInsert = Major;
export type MajorUpdate = Partial<Pick<Major, 'name'>>;