# DOKUMENTASI LENGKAP PEDOMAN NORMA DAN ETIKA AKADEMIK POLITEKNIK NEGERI PADANG (PNP)

## Peraturan Direktur Politeknik Negeri Padang Nomor 2 Tahun 2023

### Panduan Kepatuhan & Arsitektur Sistem Akademik untuk AI Agent dan System Architect

---

## BAGIAN I: PANDUAN INTEGRASI REKAYASA SISTEM & AI AGENT (COMPLIANCE SPECIFICATION)

Dokumentasi ini dirancang khusus sebagai panduan operasional bagi **AI Agent**, **Software Architect**, **Sistem Informasi Akademik (SIAKAD)**, **Learning Management System (LMS)**, dan **Development Team** di lingkungan **Politeknik Negeri Padang (PNP)** dalam merancang, mengoperasikan, dan mengevaluasi sistem yang patuh (_compliant_) terhadap **Peraturan Direktur PNP Nomor 2 Tahun 2023 tentang Pedoman Norma dan Etika Akademik Politeknik Negeri Padang**.

---

### 1. AKTOR SISTEM & MATRIKS HAK/KEWAJIBAN AKADEMIK

Sistem informasi kampus wajib mengidentifikasi dan memfasilitasi peran 3 entitas utamacivitas akademika:

| Entitas Akses                                         | Hak Utama dalam Sistem                                                                                                                                                    | Kewajiban Teknis & Etika Sistem                                                                                                                                                                                                                       |
| :---------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Dosen** _(Pasal 4, 5, 8)_                           | • Pengembangan karir, profesi, & kompetensi.<br>• Kebebasan akademik & mimbar akademik.<br>• Fasilitas pembelajaran & penelitian.                                         | • Menjunjung tinggi kebenaran & kejujuran ilmiah.<br>• Menggunakan metode pengajaran inovatif (Case Study, PBL, PjBL).<br>• Membimbing penelitian, publikasi jurnal, & perolehan HKI.<br>• Menjauhi plagiarisme/auto-plagiarisme & kekerasan seksual. |
| **Tenaga Kependidikan (Tendik)** _(Pasal 10, 11, 14)_ | • Pengembangan kompetensi & karir.<br>• Fasilitas & suasana kerja kondusif.                                                                                               | • Disiplin pelayanan administrasi akademik/non-akademik.<br>• Menjaga kerahasiaan & integritas data mahasiswa/dosen.<br>• Membantu kelancaran proses pembelajaran.                                                                                    |
| **Mahasiswa** _(Pasal 16-22)_                         | • Kebebasan akademik & mengemukakan pendapat ilmiah.<br>• Persamaan akses terhadap fasilitas kampus & layanan.<br>• Pelindungan dari kekerasan, perundungan, & pelecehan. | • Menjaga ketertiban proses pembelajaran & sikap ilmiah.<br>• Tidak melakukan akses tanpa hak terhadap dokumen elektronik.<br>• Mengutip sumber ilmiah (bebas plagiarisme).<br>• Menjauhi NAPZA, sajam, miras, perundungan, & pelecehan.              |

---

### 2. INTEGRASI FITUR SISTEM INFORMASI AKADEMIK (SYSTEM REQUIREMENTS)

Sistem elektronik Politeknik Negeri Padang (SIAKAD, LMS, Repository, Portals) wajib mengimplementasikan kontrol logis berikut:

```
+-----------------------------------------------------------------------------------+
|               PNP ACADEMIC SYSTEM & COMPLIANCE REQUIREMENTS                        |
+-----------------------------------------------------------------------------------+
| 1. Anti-Plagiarism Engine   : Deteksi plagiarisme & auto-plagiarisme otomatis    |
|                               pada submission tugas/skripsi/jurnal (Pasal 1, 9, 20)|
| 2. Access Control (RBAC)    : Proteksi dokumen elektronik dari akses tanpa hak   |
|                               (Pasal 16 Ayat 4).                                  |
| 3. Pedagogy Flow Support    : Modul pembelajaran berbasis Case Study, PBL, PjBL  |
|                               (Pasal 8 Ayat 2).                                   |
| 4. Ethics Violations Logger : Portal pengaduan pelanggaran etika, kekerasan       |
|                               seksual, & perundungan (Pasal 9, 15, 18, 23).       |
| 5. Commission Audit Portal  : Dashboard pemeriksaan bagi Komisi Norma & Etika     |
|                               Akademik (Pasal 23).                                |
+-----------------------------------------------------------------------------------+
```

