import {
  Cloud,
  Download,
  ExternalLink,
  FileText,
  FolderOpen,
  ImageIcon,
  Route,
} from "lucide-react";

/**
 * Folder Google Drive publik berisi seluruh dokumen rule & dokumen lapangan.
 * Diakses lewat tombol "Buka Google Drive" pada section ini.
 */
const GOOGLE_DRIVE_URL =
  "https://drive.google.com/drive/folders/1WpRGBSbYoU8r0YMcaURwS1ryVn3FdGq9";

interface RuleDocument {
  /** Judul dokumen yang ditampilkan ke pengunjung. */
  title: string;
  /** Label kategori lomba / jenis berkas. */
  label: string;
  /** Path publik berkas di dalam `public/documents/mrc_x/rules/`. */
  file: string;
  /** Deskripsi singkat cakupan isi dokumen. */
  description: string;
  /** Label revisi/versi dokumen (mis. "v1.1"). Opsional. */
  version?: string;
}

const BASE_PATH = "/documents/mrc_x/rules";

/** Encode spasi & karakter khusus pada nama berkas agar aman dipakai di `href`. */
function fileUrl(fileName: string) {
  return `${BASE_PATH}/${encodeURIComponent(fileName)}`;
}

const ruleDocuments: RuleDocument[] = [
  {
    title: "Rule Line Follower Digital — Junior",
    label: "Line Follower Junior",
    file: "Rule Line Follower Digital JUNIOR MRC X 2026v1.1.pdf",
    description:
      "Spesifikasi robot, sensor, aturan lintasan, dan sistem penilaian kategori Junior.",
    version: "v1.1",
  },
  {
    title: "Rule Line Follower Digital — Umum",
    label: "Line Follower Umum",
    file: "Rule Line Follower Digital UMUM MRC X 2026v1.1.pdf",
    description:
      "Spesifikasi robot, sensor, aturan lintasan, dan sistem penilaian kategori Umum.",
    version: "v1.1",
  },
  {
    title: "Rule Robot Soccer",
    label: "Robot Soccer",
    file: "Rule Robot Soccer MRC X 2026.pdf",
    description:
      "Dimensi robot, aturan pertandingan, pelanggaran, dan mekanisme babak Soccer.",
  },
  {
    title: "Rule Robot Sumo",
    label: "Robot Sumo",
    file: "Rule Robot Sumo MRC X 2026.pdf",
    description:
      "Batasan berat dan ukuran, aturan dohyo, pelanggaran, dan skema pertandingan Sumo.",
  },
];

const trackImage = {
  title: "Track Line Follower",
  label: "Referensi Arena",
  file: "track_lf.jpg",
  description:
    "Denah lintasan resmi Line Follower untuk latihan dan verifikasi ukuran lapangan.",
};

