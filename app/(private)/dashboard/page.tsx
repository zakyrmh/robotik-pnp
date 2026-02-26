/**
 * Halaman Dashboard — /dashboard
 *
 * Halaman utama setelah user berhasil login.
 * Konten dashboard akan dikembangkan lebih lanjut.
 * Saat ini menampilkan placeholder dengan style Bento Grid.
 *
 * Catatan: Proteksi autentikasi dilakukan di layout.tsx (private).
 */

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header halaman */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Selamat datang di Sistem Informasi UKM Robotik PNP.
        </p>
      </div>

      {/* Bento Grid placeholder */}
      <div className="grid auto-rows-min gap-4 md:grid-cols-3">
        {/* Kartu statistik placeholder */}
        {[
          { label: 'Total Anggota', value: '—' },
          { label: 'Calon Anggota', value: '—' },
          { label: 'Kegiatan Aktif', value: '—' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-colors"
          >
            <p className="text-sm font-medium text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold tracking-tight">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Area konten utama placeholder */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-4">
          <h2 className="mb-4 text-sm font-semibold">Aktivitas Terbaru</h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Konten akan ditambahkan nanti
          </div>
        </div>
        <div className="rounded-xl border bg-card p-6 shadow-sm md:col-span-3">
          <h2 className="mb-4 text-sm font-semibold">Pengumuman</h2>
          <div className="flex h-48 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
            Konten akan ditambahkan nanti
          </div>
        </div>
      </div>
    </div>
  )
}