---

### 3. LARANGAN HUKUM SISTEMIK & THREAT MODERATION MATRIX

Sistem wajib melakukan mitigasi dan memblokir tindakan-tindakan berikut di seluruh platform internal kampus (Pasal 9, Pasal 15, Pasal 16, Pasal 18, Pasal 22):

| Jenis Pelanggaran                                         | Deskripsi Larangan Akademik/Sistem                                                                                        | Tindakan Sistem / Moderasi                                                                          |
| :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------ | :-------------------------------------------------------------------------------------------------- |
| **Plagiarisme & Auto-Plagiarisme** _(Pasal 1, 9, 15, 20)_ | Mengutip karya pihak lain tanpa sumber tepat atau menggunakan kembali karya sendiri secara signifikan tanpa rujukan asli. | Reject submission otomatis jika _similarity index_ melampaui ambang batas; laporan ke Komisi Etika. |
| **Akses Dokumen Tanpa Hak** _(Pasal 16 Ayat 4)_           | Mencoba mengakses, mengoperasikan, atau mengambil dokumen elektronik/data tanpa kewenangan.                               | Block IP / User Account, logging kecurangan keamanan (_security alert_).                            |
| **Kekerasan Seksual & Perundungan** _(Pasal 9, 15, 18)_   | Tindakan pelecehan seksual, intimidasi verbal/tulisan/elektronik, perundungan, dan tindakan asusila.                      | Penutupan sementara akun terduga; penerusan otomatis laporan ke Satgas PPKS & Komisi Etika.         |
| **Kecurangan Akademik** _(Pasal 22 Ayat 1)_               | Berbuat curang dalam tugas, ujian, penelitian, laporan, dan karya ilmiah.                                                 | Pembatalan nilai ujian/mata kuliah terkait; pencatatan rekam jejak pelanggaran.                     |
| **Penyebaran Hoax & NAPZA/Sajam** _(Pasal 9, 15, 22)_     | Menyebarkan berita palsu tanpa sumber terpercaya, membawa/memperdagangkan miras, NAPZA, atau senjata tajam/api.           | Pembekuan akun pengguna (_account suspension_); proses disiplin pegawai/mahasiswa.                  |

---

### 4. GOVERNANCE & TATA CARA KOMISI ETIKA AKADEMIK (PASAL 23 & 24)

- **Komisi Norma dan Etika Akademik (Pasal 23):**
  - Dibentuk dengan SK Direktur melalui pertimbangan Senat untuk masa jabatan **4 (empat) tahun**.
  - Struktur: Ketua, Sekretaris, dan 3 Anggota (unsur Pimpinan, Senat, dan Dosen).
  - Tugas: Penyampaian himbauan preventif, pemeriksaan terduga pelanggar (_Berita Acara Pemeriksaan / BAP_), penyerapan pembelaan diri, dan penyusunan rekomendasi sanksi kepada Direktur.
- **Sanksi-Sanksi (Pasal 24):**
  - Sanksi Etika: Teguran lisan dan teguran tertulis.
  - Acuan Disiplin Pegawai (Dosen/Tendik): **PP No. 53 Tahun 2010** tentang Disiplin PNS (atau regulasi disiplin PNS pengganti) & Peraturan Akademik PNP.
  - Tindak Pidana: Diproses sesuai hukum pidana Republik Indonesia.

---

## BAGIAN II: TEKS LENGKAP PERATURAN DIREKTUR POLITEKNIK NEGERI PADANG NOMOR 2 TAHUN 2023 TENTANG PEDOMAN NORMA DAN ETIKA AKADEMIK POLITEKNIK NEGERI PADANG

```
PERATURAN DIREKTUR POLITEKNIK NEGERI PADANG
NOMOR 2 TAHUN 2023
TENTANG
PEDOMAN NORMA DAN ETIKA AKADEMIK
POLITEKNIK NEGERI PADANG

DENGAN RAHMAT TUHAN YANG MAHA ESA
DIREKTUR POLITEKNIK NEGERI PADANG,
```

### KONSIDERAN

