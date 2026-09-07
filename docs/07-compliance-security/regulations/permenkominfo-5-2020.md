# DOKUMENTASI LENGKAP PERMENKOMINFO NO. 5 TAHUN 2020 TENTANG PENYELENGGARA SISTEM ELEKTRONIK LINGKUP PRIVAT

## Panduan Kepatuhan Moderasi Konten, Akses Penegakan Hukum, & Arsitektur Sistem untuk AI Agent dan System Architect

---

## BAGIAN I: PANDUAN INTEGRASI REKAYASA SISTEM & AI AGENT (COMPLIANCE SPECIFICATION)

Dokumentasi ini dirancang khusus sebagai panduan operasional bagi **AI Agent**, **Software Architect**, dan **Development Team** dalam merancang, membangun, dan mengoperasikan sistem elektronik yang patuh (_compliant_) terhadap **Peraturan Menteri Komunikasi dan Informatika Nomor 5 Tahun 2020 tentang Penyelenggaraan Sistem Elektronik Lingkup Privat (Permenkominfo No. 5/2020)**.

---

### 1. TAKSONOMI INFORMASI SISTEM & KLASIFIKASI AKSES DATA

Sistem elektronik wajib mengelompokkan data ke dalam 3 jenis kategori informasi sesuai ketentuan permintaan akses oleh Kementerian/Lembaga (K/L) dan Aparat Penegak Hukum (APH) (Pasal 1):

| Kategori Data                                                           | Cakupan / Definisi Teknis                                                                                                  | Syarat Permintaan Akses APH / K/L                                                     | SLA Pemenuhan Akses                             |
| :---------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ | :---------------------------------------------- |
| **Data Lalu Lintas (Traffic Data)** _(Pasal 1 Angka 18)_                | IP Address, Nomor Telepon, Rute Transaksi, Timestamp Start/End, Ukuran Data, Jenis Layanan (Email, IM, FTP).               | Permintaan Resmi dari Narahubung APH/KL _(Pasal 36 Ayat 1)_.                          | **Paling lambat 5 hari kalender** _(Pasal 37)_. |
| **Informasi Pengguna (Subscriber Information)** _(Pasal 1 Angka 19)_    | Nama akun, Alamat fisik/lokasi pendaftaran, Email/No HP pendaftaran, Detail Billing/Pembayaran, Durasi Layanan.            | Permintaan Resmi dari Narahubung APH/KL _(Pasal 36 Ayat 1)_.                          | **Paling lambat 5 hari kalender** _(Pasal 37)_. |
| **Konten Komunikasi & Data Pribadi Spesifik** _(Pasal 1 Angka 20 & 21)_ | Teks pesan, suara, gambar, video yang ditransmisikan, serta Data Kesehatan, Biometrik, Genetika, Keuangan, Data Anak, dll. | **Permintaan Resmi + Surat Penetapan Ketua Pengadilan Negeri** _(Pasal 36 Ayat 3-5)_. | **Paling lambat 5 hari kalender** _(Pasal 37)_. |

---

### 2. MATRIKS SLA TAKE-DOWN KONTEN DILARANG (CONTENT MODERATION SLA)

Setiap PSE Privat wajib memiliki workflow otomatis dan manual untuk mengeksekusi Pemutusan Akses (_Take Down_) konten dilarang (Pasal 15 & 16):

| Jenis Konten / Kondisi                                                        | Batas Waktu Eksplisit (SLA)                                   | Jenis Konten Rujukan                                                                            | Dampak Jika Kelalaian / Telat                                                                                 |
| :---------------------------------------------------------------------------- | :------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------ |
| **Kondisi MENDESAK (Urgent Take Down)** _(Pasal 14 Ayat 3 & Pasal 15 Ayat 8)_ | **Maksimal 4 (Empat) Jam** sejak peringatan/perintah diterima | • Terorisme<br>• Pornografi Anak<br>• Konten Meresahkan Masyarakat & Mengganggu Ketertiban Umum | • Denda Administratif (PNBP) per 4 jam.<br>• _Access Blocking_ (Pemblokiran Situs/Aplikasi) oleh ISP/Kominfo. |
| **Kondisi NORMAL (Standard Take Down)** _(Pasal 15 Ayat 6 & Pasal 16 Ayat 7)_ | **Maksimal 1 x 24 Jam** sejak surat perintah diterima         | Konten melanggar UU (Perjudian, Pornografi Umum, Penipuan, SARA, HKI, dll.)                     | • Denda Administratif (PNBP) per 24 jam.<br>• _Access Blocking_ & Pencabutan Tanda Daftar PSE.                |

---

### 3. KETENTUAN UGC SAFE HARBOR (PASAL 11)

Untuk sistem berbentuk **User Generated Content (UGC)** (platform tempat pengguna dapat mengunggah media/konten sendiri), platform dapat **dibebaskan dari tanggung jawab hukum pidana/perdata** atas konten ilegal yang diunggah user JIKA memenuhi 3 kriteria:

1. **Memiliki Tata Kelola & Sarana Pelaporan Publik** _(Pasal 10)_: Menyediakan Terms of Service (ToS) Bahasa Indonesia dan _Reporting Form/Button_ yang mudah diakses publik.
2. **Memberikan Subscriber Information**: Menyerahkan data pengunggah (_Subscriber Info_) kepada APH/K-L saat diminta untuk penegakan hukum.
3. **Melakukan Take Down Cepat**: Segera melakukan _take down_ konten dilarang sesuai SLA (4 jam / 24 jam).

---

### 4. REQUIREMENT AKSES SYSTEMS & DATA OLEH APH & K/L

| Aspek                       | Kepentingan Pengawasan K/L                                                          | Kepentingan Penegakan Hukum Pidana (APH)                                                                                                                |
| :-------------------------- | :---------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Kriteria Ancaman Pidana** | Berdasarkan kewenangan pengawasan sektor K/L _(Pasal 23)_.                          | • Akses Data: Ancaman Penjara **>= 2 Tahun** _(Pasal 32)_.<br>• Akses Sistem: Penjara **>= 5 Tahun** (atau 2-5 tahun dengan Penetapan PN) _(Pasal 33)_. |
| **Persyaratan Dokumen**     | Surat Resmi, Dasar Kewenangan, Maksud/Tujuan, Deskripsi Spesifik _(Pasal 26 & 29)_. | Surat Resmi, Deskripsi Pidana, Maksud/Tujuan + Penetapan PN (khusus Konten/Sistem) _(Pasal 36 & 39)_.                                                   |
| **SLA Pemenuhan**           | **Maksimal 5 hari kalender** _(Pasal 27 & 31)_.                                     | **Maksimal 5 hari kalender** (Cloud Provider darurat: max 5 hari) _(Pasal 37 & 42)_.                                                                    |
| **Mandatory Narahubung**    | **Wajib menunjuk minimal 1 Narahubung berdomisili di Indonesia** _(Pasal 25)_.      | **Wajib menunjuk minimal 1 Narahubung berdomisili di Indonesia** _(Pasal 25)_.                                                                          |
| **Mandatory Audit Trail**   | Wajib mencatat rekam jejak audit akses K/L _(Pasal 43)_.                            | Wajib mencatat rekam jejak audit akses APH _(Pasal 44)_.                                                                                                |

