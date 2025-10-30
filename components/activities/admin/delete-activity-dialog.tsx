'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { deleteActivity } from '@/lib/firebase/activities';
import { Activity } from '@/types/activities';
import { toast } from 'sonner';

interface DeleteActivityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activity: Activity;
  onSuccess: () => void;
  currentUserId: string | null;
}

export default function DeleteActivityDialog({
  open,
  onOpenChange,
  activity,
  onSuccess,
  currentUserId,
}: DeleteActivityDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteActivity(activity.id, currentUserId || "");
      toast.success('Aktivitas berhasil dihapus');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Gagal menghapus aktivitas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Aktivitas?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus aktivitas{' '}
            <span className="font-semibold">{activity.title}</span>?
            <br />
            <br />
            Aktivitas akan di-soft delete dan masih bisa dipulihkan oleh admin.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Hapus
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
