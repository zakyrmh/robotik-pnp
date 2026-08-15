import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan | UKM Robotik PNP",
  description:
    "Syarat dan Ketentuan penggunaan Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.",
  openGraph: {
    title: "Syarat dan Ketentuan | UKM Robotik PNP",
    description:
      "Syarat dan Ketentuan penggunaan Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang.",
    type: "website",
  },
};

const sections = [
  {
    id: "pendahuluan",
    title: "1. Pendahuluan",
    content: [
      'Syarat dan Ketentuan ini mengatur penggunaan Sistem Informasi Manajemen UKM Robotik Politeknik Negeri Padang (selanjutnya disebut "Sistem") oleh seluruh pengguna, termasuk pengurus, anggota aktif, dan calon anggota (caang).',
      "Dengan mendaftar dan menggunakan Sistem, Anda dianggap telah membaca, memahami, dan menyetujui seluruh ketentuan yang tercantum dalam dokumen ini.",
    ],
  },
  {
    id: "penerimaan-syarat",
    title: "2. Penerimaan Syarat",
    content: [
      "Penggunaan Sistem hanya dapat dilakukan setelah Anda berhasil melakukan registrasi dan menyetujui Syarat dan Ketentuan serta Kebijakan Privasi UKM Robotik PNP.",
      "Jika Anda tidak menyetujui sebagian atau seluruh ketentuan ini, Anda tidak diperkenankan menggunakan Sistem dan diminta untuk segera menghentikan akses.",
    ],
  },
  {
    id: "layanan",
    title: "3. Deskripsi Layanan",
    content: [
      "Sistem disediakan untuk mendukung operasional UKM Robotik PNP, antara lain pendaftaran calon anggota (open recruitment), pengelolaan kelompok dan masa magang caang, pencatatan kegiatan dan presensi, manajemen piket dan shift laboratorium, serta penilaian kedisiplinan.",
      "Seluruh layanan diberikan berdasarkan kewenangan peran masing-masing pengguna dan dapat berubah sewaktu-waktu sesuai kebutuhan organisasi.",
    ],
  },
  {
    id: "akun",
    title: "4. Akun dan Keamanan",
    content: [
      "Anda bertanggung jawab penuh atas kerahasiaan kredensial akun, termasuk kata sandi dan perangkat yang digunakan untuk mengakses Sistem.",
      "Anda wajib segera melaporkan kepada pengurus bila mengetahui adanya penggunaan akun tanpa izin atau kebocoran data akun.",
      "Sistem menerapkan enkripsi koneksi (SSL/TLS), verifikasi captcha, dan manajemen sesi untuk melindungi akun Anda.",
    ],
  },
  {
    id: "peran-akses",
    title: "5. Peran dan Hak Akses",
    content: [
      "Akses terhadap fitur Sistem ditentukan oleh peran (role) yang diberikan, yaitu super-admin, admin-or, admin-komdis, anggota, dan caang.",
      "Setiap pengguna hanya berhak mengakses data dan fitur sesuai dengan perannya. Penggunaan akses di luar kewenangan merupakan pelanggaran dan dapat dikenakan sanksi sesuai ketentuan organisasi.",
    ],
  },
  {
    id: "larangan",
    title: "6. Ketentuan yang Dilarang",
    content: [
      "Dilarang menggunakan Sistem untuk tujuan di luar kepentingan organisasi UKM Robotik PNP.",
      "Dilarang melakukan akses tanpa hak, peretasan, pengambilan data secara tidak sah, atau tindakan lain yang membahayakan integritas dan keamanan Sistem.",
      "Dilarang menyebarkan informasi palsu, menjiplak karya, atau melakukan pelanggaran norma dan etika akademik sebagaimana diatur dalam Peraturan Direktur Politeknik Negeri Padang Nomor 2 Tahun 2023 tentang Pedoman Norma dan Etika Akademik.",
    ],
  },
  {
    id: "data-pribadi",
    title: "7. Pelindungan Data Pribadi",
    content: [
      "Data pribadi yang Anda berikan akan diproses dan dikelola sesuai dengan Kebijakan Privasi UKM Robotik PNP serta ketentuan Undang-Undang Nomor 27 Tahun 2022 tentang Pelindungan Data Pribadi.",
      "Data digunakan untuk keperluan administrasi keanggotaan, presensi, evaluasi, dan dokumentasi kegiatan organisasi serta tidak akan dijual kepada pihak ketiga.",
      "Anda berhak mengajukan permintaan akses, perbaikan, atau penghapusan data pribadi Anda melalui pengurus UKM Robotik PNP.",
    ],
  },
  {
    id: "audit",
    title: "8. Audit dan Pencatatan",
    content: [
      "Seluruh aktivitas mutasi data yang dilakukan oleh pengguna berperan pengurus dapat dicatat dalam sistem audit trail untuk kepentingan akuntabilitas dan transparansi organisasi.",
      "Catatan audit digunakan sebagai bahan evaluasi, pemeriksaan, dan penegakan kedisiplinan sesuai dengan kebijakan organisasi.",
    ],
  },
  {
    id: "penghentian",
    title: "9. Penghentian Akses",
    content: [
      "UKM Robotik PNP berhak membatasi, menangguhkan, atau menghentikan akun Anda apabila terbukti melanggar ketentuan dalam dokumen ini atau ketentuan organisasi lainnya.",
      "Akun caang yang tidak memenuhi persyaratan masa magang dapat dinyatakan tidak lolos sesuai dengan ketentuan open recruitment yang berlaku.",
    ],
  },
  {
    id: "perubahan",
    title: "10. Perubahan Ketentuan",
    content: [
      "UKM Robotik PNP dapat memperbarui Syarat dan Ketentuan ini sewaktu-waktu. Perubahan akan diumumkan melalui Sistem atau saluran resmi lainnya.",
      "Penggunaan Sistem setelah perubahan berlaku dianggap sebagai persetujuan terhadap ketentuan terbaru.",
    ],
  },
  {
    id: "hukum",
    title: "11. Hukum yang Berlaku",
    content: [
      "Syarat dan Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Negara Kesatuan Republik Indonesia.",
      "Apabila terdapat sengketa, para pihak akan berupaya menyelesaikan secara musyawarah sebelum ditempuh upaya hukum lainnya.",
    ],
  },
];

export default function TermsPage() {
  return (
    <div className="w-full min-h-screen bg-background text-foreground pt-20">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="flex flex-col gap-4 mb-10">
          <p className="text-sm font-medium text-primary">Dokumen Legal</p>
          <h1 className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">
            Syarat dan Ketentuan
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
            Pertanyaan seputar Syarat dan Ketentuan?
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
              href="/privacy"
              className="font-medium text-primary underline-offset-4 hover:underline transition-colors"
            >
              Kebijakan Privasi
            </Link>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