**Menimbang:**
a. Bahwa Politeknik Negeri Padang, dalam melaksanakan pengembangan kemampuan akademik dan keterampilan mahasiswa, juga berkewajiban menerapkan etika yang baik dalam kehidupan kampus maupun bermasyarakat;
b. Bahwa dalam upaya meningkatkan daya saing lulusan melalui pemenuhan capaian pembelajaran sikap dan tata nilai;
c. Bahwa dalam upaya meningkatkan mutu hasil penelitian/pengabdian kepada masyarakat melalui publikasi ilmiah dan perolehan Hak Kekayaan Intelektual (HKI);
d. Bahwa untuk keperluan dimaksud perlu ditetapkan peraturan Direktur.

**Mengingat:**

1. Undang-Undang Republik Indonesia Nomor 20 Tahun 2003 tentang Sistem Pendidikan Nasional;
2. Undang-Undang Republik Indonesia Nomor 12 Tahun 2012 tentang Pendidikan Tinggi;
3. Peraturan Pemerintah Nomor 53 Tahun 2010 tentang Disiplin Pegawai Negeri Sipil;
4. Peraturan Menteri Pendidikan Nasional Republik Indonesia Nomor 17 Tahun 2010 tentang Pencegahan dan Penanggulangan Plagiat di Perguruan Tinggi;
5. Peraturan Menteri Pendidikan dan Kebudayaan Republik Indonesia Nomor 16 Tahun 2012 tentang Kode Etik Pegawai di Lingkungan Kementerian Pendidikan dan Kebudayaan;
6. Peraturan Pemerintah Republik Indonesia Nomor 4 Tahun 2014 tentang Penyelenggaraan Pendidikan Tinggi dan Pengelolaan Perguruan Tinggi;
7. Peraturan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor 30 Tahun 2021 tentang Pencegahan dan Penanganan Kekerasan Seksual di Lingkungan Perguruan Tinggi;
8. Keputusan Menteri Pendidikan Nasional Republik Indonesia Nomor 89 tahun 2014 tentang Statuta Politeknik Negeri Padang;
9. Keputusan Senat Politeknik Negeri Padang Nomor 4597/PL.9/2018 tentang Peraturan Akademik Politeknik Negeri Padang;
10. Keputusan Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Nomor: 82787/MPK.A/KU.04.00/2022 Tentang Pengangkatan Direktur Politeknik Negeri Padang;
11. Keputusan Menteri Pendidikan Nasional Republik Indonesia Nomor 58 Tahun 2022 tentang Organisasi dan Tata Kerja Politeknik Negeri Padang.

MEMUTUSKAN:
Menetapkan: **PERATURAN DIREKTUR POLITEKNIK NEGERI PADANG TENTANG PEDOMAN NORMA DAN ETIKA AKADEMIK POLITEKNIK NEGERI PADANG.**

---

### BAB I: KETENTUAN UMUM

#### Pasal 1: Pengertian

Dalam Norma dan Etika Akademik Politeknik Negeri Padang ini yang dimaksud dengan:

1. **Politeknik Negeri Padang** yang selanjutnya disebut **PNP** adalah perguruan tinggi yang menyelenggarakan pendidikan vokasi dalam bidang rekayasa, bisnis dan teknologi informasi, yang diselenggarakan Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi, yang berada di bawah dan bertanggung jawab langsung kepada Menteri Pendidikan, Kebudayaan, Riset, dan Teknologi Republik Indonesia melalui Direktur Jenderal Vokasi.
2. **Dosen** adalah pendidik profesional dan ilmuwan pada perguruan tinggi dengan tugas utama mentransformasikan, mengembangkan, dan menyebarluaskan ilmu pengetahuan dan teknologi melalui pendidikan, penelitian dan pengabdian kepada masyarakat.
3. **Tenaga Kependidikan** adalah pegawai yang membantu pelayanan administrasi akademik dan non-akademik.
4. **Mahasiswa** adalah peserta didik yang terdaftar secara sah di PNP.
5. **Norma dan Etika Akademik PNP** adalah pedoman tertulis yang menjadi pedoman berpikir, bersikap, dan bertindak bagi dosen, tenaga kependidikan, dan mahasiswa dalam melakukan aktivitas Tridharma Perguruan Tinggi di PNP.
6. **Komisi Norma dan Etika Akademik** adalah komisi yang dibentuk oleh Direktur guna mengawasi pelaksanaan norma dan etika akademik dan memberikan pertimbangan dan/atau usul untuk pemberian sanksi kepada dosen, tenaga kependidikan, dan mahasiswa yang melakukan pelanggaran norma dan etika akademik.
7. **Plagiarisme** adalah perbuatan secara sengaja atau tidak sengaja dalam memperoleh atau mencoba memperoleh kredit atau nilai untuk suatu karya ilmiah dengan mengutip sebagian atau seluruh karya ilmiah pihak lain yang diakui sebagai karya ilmiahnya, tanpa menyatakan sumber secara tepat dan memadai.
8. **Auto plagiarisme** adalah perbuatan memakai kembali karya sendiri secara signifikan, identik, atau mendekati identik tanpa memberi tahu tindakan itu atau tanpa merujuk karya aslinya.
9. **Direktur** adalah Direktur Politeknik Negeri Padang.
10. **Senat** adalah senat akademik Politeknik Negeri Padang.

