export type ProgramStudi = {
  jenjang: string;
  nama: string;
};

export type Jurusan = {
  nama: string;
  program_studi: ProgramStudi[];
};

export type DataJurusan = {
  jurusan: Jurusan[];
};