---

## BAGIAN II: TEKS LENGKAP PERATURAN MENTERI KOMUNIKASI DAN INFORMATIKA NOMOR 5 TAHUN 2020 TENTANG PENYELENGGARA SISTEM ELEKTRONIK LINGKUP PRIVAT

```
PERATURAN MENTERI KOMUNIKASI DAN INFORMATIKA REPUBLIK INDONESIA
NOMOR 5 TAHUN 2020
TENTANG
PENYELENGGARA SISTEM ELEKTRONIK LINGKUP PRIVAT

DENGAN RAHMAT TUHAN YANG MAHA ESA
MENTERI KOMUNIKASI DAN INFORMATIKA REPUBLIK INDONESIA,
```

### KONSIDERAN

**Menimbang:**
a. bahwa untuk memenuhi kebutuhan pengaturan dalam penyelenggaraan sistem elektronik lingkup privat, serta untuk melaksanakan ketentuan Pasal 5 ayat (3), Pasal 6 ayat (4), Pasal 97 ayat (5), Pasal 98 ayat (4), dan Pasal 101 Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik, perlu menetapkan Peraturan Menteri Komunikasi dan Informatika tentang Penyelenggara Sistem Elektronik Lingkup Privat;

**Mengingat:**

1. Pasal 17 ayat (3) Undang-Undang Dasar Negara Republik Indonesia Tahun 1945;
2. Undang-Undang Nomor 39 Tahun 2008 tentang Kementerian Negara;
3. Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik;
4. Peraturan Presiden Nomor 54 Tahun 2015 tentang Kementerian Komunikasi dan Informatika;
5. Peraturan Menteri Komunikasi dan Informatika Nomor 6 Tahun 2018 tentang Organisasi dan Tata Kerja Kementerian Komunikasi dan Informatika;
6. Peraturan Menteri Komunikasi dan Informatika Nomor 13 Tahun 2019 tentang Penyelenggaraan Jasa Telekomunikasi;

MEMUTUSKAN:
Menetapkan: **PERATURAN MENTERI KOMUNIKASI DAN INFORMATIKA TENTANG PENYELENGGARA SISTEM ELEKTRONIK LINGKUP PRIVAT.**

---

### BAB I: KETENTUAN UMUM

#### Pasal 1

Dalam Peraturan Menteri ini yang dimaksud dengan:

