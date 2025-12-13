
import { Metadata } from 'next';
import PresenceClientPage from './_components/presence-client-page';

export const metadata: Metadata = {
  title: 'Riwayat Absensi | Robotik PNP',
  description: 'Lihat riwayat kehadiran dan partisipasi kegiatan.',
};

export default function PresencePage() {
  return (
    <div className="container mx-auto p-4 md:p-6 space-y-6">
      <PresenceClientPage />
    </div>
  );
}
