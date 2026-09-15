export function OnboardingHeader() {
  return (
    <div className="mb-6 sm:mb-8 flex flex-col items-center gap-2 text-center">
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent text-accent-foreground border border-accent-strong/20 text-xs font-mono font-semibold uppercase tracking-wider">
        Penerimaan Anggota Baru (Oprec)
      </div>

      <h1 className="text-2xl sm:text-3xl font-bold font-heading tracking-tight text-foreground">
        Formulir Pendaftaran Calon Anggota
      </h1>
      <p className="text-xs sm:text-sm text-muted-foreground max-w-md mx-auto">
        Lengkapi biodata dan berkas persyaratan pendaftaran UKM Robotik
        Politeknik Negeri Padang.
      </p>
    </div>
  );
}