---

### BAB II: MAKSUD DAN TUJUAN

#### Pasal 2: Maksud

Maksud penyusunan Norma dan Etika Akademik PNP ini adalah:

1. Menjamin terwujudnya Sistem dan Budaya Pendidikan Nasional yang berkarakter dan berintegritas di bawah Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi sekaligus mendorong tercapainya tujuan PNP;
2. Memberikan pedoman/arahan bagi dosen, tenaga kependidikan, dan mahasiswa PNP dalam melaksanakan tugas dan kewajiban sebagai insan akademik.

#### Pasal 3: Tujuan

Tujuan penyusunan Norma dan Etika Akademik PNP adalah:

1. Memberikan pedoman dan ketentuan norma dan etika bagi dosen, tenaga kependidikan, dan mahasiswa di lingkungan PNP dalam melaksanakan tugas dan kewajiban sebagai dosen, tenaga kependidikan, dan mahasiswa;
2. Membentuk karakter akademik dosen, tenaga kependidikan, dan mahasiswa dalam mengikuti perkembangan ilmu pengetahuan dan teknologi terkini;
3. Membentuk karakter sosial dosen, tenaga kependidikan, dan mahasiswa yang memiliki nilai moral dan etika yang menjadi teladan bagi masyarakat kampus dan masyarakat umum.

---

### BAB III: NORMA DAN ETIKA AKADEMIK DOSEN

#### Pasal 4: Hak Dosen

1. Mendapatkan kesempatan untuk meningkatkan pendidikan dan jabatan ke tingkat yang lebih tinggi;
2. Mengembangkan karir, profesi, dan kompetensi sesuai bidang ilmunya;
3. Mendapatkan penghargaan dan kesejahteraan yang layak sesuai dengan kontribusi dan prestasinya;
4. Mendapatkan fasilitas yang layak dan suasana yang kondusif dalam kebebasan akademik dan mimbar akademik.

#### Pasal 5: Kewajiban Dosen

1. Berperan serta dalam menciptakan suasana akademik yang kondusif untuk peningkatan mutu akademik;
2. Sebagai pendidik dalam menjalankan seluruh kegiatan Tridharma Perguruan Tinggi;
3. Menjunjung tinggi kebenaran dan kejujuran ilmiah dan akademik;
4. Menjunjung tinggi etika profesi dan moral yang berlaku di masyarakat;
5. Melaksanakan tugas dengan disiplin dan menjunjung tinggi undang-undang dan peraturan yang berlaku;
6. Memelihara dan menjaga hubungan kolegial sesama dosen;
7. Memelihara hubungan kemitraan akademik dengan mahasiswa dan hubungan kerja dengan tenaga kependidikan;
8. Meminta izin pimpinan institusi dalam kegiatan Tridharma di luar institusi.

#### Pasal 6: Etika Kerja Dosen

1. Melaksanakan tugas sesuai dengan visi dan misi institusi;
2. Memelihara penampilan diri, ucapan dan perilaku yang baik dan konsisten;
3. Memberikan yang terbaik untuk kemajuan pendidikan;
4. Selalu mengikuti perkembangan ilmu pengetahuan dan teknologi agar dapat berkontribusi kepada masyarakat;
5. Mempelopori upaya kearah kebaikan, berpandangan maju, mendorong orang lain melakukan kebaikan serta menghasilkan kinerja berkualitas dan jadi panutan;
6. Memelihara kesetiakawanan dalam semua kegiatan yang dijalankan sebagai dosen.

#### Pasal 7: Nilai Moral Dosen

