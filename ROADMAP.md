# 🗺️ Roadmap

Dokumen ini berisi daftar fitur yang akan dikembangkan untuk sistem Robotik PNP.

> **Terakhir diperbarui**: 30 Januari 2026

---

## 📊 Ringkasan Prioritas

| Prioritas | Modul                       | Status     |
| --------- | --------------------------- | ---------- |
| 🔴 Tinggi | Riset & Pengembangan (R&D)  | ⏳ Planned |
| 🔴 Tinggi | Inventaris (Lab Management) | ⏳ Planned |
| 🟡 Sedang | Kesekretariatan (Expanded)  | ⏳ Planned |
| 🟡 Sedang | Keuangan (Treasury)         | ⏳ Planned |
| 🟢 Normal | Komisi Disiplin             | ⏳ Planned |
| 🟢 Normal | Sistem (Manajemen User)     | ⏳ Planned |
| 🔵 Rendah | Notifikasi                  | ⏳ Planned |

---

## 🔴 Prioritas Tinggi

### 1. Modul Riset & Pengembangan (R&D)

Modul untuk mengelola kegiatan riset dan pengembangan tim robotik.

#### 1.1 Jurnal/Logbook Riset

- [ ] Halaman daftar jurnal riset
- [ ] Form input jurnal riset harian/mingguan
- [ ] Upload dokumentasi (foto, video, dokumen)
- [ ] Kategorisasi berdasarkan proyek/tim
- [ ] Timeline progress riset
- [ ] Export laporan riset (PDF)
- [ ] Komentar dan feedback dari pembimbing

#### 1.2 Repository Aset

- [ ] Katalog aset digital (desain, kode, dokumentasi)
- [ ] Upload dan download file aset
- [ ] Versioning aset (histori perubahan)
- [ ] Tagging dan kategorisasi aset
- [ ] Pencarian aset berdasarkan nama/tag/kategori
- [ ] Preview file (gambar, PDF, 3D model)
- [ ] Access control per aset/folder

---

### 2. Modul Inventaris (Lab Management)

Modul untuk mengelola inventaris dan peralatan laboratorium.

#### 2.1 Peminjaman Alat (E-Inventory)

- [ ] Katalog alat/komponen laboratorium
- [ ] Detail alat (nama, kode, lokasi, kondisi, foto)
- [ ] Form peminjaman alat
- [ ] Approval workflow peminjaman
- [ ] Tracking status peminjaman (dipinjam, dikembalikan, terlambat)
- [ ] Notifikasi reminder pengembalian
- [ ] Riwayat peminjaman per alat
- [ ] Laporan utilitas alat
- [ ] QR Code untuk scan alat
- [ ] Denda keterlambatan (opsional)

#### 2.2 Wishlist Pengadaan

- [ ] Form request pengadaan barang baru
- [ ] Voting/upvote sistem untuk prioritas
- [ ] Status tracking pengadaan (diajukan, diproses, dibeli, selesai)
- [ ] Estimasi harga dan link referensi
- [ ] Approval workflow dari koordinator/pembina
- [ ] Integrasi dengan modul keuangan

---

## 🟡 Prioritas Sedang

### 3. Modul Kesekretariatan (Expanded)

Modul untuk mengelola tugas kesekretariatan tim.

#### 3.1 Manajemen Piket

- [ ] Jadwal piket laboratorium
- [ ] Rotasi otomatis jadwal piket
- [ ] Tukar jadwal piket antar anggota
- [ ] Checklist tugas piket
- [ ] Absensi piket (check-in/check-out)
- [ ] Laporan kehadiran piket
- [ ] Notifikasi reminder piket

#### 3.2 Arsip Surat Digital

- [ ] Upload dan katalog surat masuk/keluar
- [ ] Nomor surat otomatis
- [ ] Kategorisasi surat (undangan, SK, proposal, dll)
- [ ] Template surat
- [ ] Pencarian surat
- [ ] Download dan preview surat
- [ ] Histori disposisi surat

---

### 4. Modul Keuangan (Treasury)

Modul untuk mengelola keuangan tim.

#### 4.1 Tracking Uang Kas

- [ ] Dashboard saldo kas terkini
- [ ] Pencatatan pemasukan (iuran, sponsor, hibah)
- [ ] Pencatatan pengeluaran (operasional, pengadaan)
- [ ] Kategorisasi transaksi
- [ ] Upload bukti transaksi
- [ ] Approval pengeluaran besar
- [ ] Laporan keuangan bulanan/tahunan
- [ ] Export laporan (PDF, Excel)
- [ ] Grafik visualisasi arus kas

#### 4.2 Manajemen Iuran Anggota

- [ ] Tracking pembayaran iuran per anggota
- [ ] Status pembayaran (lunas, belum, cicilan)
- [ ] Reminder pembayaran otomatis
- [ ] Rekap iuran per periode

