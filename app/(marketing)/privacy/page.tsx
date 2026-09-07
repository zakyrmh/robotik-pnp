import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi | UKM Robotik PNP",
  description:
    "Kebijakan Privasi Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang, sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.",
  openGraph: {
    title: "Kebijakan Privasi | UKM Robotik PNP",
    description:
      "Kebijakan Privasi Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.",
    type: "website",
  },
};

const sections = [
  {
    id: "pendahuluan",
    title: "1. Pendahuluan",
    content: [
      'Kebijakan Privasi ini menjelaskan cara UKM Robotik Politeknik Negeri Padang (selanjutnya disebut "Kami") mengumpulkan, menggunakan, menyimpan, membagikan, dan melindungi data pribadi Anda sebagai pengguna Sistem Informasi Manajemen UKM Robotik PNP (selanjutnya disebut "Sistem").',
      "Kami memproses data pribadi Anda sesuai dengan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi (UU PDP), Peraturan Pemerintah Nomor 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik, serta Peraturan Direktur Politeknik Negeri Padang Nomor 2 Tahun 2023 tentang Pedoman Norma dan Etika Akademik.",
    ],
  },
  {
    id: "pengendali-data",
    title: "2. Pengendali Data Pribadi",
    content: [
      "Pengendali Data Pribadi adalah UKM Robotik Politeknik Negeri Padang, yang menentukan tujuan dan cara pemrosesan data pribadi yang dilakukan dalam Sistem.",
      "Dokumen kebijakan dan tata kelola keamanan informasi (ISMS) serta pelindungan data pribadi (PIMS) dikelola oleh Tim IT & Security Governance UKM Robotik PNP dan ditinjau secara berkala setiap enam bulan.",
    ],
  },
  {
    id: "data-dikumpulkan",
    title: "3. Data yang Kami Kumpulkan",
    content: [
      "Kami mengumpulkan data pribadi secara terbatas dan proporsional sesuai kebutuhan layanan, meliputi:",
      "Data identitas dan akademik, antara lain nama lengkap, NIM, program studi, angkatan, dan alamat email. Data ini digunakan untuk memastikan keabsahan status Anda sebagai mahasiswa Politeknik Negeri Padang.",
      "Data aktivitas keanggotaan, antara lain riwayat pendaftaran open recruitment, penempatan kelompok magang, penugasan piket dan shift laboratorium, kehadiran kegiatan, serta hasil evaluasi kedisiplinan.",
      "Data teknis dan keamanan, antara lain alamat IP, jenis perangkat dan browser, serta catatan log aktivitas (audit trail) yang tercatat saat Anda mengakses Sistem.",
      "Kami tidak mengumpulkan data pribadi yang tidak relevan dengan tujuan pemrosesan, sesuai prinsip minimasi data.",
    ],
  },
  {
    id: "dasar-pemrosesan",
    title: "4. Dasar Hukum Pemrosesan",
    content: [
      "Pemrosesan data pribadi dilakukan berdasarkan dasar hukum yang sah sesuai Pasal 20 UU PDP, antara lain:",
      "Persetujuan eksplisit yang Anda berikan saat mendaftar dan menyetujui Syarat dan Ketentuan serta Kebijakan Privasi ini;",
      "Pemenuhan kewajiban perjanjian keanggotaan dan pelaksanaan kegiatan organisasi;",
      "Pemenuhan kewajiban hukum sesuai peraturan perundang-undangan yang berlaku; dan",
      "Kepentingan yang sah organisasi dengan tetap memperhatikan keseimbangan antara kepentingan Kami dan hak Anda sebagai subjek data pribadi.",
    ],
  },
  {
    id: "tujuan-penggunaan",
    title: "5. Tujuan Penggunaan Data",
    content: [
      "Data pribadi Anda digunakan untuk keperluan administratif dan operasional organisasi, antara lain:",
      "Pengelolaan keanggotaan, termasuk proses pendaftaran calon anggota dan penempatan kelompok magang;",
      "Pencatatan presensi kegiatan, penugasan piket, dan penilaian kedisiplinan;",
      "Komunikasi organisasi terkait kegiatan, pengumuman, dan informasi keanggotaan; dan",
      "Dokumentasi kegiatan serta evaluasi program UKM Robotik PNP.",
      "Data pribadi Anda tidak akan dijual, disewakan, atau digunakan untuk tujuan di luar yang telah dijelaskan dalam kebijakan ini.",
    ],
  },
  {
    id: "prinsip-pemrosesan",
    title: "6. Prinsip Pemrosesan",
    content: [
      "Pemrosesan data pribadi dilakukan sesuai Pasal 16 UU PDP, yaitu:",
      "Pengumpulan dilakukan secara terbatas, spesifik, sah secara hukum, dan transparan;",
      "Pemrosesan dilakukan sesuai dengan tujuannya serta menjamin hak subjek data pribadi;",
      "Data diproses secara akurat, lengkap, tidak menyesatkan, dan dapat dipertanggungjawabkan;",
      "Keamanan data dilindungi dari akses, pengungkapan, pengubahan, penyalahgunaan, perusakan, atau penghilangan yang tidak sah; dan",
      "Data dimusnahkan atau dihapus setelah masa retensi berakhir atau berdasarkan permintaan subjek data pribadi.",
    ],
  },
  {
    id: "pengamanan",
    title: "7. Pengamanan Data",
    content: [
      "Kami menerapkan langkah pengamanan teknis dan organisasional yang memadai untuk melindungi data pribadi Anda, antara lain:",
      "Enkripsi transmisi data menggunakan TLS/SSL, termasuk protokol TLS 1.3 untuk pertukaran data antar sistem;",
      "Pengamanan kata sandi menggunakan hashing yang kuat, manajemen sesi dengan cookie HTTP-Only dan SameSite, serta penerapan rate limiting untuk mencegah percobaan akses berulang;",
      "Pengendalian akses berbasis peran (RBAC) dan penerapan Row Level Security (RLS) pada basis data agar setiap pengguna hanya mengakses data sesuai kewenangannya;",
      "Penyamaran (masking) data pribadi yang sensitif serta pemisahan data identitas dari data transaksi; dan",
      "Pencatatan audit trail yang immutable untuk menjamin akuntabilitas dan mencegah perubahan data secara tidak sah, didukung strategi pencadangan data secara berkala.",
    ],
  },
  {
    id: "retensi",
    title: "8. Retensi dan Penghapusan Data",
    content: [
      "Data pribadi disimpan hanya selama diperlukan untuk memenuhi tujuan pemrosesan dan sesuai dengan masa retensi yang ditetapkan, kemudian dimusnahkan atau dihapus secara aman.",
      "Data calon anggota yang tidak lolos atau dibatalkan pada suatu periode open recruitment dihapus secara permanen setelah masa retensi berakhir sesuai ketentuan organisasi.",
      "Catatan log audit disimpan sesuai jadwal retensi, dengan log aktif disimpan untuk jangka waktu tertentu sebelum diarsipkan atau dihapus sesuai kebijakan organisasi.",
    ],
  },
  {
    id: "hak-subjek",
    title: "9. Hak Subjek Data Pribadi",
    content: [
      "Sesuai Pasal 5 hingga Pasal 13 UU PDP, Anda berhak:",
      "Mendapatkan informasi yang jelas mengenai identitas, dasar pemrosesan, dan tujuan penggunaan data pribadi Anda;",
      "Melengkapi, memperbarui, dan memperbaiki data pribadi yang tidak akurat;",
      "Mendapatkan akses dan salinan data pribadi Anda;",
      "Mengakhiri pemrosesan, menghapus, dan/atau memusnahkan data pribadi Anda;",
      "Menarik kembali persetujuan pemrosesan yang telah diberikan;",
      "Mengajukan keberatan atas pengambilan keputusan yang hanya didasarkan pada pemrosesan otomatis; dan",
      "Mendapatkan atau menggunakan data pribadi dalam format yang dapat dibaca sistem elektronik (portabilitas data).",
      "Permohonan pelaksanaan hak dapat diajukan melalui jalur yang tersedia pada Sistem atau kepada pengurus UKM Robotik PNP, dan akan Kami proses paling lambat 3 x 24 jam sesuai ketentuan peraturan perundang-undangan.",
    ],
  },
  {
    id: "cookie",
    title: "10. Cookie dan Teknologi",
    content: [
      "Sistem menggunakan cookie dan teknologi penyimpanan lokal untuk mendukung fungsi otentikasi, menjaga sesi login, dan menyimpan preferensi tampilan (tema) Anda.",
      "Kami juga menggunakan layanan verifikasi captcha untuk melindungi formulir pendaftaran dan pemulihan akun dari penyalahgunaan otomatis.",
      "Cookie yang digunakan tidak digunakan untuk melacak aktivitas Anda di luar keperluan layanan Sistem.",
    ],
  },
  {
    id: "pihak-ketiga",
    title: "11. Pembagian Data kepada Pihak Ketiga",
    content: [
      "Kami tidak membagikan data pribadi Anda kepada pihak ketiga untuk tujuan komersial.",
      "Sebagian layanan teknis Sistem disediakan oleh sub-prosesor terpercaya, seperti penyedia basis data dan hosting, layanan penyimpanan objek, jaringan pengiriman konten (CDN), serta layanan verifikasi keamanan. Sub-prosesor tersebut hanya memproses data berdasarkan instruksi Kami dan terikat kewajiban kerahasiaan serta pelindungan data.",
      "Kami dapat membagikan data apabila diwajibkan oleh hukum, perintah pengadilan, atau ketentuan peraturan perundang-undangan yang berlaku.",
    ],
  },
  {
    id: "transfer",
    title: "12. Transfer Data Lintas Yurisdiksi",
    content: [
      "Sebagian infrastruktur teknis Sistem dapat dikelola melalui penyedia layanan cloud yang beroperasi di luar wilayah hukum Indonesia.",
      "Setiap transfer data lintas yurisdiksi dilakukan dengan dasar hukum yang sah dan terekam dalam rekam jejak transfer, sesuai prinsip ISO/IEC 27701:2019 dan ketentuan UU PDP.",
      "Kami memastikan penyedia layanan tersebut menerapkan standar keamanan yang setara untuk melindungi data pribadi Anda.",
    ],
  },
  {
    id: "pelanggaran",
    title: "13. Pemberitahuan Pelanggaran Data",
    content: [
      "Apabila terjadi kegagalan pelindungan data pribadi yang berpotensi merugikan Anda, Kami wajib menyampaikan pemberitahuan secara tertulis kepada Anda dan lembaga terkait paling lambat 3 x 24 jam sesuai Pasal 46 UU PDP.",
      "Pemberitahuan tersebut memuat informasi mengenai jenis data yang terdampak, waktu kejadian, dan langkah penanganan yang telah dan akan dilakukan.",
    ],
  },
  {
    id: "perubahan",
    title: "14. Perubahan Kebijakan",
    content: [
      "Kebijakan Privasi ini dapat diperbarui sewaktu-waktu untuk menyesuaikan dengan perubahan layanan, teknologi, atau ketentuan peraturan perundang-undangan.",
      "Perubahan akan diumumkan melalui Sistem atau saluran resmi lainnya. Penggunaan Sistem setelah perubahan berlaku dianggap sebagai persetujuan Anda terhadap kebijakan terbaru.",
    ],
  },
  {
    id: "kontak",
    title: "15. Kontak",
    content: [
      "Jika Anda memiliki pertanyaan, permohonan pelaksanaan hak subjek data, atau ingin melaporkan dugaan pelanggaran data, silakan hubungi kami melalui halaman Hubungi Kami.",
      "Kami akan menindaklanjuti setiap permohonan sesuai dengan ketentuan yang berlaku dan paling lambat 3 x 24 jam sejak permohonan diterima.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-medium text-primary">Dokumen Legal</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Kebijakan Privasi
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">
            Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.
            Terakhir diperbarui: 9 Agustus 2026.
          </p>
          <div className="h-px w-full bg-border mt-2" />
        </div>

        <div className="flex flex-col gap-8">
          {sections.map((section) => (
            <section key={section.id} className="flex flex-col gap-3">
              <h2 className="font-display text-base sm:text-lg font-semibold tracking-tight">
                {section.title}
              </h2>
              {section.content.map((paragraph, i) => (
                <p
                  key={i}
                  className="text-sm sm:text-base text-muted-foreground leading-relaxed"
                >
                  {paragraph}
                </p>
              ))}
            </section>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 rounded-lg border border-border bg-surface p-5 sm:p-6">
          <p className="text-sm sm:text-base text-foreground font-medium">
            Masih ada pertanyaan seputar data pribadi Anda?
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Silakan hubungi kami melalui halaman{" "}
            <Link
              href="/hubungi-kami"
              className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
            >
              Hubungi Kami
            </Link>{" "}
            atau baca{" "}
            <Link
              href="/terms"
              className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
            >
              Syarat dan Ketentuan
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