1. **Informasi Elektronik** adalah satu atau sekumpulan Data Elektronik, termasuk tetapi tidak terbatas pada tulisan, suara, gambar, peta, rancangan, foto, electronic data interchange (EDI), surat elektronik (electronic mail), telegram, teleks, telecopy atau sejenisnya, huruf, tanda, angka, kode akses, simbol, atau perforasi yang telah diolah yang memiliki arti atau dapat dipahami oleh orang yang mampu memahaminya.
2. **Dokumen Elektronik** adalah setiap Informasi Elektronik yang dibuat, diteruskan, dikirimkan, diterima, atau disimpan dalam bentuk analog, digital, elektromagnetik, optikal, atau sejenisnya, yang dapat dilihat, ditampilkan, dan/atau didengar melalui komputer atau Sistem Elektronik, termasuk tetapi tidak terbatas pada tulisan, suara, gambar, peta, rancangan, foto atau sejenisnya, huruf, tanda, angka, kode akses, simbol atau perforasi yang memiliki makna atau arti atau dapat dipahami oleh orang yang mampu memahaminya.
3. **Data Elektronik** adalah data berbentuk elektronik yang tidak terbatas pada tulisan, suara, gambar, peta, rancangan, foto, electronic data interchange (EDI), surat elektronik (electronic mail), telegram, teleks, telecopy atau sejenisnya, huruf, tanda, angka, kode akses, simbol, atau perforasi.
4. **Sistem Elektronik** adalah serangkaian perangkat dan prosedur elektronik yang berfungsi mempersiapkan, mengumpulkan, mengolah, menganalisis, menyimpan, menampilkan, mengumumkan, mengirimkan, dan/atau menyebarkan Informasi Elektronik.
5. **Penyelenggara Sistem Elektronik** adalah setiap orang, penyelenggara negara, badan usaha, dan masyarakat yang menyediakan, mengelola, dan/atau mengoperasikan Sistem Elektronik secara sendiri-sendiri maupun bersama-sama kepada Pengguna Sistem Elektronik untuk keperluan dirinya dan/atau keperluan pihak lain.
6. **Penyelenggara Sistem Elektronik Lingkup Privat** yang selanjutnya disebut **PSE Lingkup Privat** adalah penyelenggaraan Sistem Elektronik oleh orang, badan usaha, dan masyarakat.
7. **PSE Lingkup Privat User Generated Content** adalah PSE Lingkup Privat yang penyediaan, penayangan, pengunggahan, dan/atau pertukaran Informasi Elektronik dan/atau Dokumen Elektroniknya dilakukan oleh Pengguna Sistem Elektronik.
8. **Pengguna Sistem Elektronik** adalah setiap orang, penyelenggara negara, badan usaha, dan masyarakat yang memanfaatkan barang, jasa, fasilitas, atau informasi yang disediakan oleh Penyelenggara Sistem Elektronik.
9. **Komputasi Awan** adalah model penyediaan akses jaringan yang merata, mudah, berdasarkan permintaan untuk sekumpulan sumber daya komputasi yang dapat dikonfigurasi bersama antara lain jaringan, server, penyimpanan, aplikasi, dan layanan yang dapat disediakan dan dirilis dengan cepat dan dengan daya manajemen atau interaksi penyediaan layanan minimal.
10. **Penyelenggara Komputasi Awan** adalah PSE Lingkup Privat yang menyediakan, menyelenggarakan, mengelola, dan/atau mengoperasikan layanan Komputasi Awan.
11. **Data Pribadi** adalah setiap data tentang seseorang baik yang teridentifikasi dan/atau dapat diidentifikasi secara tersendiri atau dikombinasi dengan informasi lainnya baik secara langsung maupun tidak langsung melalui Sistem Elektronik dan/atau nonelektronik.
12. **Transaksi Elektronik** adalah perbuatan hukum yang dilakukan dengan menggunakan komputer, jaringan komputer, dan/atau media elektronik lainnya.
13. **Kementerian atau Lembaga** adalah Instansi Penyelenggara Negara yang bertugas mengawasi dan mengeluarkan pengaturan terhadap sektornya.
14. **Perizinan Berusaha Terintegrasi Secara Elektronik (Online Single Submission)** yang selanjutnya disebut **OSS** adalah perizinan berusaha yang diterbitkan oleh lembaga OSS untuk dan atas nama menteri, pimpinan lembaga, gubernur, atau bupati/wali kota kepada pelaku usaha melalui sistem elektronik yang terintegrasi.
15. **Pemutusan Akses** adalah tindakan pemblokiran akses, penutupan akun dan/atau penghapusan konten.
16. **Normalisasi** adalah proses pemulihan akses terhadap Sistem Elektronik yang telah ditutup agar dapat diakses kembali.
17. **Penyelenggara Jasa Akses Internet (Internet Service Provider)** yang selanjutnya disingkat **ISP** adalah penyelenggara jasa multimedia yang menyelenggarakan jasa layanan akses internet untuk terhubung dengan jaringan internet publik.
18. **Data Lalu Lintas (Traffic Data)** adalah Data Elektronik yang dihasilkan oleh Sistem Elektronik mengenai Transaksi Elektronik yang terjadi di dalam Sistem Elektronik tersebut sebagai bagian dari rantai komunikasi dengan Sistem Elektronik lain yang meliputi asal dan tujuan Transaksi Elektronik yang meliputi nomor telefon, alamat protokol internet, atau nomor identifikasi sejenis yang digunakan oleh PSE Lingkup Privat untuk mengidentifikasi Pengguna Sistem Elektronik, rute (route) Transaksi Elektronik, waktu mulai dan berakhir Transaksi Elektronik, ukuran Data Elektronik, jenis layanan dari PSE Lingkup Privat yang digunakan oleh Pengguna Sistem Elektronik, seperti surel, layanan pesan instan (instant messaging), atau file transfer.
19. **Informasi Pengguna Sistem Elektronik (Subscriber Information)** adalah Data Elektronik yang dikontrol atau dikelola oleh PSE Lingkup Privat terkait dengan layanan yang digunakan oleh Pengguna Sistem Elektronik yang meliputi informasi mengenai identitas Pengguna Sistem Elektronik, termasuk nama Pengguna Sistem Elektronik yang digunakan dalam layanan pada PSE Lingkup Privat, alamat tempat tinggal Pengguna Sistem Elektronik dan alamat lain yang mengidentifikasikan lokasi Pengguna Sistem Elektronik pada waktu mendaftar atau menggunakan layanan PSE Lingkup Privat, nomor identifikasi yang digunakan oleh Pengguna Sistem Elektronik untuk mendaftar layanan pada PSE Lingkup Privat, seperti alamat email dan nomor telepon, informasi pembayaran atau tagihan yang dikeluarkan oleh PSE Lingkup Privat kepada Pengguna Sistem Elektronik terkait lokasi instalasi peralatan, durasi layanan.
20. **Konten Komunikasi** adalah Informasi Elektronik atau Dokumen Elektronik yang dikirimkan, ditransmisikan atau diterima oleh Pengguna Sistem Elektronik melalui jasa atau layanan PSE Lingkup Privat selain Data Lalu Lintas (Traffic Data) dan Informasi Pengguna Sistem Elektronik (Subscriber Information).
21. **Data Pribadi Spesifik** adalah data dan informasi kesehatan, data biometrik, data genetika, kehidupan/orientasi seksual, pandangan politik, data anak, data keuangan pribadi, dan/atau data lainnya sesuai dengan ketentuan peraturan perundang-undangan.
22. **Aparat Penegak Hukum** adalah pejabat dari Institusi Penegak Hukum yang bertanggung jawab atas suatu penyidikan, penuntutan, persidangan yang sedang berlangsung.
23. **Institusi Penegak Hukum** adalah Kementerian atau Lembaga yang didirikan berdasarkan undang-undang dengan kewenangan melakukan penyidikan, penuntutan, atau persidangan suatu tindak pidana yang diatur dalam suatu undang-undang.
24. **Narahubung** adalah pejabat penghubung pada PSE Lingkup Privat, Kementerian atau Lembaga, Institusi Penegak Hukum dan lembaga peradilan dalam rangka permintaan akses terhadap Sistem Elektronik dan Data Elektronik dan permohonan Pemutusan Akses.
25. **Menteri** adalah menteri yang menyelenggarakan urusan pemerintahan di bidang komunikasi dan informatika.
26. **Kementerian** adalah kementerian yang menyelenggarakan urusan pemerintahan di bidang komunikasi dan informatika.

---

### BAB II: PENDAFTARAN PENYELENGGARA SISTEM ELEKTRONIK LINGKUP PRIVAT

#### Bagian Kesatu: Pendaftaran Penyelenggara Sistem Elektronik Lingkup Privat

##### Pasal 2

(1) Setiap PSE Lingkup Privat wajib melakukan pendaftaran.
(2) PSE Lingkup Privat sebagaimana dimaksud pada ayat (1) meliputi:
a. PSE yang diatur atau diawasi oleh Kementerian atau Lembaga berdasarkan ketentuan peraturan perundang-undangan; dan/atau
b. PSE yang memiliki portal, situs, atau aplikasi dalam jaringan melalui internet yang dipergunakan untuk: 1. menyediakan, mengelola, dan/atau mengoperasikan penawaran dan/atau perdagangan barang dan/atau jasa; 2. menyediakan, mengelola, dan/atau mengoperasikan layanan transaksi keuangan; 3. pengiriman materi atau muatan digital berbayar melalui jaringan data baik dengan cara unduh melalui portal atau situs, pengiriman lewat surat elektronik, atau melalui aplikasi lain ke perangkat Pengguna Sistem Elektronik; 4. menyediakan, mengelola, dan/atau mengoperasikan layanan komunikasi meliputi namun tidak terbatas pada pesan singkat, panggilan suara, panggilan video, surat elektronik, dan percakapan dalam jaringan dalam bentuk platform digital, layanan jejaring dan media sosial; 5. layanan mesin pencari, layanan penyediaan Informasi Elektronik yang berbentuk tulisan, suara, gambar, animasi, musik, video, film, dan permainan atau kombinasi dari sebagian dan/atau seluruhnya; dan/atau 6. pemrosesan Data Pribadi untuk kegiatan operasional melayani masyarakat yang terkait dengan aktivitas Transaksi Elektronik.
(3) Kewajiban melakukan pendaftaran bagi PSE Lingkup Privat dilakukan sebelum Sistem Elektronik mulai digunakan oleh Pengguna Sistem Elektronik.
(4) Pendaftaran ISP sebagai PSE Lingkup Privat dilaksanakan melalui perizinan yang diselenggarakan oleh Kementerian sesuai dengan ketentuan peraturan perundang-undangan.
(5) Masyarakat dapat memberikan pengaduan/informasi terhadap PSE Lingkup Privat yang tidak melakukan kewajiban pendaftaran.

