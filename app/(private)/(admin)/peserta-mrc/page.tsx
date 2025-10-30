"use client";

import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebaseConfig";
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Loader2,
  Eye,
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

// Types
interface Peserta {
  id: string;
  cabang_lomba: string;
  nama_tim_karya: string;
  nama_anggota: string;
  pembimbing: string;
  asal_daerah: string;
  instansi: string;
  foto_anggota: string;
  qr_code: string;
}

type SortField =
  | "cabang_lomba"
  | "nama_tim_karya"
  | "nama_anggota"
  | "instansi";
type SortDirection = "asc" | "desc" | null;

// Helper function to convert Google Drive URL
const convertGDriveUrl = (url: string): string => {
  if (!url) return "";
  const match = url.match(/[?&]id=([^&]+)/);
  if (match && match[1]) {
    return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w400`;
  }
  return url;
};

export default function PesertaMRCPage() {
  const [pesertaList, setPesertaList] = useState<Peserta[]>([]);
  const [filteredPeserta, setFilteredPeserta] = useState<Peserta[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot | null>(null);
  const [selectedPeserta, setSelectedPeserta] = useState<Peserta | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const observerTarget = useRef<HTMLDivElement>(null);
  const ITEMS_PER_PAGE = 20;

  // Fetch initial data
  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const q = query(collection(db, "peserta_mrc_ix"), limit(ITEMS_PER_PAGE));

      const querySnapshot = await getDocs(q);
      const data: Peserta[] = [];

      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Peserta);
      });

      setPesertaList(data);
      setFilteredPeserta(data);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setInitialLoading(false);
    }
  };

  // Fetch more data for infinite scroll
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchMoreData = async () => {
    if (!hasMore || loading || !lastDoc) return;

    try {
      setLoading(true);
      const q = query(
        collection(db, "peserta_mrc_ix"),
        startAfter(lastDoc),
        limit(ITEMS_PER_PAGE)
      );

      const querySnapshot = await getDocs(q);
      const data: Peserta[] = [];

      querySnapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as Peserta);
      });

      setPesertaList((prev) => [...prev, ...data]);
      setLastDoc(querySnapshot.docs[querySnapshot.docs.length - 1]);
      setHasMore(querySnapshot.docs.length === ITEMS_PER_PAGE);
    } catch (error) {
      console.error("Error fetching more data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          fetchMoreData();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, lastDoc, fetchMoreData]);

  // Initial fetch
  useEffect(() => {
    fetchInitialData();
  }, []);

  // Search functionality
  useEffect(() => {
    let result = [...pesertaList];

    if (searchQuery) {
      result = result.filter((peserta) => {
        const search = searchQuery.toLowerCase();
        return (
          peserta.cabang_lomba?.toLowerCase().includes(search) ||
          peserta.nama_tim_karya?.toLowerCase().includes(search) ||
          peserta.nama_anggota?.toLowerCase().includes(search) ||
          peserta.instansi?.toLowerCase().includes(search) ||
          peserta.pembimbing?.toLowerCase().includes(search) ||
          peserta.asal_daerah?.toLowerCase().includes(search)
        );
      });
    }

    // Apply sorting
    if (sortField && sortDirection) {
      result.sort((a, b) => {
        const aValue = a[sortField]?.toLowerCase() || "";
        const bValue = b[sortField]?.toLowerCase() || "";

        if (sortDirection === "asc") {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    setFilteredPeserta(result);
  }, [searchQuery, pesertaList, sortField, sortDirection]);

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else if (sortDirection === "desc") {
        setSortField(null);
        setSortDirection(null);
      } else {
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="w-4 h-4" />;
    if (sortDirection === "asc") return <ArrowUp className="w-4 h-4" />;
    if (sortDirection === "desc") return <ArrowDown className="w-4 h-4" />;
    return <ArrowUpDown className="w-4 h-4" />;
  };

  // Open detail modal
  const openDetailModal = (peserta: Peserta) => {
    setSelectedPeserta(peserta);
    setModalOpen(true);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Peserta MRC IX</h1>
          <p className="text-muted-foreground">
            Minangkabau Robot Contest IX - UKM Robotik PNP
          </p>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                type="text"
                placeholder="Cari berdasarkan cabang lomba, nama tim, anggota, instansi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results count */}
        <div className="mb-4 text-sm text-muted-foreground">
          Menampilkan {filteredPeserta.length} dari {pesertaList.length} peserta
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">No</TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("cabang_lomba")}
                        className="flex items-center gap-2 hover:bg-transparent p-0"
                      >
                        Cabang Lomba
                        {getSortIcon("cabang_lomba")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("nama_tim_karya")}
                        className="flex items-center gap-2 hover:bg-transparent p-0"
                      >
                        Nama Tim/Karya
                        {getSortIcon("nama_tim_karya")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("nama_anggota")}
                        className="flex items-center gap-2 hover:bg-transparent p-0"
                      >
                        Nama Anggota
                        {getSortIcon("nama_anggota")}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort("instansi")}
                        className="flex items-center gap-2 hover:bg-transparent p-0"
                      >
                        Instansi
                        {getSortIcon("instansi")}
                      </Button>
                    </TableHead>
                    <TableHead className="w-[100px]">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <AnimatePresence mode="popLayout">
                    {filteredPeserta.map((peserta, index) => (
                      <motion.tr
                        key={peserta.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="border-b"
                      >
                        <TableCell className="font-medium">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {peserta.cabang_lomba}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {peserta.nama_tim_karya}
                        </TableCell>
                        <TableCell>{peserta.nama_anggota}</TableCell>
                        <TableCell>{peserta.instansi}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDetailModal(peserta)}
                            className="hover:bg-primary/10"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </TableBody>
              </Table>
            </div>

            {/* Loading indicator for infinite scroll */}
            <div ref={observerTarget} className="py-4 text-center">
              {loading && (
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" />
              )}
              {!hasMore && pesertaList.length > 0 && (
                <p className="text-sm text-muted-foreground">
                  Semua data telah ditampilkan
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Detail Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detail Peserta</DialogTitle>
            <DialogDescription>
              Informasi lengkap peserta Minangkabau Robot Contest IX
            </DialogDescription>
          </DialogHeader>

          {selectedPeserta && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              {/* Foto Anggota */}
              {selectedPeserta.foto_anggota && (
                <div className="flex justify-center">
                  <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-border">
                    <Image
                      src={convertGDriveUrl(selectedPeserta.foto_anggota)}
                      alt={selectedPeserta.nama_anggota}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src =
                          "https://via.placeholder.com/400x400?text=No+Image";
                      }}
                      width={400}
                      height={400}
                    />
                  </div>
                </div>
              )}

              {/* Detail Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Cabang Lomba
                  </label>
                  <p className="mt-1">
                    <Badge variant="default">
                      {selectedPeserta.cabang_lomba}
                    </Badge>
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Nama Tim/Karya
                  </label>
                  <p className="mt-1 font-medium">
                    {selectedPeserta.nama_tim_karya}
                  </p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Nama Anggota
                  </label>
                  <p className="mt-1">{selectedPeserta.nama_anggota}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Pembimbing
                  </label>
                  <p className="mt-1">{selectedPeserta.pembimbing}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Asal Daerah
                  </label>
                  <p className="mt-1">{selectedPeserta.asal_daerah}</p>
                </div>

                <div>
                  <label className="text-sm font-semibold text-muted-foreground">
                    Instansi
                  </label>
                  <p className="mt-1">{selectedPeserta.instansi}</p>
                </div>
              </div>
            </motion.div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