export function MrcRulesSection() {
  return (
    <section id="dokumen" className="space-y-6">
      {/* Section Title & Subtitle */}
      <div className="text-center space-y-2">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-primary bg-primary-soft/50 dark:bg-primary-soft/20 px-3 py-1 rounded-full border border-primary/20">
          Dokumen Resmi
        </span>
        <h2 className="font-display font-bold text-balance">
          Peraturan & Berkas Perlombaan
        </h2>
        <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Dokumen regulasi resmi Minangkabau Robot Contest X 2026. Dapat dibaca
          langsung maupun diunduh tanpa perlu masuk akun.
        </p>
      </div>

      {/* Rulebook Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        {ruleDocuments.map((doc) => {
          const href = fileUrl(doc.file);

          return (
            <article
              key={doc.file}
              className="flex flex-col justify-between rounded-lg border border-border bg-card p-6 shadow-2xs transition-all duration-200 hover:border-primary/50 hover:shadow-soft"
            >
              <div className="space-y-4">
                {/* Header Icon + File Type Badge */}
                <div className="flex items-center justify-between gap-2">
                  <div className="size-10 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary">
                    <Route className="size-5" />
                  </div>

                  <div className="flex items-center gap-1.5">
                    {doc.version && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-success/10 text-success border border-success/30">
                        <span className="font-mono uppercase tracking-wider">
                          {doc.version}
                        </span>
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                      <FileText className="size-3.5" />
                      <span className="font-mono uppercase tracking-wider">
                        PDF
                      </span>
                    </span>
                  </div>
                </div>

                {/* Title & Description */}
                <div className="space-y-1.5">
                  <h3 className="font-display font-bold text-md text-foreground text-balance">
                    {doc.title}
                  </h3>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-primary">
                    {doc.label}
                  </p>
                  <p className="font-body text-xs text-muted-foreground leading-relaxed">
                    {doc.description}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-6">
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <ExternalLink className="size-4" />
                  <span>Lihat Dokumen</span>
                </a>
                <a
                  href={href}
                  download={doc.file}
                  className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-md bg-background border border-border text-foreground hover:border-primary/50 hover:bg-muted transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <Download className="size-4" />
                  <span>Unduh</span>
                </a>
              </div>
            </article>
          );
        })}
      </div>

      {/* Google Drive Repository — dokumen rule & lapangan lengkap */}
      <article className="rounded-lg border border-primary/30 bg-primary-soft/30 dark:bg-primary-soft/10 p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 shrink-0 rounded-lg bg-primary/10 border border-primary/30 flex items-center justify-center text-primary">
              <Cloud className="size-5" />
            </div>
            <div className="space-y-1">
              <h3 className="font-display font-semibold text-sm sm:text-base text-foreground">
                Repositori Dokumen Lengkap (Google Drive)
              </h3>
              <p className="font-body text-xs text-muted-foreground leading-relaxed max-w-xl">
                Seluruh dokumen peraturan dan dokumen lapangan terbaru tersedia
                terpusat di Google Drive. Gunakan folder ini untuk mengakses
                berkas tambahan, revisi, maupun lampiran teknis lainnya.
              </p>
            </div>
          </div>

          <a
            href={GOOGLE_DRIVE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-5 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <FolderOpen className="size-4" />
            <span>Buka Google Drive</span>
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </article>

      {/* Track Reference Visual */}
      <article className="rounded-lg border border-border bg-card p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="size-4 text-primary" />
            <h3 className="font-display font-semibold text-sm sm:text-base text-foreground">
              {trackImage.title}
            </h3>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {trackImage.label}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Preview */}
          <a
            href={fileUrl(trackImage.file)}
            target="_blank"
            rel="noopener noreferrer"
            className="lg:col-span-2 group relative block overflow-hidden rounded-md border border-border bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- berkas dinamis dari public/documents, Next/Image tidak memberi nilai tambah di sini */}
            <img
              src={fileUrl(trackImage.file)}
              alt="Denah lintasan resmi Line Follower MRC X 2026 beserta keterangan ukuran arena"
              loading="lazy"
              className="w-full aspect-video object-cover transition-transform duration-200 group-hover:scale-[1.02]"
            />
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-background/90 backdrop-blur-sm border border-border text-[11px] font-semibold text-foreground opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 transition-opacity duration-150">
              <ExternalLink className="size-3.5" />
              <span>Perbesar</span>
            </span>
          </a>

          {/* Meta & Actions */}
          <div className="flex flex-col justify-between gap-4">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
                <ImageIcon className="size-3.5" />
                <span className="font-mono uppercase tracking-wider">JPG</span>
              </div>
              <p className="font-body text-xs text-muted-foreground leading-relaxed">
                {trackImage.description}
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <a
                href={fileUrl(trackImage.file)}
                target="_blank"
                rel="noopener noreferrer"
                className="min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-md bg-primary hover:bg-primary-hover text-primary-foreground shadow-2xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <ExternalLink className="size-4" />
                <span>Lihat Gambar</span>
              </a>
              <a
                href={fileUrl(trackImage.file)}
                download={trackImage.file}
                className="min-h-[44px] inline-flex items-center justify-center gap-2 font-body text-sm font-semibold px-4 py-2.5 rounded-md bg-background border border-border text-foreground hover:border-primary/50 hover:bg-muted transition-all duration-150 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Download className="size-4" />
                <span>Unduh Gambar</span>
              </a>
            </div>
          </div>
        </div>
      </article>
    </section>
  );
}