##### Pasal 3

(1) Pendaftaran PSE Lingkup Privat sebagaimana dimaksud dalam Pasal 2 ayat (1) diajukan kepada Menteri.
(2) Pengajuan permohonan pendaftaran PSE Lingkup Privat sebagaimana dimaksud pada ayat (1) dilakukan melalui OSS, kecuali yang ditentukan lain oleh ketentuan peraturan perundang-undangan.
(3) Pengajuan permohonan pendaftaran sebagaimana dimaksud pada ayat (2) dilakukan dengan mengisi formulir pendaftaran yang memuat informasi yang benar mengenai:
a. gambaran umum pengoperasian Sistem Elektronik;
b. kewajiban untuk memastikan keamanan informasi sesuai dengan ketentuan peraturan perundang-undangan;
c. kewajiban melakukan pelindungan Data Pribadi sesuai dengan ketentuan peraturan perundang-undangan; dan
d. kewajiban untuk melakukan uji kelaikan Sistem Elektronik sesuai dengan ketentuan peraturan perundang-undangan.
(4) Informasi mengenai gambaran umum pengoperasian Sistem Elektronik sebagaimana dimaksud pada ayat (3) huruf a, terdiri atas:
a. nama Sistem Elektronik;
b. sektor Sistem Elektronik;
c. uniform resource locator (URL) website;
d. sistem nama domain (domain name system) dan/atau alamat Internet Protocol (IP) server;
e. deskripsi model bisnis;
f. deskripsi singkat fungsi Sistem Elektronik dan proses bisnis Sistem Elektronik;
g. keterangan Data Pribadi yang diproses;
h. keterangan lokasi pengelolaan, pemrosesan, dan/atau penyimpanan Sistem Elektronik dan Data Elektronik; dan
i. keterangan yang menyatakan bahwa PSE Lingkup Privat menjamin dan melaksanakan kewajiban pemberian akses terhadap Sistem Elektronik dan Data Elektronik dalam rangka memastikan efektivitas pengawasan dan penegakan hukum sesuai dengan ketentuan peraturan perundang-undangan.
(5) Pendaftaran PSE Lingkup Privat yang dikecualikan untuk melakukan pendaftaran melalui OSS sebagaimana dimaksud pada ayat (2) dilakukan dengan menyampaikan informasi sebagaimana dimaksud pada ayat (3) dan ayat (4) serta menyampaikan informasi yang benar mengenai:
a. nama badan hukum, alamat badan hukum, bentuk badan hukum, akta perusahaan dan akta perubahan terakhir;
b. nomor pokok wajib pajak;
c. nama, nomor induk kependudukan, dan nomor telepon; dan
d. keterangan yang menyatakan bahwa PSE Lingkup Privat telah memiliki legalitas dalam menyelenggarakan kegiatan berusaha dari Kementerian atau Lembaga yang memiliki kewenangan sesuai dengan ketentuan peraturan perundang-undangan yang dibuktikan dengan dokumen terkait.

##### Pasal 4

(1) Kewajiban PSE Lingkup Privat melakukan pendaftaran sebagaimana dimaksud dalam Pasal 2 ayat (1) juga berlaku untuk PSE Lingkup Privat yang didirikan menurut hukum negara lain atau yang berdomisili tetap di negara lain tetapi:
a. memberikan layanan di dalam wilayah Indonesia;
b. melakukan usaha di Indonesia; dan/atau
c. Sistem Elektroniknya dipergunakan dan/atau ditawarkan di wilayah Indonesia.
(2) Pendaftaran PSE Lingkup Privat sebagaimana dimaksud pada ayat (1) dilakukan dengan mengisi formulir pendaftaran yang memuat informasi sebagaimana dimaksud dalam Pasal 3 ayat (3) dan Pasal 3 ayat (4) serta informasi yang benar yang meliputi:
a. identitas PSE Lingkup Privat;
b. identitas pimpinan perusahaan dan/atau identitas penanggung jawab;
c. keterangan domisili dan/atau akta pendirian perusahaan (certificate of incorporation);
d. jumlah pelanggan (user) dari Indonesia; dan
e. nilai transaksi yang berasal dari Indonesia.
(3) Informasi sebagaimana dimaksud pada ayat (2) huruf c disampaikan dengan melampirkan dokumen pendukung yang diterjemahkan ke dalam bahasa Indonesia oleh penerjemah tersumpah.

##### Pasal 5

Perubahan terhadap informasi pendaftaran sebagaimana dimaksud dalam Pasal 3 ayat (3), Pasal 3 ayat (5), dan Pasal 4 ayat (2) wajib dilaporkan kepada Menteri.

#### Bagian Kedua: Penerbitan Tanda Daftar

##### Pasal 6

(1) Tanda daftar PSE Lingkup Privat diterbitkan oleh Menteri setelah persyaratan pendaftaran sebagaimana dimaksud dalam Pasal 2 sampai dengan Pasal 5 dinyatakan lengkap sesuai dengan Peraturan Menteri ini dan ditempatkan dalam daftar PSE Lingkup Privat.
(2) Daftar PSE Lingkup Privat sebagaimana dimaksud pada ayat (1) dimuat di laman website yang dikelola oleh Kementerian.

#### Bagian Ketiga: Penjatuhan Sanksi Administratif dan Normalisasi

##### Pasal 7

