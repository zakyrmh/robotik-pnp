"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Users,
  Search,
  Trash2,
  Crown,
  AlertCircle,
  ArrowUpDown,
  Loader2,
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
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getSubGroupById, updateSubGroup } from "@/lib/firebase/groups";
import { SubGroup, GroupMember } from "@/types/groups";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";

type SortField = "name" | "nim" | "attendance";
type SortOrder = "asc" | "desc";

type UpdateData = {
  members: GroupMember[];
  memberIds: string[];
  leaderId?: string;
};

export default function SubGroupMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupParentId = params.id as string;
  const subGroupId = params.subGroupId as string;

  const [subGroup, setSubGroup] = useState<SubGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Dialog states
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getSubGroupById(subGroupId);

      if (!data) {
        toast.error("Sub-kelompok tidak ditemukan");
        router.push(`/group-management/${groupParentId}`);
        return;
      }

      setSubGroup(data);
    } catch (error) {
      console.error("Error loading sub-group:", error);
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, [subGroupId, groupParentId, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and sort members
  const filteredAndSortedMembers = subGroup?.members
    .filter(
      (member) =>
        member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        member.nim.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case "name":
          comparison = a.fullName.localeCompare(b.fullName);
          break;
        case "nim":
          comparison = a.nim.localeCompare(b.nim);
          break;
        case "attendance":
          comparison = a.attendancePercentage - b.attendancePercentage;
          break;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    }) || [];

  const handleRemoveMember = async () => {
    if (!memberToRemove || !subGroup) return;

    setIsUpdating(true);
    try {
      const updatedMembers = subGroup.members.filter(
        (m) => m.userId !== memberToRemove.userId
      );
      const updatedMemberIds = updatedMembers.map((m) => m.userId);

      // If removing the leader, clear leaderId
      const updateData: UpdateData = {
        members: updatedMembers,
        memberIds: updatedMemberIds,
      };

      if (subGroup.leaderId === memberToRemove.userId) {
        updateData.leaderId = undefined;
      }

      await updateSubGroup(subGroupId, updateData);

      toast.success("Anggota berhasil dihapus");
      loadData();
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Gagal menghapus anggota");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeLeader = async (userId: string) => {
    if (!subGroup) return;

    setIsUpdating(true);
    try {
      await updateSubGroup(subGroupId, {
        leaderId: userId || undefined,
      });

      toast.success("Ketua kelompok berhasil diubah");
      loadData();
    } catch (error) {
      console.error("Error changing leader:", error);
      toast.error("Gagal mengubah ketua kelompok");
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-4 h-4 ml-2 text-gray-400 dark:text-gray-500" />;
    }
    return (
      <ArrowUpDown
        className={`w-4 h-4 ml-2 transition-transform ${sortOrder === "desc" ? "rotate-180" : ""
          } ${sortField === field ? "text-blue-600 dark:text-blue-400" : "text-gray-400 dark:text-gray-500"}`}
      />
    );
  };

  const lowAttendanceCount = subGroup?.members.filter(
    (m) => m.isLowAttendance
  ).length || 0;

  return (
    <div className="min-h-screen p-8 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push(`/group-management/${groupParentId}`)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Kembali ke Sub-kelompok
          </Button>

          {subGroup && (
            <>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    {subGroup.name}
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400">
                    {subGroup.description || "Tidak ada deskripsi"}
                  </p>
                  <div className="flex items-center gap-4 mt-4">
                    <Badge variant="secondary">{subGroup.orPeriod}</Badge>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {subGroup.members.length} Anggota
                    </div>
                    {lowAttendanceCount > 0 && (
                      <div className="flex items-center gap-1 text-sm text-orange-600 dark:text-orange-400">
                        <AlertCircle className="w-4 h-4" />
                        {lowAttendanceCount} dengan attendance rendah
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </motion.div>

        {/* Filters & Table */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Daftar Anggota</CardTitle>
              <CardDescription>
                Kelola anggota dan ketua kelompok
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
                  <Input
                    placeholder="Cari nama atau NIM..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Leader Selector */}
                <select
                  value={subGroup?.leaderId || ""}
                  onChange={(e) => handleChangeLeader(e.target.value)}
                  disabled={isUpdating || !subGroup || subGroup.members.length === 0}
                  className="w-full sm:w-[250px] border border-gray-300 dark:border-gray-800 bg-white dark:bg-gray-950 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:text-gray-100"
                >
                  <option value="">Pilih Ketua Kelompok</option>
                  {subGroup?.members.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.fullName}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              {loading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
                  ))}
                </div>
              ) : filteredAndSortedMembers.length === 0 ? (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {searchQuery ? "Tidak ada hasil" : "Belum ada anggota"}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {searchQuery
                      ? "Tidak ditemukan anggota yang sesuai dengan pencarian"
                      : "Sub-kelompok ini belum memiliki anggota"}
                  </p>
                </div>
              ) : (
                <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          No
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => toggleSort("name")}
                            className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            Nama
                            {getSortIcon("name")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => toggleSort("nim")}
                            className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            NIM
                            {getSortIcon("nim")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left">
                          <button
                            onClick={() => toggleSort("attendance")}
                            className="flex items-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-blue-600 dark:hover:text-blue-400"
                          >
                            Attendance
                            {getSortIcon("attendance")}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-950 divide-y divide-gray-200 dark:divide-gray-800">
                      {filteredAndSortedMembers.map((member, index) => (
                        <tr
                          key={member.userId}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-900 ${member.isLowAttendance ? "bg-red-50 dark:bg-red-900/20" : ""
                            }`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {index + 1}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                {member.fullName}
                              </span>
                              {subGroup?.leaderId === member.userId && (
                                <Badge
                                  variant="default"
                                  className="gap-1 text-xs"
                                >
                                  <Crown className="w-3 h-3" />
                                  Ketua
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                            {member.nim}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-semibold ${member.isLowAttendance
                                  ? "text-red-600 dark:text-red-400"
                                  : "text-green-600 dark:text-green-400"
                                  }`}
                              >
                                {member.attendancePercentage.toFixed(1)}%
                              </span>
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                ({member.attendedActivities}/
                                {member.totalActivities})
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            {member.isLowAttendance ? (
                              <Badge variant="destructive" className="gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Rendah
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Normal</Badge>
                            )}
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setMemberToRemove(member);
                                setIsRemoveDialogOpen(true);
                              }}
                              className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Summary */}
              {!loading && filteredAndSortedMembers.length > 0 && (
                <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                  Menampilkan {filteredAndSortedMembers.length} dari{" "}
                  {subGroup?.members.length} anggota
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Remove Member Dialog */}
      <Dialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <Trash2 className="w-5 h-5" />
              Hapus Anggota
            </DialogTitle>
            <DialogDescription>
              Apakah Anda yakin ingin menghapus anggota ini dari sub-kelompok?
            </DialogDescription>
          </DialogHeader>

          {memberToRemove && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 my-4">
              <p className="font-semibold text-red-900 dark:text-red-200">
                {memberToRemove.fullName}
              </p>
              <p className="text-sm text-red-800 dark:text-red-300">{memberToRemove.nim}</p>
              {subGroup?.leaderId === memberToRemove.userId && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Anggota ini adalah ketua kelompok
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRemoveDialogOpen(false)}
              disabled={isUpdating}
            >
              Batal
            </Button>
            <Button
              variant="destructive"
              onClick={handleRemoveMember}
              disabled={isUpdating}
            >
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isUpdating ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}