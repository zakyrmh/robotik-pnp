# PRD — Presensi Daftar Ulang MRC

Versi: **1.0 (Final)**  
Tanggal: 26 Oktober 2026  
Lokasi: depan Gedung PKM, Politeknik Negeri Padang  
Pengguna: panitia MRC, dengan 3–5 meja bekerja bersamaan

## 1. Tujuan dan keputusan operasional

Menambahkan pencatatan kedatangan peserta dan penyerahan kokarde pada sistem pendaftaran MRC yang sudah tersedia. Daftar ulang berlangsung **satu kali per penyelenggaraan**, bukan presensi harian.

**Opsi A dikunci:** ketua tim atau pembimbing boleh mengambilkan kokarde anggota yang belum tiba. Anggota tersebut tetap **Belum Hadir**, tetapi kokardenya dapat **Sudah Diserahkan**. Nama dan peran penerima perwakilan wajib dicatat.

Kehadiran dicatat per anggota. Kehadiran, penyerahan kokarde, pembayaran, dan verifikasi wajah merupakan status terpisah. Pembimbing bukan anggota tim dan tidak termasuk hitungan kehadiran peserta; kokardenya dicatat pada pendaftaran tim hanya jika `advisor_name` terisi.

MVP mencakup pencarian admin, presensi, penyerahan kokarde, koreksi, rekap, dan ekspor CSV. Presensi mandiri, QR wajib, presensi harian, pencetakan kokarde, pengenalan wajah otomatis, stok kokarde, serta sinkronisasi offline otomatis berada di luar cakupan.

## 2. Kebutuhan fungsional

### FR-01 — Pencarian

Satu kolom menerima nama anggota, nama tim, instansi, atau kode pendaftaran. Nama/tim/instansi mendukung sebagian kata, mengabaikan kapitalisasi dan spasi berlebih. Kecocokan persis kode pendaftaran diprioritaskan. Hasil memuat konteks pembeda nama sama, kategori, kode pendaftaran, dan ringkasan kehadiran/kokarde. Membuka hasil tidak mengubah status.

Tersedia filter kategori, kehadiran, kokarde, dan paginasi server. Target respons pencarian **≤500 ms pada p95**, dari permintaan dikirim sampai hasil siap ditampilkan, termasuk jaringan dan otorisasi, di luar debounce. Uji dengan 500 tim dan lima sesi petugas bersamaan; jumlah anggota mengikuti kategori. Target harus dibuktikan melalui pengukuran, bukan hanya keberadaan indeks.

### FR-02 — Detail tim dan identitas kokarde

Panel menampilkan kode pendaftaran, nama tim, instansi, kategori, status pembayaran, daftar anggota beserta foto/peran, status hadir, status kokarde, waktu/petugas, dan penerima perwakilan.

Tampilkan referensi kokarde `member_qr_token` yang sama dengan QR pada e-ticket saat ini, dapat dilihat/disalin petugas yang berwenang. Jangan membuat kode pendek baru yang belum tercetak pada kokarde. Jangan menampilkan `access_token` pendaftaran, dokumen identitas, tanggal lahir, atau kontak yang tidak dibutuhkan.

Panel kokarde pembimbing hanya muncul jika nama pembimbing terisi.

### FR-03 — Pembayaran dan refresh

Hanya tim `paid` yang dapat diproses. Status lain tetap dapat ditemukan; aksi pencatatan dinonaktifkan dan peserta diarahkan ke meja verifikasi pembayaran.

Sediakan **Muat Ulang Status** untuk mengambil pembayaran dan status daftar ulang terbaru tanpa menutup panel, mengganti tim, atau menghapus pencarian. Setiap mutasi memeriksa ulang status pembayaran di server; petugas daftar ulang tidak dapat melewati syarat ini.

### FR-04 — Aksi cepat individu dan bulk

Tidak ada anggota yang dipilih otomatis. Petugas dapat memilih satu, beberapa, atau semua anggota dalam satu tim. Pembimbing tidak ikut dalam Pilih Semua Anggota.

| Aksi                              | Kehadiran          | Kokarde                             |
| --------------------------------- | ------------------ | ----------------------------------- |
| **Hadir & Serahkan Kokarde**      | Catat hadir        | Catat penyerahan langsung           |
| **Catat Hadir Saja**              | Catat hadir        | Pertahankan status                  |
| **Serahkan Kokarde (Diwakilkan)** | Pertahankan status | Catat penyerahan melalui perwakilan |

