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
import { deleteMaterial } from '@/lib/firebase/materials';
import { deleteFileFromSupabase } from '@/lib/supabase-storage';
import { Material } from '@/types/materials';
import { toast } from 'sonner';

interface DeleteMaterialDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  material: Material;
  onSuccess: () => void;
  currentUserId: string | null;
}

export default function DeleteMaterialDialog({
  open,
  onOpenChange,
  material,
  onSuccess,
  currentUserId,
}: DeleteMaterialDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (!currentUserId) {
      toast.error('User tidak terautentikasi');
      return;
    }

    setLoading(true);
    try {
      // Soft delete material in Firestore
      await deleteMaterial(material.id, currentUserId);
      
      // Optionally delete file from Supabase storage
      // Note: You might want to keep the file for recovery purposes
      // Uncomment the line below if you want to delete the file immediately
      // await deleteFileFromSupabase('materials', material.fileUrl);
      
      toast.success('Materi berhasil dihapus');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deleting material:', error);
      toast.error('Gagal menghapus materi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Materi?</AlertDialogTitle>
          <AlertDialogDescription>
            Apakah Anda yakin ingin menghapus materi{' '}
            <span className="font-semibold">{material.title}</span>?
            <br />
            <br />
            Materi akan di-soft delete dan masih bisa dipulihkan oleh admin.
            File akan tetap tersimpan di storage.
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
