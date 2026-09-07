import { Mail, MessageCircle, Phone } from "lucide-react";

interface ContactPerson {
  name: string;
  role: string;
  /** WhatsApp number in international format without +, e.g. "6281234567890" */
  whatsapp: string;
}

/**
 * Edit data kontak di bawah ini sesuai kebutuhan panitia.
 * Jika belum diisi, section ini akan menampilkan placeholder.
 */
const contactPersons: ContactPerson[] = [
  {
    name: "", // TODO: Isi nama CP 1
    role: "Ketua Panitia",
    whatsapp: "", // TODO: Isi nomor WA tanpa "+"
  },
  {
    name: "", // TODO: Isi nama CP 2
    role: "Sekretariat",
    whatsapp: "", // TODO: Isi nomor WA tanpa "+"
  },
];

const email = ""; // TODO: Isi email panitia, contoh: "mrc@ukmrobotik.pnp.ac.id"

export function MrcContactSection() {
  const hasData =
    contactPersons.some((cp) => cp.name.trim() !== "") || email.trim() !== "";

  return (
    <section className="space-y-6">
      {/* Title */}
      <div className="text-center space-y-1.5">
        <span className="font-mono text-xs font-semibold uppercase tracking-wider text-accent-foreground bg-accent px-3 py-1 rounded-full border border-accent-strong/20">
          Hubungi Kami
        </span>
        <h2 className="font-display font-bold text-balance">
          Narahubung Panitia
        </h2>
        <p className="font-body text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Jika ada pertanyaan seputar pendaftaran, teknis perlombaan, atau
          pembayaran, silakan hubungi panitia di bawah ini.
        </p>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 shadow-2xs">
        {hasData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {contactPersons
              .filter((cp) => cp.name.trim() !== "")
              .map((cp, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-4 p-4 rounded-lg border border-border/70 bg-muted/30"
                >
                  {/* Avatar placeholder */}
                  <div className="size-11 rounded-full bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                    <Phone className="size-5" />
                  </div>

                  <div className="space-y-1.5 min-w-0">
                    <div>
                      <p className="font-display font-semibold text-sm text-foreground">
                        {cp.name}
                      </p>
                      <p className="font-body text-xs text-muted-foreground">
                        {cp.role}
                      </p>
                    </div>

                    {cp.whatsapp && (
                      <a
                        href={`https://wa.me/${cp.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 min-h-[44px] font-body text-xs font-semibold px-3 py-1.5 rounded-md bg-success/15 text-success border border-success/30 hover:bg-success/25 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <MessageCircle className="size-3.5" />
                        <span>Chat WhatsApp</span>
                      </a>
                    )}
                  </div>
                </div>
              ))}

            {/* Email row */}
            {email.trim() !== "" && (
              <div className="sm:col-span-2 flex items-center gap-3 p-4 rounded-lg border border-border/70 bg-muted/30">
                <div className="size-9 rounded-lg bg-primary-soft/60 dark:bg-primary-soft/20 border border-primary/20 flex items-center justify-center text-primary shrink-0">
                  <Mail className="size-4" />
                </div>
                <div>
                  <p className="font-body text-xs text-muted-foreground">
                    Email Panitia
                  </p>
                  <a
                    href={`mailto:${email}`}
                    className="font-body text-sm font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                  >
                    {email}
                  </a>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Placeholder state when no data is filled yet */
          <div className="text-center py-6 space-y-2">
            <div className="size-12 mx-auto rounded-full bg-muted/60 border border-border flex items-center justify-center">
              <Phone className="size-5 text-muted-foreground" />
            </div>
            <p className="font-body text-sm text-muted-foreground">
              Informasi narahubung akan segera ditampilkan.
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/60">
              Silakan cek kembali halaman ini secara berkala.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
