# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Pengurus UKM Robotik PNP mengelola tata kelola organisasi, rekrutmen, kegiatan, kedisiplinan, dan acara MRC. Panitia MRC menggunakan panel internal saat pendaftaran, verifikasi pembayaran, daftar ulang, dan pertandingan. Peserta MRC mengakses pendaftaran dan e-ticket tanpa akun melalui tautan terbatas.

## Product Purpose

Sistem Informasi Manajemen UKM Robotik PNP menyatukan proses organisasi dan penyelenggaraan kompetisi dalam alur yang dapat diaudit. Keberhasilan berarti pekerjaan panitia cepat di lapangan, batas akses per peran terjaga, dan riwayat administratif tidak dapat dimanipulasi.

## Operating Context

Antarmuka internal dipakai pada laptop dan ponsel. Daftar ulang MRC berlangsung satu kali per penyelenggaraan di depan Gedung PKM PNP dengan tiga sampai lima meja aktif bersamaan. Koneksi dapat melambat, peserta dapat bernama sama, dan kokarde dapat diambilkan ketua tim atau pembimbing.

## Capabilities and Constraints

- Next.js App Router, React, Supabase Auth/PostgreSQL/RLS, dan Server Actions.
- Lima role organisasi dan tiga `role_event` MRC membatasi akses server dan UI.
- Mutasi administratif divalidasi, diaudit, dan memakai identitas sesi server.
- Kehadiran peserta MRC dan penyerahan kokarde adalah status terpisah.
- Foto serta data identitas peserta hanya ditampilkan kepada petugas yang memerlukannya.
- Pendaftaran peserta MRC tidak menyediakan akun login peserta.

## Brand Commitments

Nama resmi adalah UKM Robotik Politeknik Negeri Padang. Suara produk ringkas, percaya diri, akademis, dan solutif. Identitas visual yang mengikat tersedia di `DESIGN.md` dan menggunakan pendekatan Clean Institutional Engineering.

## Evidence on Hand

- `DESIGN.md` sebagai sumber sistem visual.
- `docs/prd-presensi-daftar-ulang-mrc.md` sebagai kebutuhan final daftar ulang MRC.
- Alur pendaftaran, pembayaran, e-ticket, QR kokarde, dan panel admin sudah berjalan di repositori.

## Product Principles

- Tugas lapangan harus selesai dengan sedikit langkah dan umpan balik yang jelas.
- Status operasional yang berbeda tidak boleh digabung hingga kehilangan makna.
- Sistem selalu memverifikasi identitas, peran, dan data mutakhir pada batas server.
- Riwayat administrasi harus tetap dapat ditelusuri setelah koreksi.
- Gunakan kemampuan yang sudah tersedia sebelum menambah komponen atau dependency.

## Accessibility & Inclusion

Antarmuka mengikuti WCAG 2.2 AA, dapat digunakan dengan keyboard, tidak mengandalkan warna saja, dan menyediakan target sentuh sekurangnya 44 × 44 piksel.