(1) Menteri mengenakan sanksi administratif kepada PSE Lingkup Privat yang:
a. tidak melakukan pendaftaran sebagaimana dimaksud dalam Pasal 2 dan Pasal 4;
b. telah mempunyai tanda daftar tetapi tidak melaporkan perubahan terhadap informasi pendaftaran sebagaimana dimaksud dalam Pasal 5;
c. tidak memberikan informasi pendaftaran sebagaimana dimaksud dalam Pasal 3 ayat (3), Pasal 3 ayat (4), dan Pasal 4 ayat (2) dengan benar.
(2) Dalam hal PSE Lingkup Privat tidak melakukan pendaftaran sebagaimana dimaksud pada ayat (1) huruf a, Menteri memberikan sanksi administratif berupa Pemutusan Akses terhadap Sistem Elektronik (access blocking).
(3) Dalam hal PSE Lingkup Privat telah mempunyai tanda daftar tetapi tidak melaporkan perubahan terhadap informasi pendaftaran sebagaimana dimaksud pada ayat (1) huruf b atau tidak memberikan informasi pendaftaran dengan benar sebagaimana dimaksud pada ayat (1) huruf c, Menteri memberikan sanksi administratif berupa:
a. teguran tertulis yang disampaikan melalui surat elektronik (electronic mail) dan/atau media elektronik lainnya;
b. penghentian sementara terhadap PSE Lingkup Privat dalam hal tidak mengindahkan teguran tertulis sebagaimana dimaksud pada ayat (3) huruf a;
c. Pemutusan Akses terhadap Sistem Elektronik (access blocking) dan pencabutan Tanda Daftar Penyelenggara Sistem Elektronik dalam hal PSE Lingkup Privat tidak memberikan konfirmasi dalam jangka waktu 7 (tujuh) hari setelah penghentian sementara sebagaimana dimaksud pada ayat (3) huruf b.
(4) Dalam hal PSE Lingkup Privat telah memenuhi ketentuan pendaftaran sebagaimana dimaksud dalam Pasal 2 sampai dengan Pasal 5, Menteri melakukan Normalisasi terhadap Sistem Elektronik yang diputus aksesnya (access blocking) sebagaimana dimaksud pada ayat (2).
(5) Dalam hal PSE Lingkup Privat telah melakukan pembaruan informasi pendaftaran dengan benar, Menteri melakukan Normalisasi terhadap Sistem Elektronik yang dihentikan sementara sebagaimana dimaksud pada ayat (3) huruf b.
(6) Dalam hal PSE Lingkup Privat telah melakukan pendaftaran ulang dengan memberikan informasi pendaftaran dengan benar, Menteri melakukan Normalisasi terhadap Sistem Elektronik yang diputus akses Sistem Elektroniknya dan dicabut tanda daftar Penyelenggara Sistem Elektroniknya sebagaimana dimaksud pada ayat (3) huruf c.

##### Pasal 8

(1) Menteri dapat mengenakan sanksi administratif kepada PSE Lingkup Privat berdasarkan permohonan dari Kementerian atau Lembaga atas dasar pelanggaran peraturan perundang-undangan di bidang Kementerian atau Lembaga yang memiliki kewenangan sesuai dengan ketentuan peraturan perundang-undangan.
(2) Dalam hal sanksi administratif yang diberikan kepada PSE Lingkup Privat sebagaimana dimaksud pada ayat (1) adalah Pemutusan Akses terhadap Sistem Elektronik (access blocking), Menteri melakukan Normalisasi berdasarkan pengajuan rekomendasi oleh Kementerian atau Lembaga atas dasar layanan PSE lingkup privat yang telah memenuhi ketentuan peraturan perundang-undangan.

---

### BAB III: TATA KELOLA DAN MODERASI INFORMASI ELEKTRONIK DAN/ATAU DOKUMEN ELEKTRONIK

#### Bagian Kesatu: Umum

##### Pasal 9

(1) PSE Lingkup Privat bertanggung jawab atas penyelenggaraan Sistem Elektronik dan pengelolaan Informasi Elektronik dan/atau Dokumen Elektronik di dalam Sistem Elektronik secara andal, aman, dan bertanggung jawab.
(2) PSE Lingkup Privat wajib menyediakan petunjuk penggunaan layanan dalam bahasa Indonesia sesuai dengan ketentuan perundang-undangan.
(3) PSE Lingkup Privat wajib memastikan:
a. Sistem Elektroniknya tidak memuat Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang; dan
b. Sistem Elektroniknya tidak memfasilitasi penyebarluasan Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang.
(4) Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (3) dengan klasifikasi:
a. melanggar ketentuan peraturan perundang-undangan;
b. meresahkan masyarakat dan mengganggu ketertiban umum; dan
c. memberitahukan cara atau menyediakan akses terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang.
(5) Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (4) huruf b ditetapkan oleh Kementerian atau Lembaga sesuai dengan ketentuan peraturan perundang-undangan.
(6) PSE Lingkup Privat yang tidak melakukan kewajiban sebagaimana dimaksud pada ayat (3) diputus akses terhadap Sistem Elektroniknya (access blocking) sesuai dengan ketentuan dalam Peraturan Menteri ini.

#### Bagian Kedua: Kewajiban Penyelenggara Sistem Elektronik Lingkup Privat User Generated Content

##### Pasal 10

(1) Dalam rangka memenuhi kewajiban sebagaimana dimaksud dalam Pasal 9 ayat (3), PSE Lingkup Privat User Generated Content wajib:
a. memiliki tata kelola mengenai Informasi Elektronik dan/atau Dokumen Elektronik; dan
b. menyediakan sarana pelaporan.
(2) Tata kelola sebagaimana dimaksud pada ayat (1) huruf a paling sedikit memuat ketentuan sebagai berikut:
a. kewajiban dan hak Pengguna Sistem Elektronik dalam menggunakan layanan Sistem Elektronik;
b. kewajiban dan hak PSE Lingkup Privat dalam melaksanakan operasional Sistem Elektronik;
c. ketentuan mengenai pertanggungjawaban terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang diunggah Pengguna Sistem Elektronik; dan
d. ketersediaan sarana dan layanan serta penyelesaian pengaduan.
(3) Sarana pelaporan sebagaimana dimaksud pada ayat (1) huruf b harus dapat diakses oleh publik dan digunakan untuk penyampaian aduan dan/atau laporan atas Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang termuat pada Sistem Elektronik yang dikelolanya.
(4) Terhadap aduan dan/atau laporan atas Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (3), PSE Lingkup Privat wajib:
a. memberikan tanggapan terhadap aduan dan/atau laporan kepada pihak yang mengadukan dan/atau melaporkan;
b. melakukan pemeriksaan secara mandiri atas aduan dan/atau laporan dan/atau meminta verifikasi aduan dan/atau laporan kepada Menteri dan/atau Kementerian atau Lembaga terkait;
c. memberikan pemberitahuan kepada Pengguna Sistem Elektronik mengenai aduan dan/atau laporan terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang diunggah oleh Pengguna Sistem Elektronik; dan
d. menolak aduan dan/atau laporan apabila Informasi Elektronik dan/atau Dokumen Elektronik yang dilaporkan bukan merupakan Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang.
(5) PSE Lingkup Privat yang tidak melakukan kewajiban sebagaimana dimaksud ayat (1) dan ayat (4) diputus akses terhadap Sistem Elektroniknya (access blocking) sesuai dengan ketentuan dalam Peraturan Menteri ini.

