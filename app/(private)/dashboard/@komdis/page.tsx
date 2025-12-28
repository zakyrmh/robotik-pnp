export default function KomdisDashboardPage() {
  return (
    <div className="h-full bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm">
      <h2 className="text-xl font-bold text-red-900 mb-4">
        🛡️ Komisi Disiplin
      </h2>
      <p className="text-red-800 mb-4">
        Area terbatas untuk Komisi Disiplin. Monitor pelanggaran dan penegakan
        aturan.
      </p>
      <div className="bg-white/50 p-3 rounded border border-red-100">
        <span className="text-xs font-mono text-red-600">
          SENSITIVE DATA ACCESS LOGGED
        </span>
      </div>
    </div>
  );
}
