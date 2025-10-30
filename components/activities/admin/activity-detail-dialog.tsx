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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'upcoming':
        return 'Akan Datang';
      case 'ongoing':
        return 'Berlangsung';
      case 'completed':
        return 'Selesai';
      case 'cancelled':
        return 'Dibatalkan';
      default:
        return status;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                {activity.title}
              </DialogTitle>
              <DialogDescription>{activity.description}</DialogDescription>
            </div>
            <Badge className={`${getStatusColor(activity.status)} text-white`}>
              {getStatusLabel(activity.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500 mb-1">OR Period</p>
              <p className="font-medium">{activity.orPeriod}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500 mb-1">Slug</p>
              <p className="font-medium">{activity.slug}</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Jadwal</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Mulai</p>
                  <span>
                    {format(
                      activity.startDateTime instanceof Date
                        ? activity.startDateTime
                        : activity.startDateTime.toDate(),
                      'dd MMMM yyyy, HH:mm',
                      { locale: localeId }
                    )}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Selesai</p>
                  <span>
                    {format(
                      activity.endDateTime instanceof Date
                        ? activity.endDateTime
                        : activity.endDateTime.toDate(),
                      'dd MMMM yyyy, HH:mm',
                      { locale: localeId }
                    )}
                  </span>
                </div>
              </div>
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
                <span className="capitalize">
                  {activity.mode === 'online' ? 'Online' : 'Offline'}
                </span>
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
                  {activity.attendanceOpenTime && (
                    <div className="ml-8">
                      <p className="text-sm text-gray-500">Waktu Buka</p>
                      <p className="text-gray-600">
                        {format(
                          activity.attendanceOpenTime instanceof Date
                            ? activity.attendanceOpenTime
                            : activity.attendanceOpenTime.toDate(),
                          'dd MMMM yyyy, HH:mm',
                          { locale: localeId }
                        )}
                      </p>
                    </div>
                  )}
                  {activity.attendanceCloseTime && (
                    <div className="ml-8">
                      <p className="text-sm text-gray-500">Waktu Tutup</p>
                      <p className="text-gray-600">
                        {format(
                          activity.attendanceCloseTime instanceof Date
                            ? activity.attendanceCloseTime
                            : activity.attendanceCloseTime.toDate(),
                          'dd MMMM yyyy, HH:mm',
                          { locale: localeId }
                        )}
                      </p>
                    </div>
                  )}
                  {activity.lateTolerance && (
                    <p className="text-gray-600 ml-8">
                      Toleransi Keterlambatan: {activity.lateTolerance} menit
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Participants */}
          {activity.attendanceEnabled && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Statistik Peserta</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>
                    Total Peserta: {activity.totalParticipants || 0}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span>Hadir: {activity.attendedCount || 0}</span>
                </div>
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-red-500" />
                  <span>Tidak Hadir: {activity.absentCount || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Status Flags */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Status Aktivitas</h3>
            <div className="flex gap-2 flex-wrap">
              <Badge variant={activity.isVisible ? 'default' : 'secondary'}>
                {activity.isVisible ? 'Visible' : 'Hidden'}
              </Badge>
              <Badge variant={activity.isActive ? 'default' : 'secondary'}>
                {activity.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>

          {/* Metadata */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Informasi Tambahan</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div>
                <span className="text-gray-500">Dibuat: </span>
                {format(
                  activity.createdAt instanceof Date
                    ? activity.createdAt
                    : activity.createdAt.toDate(),
                  'dd MMMM yyyy, HH:mm',
                  { locale: localeId }
                )}
              </div>
              <div>
                <span className="text-gray-500">Terakhir Diperbarui: </span>
                {format(
                  activity.updatedAt instanceof Date
                    ? activity.updatedAt
                    : activity.updatedAt.toDate(),
                  'dd MMMM yyyy, HH:mm',
                  { locale: localeId }
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}