##### Pasal 11

PSE Lingkup Privat User Generated Content dapat dibebaskan dari tanggung jawab hukum mengenai Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang ditransmisikan atau didistribusikan melalui Sistem Elektroniknya dalam hal PSE Lingkup Privat:
a. telah melakukan kewajiban sebagaimana dimaksud dalam Pasal 9 ayat (3) dan Pasal 10;
b. memberikan Informasi Pengguna Sistem Elektronik (Subscriber Information) yang mengunggah Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang dalam rangka pengawasan dan/atau penegakan hukum; dan
c. melakukan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang.

#### Bagian Ketiga: Kewajiban Penyelenggara Komputasi Awan

##### Pasal 12

(1) Dalam rangka memenuhi kewajiban sebagaimana dimaksud dalam Pasal 9 ayat (3), Penyelenggara Komputasi Awan wajib memiliki tata kelola mengenai Informasi Elektronik dan/atau Dokumen Elektronik.
(2) Tata kelola sebagaimana dimaksud pada ayat (1) paling sedikit memuat hal-hal sebagai berikut:
a. kewajiban dan hak pengguna layanan Penyelenggara Komputasi Awan dalam menggunakan Komputasi Awan;
b. kewajiban dan hak Penyelenggara Komputasi Awan dalam melaksanakan operasional Komputasi Awan; dan
c. ketentuan mengenai pertanggungjawaban pengguna layanan Penyelenggara Komputasi Awan dalam hal menyimpan Informasi Elektronik dan/atau Dokumen Elektronik pada Komputasi Awan.
(3) Penyelenggara Komputasi Awan wajib memberikan Informasi Elektronik dan/atau Data Elektronik mengenai pengguna layanan Penyelenggara Komputasi Awan yang dikuasainya untuk kepentingan pengawasan dan penegakan hukum.

---

### BAB IV: PERMOHONAN PEMUTUSAN AKSES INFORMASI ELEKTRONIK DAN/ATAU DOKUMEN ELEKTRONIK YANG DILARANG

#### Bagian Kesatu: Umum

##### Pasal 13

(1) PSE Lingkup Privat wajib melakukan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud dalam Pasal 9 ayat (4).
(2) Kewajiban melakukan Pemutusan Akses (take down) sebagaimana dimaksud pada ayat (1) termasuk Pemutusan Akses terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dapat memfasilitasi penyebarluasan Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang.

##### Pasal 14

(1) Permohonan Pemutusan Akses terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud dalam Pasal 13 dapat diajukan oleh:
a. masyarakat;
b. Kementerian atau Lembaga;
c. Aparat Penegak Hukum; dan/atau
d. lembaga peradilan.
(2) Permohonan sebagaimana dimaksud pada ayat (1) dapat disampaikan melalui:
a. situs web (website) dan/atau aplikasi;
b. surat non elektronik; dan/atau
c. surat elektronik (electronic mail).
(3) Permohonan sebagaimana dimaksud pada ayat (1) bersifat mendesak dalam hal:
a. terorisme;
b. pornografi anak; atau
c. konten yang meresahkan masyarakat dan mengganggu ketertiban umum.

#### Bagian Kedua: Permohonan Pemutusan Akses oleh Masyarakat

##### Pasal 15

(1) Permohonan Pemutusan Akses Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang oleh masyarakat sebagaimana dimaksud dalam Pasal 14 ayat (1) huruf a diajukan kepada:
a. Kementerian atau Lembaga yang berwenang untuk permohonan Pemutusan Akses terhadap: 1. Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang berada di bawah kewenangannya; dan/atau 2. Informasi Elektronik dan/atau Dokumen Elektronik yang dapat memfasilitasi diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang berada di bawah kewenangannya berdasarkan ketentuan peraturan perundang-undangan, atau
b. Menteri untuk permohonan Pemutusan Akses terhadap: 1. Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang bermuatan pornografi dan/atau perjudian; 2. Informasi Elektronik dan/atau Dokumen Elektronik yang dapat memfasilitasi diaksesnya Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang bermuatan pornografi dan/atau perjudian.
(2) Permohonan Pemutusan Akses yang diajukan oleh masyarakat sebagaimana dimaksud pada ayat (1) paling sedikit memuat informasi:
a. identitas pemohon;
b. gambar atau tangkapan layar (screen capture) yang menampilkan Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang;
c. tautan atau Uniform Resource Locator (URL) yang spesifik mengarah ke Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang yang dimohonkan untuk diputus aksesnya; dan
d. alasan yang menjadi dasar permohonan.
(3) Kementerian atau Lembaga yang menerima permohonan Pemutusan Akses dari masyarakat sebagaimana dimaksud pada ayat (1) huruf a mengajukan permohonan Pemutusan Akses kepada Menteri.
(4) Menteri memerintahkan PSE Lingkup Privat melakukan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (1).
(5) Perintah Pemutusan Akses (take down) sebagaimana dimaksud pada ayat (4) disampaikan melalui surat elektronik (electronic mail) atau Sistem Elektronik lainnya.
(6) PSE Lingkup Privat yang diperintahkan melakukan Pemutusan Akses (take down) sebagaimana dimaksud pada ayat (4) wajib melakukan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang **paling lambat 1 x 24 (satu kali dua puluh empat) jam** setelah surat perintah Pemutusan Akses (take down) diterima.
(7) Dalam hal PSE Lingkup Privat tidak melaksanakan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (6), Menteri dapat melakukan Pemutusan Akses dan/atau memerintahkan ISP untuk melakukan Pemutusan Akses terhadap Sistem Elektroniknya (access blocking) setelah mempertimbangkan alasan yang diajukan oleh PSE Lingkup Privat.
(8) Permohonan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang bersifat mendesak sebagaimana dimaksud dalam Pasal 14 ayat (3), PSE Lingkup Privat wajib melakukan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sesegera mungkin tanpa penundaan **paling lambat 4 (empat) jam** setelah peringatan diterima.
(9) Dalam hal PSE Lingkup Privat tidak melaksanakan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang bersifat mendesak dalam jangka waktu paling lambat 4 (empat) jam sebagaimana dimaksud pada ayat (8), Menteri dapat melakukan Pemutusan Akses dan/atau memerintahkan ISP untuk melakukan Pemutusan Akses terhadap Sistem Elektroniknya (access blocking) setelah mempertimbangkan alasan yang diajukan oleh PSE Lingkup Privat.
(10) PSE Lingkup Privat User Generated Content yang tidak melaksanakan Pemutusan Akses (take down) terhadap Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud pada ayat (6) dan ayat (8) dikenakan sanksi administratif berupa denda yang besarannya sesuai dengan ketentuan peraturan perundang-undangan mengenai penerimaan negara bukan pajak.
(11) Sanksi sebagaimana dimaksud pada ayat (10) disampaikan melalui surat teguran yang diberikan kepada PSE Lingkup Privat untuk setiap 1 x 24 jam (untuk ayat 6) dan 1 x 4 jam (untuk ayat 8) dengan maksimal surat teguran yang diberikan sebanyak 3 (tiga) kali.
(12) Dalam hal PSE Lingkup Privat User Generated Content tidak melakukan Pemutusan Akses (take down) dan/atau tidak membayar denda sebagaimana dimaksud pada ayat (10), Menteri dapat melakukan Pemutusan Akses dan/atau memerintahkan ISP untuk melakukan Pemutusan Akses terhadap Sistem Elektroniknya (access blocking).

