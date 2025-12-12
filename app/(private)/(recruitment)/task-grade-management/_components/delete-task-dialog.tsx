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
import { softDeleteTask } from '@/lib/firebase/tasks';
import { Task } from '@/types/tasks';
import { toast } from 'sonner';

interface DeleteTaskDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    task: Task | null;
    onSuccess: () => void;
    currentUserId: string | null;
}

export default function DeleteTaskDialog({
    open,
    onOpenChange,
    task,
    onSuccess,
    currentUserId,
}: DeleteTaskDialogProps) {
    const [loading, setLoading] = useState(false);

    if (!task) return null;

    const handleDelete = async () => {
        if (!currentUserId) {
            toast.error('User tidak terautentikasi');
            return;
        }

        setLoading(true);
        try {
            await softDeleteTask(task.id, currentUserId);

            toast.success('Tugas berhasil dihapus');
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting task:', error);
            toast.error('Gagal menghapus tugas');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Hapus Tugas?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Apakah Anda yakin ingin menghapus tugas{' '}
                        <span className="font-semibold">{task.title}</span>?
                        <br />
                        <br />
                        Tugas akan di-soft delete dan masih bisa dipulihkan dari menu Sampah.
                        Nilai dan pengumpulan terkait mungkin tidak dapat diakses sementara.
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
