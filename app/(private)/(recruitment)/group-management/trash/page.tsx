"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Timestamp } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import {
    ArrowLeft,
    Search,
    RefreshCw,
    Trash2,
    FolderOpen,
    AlertTriangle,
    Users,
    UsersRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    getDeletedGroupParents,
    restoreGroupParent,
    hardDeleteGroupParent,
} from "@/lib/firebase/groups";
import { GroupParent } from "@/types/groups";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export default function GroupTrashPage() {
    const router = useRouter();
    const [groupParents, setGroupParents] = useState<GroupParent[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedGroup, setSelectedGroup] = useState<GroupParent | null>(null);
    const [isRestoreOpen, setIsRestoreOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const loadDeletedGroups = async () => {
        setLoading(true);
        try {
            const data = await getDeletedGroupParents();
            setGroupParents(data);
        } catch (error) {
            console.error("Error loading deleted groups:", error);
            toast.error("Gagal memuat data sampah kelompok");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadDeletedGroups();
    }, []);

    const handleRestore = async () => {
        if (!selectedGroup) return;

        setActionLoading(true);
        try {
            await restoreGroupParent(selectedGroup.id);
            toast.success("Kelompok berhasil dipulihkan");
            loadDeletedGroups();
            setIsRestoreOpen(false);
        } catch (error) {
            console.error("Error restoring group:", error);
            toast.error("Gagal memulihkan kelompok");
        } finally {
            setActionLoading(false);
            setSelectedGroup(null);
        }
    };

    const handleDeletePermanent = async () => {
        if (!selectedGroup) return;

        setActionLoading(true);
        try {
            await hardDeleteGroupParent(selectedGroup.id);

            toast.success("Kelompok dihapus permanen");
            loadDeletedGroups();
            setIsDeleteOpen(false);
        } catch (error) {
            console.error("Error deleting group permanently:", error);
            toast.error("Gagal menghapus kelompok permanen");
        } finally {
            setActionLoading(false);
            setSelectedGroup(null);
        }
    };

    const filteredGroups = groupParents.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <Button
                        variant="ghost"
                        onClick={() => router.back()}
                        className="mb-4 pl-0 hover:pl-2 transition-all gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Kembali ke Manajemen Kelompok
                    </Button>
                    <div className="flex items-center gap-3">
                        <Trash2 className="w-8 h-8 text-red-500" />
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-50">
                            Sampah Kelompok
                        </h1>
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 mt-2 ml-11">
                        Kelola kelompok yang telah dihapus. Anda dapat memulihkan atau
                        menghapus permanen.
                    </p>
                </motion.div>

                {/* Filters */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-6"
                >
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                        <Input
                            placeholder="Cari kelompok yang dihapus..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </motion.div>

                {/* Groups Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map((i) => (
                            <Card key={i} className="animate-pulse">
                                <CardHeader>
                                    <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-3/4 mb-2"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2"></div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded"></div>
                                        <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-5/6"></div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <AnimatePresence mode="popLayout">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredGroups.map((group, index) => (
                                <motion.div
                                    key={group.id}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    transition={{ delay: index * 0.05 }}
                                    layout
                                >
                                    <Card className="hover:shadow-lg transition-shadow group border-red-100 dark:border-red-900/30">
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start gap-3 flex-1">
                                                    <span className="text-3xl grayscale opacity-70">
                                                        📂
                                                    </span>
                                                    <div className="flex-1">
                                                        <CardTitle className="text-lg mb-1 text-gray-700 dark:text-gray-300">
                                                            {group.name}
                                                        </CardTitle>
                                                        <CardDescription className="line-clamp-2 dark:text-gray-500">
                                                            {group.description || "Tidak ada deskripsi"}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3">
                                                <Badge
                                                    variant="secondary"
                                                    className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                >
                                                    {group.orPeriod}
                                                </Badge>
                                            </div>
                                        </CardHeader>

                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                        <UsersRound className="w-4 h-4" />
                                                        <span>
                                                            {group.totalSubGroups} Sub-kelompok
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                        <Users className="w-4 h-4" />
                                                        <span>
                                                            {group.totalMembers} Total Anggota
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                                                        <Trash2 className="w-4 h-4" />
                                                        <span>
                                                            Dihapus:{" "}
                                                            {group.deletedAt
                                                                ? format(
                                                                    group.deletedAt instanceof Timestamp
                                                                        ? group.deletedAt.toDate()
                                                                        : new Date(),
                                                                    "dd MMM yyyy",
                                                                    { locale: localeId }
                                                                )
                                                                : "-"}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button
                                                        className="flex-1 gap-2"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedGroup(group);
                                                            setIsRestoreOpen(true);
                                                        }}
                                                    >
                                                        <RefreshCw className="w-4 h-4" />
                                                        Pulihkan
                                                    </Button>
                                                    <Button
                                                        className="flex-1 gap-2 bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/30 dark:text-red-400 dark:hover:bg-red-900/50 border-red-200 dark:border-red-800"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedGroup(group);
                                                            setIsDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                        Hapus
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>
                )}

                {/* Empty State */}
                {!loading && filteredGroups.length === 0 && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-12"
                    >
                        <FolderOpen className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Tong Sampah Kosong
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400">
                            {searchQuery
                                ? "Tidak ditemukan kelompok yang dihapus sesuai pencarian"
                                : "Tidak ada kelompok di tampungan sampah"}
                        </p>
                    </motion.div>
                )}
            </div>

            {/* Restore Dialog */}
            <AlertDialog open={isRestoreOpen} onOpenChange={setIsRestoreOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Pulihkan Kelompok?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Kelompok &quot;{selectedGroup?.name}&quot; beserta sub-kelompoknya akan
                            dikembalikan ke daftar aktif.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleRestore()}
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Memproses..." : "Pulihkan"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Permanent Dialog */}
            <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600 flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5" />
                            Hapus Permanen?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Tindakan ini tidak dapat dibatalkan. Kelompok &quot;{selectedGroup?.name}&quot;
                            dan <strong>seluruh sub-kelompoknya</strong> akan dihapus selamanya dari sistem.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Batal</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => handleDeletePermanent()}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={actionLoading}
                        >
                            {actionLoading ? "Menghapus..." : "Hapus Permanen"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
