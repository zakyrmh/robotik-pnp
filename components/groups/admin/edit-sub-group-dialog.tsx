"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  updateSubGroup,
  getCaangUsersWithAttendance,
} from "@/lib/firebase/groups";
import { GroupParent, SubGroup, GroupMember } from "@/types/groups";
import { toast } from "sonner";
import { Loader2, X, Plus, AlertCircle, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface EditSubGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup;
  groupParent: GroupParent;
  onSuccess: () => void;
}

export default function EditSubGroupDialog({
  open,
  onOpenChange,
  subGroup,
  groupParent,
  onSuccess,
}: EditSubGroupDialogProps) {
  const [loading, setLoading] = useState(false);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [formData, setFormData] = useState({
    name: subGroup.name,
    description: subGroup.description || "",
  });

  // Member management
  const [currentMembers, setCurrentMembers] = useState<GroupMember[]>(
    subGroup.members
  );
  const [availableMembers, setAvailableMembers] = useState<GroupMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [leaderId, setLeaderId] = useState(subGroup.leaderId || "");

  useEffect(() => {
    setFormData({
      name: subGroup.name,
      description: subGroup.description || "",
    });
    setCurrentMembers(subGroup.members);
    setLeaderId(subGroup.leaderId || "");
  }, [subGroup]);

  useEffect(() => {
    const loadAvailableMembers = async () => {
      setLoadingMembers(true);
      try {
        const allCaangUsers = await getCaangUsersWithAttendance(
          groupParent.orPeriod
        );

        // Filter out users that are already members
        const currentMemberIds = currentMembers.map((m) => m.userId);
        const available = allCaangUsers.filter(
          (user) => !currentMemberIds.includes(user.userId)
        );

        setAvailableMembers(available);
      } catch (error) {
        console.error("Error loading available members:", error);
        toast.error("Gagal memuat daftar caang");
      } finally {
        setLoadingMembers(false);
      }
    };

    if (open) {
      loadAvailableMembers();
    }
  }, [open, groupParent.orPeriod, currentMembers, setAvailableMembers]);

  const addMember = (member: GroupMember) => {
    setCurrentMembers([...currentMembers, member]);
    setAvailableMembers(
      availableMembers.filter((m) => m.userId !== member.userId)
    );
  };

  const removeMember = (userId: string) => {
    const member = currentMembers.find((m) => m.userId === userId);
    if (member) {
      setCurrentMembers(currentMembers.filter((m) => m.userId !== userId));
      setAvailableMembers([...availableMembers, member]);

      // Remove as leader if they were the leader
      if (leaderId === userId) {
        setLeaderId("");
      }
    }
  };

  const filteredAvailableMembers = availableMembers.filter(
    (member) =>
      member.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.nim.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Nama sub-kelompok harus diisi");
      return;
    }

    setLoading(true);
    try {
      await updateSubGroup(subGroup.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        memberIds: currentMembers.map((m) => m.userId),
        members: currentMembers,
        leaderId: leaderId || undefined,
      });

      toast.success("Sub-kelompok berhasil diperbarui!");
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating sub-group:", error);
      toast.error("Gagal memperbarui sub-kelompok. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Sub-kelompok</DialogTitle>
          <DialogDescription>
            Edit informasi dan anggota sub-kelompok
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col flex-1 overflow-hidden"
        >
          <Tabs
            defaultValue="info"
            className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="info">Informasi</TabsTrigger>
              <TabsTrigger value="members">
                Anggota ({currentMembers.length})
              </TabsTrigger>
            </TabsList>

            <div className="flex-1 overflow-y-auto py-4">
              {/* Tab: Informasi */}
              <TabsContent value="info" className="space-y-4 mt-0">
                {/* Nama Sub-kelompok */}
                <div className="space-y-2">
                  <Label htmlFor="name">
                    Nama Sub-kelompok <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Contoh: Kelompok 1"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    required
                  />
                </div>

                {/* Deskripsi */}
                <div className="space-y-2">
                  <Label htmlFor="description">Deskripsi</Label>
                  <Textarea
                    id="description"
                    placeholder="Deskripsi sub-kelompok (opsional)"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>

                {/* Leader Selection */}
                <div className="space-y-2">
                  <Label htmlFor="leader">Ketua Kelompok (Opsional)</Label>
                  <select
                    id="leader"
                    value={leaderId}
                    onChange={(e) => setLeaderId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md p-2 text-sm"
                  >
                    <option value="">Pilih ketua kelompok...</option>
                    {currentMembers.map((member) => (
                      <option key={member.userId} value={member.userId}>
                        {member.fullName} ({member.nim})
                      </option>
                    ))}
                  </select>
                </div>
              </TabsContent>

              {/* Tab: Anggota */}
              <TabsContent value="members" className="space-y-4 mt-0">
                {/* Current Members */}
                <div>
                  <Label className="mb-2 block">Anggota Saat Ini</Label>
                  <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg p-2">
                    {currentMembers.length === 0 ? (
                      <p className="text-sm text-gray-400 text-center py-4">
                        Belum ada anggota
                      </p>
                    ) : (
                      currentMembers.map((member) => (
                        <div
                          key={member.userId}
                          className={`flex items-center justify-between p-2 rounded ${
                            member.isLowAttendance
                              ? "bg-red-50 border border-red-200"
                              : "bg-gray-50"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm truncate">
                                {member.fullName}
                              </p>
                              {leaderId === member.userId && (
                                <Badge variant="default" className="text-xs">
                                  Ketua
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {member.nim}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span
                                className={`text-xs font-semibold ${
                                  member.isLowAttendance
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                Attendance:{" "}
                                {member.attendancePercentage.toFixed(0)}%
                              </span>
                              {member.isLowAttendance && (
                                <span className="flex items-center gap-1 text-xs text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  Rendah
                                </span>
                              )}
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeMember(member.userId)}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add Members */}
                <div>
                  <Label className="mb-2 block">Tambah Anggota</Label>

                  {/* Search */}
                  <div className="relative mb-2">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Cari caang..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 text-sm"
                    />
                  </div>

                  {loadingMembers ? (
                    <div className="flex justify-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-2">
                      {filteredAvailableMembers.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-4">
                          {searchQuery
                            ? "Tidak ditemukan caang yang sesuai"
                            : "Tidak ada caang yang tersedia"}
                        </p>
                      ) : (
                        filteredAvailableMembers.map((member) => (
                          <div
                            key={member.userId}
                            className={`flex items-center justify-between p-2 rounded ${
                              member.isLowAttendance
                                ? "bg-red-50 border border-red-200"
                                : "bg-gray-50"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {member.fullName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {member.nim}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <span
                                  className={`text-xs font-semibold ${
                                    member.isLowAttendance
                                      ? "text-red-600"
                                      : "text-green-600"
                                  }`}
                                >
                                  Attendance:{" "}
                                  {member.attendancePercentage.toFixed(0)}%
                                </span>
                                {member.isLowAttendance && (
                                  <span className="flex items-center gap-1 text-xs text-red-600">
                                    <AlertCircle className="w-3 h-3" />
                                    Rendah
                                  </span>
                                )}
                              </div>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => addMember(member)}
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            </div>
          </Tabs>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