1. Ikhlas, jujur, dan berpikiran positif;
2. Melaksanakan tugas dengan penuh dedikasi dan tanggung jawab;
3. Tabah, sabar dan tangguh dalam menghadapi tantangan, tekanan dan kesulitan;
4. Menggunakan bahasa yang baik dan sopan dalam berkomunikasi;
5. Menggunakan pertimbangan yang seksama, adil, terbuka dan akuntabel dalam setiap tindakan dan keputusan.

#### Pasal 8: Perilaku Dosen

##### Ayat 1. Sebagai Pemimpin

1. Menyelenggarakan sistem manajemen sumberdaya institusi yang efektif dan efisien;
2. Sebagai panutan, penasehat dan teman sekerja serta pendengar yang sabar dalam memimpin bawahannya;
3. Mewujudkan suasana kerja yang nyaman dan kondusif, sehingga bawahan memberikan kinerja terbaik;
4. Membuat keputusan yang adil dan konsisten dalam menyelesaikan masalah;
5. Membina komunikasi yang baik dan lancar dengan semua pihak;
6. Membimbing dan mengarahkan bawahannya agar melaksanakan prinsip dan nilai etika kerja yang baik.

##### Ayat 2. Sebagai Pendidik

1. Komitmen dan disiplin yang tinggi dalam melaksanakan tugas;
2. Mengikuti perkembangan dan mendorong terciptanya inovasi sesuai dengan bidang keilmuan dan keahliannya;
3. Menggunakan metode pengajaran yang baik dan menarik untuk mendorong minat belajar, seperti: _Case Study_, _Problem Based Learning_, _Project Based Learning_, dan lainnya;
4. Memperlakukan mahasiswa/i secara adil dan terhormat;
5. Mendorong terjadinya diskusi akademis dengan mahasiswa/i;
6. Membantu memecahkan masalah pembelajaran mahasiswa/i;
7. Mengembangkan ide dan pemikiran untuk perbaikan pendidikan;
8. Membimbing dosen muda kearah pemantapan dan peningkatan mutu pendidikan dan keahlian mengajar.

##### Ayat 3. Sebagai Peneliti

1. Selalu memutakhirkan ilmu dan kepakarannya;
2. Menghargai ilmu dan kepakaran orang lain;
3. Tanggap terhadap masalah yang dituangkan dalam agenda penelitian untuk pengembangan IPTEK, perolehan HKI dan pemenuhan kebutuhan masyarakat;
4. Menggali dan meningkatkan daya guna kearifan lokal dan teknologi lokal melalui penelitian;
5. Menjalin hubungan dengan sesama peneliti di dalam maupun luar negeri;
6. Membimbing dan mengarahkan mahasiswa dalam penelitian;
7. Mempublikasikan hasil penelitian dalam jurnal bermutu di dalam dan luar negeri;
8. Berusaha memperoleh HKI untuk hasil penelitian baik nasional maupun internasional;
9. Mendorong mahasiswa yang terlibat penelitian untuk melakukan publikasi baik sebagai penulis anggota, penulis utama atau mandiri.

##### Ayat 4. Sebagai Pelaksana Layanan Masyarakat

1. Berusaha menghasilkan karya yang berguna untuk masyarakat;
2. Memahami dan menyadari tugas, kewajiban dan tanggung jawab sebagai pelaksana layanan masyarakat;
3. Menyebarluaskan dan menerapkan IPTEK untuk membangun masyarakat;
4. Menjaga lingkungan bersih dan sehat (_green campus_);
5. Ikut serta memelihara fasilitas dan lingkungan kampus.

#### Pasal 9: Perilaku yang Harus Dihindari (Oleh Dosen)

1. Melanggar norma dan etika yang telah ditetapkan;
2. Mengeksploitasi mahasiswa untuk kepentingan pribadi;
3. Menolak penugasan yang diberikan pimpinan tanpa alasan yang tepat;
4. Berperilaku malas atau melalaikan tugas secara sengaja;
5. Melakukan tindakan kekerasan seksual baik di dalam maupun di luar kampus;
6. Berperilaku tidak terpuji, asusila, perundungan, dan LGBT;
7. Tidak menghargai pendapat orang lain dan tidak mau bekerjasama dalam tim;
8. Melakukan tindakan plagiarisme atau auto plagiarisme;
9. Menyebarkan berita hoax atau berita tanpa sumber yang otentik dan terpercaya;
10. Menggunakan dan mengedarkan NAPZA dan obat terlarang.

