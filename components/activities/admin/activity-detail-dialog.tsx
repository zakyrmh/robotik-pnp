'use client';

import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Activity } from '@/types/activities';
import {
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  CheckCircle,
  XCircle,
  User,
} from 'lucide-react';

interface ActivityDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
}

export default function ActivityDetailDialog({
  open,
  onOpenChange,
  activity,
}: ActivityDetailDialogProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'bg-blue-500';
      case 'ongoing':
        return 'bg-green-500';
      case 'completed':
        return 'bg-gray-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                {activity.title}
              </DialogTitle>
              <DialogDescription>{activity.description}</DialogDescription>
            </div>
            <Badge className={`${getStatusColor(activity.status)} text-white`}>
              {activity.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">Tipe</p>
              <p className="font-medium">{activity.type}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Fase</p>
              <p className="font-medium">{activity.phase.replace(/_/g, ' ')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">OR Period</p>
              <p className="font-medium">{activity.orPeriod}</p>
            </div>
            {activity.category && (
              <div>
                <p className="text-sm text-gray-500 mb-1">Kategori</p>
                <p className="font-medium capitalize">{activity.category}</p>
              </div>
            )}
          </div>

          {/* Schedule */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Jadwal</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span>
                  {format(activity.scheduledDate.toDate(), 'dd MMMM yyyy', {
                    locale: localeId,
                  })}
                </span>
              </div>
              {activity.duration && (
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-gray-400" />
                  <span>{activity.duration} menit</span>
                </div>
              )}
            </div>
          </div>

          {/* Location/Mode */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Lokasi & Mode</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {activity.mode === 'online' ? (
                  <Video className="w-5 h-5 text-gray-400" />
                ) : (
                  <MapPin className="w-5 h-5 text-gray-400" />
                )}
                <span className="capitalize">{activity.mode}</span>
              </div>
              {activity.mode === 'offline' && activity.location && (
                <p className="text-gray-600 ml-8">{activity.location}</p>
              )}
              {activity.mode === 'online' && activity.onlineLink && (
                <a
                  href={activity.onlineLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline ml-8 block"
                >
                  {activity.onlineLink}
                </a>
              )}
            </div>
          </div>

          {/* PIC */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Person in Charge</h3>
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-gray-400" />
              <span>{activity.picName}</span>
            </div>
          </div>

          {/* Attendance */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Absensi</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                {activity.attendanceEnabled ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-500" />
                )}
                <span>
                  {activity.attendanceEnabled ? 'Aktif' : 'Tidak Aktif'}
                </span>
              </div>
              {activity.attendanceEnabled && (
                <>
                  <p className="text-gray-600 ml-8">
                    Metode: {activity.attendanceMethod === 'qr_code' ? 'QR Code' : 'Manual'}
                  </p>
                  {activity.lateTolerance && (
                    <p className="text-gray-600 ml-8">
                      Toleransi: {activity.lateTolerance} menit
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Participants */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Peserta</h3>
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-400" />
              <span>
                {activity.attendedCount || 0} hadir dari{' '}
                {activity.totalParticipants || 0} peserta
              </span>
            </div>
          </div>

          {/* Status Flags */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Status</h3>
            <div className="flex gap-2">
              {activity.isVisible && (
                <Badge variant="secondary">Visible</Badge>
              )}
              {activity.isActive && <Badge variant="secondary">Active</Badge>}
              {activity.hasTask && <Badge variant="secondary">Ada Tugas</Badge>}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}