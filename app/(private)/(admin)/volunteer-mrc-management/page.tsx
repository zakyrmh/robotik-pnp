"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, onSnapshot, doc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import { VolunteerData } from "@/types/volunteer-mrc";
import { User } from "@/types/users";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Edit,
  Trash2,
  Loader2,
  ExternalLink,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface VolunteerWithUser extends VolunteerData {
  id: string;
  userName: string;
  userNim: string;
  userProdi: string;
}

type SortField = "userName" | "userNim" | "userProdi" | "pilihanPertama" | "pilihanKedua" | "bidangDitempatkan" | "createdAt";
type SortDirection = "asc" | "desc" | null;

const BIDANG_LABELS: Record<string, string> = {
  LO: "Liaison Officer (LO)",
  PDD: "Publikasi, Desain, dan Dokumentasi (PDD)",
  Keamanan: "Keamanan",
  Admin: "Admin",
};

export default function VolunteerMRCTable() {
  const [volunteers, setVolunteers] = useState<VolunteerWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("createdAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const volunteerQuery = query(collection(db, "volunteer_mrc_ix"));

    const unsubscribe = onSnapshot(volunteerQuery, async (snapshot) => {
      const volunteerPromises = snapshot.docs.map(async (volunteerDoc) => {
        const volunteerData = volunteerDoc.data() as VolunteerData;
        
        // Fetch user data
        try {
          const userDocRef = doc(db, "users_new", volunteerData.userId);
          const userDocSnap = await getDoc(userDocRef);
          console.log(userDocSnap.data());
          
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data() as User;
            return {
              id: volunteerDoc.id,
              ...volunteerData,
              userName: userData.profile.fullName,
              userNim: userData.profile.nim,
              userProdi: userData.profile.department,
            } as VolunteerWithUser;
          }
        } catch (error) {
          console.error("Error fetching user:", error);
        }
        
        // Fallback if user not found
        return {
          id: volunteerDoc.id,
          ...volunteerData,
          userName: "Unknown",
          userNim: "-",
          userProdi: "-",
        } as VolunteerWithUser;
      });

      const volunteersData = await Promise.all(volunteerPromises);
      setVolunteers(volunteersData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Toggle direction
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortDirection(null);
        setSortField("createdAt");
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, "volunteer_mrc_ix", deleteId));
      toast({
        title: "Berhasil",
        description: "Data volunteer berhasil dihapus",
      });
      setDeleteId(null);
    } catch (error) {
      console.error("Error deleting volunteer:", error);
      toast({
        title: "Error",
        description: "Gagal menghapus data volunteer",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredAndSortedVolunteers = useMemo(() => {
    let result = [...volunteers];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (v) =>
          v.userName.toLowerCase().includes(query) ||
          v.userNim.toLowerCase().includes(query) ||
          v.userProdi.toLowerCase().includes(query) ||
          v.pilihanPertama.toLowerCase().includes(query) ||
          v.pilihanKedua.toLowerCase().includes(query) ||
          (v.bidangDitempatkan && v.bidangDitempatkan.toLowerCase().includes(query))
      );
    }

    // Sort
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        let aValue: string | number = a[sortField] || "";
        let bValue: string | number = b[sortField] || "";

        // Handle null values
        if (!aValue) return sortDirection === "asc" ? 1 : -1;
        if (!bValue) return sortDirection === "asc" ? -1 : 1;

        if (typeof aValue === "string" && typeof bValue === "string") {
          aValue = aValue.toLowerCase();
          bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
        if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [volunteers, searchQuery, sortField, sortDirection]);

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field || !sortDirection) {
      return <ArrowUpDown className="h-4 w-4 ml-2 text-gray-400" />;
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="h-4 w-4 ml-2 text-blue-600" />
    ) : (
      <ArrowDown className="h-4 w-4 ml-2 text-blue-600" />
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Data Volunteer MRC IX
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Total: {volunteers.length} pendaftar
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
            {filteredAndSortedVolunteers.length} ditampilkan
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Cari nama, NIM, prodi, atau bidang..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">No</TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("userName")}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Nama
                    <SortIcon field="userName" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("userNim")}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    NIM
                    <SortIcon field="userNim" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("userProdi")}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Prodi
                    <SortIcon field="userProdi" />
                  </button>
                </TableHead>
                <TableHead>
                  <button
                    onClick={() => handleSort("bidangDitempatkan")}
                    className="flex items-center hover:text-blue-600 transition-colors"
                  >
                    Bidang
                    <SortIcon field="bidangDitempatkan" />
                  </button>
                </TableHead>
                <TableHead>Dokumen</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <AnimatePresence mode="popLayout">
                {filteredAndSortedVolunteers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                      Tidak ada data volunteer
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAndSortedVolunteers.map((volunteer, index) => (
                    <motion.tr
                      key={volunteer.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                    >
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">{volunteer.userName}</TableCell>
                      <TableCell>{volunteer.userNim}</TableCell>
                      <TableCell>{volunteer.userProdi}</TableCell>
                      <TableCell>
                        {volunteer.bidangDitempatkan ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-medium">
                            {BIDANG_LABELS[volunteer.bidangDitempatkan] || volunteer.bidangDitempatkan}
                          </span>
                        ) : (
                          <span className="text-gray-400 text-xs">Belum ditempatkan</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {volunteer.commitmentDocUrl ? (
                          <a
                            href={volunteer.commitmentDocUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(volunteer.id)}
                            className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Data Volunteer?</AlertDialogTitle>
            <AlertDialogDescription>
              Aksi ini tidak dapat dibatalkan. Data volunteer akan dihapus secara permanen dari database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Menghapus...
                </>
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}