---

### BAB IV: NORMA DAN ETIKA AKADEMIK TENAGA KEPENDIDIKAN

#### Pasal 10: Hak Tenaga Kependidikan

1. Mendapatkan kesempatan untuk meningkatkan pendidikan dan jabatan ke tingkat yang lebih tinggi;
2. Mengembangkan karir, profesi, dan kompetensi sesuai bidang ilmunya;
3. Mendapatkan penghargaan dan kesejahteraan yang layak sesuai dengan kontribusi dan prestasinya;
4. Mendapatkan fasilitas yang layak dan suasana yang kondusif dalam melaksanakan pekerjaan.

#### Pasal 11: Kewajiban Tenaga Kependidikan

1. Berperan serta dalam menciptakan suasana akademik yang kondusif untuk peningkatan mutu akademik;
2. Menjunjung tinggi kebenaran ilmiah dan kejujuran akademik;
3. Menjunjung tinggi etika profesi dan moral yang berlaku di masyarakat;
4. Melaksanakan tugas dengan disiplin dan menjunjung tinggi undang-undang dan peraturan yang berlaku;
5. Memelihara dan menjaga hubungan kolegial sesama tenaga kependidikan;
6. Memelihara hubungan kemitraan akademik dengan mahasiswa dan hubungan kerja dengan dosen;
7. Meminta izin pimpinan dalam kegiatan di luar institusi pada jam dinas.

#### Pasal 12: Etika Kerja Tenaga Kependidikan

1. Melaksanakan tugas sesuai dengan visi dan misi institusi;
2. Memelihara penampilan diri, ucapan dan perilaku yang baik dan konsisten;
3. Memberikan yang terbaik untuk kemajuan pendidikan;
4. Selalu mengikuti perkembangan ilmu pengetahuan dan teknologi agar dapat memberikan layanan yang memuaskan masyarakat;
5. Mempelopori upaya ke arah kebaikan, berpandangan maju, mendorong orang lain melakukan kebaikan serta menghasilkan kinerja berkualitas;
6. Memelihara kesetiakawanan dalam semua kegiatan yang dijalankan sebagai tenaga kependidikan.

#### Pasal 13: Nilai Moral Tenaga Kependidikan

1. Ikhlas, jujur, dan berpikiran positif;
2. Melaksanakan tugas dengan penuh dedikasi dan tanggung jawab;
3. Tabah, sabar dan tangguh dalam menghadapi tantangan, tekanan dan kesulitan;
4. Menggunakan bahasa yang baik dan sopan dalam berkomunikasi;
5. Menggunakan pertimbangan yang seksama, adil, terbuka dan akuntabel dalam setiap tindakan dan keputusan.

#### Pasal 14: Perilaku Tenaga Kependidikan

##### Ayat 1. Sebagai Pemimpin

1. Menyelenggarakan sistem manajemen sumberdaya institusi yang efektif dan efisien;
2. Sebagai panutan, penasehat dan teman sekerja serta pendengar yang sabar dalam memimpin bawahannya;
3. Mewujudkan suasana kerja yang nyaman dan kondusif, sehingga bawahan menghasilkan kinerja terbaik;
4. Membuat keputusan yang adil dan konsisten dalam menyelesaikan masalah;
5. Membina komunikasi yang baik dan lancar dengan semua pihak;
6. Membimbing dan mengarahkan bawahannya agar melaksanakan prinsip dan nilai etika kerja yang baik.

##### Ayat 2. Sebagai Tenaga Kependidikan

1. Komitmen dan disiplin yang tinggi terhadap tugas yang diberikan;
2. Mengikuti perkembangan dalam keilmuan dan keahliannya;
3. Memperlakukan mahasiswa/i secara adil dan terhormat;
4. Membantu memecahkan masalah terkait proses pembelajaran mahasiswa/i;
5. Mengembangkan ide dan pemikiran untuk perbaikan pendidikan.

##### Ayat 3. Sebagai Pelaksana Layanan Masyarakat

1. Berusaha menghasilkan karya yang berguna untuk masyarakat;
2. Memahami dan menyadari tugas, kewajiban dan tanggung jawab sebagai pelaksana layanan masyarakat;
3. Menyebarluaskan dan menerapkan IPTEK untuk membangun masyarakat;
4. Menjaga lingkungan bersih dan sehat (_green campus_);
5. Ikut serta memelihara fasilitas dan lingkungan kampus.