Aksi utama berlangsung satu klik setelah pemilihan ketika kokarde diserahkan secara fisik. Aksi perwakilan membuka formulir singkat: peran Ketua/Pembimbing dan penerima. Ketua dipilih dari anggota tim; pembimbing memakai nama terdaftar. Opsi pembimbing tidak tersedia jika namanya kosong.

Aksi hanya melengkapi status yang belum tercatat. Kedatangan anggota setelah kokardenya diambil perwakilan tidak menimpa riwayat penerimaan. Hasil menyebut jumlah anggota diperbarui dan yang sudah tercatat.

Bulk diproses atomik. Anggota tidak valid atau konflik versi membatalkan seluruh perubahan baru dan memicu pemuatan ulang panel. Selama proses, tombol dinonaktifkan. Status sukses hanya ditampilkan setelah konfirmasi server.

### FR-05 — Kokarde pembimbing

**Serahkan Kokarde Pembimbing** mencatat penerima (pembimbing sendiri atau ketua), waktu, dan petugas pada pendaftaran tim. Syarat pembayaran tetap `paid`. Tidak ada presensi pembimbing dalam MVP.

### FR-06 — Koreksi dan riwayat

Hanya `panitia-pendaftaran` dan `super-admin` dapat membatalkan hadir/penyerahan, dengan alasan wajib. Catatan awal dan koreksi tetap tersedia dalam audit immutable.

Pembatalan hadir boleh menghasilkan Belum Hadir + Sudah Diserahkan sesuai kebijakan perwakilan. Penyerahan yang salah dikoreksi terpisah. Kokarde hilang setelah diterima ditangani melalui SOP penggantian, bukan penghapusan catatan penerimaan.

### FR-07 — Rekap dan CSV

Hitung seluruh data sesuai filter, bukan hanya halaman aktif: anggota tim paid, hadir/belum hadir; tim belum hadir/hadir sebagian/hadir lengkap; kokarde anggota diserahkan/belum, termasuk yang diwakilkan; kokarde pembimbing diserahkan/belum, terpisah dari anggota.

Kehadiran tim diturunkan dari anggota hadir. CSV memuat kode pendaftaran, tim, instansi, kategori, anggota/pembimbing, status, penerima, waktu, dan petugas. Tanpa foto, dokumen pribadi, atau token akses. Lindungi nilai CSV dari formula spreadsheet.

### FR-08 — Hak akses

| Peran                | Detail/rekap          | Pencatatan | Koreksi | CSV   |
| -------------------- | --------------------- | ---------- | ------- | ----- |
| super-admin          | Ya                    | Ya         | Ya      | Ya    |
| panitia-pendaftaran  | Ya                    | Ya         | Ya      | Ya    |
| panitia-verifikasi   | Ya                    | Ya         | Tidak   | Tidak |
| panitia-pertandingan | Ringkasan operasional | Tidak      | Tidak   | Tidak |

Ringkasan pertandingan tidak memuat foto, token QR, atau penerima. Publik, peserta, dan role organisasi tanpa penugasan MRC tidak memperoleh akses.

## 3. Alur dan UX

Peserta menyebut nama/instansi → petugas mencari → membuka tim dan mencocokkan foto → memilih anggota yang dilayani → menjalankan aksi sesuai kondisi → memastikan hasil tersimpan → melanjutkan peserta berikutnya.

Pertahankan pencarian dan panel setelah mutasi. Sediakan **Peserta Berikutnya** yang menghapus pilihan dan mengembalikan fokus ke pencarian. Gunakan komponen desain yang tersedia, target sentuh ≥44 px, teks status selain warna, navigasi keyboard, dan pengumuman hasil untuk pembaca layar. Sediakan loading, kosong, gagal, dan coba lagi yang jelas.

## 4. Kegagalan dan integritas

- Dua meja melayani orang yang sama: satu pencatatan berlaku; permintaan berikutnya tidak menggandakan atau menimpa penerima/petugas pertama.
- Pembayaran berubah saat panel terbuka: transaksi membaca status terbaru dan menolak bila tidak paid.
- Hasil pengiriman tidak diketahui karena jaringan: jangan mengklaim sukses; muat ulang sebelum mengulangi. Pengulangan harus aman.
- Internet venue mati: daftar cadangan bernomor dibagi per meja/kategori; rekonsiliasi oleh petugas berwenang, dengan waktu kedatangan manual terpisah dari waktu input.
- Daftar ulang tidak mengubah `verification_status` pemeriksaan wajah sebelum pertandingan.
- Riwayat tidak hilang akibat penghapusan anggota/pendaftaran.