#### Bagian Ketiga: Pengajuan Pemutusan Akses oleh Kementerian atau Lembaga, Aparat Penegak Hukum dan Lembaga Peradilan

##### Pasal 16

(1) Kementerian atau Lembaga terkait berkoordinasi dengan Menteri untuk Pemutusan Akses Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud dalam Pasal 9 ayat (4).
(2) Aparat penegak hukum dapat meminta Pemutusan Akses Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud dalam Pasal 9 ayat (4) kepada Menteri.
(3) Lembaga peradilan dapat memerintahkan Pemutusan Akses Informasi Elektronik dan/atau Dokumen Elektronik yang dilarang sebagaimana dimaksud dalam Pasal 9 ayat (4) kepada Menteri.
(4) Pemutusan Akses sebagaimana dimaksud pada ayat (1), ayat (2), dan ayat (3) diajukan dengan paling sedikit melampirkan:
a. surat resmi dari K/L, APH, atau surat penetapan/putusan pengadilan;
b. analisis hukum mengenai Informasi/Dokumen Elektronik yang dilarang;
c. gambar atau screen capture; dan
d. tautan atau link (URL) yang spesifik.
(5) Menteri memerintahkan PSE Lingkup Privat melakukan Pemutusan Akses (take down).
(6) Perintah disampaikan melalui email atau Sistem Elektronik lainnya.
(7) PSE Lingkup Privat wajib melakukan Pemutusan Akses (take down) **paling lambat 1 x 24 jam** setelah surat perintah diterima.
(8) Jika tidak melaksanakan, Menteri melakukan Pemutusan Akses / pemblokiran situs (access blocking).
(9) Untuk permohonan bersifat mendesak (terorisme, pornografi anak, meresahkan masyarakat), PSE Lingkup Privat wajib melakukan Pemutusan Akses **paling lambat 4 (empat) jam** setelah peringatan diterima.
(10) Jika tidak melaksanakan perintah mendesak 4 jam, Menteri/ISP langsung melakukan pemblokiran (access blocking).
(11) PSE Privat UGC yang melanggar ayat (7) dan (9) dikenai sanksi administratif berupa denda PNBP.
(12) Teguran diberikan per 24 jam (normal) atau per 4 jam (mendesak) maksimal 3 kali teguran.
(13) Jika tetap tidak take down / tidak bayar denda, dilakukan Pemutusan Akses (access blocking).

##### Pasal 17

(1) Pengajuan Pemutusan Akses secara tertulis harus dilakukan oleh Narahubung.
(2) Ketentuan Pemutusan Akses pada Pasal 15 dan Pasal 16 tidak berlaku bagi PSE Lingkup Privat Penyelenggara Komputasi Awan.

#### Bagian Keempat: Peran Penyelenggara Jasa Akses Internet (Internet Service Provider)

##### Pasal 18

(1) ISP wajib melakukan Pemutusan Akses terhadap Sistem Elektronik PSE Lingkup Privat (access blocking) yang diperintahkan oleh Menteri.
(2) Pemutusan Akses (access blocking) hanya dapat dilakukan oleh Menteri.
(3) Tata cara/metode pemblokiran ISP ditetapkan oleh Menteri.
(4) ISP yang tidak melakukan pemblokiran dikenai sanksi peraturan perundang-undangan.

##### Pasal 19

(1) ISP wajib menampilkan **laman labuh (landing page)** dalam melakukan Pemutusan Akses terhadap Sistem Elektronik.
(2) Landing page tidak boleh memuat konten dilarang atau iklan produk dilarang.
(3) Mengacu pada format Lampiran Peraturan Menteri ini.

#### Bagian Kelima: Normalisasi

##### Pasal 20

(1) PSE Lingkup Privat atau K/L dapat mengajukan permohonan Normalisasi kepada Menteri.
(2) Melampirkan: surat permohonan, identitas penanggung jawab, KTP/paspor, bukti screen capture & URL bahwa konten dilarang telah dihapus, surat rekomendasi K/L / APH / Putusan Pengadilan, dan bukti legitimasi PSE.
(3) Permohonan K/L diajukan melalui surat tertulis.
(4) Menteri menindaklanjuti permohonan Normalisasi yang memenuhi syarat dalam waktu **paling lama 2 x 24 (dua kali dua puluh empat) jam**.
(5) Menteri berwenang menolak permohonan Normalisasi terhadap Sistem Elektronik yang telah diputus aksesnya (access blocking) **lebih dari 3 (tiga) kali**.

---

### BAB V: PEMBERIAN AKSES TERHADAP SISTEM ELEKTRONIK DAN/ATAU DATA ELEKTRONIK UNTUK KEPENTINGAN PENGAWASAN DAN PENEGAKAN HUKUM PIDANA

#### Bagian Kesatu: Umum

##### Pasal 21

