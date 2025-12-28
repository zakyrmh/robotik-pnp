export default function RecruitmentDashboardPage() {
  return (
    <div className="h-full bg-white p-6 rounded-xl border border-green-200 shadow-sm">
      <h2 className="text-xl font-bold text-green-900 mb-4">
        🌱 Recruitment & HR
      </h2>
      <p className="text-gray-600 mb-4">
        Manajemen pendaftaran calon anggota baru (Caang) dan proses seleksi.
      </p>
      <div className="flex space-x-2">
        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
          Open Recruitment 2024
        </span>
        <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
          Applicants: 142
        </span>
      </div>
    </div>
  );
}