**Pengamanan wajib:** `apply_registration_change_request` saat ini mengganti anggota melalui delete + insert. Setelah daftar ulang dimulai, tolak payload perubahan yang memuat penggantian anggota, termasuk ketika status operasional kemudian dikoreksi. Perubahan metadata tim yang tidak mengganti anggota tetap dapat diproses. Pengamanan dan pencatatan mengunci pendaftaran yang sama dalam transaksi, agar perubahan anggota dan daftar ulang tidak lolos bersamaan. Selesaikan perubahan anggota sebelum daftar ulang pertama.

## 5. Rencana teknis

### Database dan migrasi Supabase

- Tabel `event_member_checkins`: satu baris unik per anggota, waktu/petugas hadir dan kokarde terpisah, metode/penerima kokarde, versi untuk konflik.
- Kolom kokarde pembimbing pada `event_registrations`: waktu, petugas, metode, snapshot penerima. Tidak merombak skema anggota.
- Transaksi RPC mengunci pendaftaran, memeriksa role/paid/anggota/versi, memproses bulk, dan menulis audit immutable secara atomik. Gunakan sistem audit aktual repo `system_audit_logs` (dokumen proyek menyebut audit_logs secara umum); payload schema v2 memuat timestamp, aktor, target, aksi, correlation ID, tanpa token/dokumen/kontak mentah.
- FK RESTRICT dan pengaman perubahan data mempertahankan riwayat. Riwayat pertama tetap mengunci perubahan walau status kemudian dibatalkan.
- Indeks pg_trgm untuk nama anggota, tim, dan instansi; gunakan indeks kode pendaftaran. Hasil pencarian ringan, detail/foto dimuat setelah pemilihan.
- Mengikuti model satu penyelenggaraan MRC aktif yang tersedia. Jangan menghapus/reset data untuk edisi berikutnya; dukungan multi-edisi membutuhkan pengikatan edisi lebih dahulu.

### RLS dan Server Actions

Aktifkan RLS, batasi pembacaan sesuai peran, larang DML langsung klien/publik. RPC memverifikasi identitas dan role database; aktor berasal dari sesi. Server Actions memakai getUser(), Zod, ActionResult, transaksi database, dan revalidasi. Tidak membuat API route mutasi form.

Antarmuka aksi: registrationId, memberIds, jenis aksi, penerima jika diwakilkan, dan versi status. Koreksi membutuhkan target/jenis/alasan. Pencarian/detail/refresh tidak memakai cache status lintas permintaan.

### Halaman dan komponen

Route `/manajemen-event/presensi` berupa Server Component dengan guard per halaman dan menu sidebar. Client leaf menangani pencarian/filter, detail, bulk, formulir perwakilan, koreksi, refresh, CSV, dan fokus pencarian.

## 6. Pengujian dan penerimaan

1. Keempat jenis pencarian bekerja, nama sama dapat dibedakan, filter/paginasi konsisten, p95 ≤500 ms dibuktikan pada skala target.
2. Hadir saja tidak membagikan kokarde; perwakilan tidak menandai anggota hadir.
3. Aksi utama dan bulk memperbarui dua status atomik, hanya untuk anggota dipilih.
4. Kedatangan setelah pengambilan perwakilan mempertahankan penerima pertama.
5. Pembimbing hanya muncul ketika namanya ada dan tidak mengubah hitungan peserta.
6. Refresh mempertahankan pencarian/tim; server selalu memeriksa pembayaran terbaru.
7. Dua meja, klik ulang, retry, dan konflik tidak menggandakan atau menghasilkan bulk sebagian.
8. RLS/RPC menolak akses tanpa izin dan aktor palsu; kegagalan audit menggagalkan transaksi.
9. Koreksi mempertahankan riwayat; perubahan data/penghapusan tidak menghilangkan presensi.
10. Rekap/CSV sesuai data, aman dari formula, dan tidak membocorkan token/dokumen.
11. Uji alur dengan petugas pada desktop/ponsel dan lima sesi bersamaan; jalankan typecheck, lint, dan test sebelum rilis.

## 7. Rollout

Terapkan migrasi pada lingkungan uji sebelum halaman digunakan, verifikasi hak akses dan data contoh, ukur pencarian, lalu simulasi meja. Migrasi produksi dan publikasi dilakukan melalui alur deployment proyek; jangan menganggap penyimpanan PRD sebagai persetujuan deployment produksi. Catat ADR implementasi pada memori proyek dan indeks vault ketika implementasi selesai.
