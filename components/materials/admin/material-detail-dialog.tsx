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
import { Button } from '@/components/ui/button';
import { Material } from '@/types/materials';
import { Activity } from '@/types/activities';
import {
  FileText,
  Download,
  Lock,
  Unlock,
  Calendar,
  User,
  Activity as ActivityIcon,
  ExternalLink,
} from 'lucide-react';
import { incrementDownloadCount } from '@/lib/firebase/materials';
import { toast } from 'sonner';
import Image from 'next/image';

interface MaterialDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material;
  activities: Activity[];
}

export default function MaterialDetailDialog({
  open,
  onOpenChange,
  material,
  activities,
}: MaterialDetailDialogProps) {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'elektronika':
        return 'bg-blue-500';
      case 'mekanik':
        return 'bg-yellow-500';
      case 'pemrograman':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'elektronika':
        return 'Elektronika';
      case 'mekanik':
        return 'Mekanik';
      case 'pemrograman':
        return 'Pemrograman';
      default:
        return category;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('powerpoint') || fileType.includes('presentation'))
      return '📊';
    if (fileType.includes('image')) return '🖼️';
    return '📁';
  };

  const handleDownload = async () => {
    try {
      // Open file in new tab
      window.open(material.fileUrl, '_blank');
      
      // Increment download count
      await incrementDownloadCount(material.id);
      toast.success('File berhasil didownload');
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Gagal mendownload file');
    }
  };

  const handlePreview = () => {
    // Open file in new tab for preview
    window.open(material.fileUrl, '_blank');
  };

  // Find linked activity
  const linkedActivity = material.activityId
    ? activities.find((a) => a.id === material.activityId)
    : null;

  const requiredActivity = material.requiredActivityId
    ? activities.find((a) => a.id === material.requiredActivityId)
    : null;

  // Check if file is previewable
  const isPreviewable =
    material.fileType.includes('pdf') || material.fileType.includes('image');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl mb-2 flex items-center gap-3">
                <span className="text-3xl">
                  {getFileIcon(material.fileType)}
                </span>
                {material.title}
              </DialogTitle>
              <DialogDescription>
                {material.description || 'Tidak ada deskripsi'}
              </DialogDescription>
            </div>
            <div className="flex flex-col gap-2">
              <Badge
                className={`${getCategoryColor(material.category)} text-white`}
              >
                {getCategoryLabel(material.category)}
              </Badge>
              <Badge
                variant="outline"
                className={`gap-1 ${
                  material.isPublic
                    ? 'text-green-600 border-green-600'
                    : 'text-orange-600 border-orange-600'
                }`}
              >
                {material.isPublic ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    Public
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    Private
                  </>
                )}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* File Preview */}
          {isPreviewable && (
            <div className="border-2 border-dashed rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">Preview File</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreview}
                  className="gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka di Tab Baru
                </Button>
              </div>
              {material.fileType.includes('pdf') && (
                <div className="w-full h-96 bg-white rounded border">
                  <iframe
                    src={material.fileUrl}
                    className="w-full h-full rounded"
                    title="PDF Preview"
                  />
                </div>
              )}
              {material.fileType.includes('image') && (
                <div className="w-full flex justify-center bg-white rounded border p-4">
                  <Image
                    src={material.fileUrl}
                    alt={material.fileName}
                    className="max-h-96 object-contain rounded"
                    width={500}
                    height={500}
                  />
                </div>
              )}
            </div>
          )}

          {/* File Info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Informasi File</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Nama File</p>
                  <p className="font-medium">{material.fileName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-8">
                <div>
                  <p className="text-sm text-gray-500">Ukuran</p>
                  <p className="font-medium">
                    {formatFileSize(material.fileSize)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-8">
                <div>
                  <p className="text-sm text-gray-500">Tipe File</p>
                  <p className="font-medium">{material.fileType}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Download className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Jumlah Unduhan</p>
                  <p className="font-medium">{material.downloadCount || 0}x</p>
                </div>
              </div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Informasi Materi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 mb-1">OR Period</p>
                <Badge variant="secondary">{material.orPeriod}</Badge>
              </div>
            </div>
          </div>

          {/* Linked Activity */}
          {linkedActivity && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Aktivitas Terkait</h3>
              <div className="flex items-center gap-3 bg-blue-50 p-3 rounded-lg">
                <ActivityIcon className="w-5 h-5 text-blue-600" />
                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {linkedActivity.title}
                  </p>
                  <p className="text-sm text-blue-700">
                    {linkedActivity.description}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Access Control */}
          {!material.isPublic && requiredActivity && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-3">Syarat Akses</h3>
              <div className="flex items-center gap-3 bg-orange-50 p-3 rounded-lg">
                <Lock className="w-5 h-5 text-orange-600" />
                <div className="flex-1">
                  <p className="font-medium text-orange-900">
                    Memerlukan Kehadiran
                  </p>
                  <p className="text-sm text-orange-700">
                    Harus menghadiri: {requiredActivity.title}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Metadata */}
          <div className="border-t pt-4">
            <h3 className="font-semibold mb-3">Informasi Tambahan</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Diupload Oleh</p>
                  <p className="font-medium">{material.uploadedBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Tanggal Upload</p>
                  <p className="font-medium">
                    {material.createdAt
                      ? format(
                          material.createdAt instanceof Date
                            ? material.createdAt
                            : material.createdAt.toDate(),
                          'dd MMMM yyyy, HH:mm',
                          { locale: localeId }
                        )
                      : '-'}
                  </p>
                </div>
              </div>
              {material.updatedAt && (
                <div className="flex items-center gap-3 ml-8">
                  <div>
                    <p className="text-sm text-gray-500">Terakhir Diperbarui</p>
                    <p className="font-medium">
                      {format(
                        material.updatedAt instanceof Date
                          ? material.updatedAt
                          : material.updatedAt.toDate(),
                        'dd MMMM yyyy, HH:mm',
                        { locale: localeId }
                      )}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Download Button */}
          <div className="border-t pt-4 flex justify-end">
            <Button onClick={handleDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Download File
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
