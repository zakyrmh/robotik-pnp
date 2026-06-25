# Rancangan Konten Halaman Detail Divisi - UKM Robotik PNP

Halaman ini berfungsi sebagai wadah eksplorasi mendalam (deep dive) untuk masing-masing dari 5 divisi kompetisi robotika (KRAI, KRSBI-B, KRSBI-H, KRSTI, KRSRI). Fokus utamanya adalah menyajikan spesifikasi teknis riset, memperkenalkan anggota tim teknis divisi, serta memamerkan rekam jejak prestasi dan dokumentasi uji coba lapangan kepada pengunjung, calon anggota, maupun pihak sponsor.

---

## 1. Hero Section: Division Identity (Pengantar & Identitas Divisi)

Seksi pembuka yang langsung memberikan impresi visual dan penegasan fokus kompetisi dari divisi terkait.

### Komponen UI & Visual

- **Layout:** Grid 2 kolom yang responsif.
- **Kolom Kiri:** Teks judul, tag kompetisi resmi, dan deskripsi singkat fokus divisi.
- **Kolom Kanan:** Aset visual utama berupa foto close-up robot andalan divisi tersebut atau visualisasi 3D render komponen mekanik robot.

### Konten Teks

- **Badges / Tag Kategori:** "Kontes Robot Indonesia (KRI) - Puspresnas"
- **Headline Utama:** "[Nama Panjang Divisi Kompetisi]" (Contoh: _KRSBI-B - Kontes Robot Sepak Bola Indonesia Beroda_)
- **Sub-headline:** Deskripsi performa singkat yang menjelaskan peran robot dalam kompetisi tersebut (Contoh: _Divisi riset yang berfokus pada pengembangan robot otonom beroda berkemampuan mobilitas tinggi untuk mensimulasikan permainan sepak bola secara cerdas dan taktis._)

---

## 2. Spesifikasi Teknis Robot (Technical Core Specs)

Bagian inti yang membedah arsitektur teknologi dan komponen modular yang dikembangkan di dalam divisi tersebut.

### Komponen UI & Visual

- Komponen **Tab Interactive Layout** (Mekanik, Elektronik, Software) untuk memisahkan fokus bahasan teknis agar rapi dan tidak menumpuk.
- Gunakan struktur list berikon (_iconic checklist_) mini untuk mempertegas komponen sub-sistem robot.

### Konten Teks per Kategori Tab

- **Tab 1: Mekanik & Hardware**
  - Sistem Aktuator: Jenis penggerak utama robot (Contoh: _DC Motor dengan High Torque_ atau _Omnidirectional Wheels_ untuk mobilitas segala arah).
  - Sasis & Bodi: Material utama pembentuk kerangka robot (Contoh: _Aluminium Alloy cutting_ atau _serat karbon_ ringan).
  - Sistem Daya: Manajemen energi dan jenis baterai yang menyokong performa robot di lapangan.
- **Tab 2: Elektronik & Sensor**
  - Komputasi Utama: Otak pemroses data robot (Contoh: _Mikrokontroler ESP32_ untuk kontrol tingkat rendah atau _Mini PC/Jetson_ untuk pemrosesan tingkat tinggi).
  - Sistem Sensor: Alat indra robot di lapangan (Contoh: _Sistem Kamera (Vision)_, _Sinyal Lidar_, atau _Sensor Kecepatan IMU/Inertial Measurement Unit_).
  - Sirkuit Kendali: Penataan sistem perkabelan dan papan PCB kustom hasil rancangan internal tim.
- **Tab 3: Software & Artificial Intelligence**
  - Framework & OS: Lingkungan pengembangan kode (Contoh: _Robot Operating System / ROS 2_).
  - Modul Visi Komputer: Algoritma cerdas pelacak objek lapangan (Contoh: _Deteksi bola dan gawang secara real-time berbasis YOLO_).
  - Logika Strategi: Algoritma penentu keputusan dan pergerakan taktis robot berdasarkan situasi pertandingan.

---

## 3. Struktur Tim Teknis Divisi (Division Line-Up)

Memperkenalkan anggota tim spesifik yang bertanggung jawab penuh atas riset robot di bawah koordinasi divisi berjalan.

### Komponen UI & Visual

- Layout menggunakan susunan horizontal _avatar cards_ atau _minimalist profile grid_ yang berfokus pada efisiensi ruang visual.
- Setiap kartu menampilkan foto profil kasual anggota tim di workshop, nama lengkap, serta label keahlian utama mereka.

### Peran Tim yang Ditampilkan

- **Ketua Divisi / General Manager:** Penanggung jawab manajemen riset dan strategi tim.
- **Tim Software / Programmer:** Anggota yang menangani implementasi algoritma, pengolahan citra visi, dan pergerakan otonom robot.
- **Tim Elektrikal / Hardware:** Anggota yang merancang sirkuit PCB, integrasi sensor, dan sistem distribusi daya listrik.
- **Tim Mekanik / Designer:** Anggota yang merancang struktur CAD, simulasi beban mekanis, serta perakitan fisik robot.

---

## 4. Rekam Jejak & Prestasi (Division Milestones)

Menampilkan daftar kejayaan dan piala yang berhasil diraih secara khusus oleh divisi ini selama berpartisipasi di ajang kompetisi.

### Komponen UI & Visual

- Layout menggunakan **Bento Grid Layout** modern atau komponen **Achievement Cards Slider** yang responsif.
- Gunakan efek gradasi warna tipis di latar belakang kartu untuk mencerminkan nuansa medali (emas/perak/perunggu) tanpa merusak konsistensi tema gelap website.

### Konten Teks per Kartu Prestasi

- **Judul Penghargaan:** (Contoh: _Juara 1 Tingkat Regional / Desain Robot Terbaik_)
- **Nama Kompetisi:** Kontes Robot Indonesia (KRI) beserta tahun pelaksanaan kompetisi.
- **Penyelenggara & Lokasi:** Nama kampus tuan rumah dan wilayah pelaksanaan kontes.

---

## 5. Galeri Riset & Dokumentasi Lapangan (Uji Coba Robot)

Menunjukkan aktivitas harian pengerjaan robot serta bukti autentik dari performa pergerakan robot selama proses simulasi uji coba internal.

### Komponen UI & Visual

- Kombinasi antara **Video Player Embed Box** di sisi atas/samping, didukung oleh grid dokumentasi foto di sekelilingnya.
- Komponen pemutar video harus memiliki kontrol kontrol minimalis agar tidak merusak visual estetika antarmuka.

### Ragam Visual yang Diperlihatkan

- Video singkat yang memperlihatkan pergerakan robot saat melakukan simulasi pertandingan di lapangan uji coba internal workshop.
- Foto dokumentasi anggota tim saat melakukan proses kalibrasi sensor, pengelasan sasis, atau perbaikan kode di depan komputer kerja.
