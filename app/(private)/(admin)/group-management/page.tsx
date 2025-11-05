"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { getGroupParents, deleteGroupParent } from "@/lib/firebase/groups";
import { GroupParent } from "@/types/groups";
import { useRouter } from "next/navigation";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";
import { toast } from "sonner";
import GenerateGroupDialog from "@/components/groups/admin/generate-group-dialog";
import DeleteGroupParentDialog from "@/components/groups/admin/delete-group-parent-dialog";
import EditGroupParentDialog from "@/components/groups/admin/edit-group-parent-dialog";

export default function GroupManagementPage() {
  const router = useRouter();
  const [groupParents, setGroupParents] = useState<GroupParent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dialog states
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedGroupParent, setSelectedGroupParent] =
    useState<GroupParent | null>(null);

  const loadGroupParents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGroupParents();
      setGroupParents(data);
    } catch (error) {
      console.error("Error loading group parents:", error);
      toast.error("Gagal memuat data kelompok");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadGroupParents();
  }, [loadGroupParents]);

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUserId(user.uid);
      } else {
        setCurrentUserId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const filteredGroupParents = groupParents.filter((gp) =>
    gp.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewDetail = (groupParent: GroupParent) => {
    router.push(`/group-management/${groupParent.id}`);
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Manajemen Kelompok
          </h1>
          <p className="text-gray-600">
            Kelola kelompok project khusus untuk calon anggota
          </p>
        </motion.div>

        {/* Filters & Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6 flex flex-col sm:flex-row gap-4"
        >
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Cari kelompok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => setIsGenerateOpen(true)}
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            Generate Kelompok
          </Button>
        </motion.div>

        {/* Group Parents Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroupParents.map((groupParent, index) => (
                <motion.div
                  key={groupParent.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="hover:shadow-lg transition-shadow group cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">📂</span>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                              {groupParent.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {groupParent.description || "Tidak ada deskripsi"}
                            </CardDescription>
                          </div>
                        </div>

                        {/* Actions Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleViewDetail(groupParent)}
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Lihat Detail
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedGroupParent(groupParent);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedGroupParent(groupParent);
                                setIsDeleteOpen(true);
                              }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      {/* OR Period Badge */}
                      <div className="flex items-center gap-2 mt-3">
                        <Badge variant="secondary">{groupParent.orPeriod}</Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-2 text-sm">
                        {/* Sub-groups Count */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <UsersRound className="w-4 h-4" />
                          <span>{groupParent.totalSubGroups} Sub-kelompok</span>
                        </div>

                        {/* Total Members */}
                        <div className="flex items-center gap-2 text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{groupParent.totalMembers} Total Anggota</span>
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
        {!loading && filteredGroupParents.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada kelompok
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Tidak ditemukan kelompok yang sesuai dengan pencarian"
                : "Belum ada kelompok yang dibuat"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsGenerateOpen(true)}
                className="gap-2"
              >
                <Plus className="w-5 h-5" />
                Generate Kelompok Pertama
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      <GenerateGroupDialog
        open={isGenerateOpen}
        onOpenChange={setIsGenerateOpen}
        onSuccess={loadGroupParents}
        currentUserId={currentUserId}
      />

      {selectedGroupParent && (
        <>
          <EditGroupParentDialog
            open={isEditOpen}
            onOpenChange={setIsEditOpen}
            groupParent={selectedGroupParent}
            onSuccess={loadGroupParents}
          />

          <DeleteGroupParentDialog
            open={isDeleteOpen}
            onOpenChange={setIsDeleteOpen}
            groupParent={selectedGroupParent}
            onSuccess={loadGroupParents}
          />
        </>
      )}
    </div>
  );
}