---

## 🟢 Prioritas Normal

### 5. Modul Komisi Disiplin (Monitoring & Sanksi)

Modul untuk monitoring kedisiplinan anggota.

#### 5.1 Monitoring Kegiatan

- [ ] Dashboard keaktifan anggota
- [ ] Tracking partisipasi kegiatan
- [ ] Poin keaktifan anggota
- [ ] Leaderboard keaktifan

#### 5.2 Presensi

- [ ] Integrasi dengan modul presensi existing
- [ ] Rekap presensi per anggota
- [ ] Visualisasi kehadiran (grafik)
- [ ] Alert ketidakhadiran beruntun

#### 5.3 Surat Peringatan Otomatis

- [ ] Trigger otomatis berdasarkan kriteria (alfa > 3x, dll)
- [ ] Template surat peringatan (SP1, SP2, SP3)
- [ ] Notifikasi ke anggota terkait
- [ ] Arsip surat peringatan
- [ ] Eskalasi otomatis (SP1 → SP2 → SP3)
- [ ] Dashboard pelanggaran

---

### 6. Modul Sistem (Manajemen User)

Modul untuk administrasi sistem dan pengguna.

#### 6.1 Role Management

- [ ] Daftar roles dan permissions
- [ ] CRUD roles (Admin, Koordinator, Anggota, Caang, dll)
- [ ] Assign/revoke role ke user
- [ ] Permission granular per fitur
- [ ] Role hierarchy

#### 6.2 Ban/Block User

- [ ] Suspend user sementara
- [ ] Ban permanen user
- [ ] Alasan ban/suspend
- [ ] Histori ban per user
- [ ] Unban user

#### 6.3 Reset Password Manual

- [ ] Admin reset password user
- [ ] Force password change on next login
- [ ] Log aktivitas reset password
- [ ] Email notifikasi ke user

---

## 🔵 Prioritas Rendah

### 7. Modul Notifikasi

Sistem notifikasi real-time untuk berbagai event.

#### 7.1 Notifikasi Pendaftaran

- [ ] Ada akun baru mendaftar
- [ ] Ada caang mengajukan verifikasi
- [ ] Status verifikasi berubah (diterima/ditolak)

#### 7.2 Notifikasi Tugas

- [ ] Ada tugas baru dipublish
- [ ] Ada caang submit tugas
- [ ] Deadline tugas mendekat
- [ ] Nilai tugas sudah keluar

#### 7.3 Notifikasi Kegiatan

- [ ] Kegiatan baru dijadwalkan
- [ ] Reminder kegiatan H-1
- [ ] Kegiatan dibatalkan/dijadwal ulang

#### 7.4 Notifikasi Umum

- [ ] Pengumuman baru
- [ ] Materi baru diupload
- [ ] Reminder presensi

#### 7.5 Channel Notifikasi

- [ ] In-app notification (bell icon)
- [ ] Push notification (browser)
- [ ] Email notification
- [ ] WhatsApp notification (opsional)
- [ ] Preferensi notifikasi per user

---

## 🎯 Fitur Tambahan (Backlog)

Fitur-fitur tambahan yang bisa dikembangkan di masa depan:

### Komunikasi & Kolaborasi

- [ ] Forum diskusi internal
- [ ] Chat/messaging antar anggota
- [ ] Announcement board

### Dokumentasi & Knowledge Base

- [ ] Wiki internal tim
- [ ] SOP dan panduan
- [ ] FAQ

### Gamification

- [ ] Badge dan achievement
- [ ] Poin kontribusi
- [ ] Leaderboard anggota

### Reporting & Analytics

- [ ] Dashboard analytics komprehensif
- [ ] Export laporan custom
- [ ] Statistik tim

### Integrasi Eksternal

- [ ] Google Calendar sync
- [ ] Google Drive integration
- [ ] GitHub/GitLab integration
- [ ] WhatsApp Bot

---

## 📝 Cara Update Dokumen Ini

1. Ubah status checkbox `[ ]` menjadi `[x]` ketika fitur selesai
2. Tambahkan tanggal penyelesaian jika diperlukan
3. Update tabel ringkasan prioritas di atas
4. Pindahkan fitur yang sudah selesai ke CHANGELOG.md

---

## 📌 Legend

| Simbol         | Arti              |
| -------------- | ----------------- |
| ⏳ Planned     | Direncanakan      |
| 🚧 In Progress | Sedang dikerjakan |
| ✅ Completed   | Selesai           |
| ❌ Cancelled   | Dibatalkan        |
| 🔴             | Prioritas Tinggi  |
| 🟡             | Prioritas Sedang  |
| 🟢             | Prioritas Normal  |
| 🔵             | Prioritas Rendah  |