(1) PSE Lingkup Privat wajib memberikan akses terhadap Sistem Elektronik dan/atau Data Elektronik kepada Kementerian atau Lembaga dalam rangka pengawasan sesuai dengan peraturan perundang-undangan.
(2) PSE Lingkup Privat wajib memberikan akses terhadap Sistem Elektronik dan/atau Data Elektronik kepada Aparat Penegak Hukum dalam rangka penegakan hukum sesuai dengan peraturan perundang-undangan.

#### Bagian Kedua: Tata Cara Pemberian Akses untuk Kepentingan Pengawasan (K/L)

##### Pasal 22 - 31

- **Pengajuan Permintaan:** Disampaikan oleh K/L secara tertulis berdasarkan analisis kepentingan pengawasan, proporsionalitas, dan legalitas.
- **Penunjukan Narahubung (Pasal 25):** PSE Lingkup Privat **wajib menunjuk paling sedikit seorang Narahubung yang berdomisili di wilayah Indonesia** untuk memfasilitasi permohonan akses K/L dan APH.
- **Persyaratan Surat (Pasal 26 & 29):** Melampirkan dasar kewenangan K/L, maksud & tujuan, deskripsi spesifik jenis Data / Sistem Elektronik yang diminta, serta pejabat yang diberi wewenang mengakses.
- **SLA Pemenuhan (Pasal 27 & 31):** Wajib dipenuhi oleh PSE Lingkup Privat dalam waktu **paling lambat 5 (lima) hari kalender** sejak permintaan disampaikan oleh Narahubung K/L.
- **Kerahasiaan & Keamanan Akses (Pasal 30):** Akses bersifat terbatas dan rahasia. Wajib menjaga integritas, ketersediaan, kerahasiaan Data Elektronik, keandalan sistem, serta pelindungan Data Pribadi.

#### Bagian Ketiga: Pemberian Akses untuk Kepentingan Penegakan Hukum Pidana (APH)

##### Pasal 32

PSE Lingkup Privat memberikan akses terhadap Data Elektronik kepada APH untuk kepentingan penyidikan, penuntutan, atau persidangan tindak pidana dengan **ancaman pidana penjara paling singkat 2 (dua) tahun**.

##### Pasal 33

PSE Lingkup Privat memberikan akses terhadap Sistem Elektronik kepada APH untuk tindak pidana dengan ancaman pidana penjara:
a. **paling singkat 5 (lima) tahun**; atau
b. **di bawah 5 tahun tetapi tidak boleh di bawah 2 tahun** sepanjang mendapatkan **penetapan dari pengadilan negeri**.

##### Pasal 34

Dalam hal PSE Lingkup Privat mengelola/menyimpan data di luar wilayah Indonesia, PSE Privat wajib memberikan akses data/sistem terkait:
a. penduduk Indonesia; atau
b. Badan Usaha yang didirikan berdasarkan hukum Indonesia.

##### Pasal 36

(1) Access to **Data Lalu Lintas (Traffic Data)** dan **Informasi Pengguna (Subscriber Information)**: Disampaikan secara resmi kepada Narahubung PSE Lingkup Privat melampirkan dasar kewenangan APH, tujuan, deskripsi data, dan pasal tindak pidana.
(3) Access to **Konten Komunikasi**: Disampaikan resmi kepada PSE Lingkup Privat dengan **WAJIB melampirkan Surat Penetapan dari Ketua Pengadilan Negeri**.
(5) Access to **Data Pribadi Spesifik**: Disampaikan dengan persyaratan yang sama dengan Konten Komunikasi (**wajib Surat Penetapan Ketua Pengadilan Negeri**).

##### Pasal 37 & 41

Permintaan akses Data Elektronik maupun Sistem Elektronik oleh APH wajib dipenuhi oleh PSE Lingkup Privat dalam waktu **paling lambat 5 (lima) hari kalender** sejak permintaan disampaikan oleh Narahubung APH.

##### Pasal 39

Permintaan akses Sistem Elektronik oleh APH wajib melampirkan **Surat Penetapan dari Ketua Pengadilan Negeri** dan identitas pejabat APH yang ditunjuk.

##### Pasal 42 (Ketentuan Khusus Penyelenggara Komputasi Awan / Cloud Provider)

(1) Penyelenggara Komputasi Awan wajib memberikan akses Sistem/Data Elektronik kepada APH dalam rangka penegakan hukum.
(2) Kewajiban pemberian akses Cloud Provider **hanya untuk keperluan situasi DARURAT** terkait:
a. Terorisme;
b. Pornografi anak;
c. Perdagangan orang (_human trafficking_);
d. Kejahatan terorganisir (_organized crime_); dan/atau
e. Situasi darurat yang mengancam nyawa dan cedera fisik.
(3) Dipenuhi **paling lambat 5 (lima) hari kalender** sejak tanggal permohonan APH diterima.

#### Bagian Keempat: Rekam Jejak Akses (Audit Trail Access)

##### Pasal 43 & 44

- PSE Lingkup Privat **wajib memiliki rekam jejak audit (audit trail log)** mengenai seluruh penggunaan akses terhadap Sistem/Data Elektronik yang dilakukan oleh K/L maupun APH.
- PSE Lingkup Privat dapat melakukan _assessment_ dampak penggunaan akses terhadap kualitas layanan dan perlindungan data pribadi pengguna.

#### Bagian Kelima: Penjatuhan Sanksi Administratif

##### Pasal 45 & 46

- Jika PSE Privat / Cloud Provider tidak memberikan akses atau tidak memiliki audit trail log, K/L atau APH dapat melaporkan kepada Menteri.
- Sanksi administratif: Teguran tertulis, Penghentian Sementara, Pemutusan Akses (_access blocking_), hingga Pencabutan Tanda Daftar PSE.

---

### BAB VI & VII: KETENTUAN PERALIHAN DAN PENUTUP

##### Pasal 47 - 49

- PSE Lingkup Privat wajib melakukan pendaftaran dalam jangka waktu **paling lambat 6 (enam) bulan** sejak Peraturan Menteri ini berlaku (24 November 2020).
- Membatalkan Permenkominfo No. 19 Tahun 2014 (Situs Negatif) dan Permenkominfo No. 36 Tahun 2014 (Pendaftaran PSE).
- Mulai berlaku pada tanggal diundangkan (**24 November 2020**).

---

_Dokumentasi ini disusun secara lengkap dan terstruktur sebagai acuan standar pemrosesan sistem elektronik berstandar Permenkominfo No. 5 Tahun 2020 (PSE Privat)._