#### Pasal 15: Perilaku yang Harus Dijauhi (Oleh Tenaga Kependidikan)

1. Melanggar norma dan etika yang telah ditetapkan;
2. Mengeksploitasi mahasiswa untuk kepentingan pribadi;
3. Menolak penugasan yang diberikan pimpinan tanpa alasan yang tepat;
4. Berperilaku malas atau melalaikan tugas secara sengaja;
5. Melakukan tindakan kekerasan seksual baik di dalam maupun di luar kampus;
6. Berperilaku tidak terpuji, asusila, perundungan, dan LGBT;
7. Tidak menghargai pendapat orang lain dan tidak mau bekerjasama dalam tim;
8. Melakukan tindakan plagiarisme atau auto plagiarisme;
9. Menyebarkan berita hoax atau berita tanpa sumber yang otentik dan terpercaya;
10. Menggunakan dan mengedarkan NAPZA dan obat terlarang.

---

### BAB V: NORMA DAN ETIKA AKADEMIK MAHASISWA

#### Pasal 16: Norma dan Etika Akademik

1. Mengikuti pelaksanaan proses pembelajaran, penelitian, pemberdayaan masyarakat dan prosedur administrasi sebaik-baiknya;
2. Aktif menjaga dan memelihara fasilitas pembelajaran dan lingkungan baik gedung, peralatan kantor, laboratorium, bahan pustaka dan fasilitas lain;
3. Tidak mencuri barang atau dokumen milik perorangan/kelompok/institusi;
4. Tidak melakukan akses terhadap dokumen elektronik tanpa kewenangan.

#### Pasal 17: Kebebasan Akademik dan Aktualisasi Diri

1. Mengemukakan pendapat dengan didukung argumentasi ilmiah, dan menghargai perbedaan pendapat;
2. Bertanggung jawab, menghormati institusi serta mempertimbangkan kemampuan diri.

#### Pasal 18: Hubungan Antar Mahasiswa

1. Saling menghormati dan tolong menolong dalam kehidupan masyarakat kampus;
2. Menjauhi kegiatan yang mengarah perbuatan tidak sopan, asusila, perundungan, dan LGBT;
3. Menghindari tindakan intimidasi baik secara verbal, tulisan, elektronik atau bentuk lain;
4. Tidak melakukan pemaksaan, pemukulan, penganiayaan dan kekerasan fisik yang menimbulkan cedera dan traumatis orang lain;
5. Tidak melakukan tindakan pelecehan seksual.

#### Pasal 19: Hubungan dengan Masyarakat Kampus

1. Saling menghormati, menghargai pendapat dan saling tolong menolong dalam kehidupan masyarakat kampus yang beragam;
2. Bersikap santun dalam berkomunikasi baik secara langsung maupun lewat tulisan dengan masyarakat kampus.

#### Pasal 20: Sikap Ilmiah

1. Selalu menyebutkan sumber atas penggunaan tulisan, ide, dan konsep orang lain;
2. Bersikap ilmiah saat terjadi selisih pendapat dan pemahaman dalam sebuah kasus.

#### Pasal 21: Persamaan Akses Akademik

1. Memiliki hak yang sama dalam memanfaatkan fasilitas;
2. Tertib dalam memanfaatkan semua fasilitas;
3. Saling menghargai dalam menerima layanan akademik sesuai peraturan yang berlaku.

#### Pasal 22: Ketertiban Proses Pembelajaran

1. Berperilaku jujur dalam mengikuti kaidah ilmiah (tugas, ujian, penelitian, laporan dan karya ilmiah lain);
2. Berpakaian serta berpenampilan rapi dan sopan sesuai dengan aturan yang berlaku;
3. Menerapkan budaya tertib, bersih, dan indah di lingkungan kampus;
4. Tidak menggunakan, membawa, dan memperdagangkan minuman keras/beralkohol;
5. Tidak terlibat NAPZA, obat terlarang dan pornografi;
6. Tidak memiliki, membawa, menyimpan dan memperdagangkan senjata tajam ataupun senjata api dan lainnya, baik untuk dirinya maupun orang lain.

---

### BAB VI: KOMISI NORMA DAN ETIKA AKADEMIK

