Berikut adalah dokumentasi struktur komponen dan detail isi untuk halaman **Hubungi Kami / Contact Us** dalam format `hubungi-kami.md`. Halaman ini dirancang sebagai gerbang komunikasi formal maupun informal bagi pihak luar (seperti pihak kampus Politeknik Negeri Padang, calon sponsor kompetisi, komunitas robotik lain, hingga mahasiswa yang ingin bertanya).

---

```markdown
# Dokumentasi Komponen Halaman Hubungi Kami

Dokumen ini berisi arsitektur komponen, detail elemen kontak, dan spesifikasi interaksi untuk halaman **Hubungi Kami**. Desain ini difokuskan pada kejelasan informasi kontak resmi, formulir pesan yang intuitif, serta elemen interaktif peta lokasi yang menyatu dengan tema teknologi UKM Robotik PNP.

---

## 1. Komponen Layout Utama (Hierarchy)

Halaman Hubungi Kami dibagi menjadi dua kolom utama pada tampilan Desktop (atau bertumpuk pada Mobile) untuk menyeimbangkan antara informasi langsung dan formulir interaktif:
```

[PageWrapper (Animasi Transisi Masuk)]
├── [HeroSection] -> Judul Utama & Slogan Ajakan Berkolaborasi
└── [ContentSplitLayout] -> Pembagian Konten 2 Kolom
├── [Kolom 1: QuickContact & Map] -> Info Kontak Langsung & Lokasi Fisik
└── [Kolom 2: ContactForm] -> Formulir Pengiriman Pesan Ke Organisasi

```

---

## 2. Detail Komponen & Spesifikasi Isi

### A. Komponen: `HeroSection`
*   **Judul Utama (H1):** `Mari Berkolaborasi dan Terhubung`
*   **Sub-judul:** `Memiliki pertanyaan seputar riset kami, kerja sama sponsor, atau tertarik mengundang UKM Robotik PNP dalam event Anda? Hubungi kami sekarang.`

### B. Komponen: `QuickContact` (Kolom Kiri - Atas)
Menampilkan kartu-kartu informasi kontak instan yang langsung dapat diklik (*clickable action links*):

1.  **Alamat Sekretariat (Ikon: Map Pin):**
    *   *Teks:* Gedung Pusat Kegiatan Mahasiswa (PKM) Lt. 2, Kampus Politeknik Negeri Padang, Limau Manis, Kec. Pauh, Kota Padang, Sumatera Barat.
2.  **Email Resmi (Ikon: Mail / Surat):**
    *   *Teks:* `robotik@pnp.ac.id` (Tautan otomatis membuka aplikasi email: `mailto:robotik@pnp.ac.id`).
3.  **Media Sosial Resmi (Ikon Group):**
    *   Barisan ikon minimalis interaktif yang menghubungkan ke akun resmi: Instagram (`@robotik_pnp`), YouTube, dan GitHub organisasi.

### C. Komponen: `InteractiveMap` (Kolom Kiri - Bawah)
*   **Isi:** Sematan (*embed*) Google Maps lokasi kampus Politeknik Negeri Padang, khususnya area Gedung PKM/Sekretariat.
*   **Desain Visual:** Bingkai peta disesuaikan dengan tema situs menggunakan sudut melengkung (*rounded corners*) dan efek bayangan (*shadow*) tipis agar selaras dengan kartu komponen lainnya.

### D. Komponen: `ContactForm` (Kolom Kanan)
Formulir bersih bagi pengunjung yang ingin mengirimkan pesan formal secara langsung melalui situs web.

*   **Elemen Input:**
    1.  **Nama Lengkap:** Input teks (Wajib diisi).
    2.  **Instansi / Organisasi:** Input teks (Opsional, contoh: *Universitas X, PT. Y, Umum*).
    3.  **Alamat Email:** Input bertipe email untuk kebutuhan balasan (Wajib diisi).
    4.  **Kategori Pesan (Dropdown/Select):** Pilihan tujuan pesan agar pengurus lebih mudah menyortir:
        *   `Sponsorship & Kerja Sama`
        *   `Undangan Event / Eksibisi`
        *   `Pertanyaan Seputar Rekrutmen (Caang)`
        *   `Kritik & Saran / Lainnya`
    5.  **Isi Pesan:** Textarea dengan ruang baris yang cukup luas (Wajib diisi).
*   **Tombol Aksi (`SubmitButton`):** Tombol bertuliskan `Kirim Pesan` yang dilengkapi dengan efek hover interaktif.

---

## 3. Aturan Animasi & Interaksi

Agar selaras dengan transisi halus pada halaman Beranda dan Profil, komponen ini wajib menerapkan interaksi berikut:

1.  **Split Fade-In (Entrance):**
    Saat halaman dimuat, Kolom Kiri (`QuickContact`) dan Kolom Ranan (`ContactForm`) memudar masuk secara bersamaan dari arah luar yang berlawanan secara halus (efek *sliding in from left and right*).
2.  **Focus Border Animation pada Form:**
    Ketika pengguna mengklik salah satu kotak input di `ContactForm`, garis tepi (*border*) kotak tersebut akan berubah warna (misalnya menjadi warna biru elektrik atau aksen utama UKM) dengan animasi transisi memudar (*glow transition*).
3.  **Submit Loading State:**
    Saat tombol `Kirim Pesan` diklik, teks tombol berubah menjadi ikon *loading spinner* berputar, dan setelah berhasil, memicu animasi centang hijau kecil yang menandakan "Pesan Berhasil Dikirim".

```
