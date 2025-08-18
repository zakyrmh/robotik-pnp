export type ProgramStudi = {
  nama: string;
  jenjang?: string;
};

export type Jurusan = {
  nama: string;
  program_studi: ProgramStudi[];
};

export type DataJurusan = {
  jurusan: Jurusan[];
};
