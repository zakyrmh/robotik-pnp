"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  MoreVertical,
  Edit,
  Trash2,
  AlertCircle,
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
import {
  getGroupParentById,
  getSubGroupsByParent,
} from "@/lib/firebase/groups";
import { GroupParent, SubGroup } from "@/types/groups";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import AddSubGroupDialog from "@/components/groups/admin/add-sub-group-dialog";
import EditSubGroupDialog from "@/components/groups/admin/edit-sub-group-dialog";
import DeleteSubGroupDialog from "@/components/groups/admin/delete-sub-group-dialog";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { app } from "@/lib/firebaseConfig";

export default function GroupDetailPage() {
  const router = useRouter();
  const params = useParams();
  const groupParentId = params.id as string;

  const [groupParent, setGroupParent] = useState<GroupParent | null>(null);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Dialog states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState<SubGroup | null>(
    null
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [parentData, subGroupsData] = await Promise.all([
        getGroupParentById(groupParentId),
        getSubGroupsByParent(groupParentId),
      ]);

      if (!parentData) {
        toast.error("Kelompok tidak ditemukan");
        router.push("/group-management");
        return;
      }

      setGroupParent(parentData);
      setSubGroups(subGroupsData);
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [groupParentId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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

  const filteredSubGroups = subGroups.filter((sg) =>
    sg.name.toLowerCase().includes(searchQuery.toLowerCase())
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
            onClick={() => router.push("/group-management")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Daftar Kelompok
          </Button>

          {groupParent && (
            <>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {groupParent.name}
              </h1>
              <p className="text-gray-600">
                {groupParent.description || "Tidak ada deskripsi"}
              </p>
              <div className="flex items-center gap-4 mt-4">
                <Badge variant="secondary">{groupParent.orPeriod}</Badge>
                <div className="text-sm text-gray-600">
                  {groupParent.totalSubGroups} Sub-kelompok •{" "}
                  {groupParent.totalMembers} Total Anggota
                </div>
              </div>
            </>
          )}
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
              placeholder="Cari sub-kelompok..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Add Button */}
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="w-5 h-5" />
            Tambah Sub-kelompok
          </Button>
        </motion.div>

        {/* Sub-groups Grid */}
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
              {filteredSubGroups.map((subGroup, index) => (
                <motion.div
                  key={subGroup.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                  layout
                >
                  <Card className="hover:shadow-lg transition-shadow group">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <span className="text-3xl">👥</span>
                          <div className="flex-1">
                            <CardTitle className="text-lg mb-1 group-hover:text-blue-600 transition-colors">
                              {subGroup.name}
                            </CardTitle>
                            <CardDescription className="line-clamp-2">
                              {subGroup.description || "Tidak ada deskripsi"}
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
                              onClick={() => {
                                setSelectedSubGroup(subGroup);
                                setIsEditOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedSubGroup(subGroup);
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
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-3">
                        {/* Member Count */}
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{subGroup.memberIds.length} Anggota</span>
                        </div>

                        {/* Members List */}
                        <div className="space-y-2">
                          {subGroup.members.slice(0, 3).map((member) => (
                            <div
                              key={member.userId}
                              className={`text-xs p-2 rounded ${
                                member.isLowAttendance
                                  ? "bg-red-50 border border-red-200"
                                  : "bg-gray-50"
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {member.fullName}
                                  </p>
                                  <p className="text-gray-500">{member.nim}</p>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`font-semibold ${
                                      member.isLowAttendance
                                        ? "text-red-600"
                                        : "text-green-600"
                                    }`}
                                  >
                                    {member.attendancePercentage.toFixed(0)}%
                                  </p>
                                </div>
                              </div>
                              {member.isLowAttendance && (
                                <div className="flex items-center gap-1 mt-1 text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="text-xs">
                                    Attendance rendah
                                  </span>
                                </div>
                              )}
                            </div>
                          ))}

                          {subGroup.members.length > 3 && (
                            <p className="text-xs text-gray-500 text-center">
                              +{subGroup.members.length - 3} anggota lainnya
                            </p>
                          )}

                          {subGroup.members.length === 0 && (
                            <p className="text-xs text-gray-400 text-center py-2">
                              Belum ada anggota
                            </p>
                          )}
                        </div>

                        {/* Low Attendance Warning */}
                        {subGroup.members.some((m) => m.isLowAttendance) && (
                          <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                            <AlertCircle className="w-3 h-3" />
                            <span>
                              Ada anggota dengan attendance &lt; 25%
                            </span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {!loading && filteredSubGroups.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Users className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Tidak ada sub-kelompok
            </h3>
            <p className="text-gray-600 mb-6">
              {searchQuery
                ? "Tidak ditemukan sub-kelompok yang sesuai dengan pencarian"
                : "Belum ada sub-kelompok yang dibuat"}
            </p>
            {!searchQuery && (
              <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                <Plus className="w-5 h-5" />
                Tambah Sub-kelompok Pertama
              </Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Dialogs */}
      {groupParent && (
        <>
          <AddSubGroupDialog
            open={isAddOpen}
            onOpenChange={setIsAddOpen}
            groupParent={groupParent}
            onSuccess={loadData}
            currentUserId={currentUserId}
          />

          {selectedSubGroup && (
            <>
              <EditSubGroupDialog
                open={isEditOpen}
                onOpenChange={setIsEditOpen}
                subGroup={selectedSubGroup}
                groupParent={groupParent}
                onSuccess={loadData}
              />

              <DeleteSubGroupDialog
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                subGroup={selectedSubGroup}
                onSuccess={loadData}
              />
            </>
          )}
        </>
      )}
    </div>
  );
}