#### Pasal 23: Komisi

1. Komisi Norma dan Etika Akademik dibentuk dengan Surat Keputusan Direktur melalui pertimbangan senat untuk masa jabatan 4 (empat) tahun.
2. Keanggotaan Komisi terdiri atas:
   a. 1 (satu) orang ketua merangkap anggota;
   b. 1 (satu) orang sekretaris merangkap anggota;
   c. 3 (tiga) orang anggota dari unsur pimpinan, senat dan dosen.
3. Tugas Komisi:
   a. Memberikan himbauan-himbauan yang positif dan bersifat preventif untuk mendorong penegakan norma dan etika di PNP;
   b. Memeriksa dosen, tenaga kependidikan, dan mahasiswa yang disangkakan melakukan pelanggaran Norma dan Etika Akademik yang dituangkan dalam Berita Acara Pemeriksaan (BAP);
   c. Meminta keterangan dari pihak lain atau pejabat lain yang dipandang perlu;
   d. Mendengarkan pembelaan diri dosen, tenaga kependidikan, dan mahasiswa yang disangkakan melakukan pelanggaran Norma dan Etika Akademik;
   e. Menyusun laporan hasil pemeriksaan pelanggaran Norma dan Etika Akademik;
   f. Memberikan rekomendasi kepada Direktur mengenai pemberian sanksi.

---

### BAB VII: SANKSI

#### Pasal 24: Sanksi-Sanksi

1. Apabila Dosen, Tenaga Kependidikan, dan Mahasiswa terbukti melanggar Norma dan Etika Akademik, maka diberikan sanksi sesuai berat ringannya pelanggaran;
2. Sanksi yang dimaksud dapat berupa: (a) teguran lisan dan (b) teguran tertulis yang disesuaikan dengan peraturan dan perundang-undangan yang berlaku;
3. Acuan hukum pemberian Sanksi adalah PP No. 53 tahun 2010 tentang disiplin Pegawai Negeri Sipil dan Peraturan Akademik PNP;
4. Apabila Dosen, Tenaga Kependidikan, dan Mahasiswa melakukan tindak pidana akan diproses sesuai dengan ketentuan hukum pidana yang berlaku.

---

### BAB VIII: PENUTUP

#### Pasal 25: Ketentuan

1. Norma dan Etika Akademik ini dibuat untuk dapat ditaati dan dilaksanakan oleh semua Dosen, Tenaga Kependidikan, dan Mahasiswa PNP;
2. Pelaksanaan Norma dan Etika Akademik ini berlaku sejak tanggal ditetapkan dengan ketentuan bahwa segala sesuatu akan diubah dan/atau diperbaiki sebagaimana mestinya apabila terdapat ketentuan baru dalam peraturan dan perundangan-undangan yang berlaku.

Ditetapkan di: Padang
Pada tanggal: 01 September 2023
Direktur Politeknik Negeri Padang,
ttd.
**SURFA YONDRI**
NIP. 197006091999031003

---

## BAGIAN III: RINGKASAN NORMA & SANKSI DIESEKUSI SISTEM

### 1. Checklist Akses & Keamanan Sistem Akademik

- **Role-Based Access Control (RBAC):** Proteksi penuh data nilai, dokumen dosen, dan skripsi dari akses unauthorized (_Pasal 16 Ayat 4_).
- **Anti-Plagiarism & Integrity Gate:** Pemeriksaan otomatis kutipan dan rujukan jurnal/tugas akhir (_Pasal 1 & Pasal 20_).
- **Disciplinary Logging System:** Pencatatan otomatis pelanggaran akademik (kecurangan ujian, plagiat, tuduhan perundungan/kekerasan) untuk ditindaklanjuti Komisi Etika (_Pasal 23_).

### 2. Pedoman Sikap & Tata Nilai Utama PNP

- **Motto PNP:** _"Berakhlak Mulia, Berpikir Akademis dan Bertindak Professional"_.
- **Prinsip Pembelajaran Vokasi:** Mengutamakan metode pengajaran _Case Study_, _Problem Based Learning_ (PBL), dan _Project Based Learning_ (PjBL) (_Pasal 8 Ayat 2_).

---

_Dokumentasi ini disusun secara lengkap dan terstruktur sebagai acuan standar pemrosesan norma dan etika akademik berstandar Peraturan Direktur PNP No. 2 Tahun 2023._
