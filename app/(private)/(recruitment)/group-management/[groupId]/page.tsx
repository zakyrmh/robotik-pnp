"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, ArrowLeft, FileSpreadsheet, UserCog } from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import {
  getGroupParentById,
  getSubGroupsByParent,
  getActiveCaangCount,
} from "@/lib/firebase/services/group-service";
import { GroupParent, SubGroup } from "@/schemas/groups";
import { exportSubGroupsToExcel } from "@/lib/utils/export-excel";

import { SubGroupList } from "./_components/sub-group-list";
import {
  SubGroupFilterBar,
  SubGroupFilterState,
} from "./_components/sub-group-filters";
import { GenerateSubGroupModal } from "./_components/generate-sub-group-modal";
import { AddSubGroupModal } from "./_components/add-sub-group-modal";
import { SubGroupDetailModal } from "./_components/sub-group-detail-modal";
import { DeleteSubGroupModal } from "./_components/delete-sub-group-modal";
import { SetSubGroupLeaderModal } from "./_components/set-sub-group-leader-modal";

export default function SubGroupManagementPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [parentGroup, setParentGroup] = useState<GroupParent | null>(null);
  const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isParentLoading, setIsParentLoading] = useState(true);
  const [totalCaang, setTotalCaang] = useState(0);

  // Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isAddSubGroupModalOpen, setIsAddSubGroupModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSetLeaderModalOpen, setIsSetLeaderModalOpen] = useState(false);
  const [selectedSubGroup, setSelectedSubGroup] = useState<SubGroup | null>(
    null
  );

  const [filters, setFilters] = useState<SubGroupFilterState>({
    query: "",
  });

  // Fetch Parent Group on mount
  useEffect(() => {
    const fetchParentGroup = async () => {
      setIsParentLoading(true);
      try {
        const parent = await getGroupParentById(groupId);
        if (!parent) {
          toast.error("Kelompok tidak ditemukan");
          router.push("/group-management");
          return;
        }
        setParentGroup(parent);

        // Also fetch caang count
        const caangCount = await getActiveCaangCount();
        setTotalCaang(caangCount);
      } catch (error) {
        console.error("Error fetching parent group:", error);
        toast.error("Gagal memuat data kelompok");
        router.push("/group-management");
      } finally {
        setIsParentLoading(false);
      }
    };
    fetchParentGroup();
  }, [groupId, router]);

  // Fetch Sub-Groups
  const fetchSubGroupsData = useCallback(async () => {
    if (!groupId) return;

    setIsLoading(true);
    try {
      const data = await getSubGroupsByParent(groupId);

      // Apply search query locally
      let filteredData = data;
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredData = data.filter(
          (sg) =>
            sg.name.toLowerCase().includes(lowerQuery) ||
            (sg.description || "").toLowerCase().includes(lowerQuery) ||
            sg.members.some(
              (m) =>
                m.fullName.toLowerCase().includes(lowerQuery) ||
                m.nim.toLowerCase().includes(lowerQuery)
            )
        );
      }

      setSubGroups(filteredData);
    } catch (error) {
      console.error("Error fetching sub-groups:", error);
      toast.error("Gagal memuat daftar sub-kelompok");
    } finally {
      setIsLoading(false);
    }
  }, [groupId, filters.query]);

  useEffect(() => {
    fetchSubGroupsData();
  }, [fetchSubGroupsData]);

  // Handlers
  const handleViewDetail = (subGroup: SubGroup) => {
    setSelectedSubGroup(subGroup);
    setIsDetailModalOpen(true);
  };

  const handleDelete = (subGroup: SubGroup) => {
    setSelectedSubGroup(subGroup);
    setIsDeleteModalOpen(true);
  };

  const handleSetLeader = (subGroup: SubGroup) => {
    setSelectedSubGroup(subGroup);
    setIsSetLeaderModalOpen(true);
  };

  const handleSetLeaderSuccess = () => {
    fetchSubGroupsData();
  };

  const handleDeleteSuccess = () => {
    fetchSubGroupsData();
    // Refresh parent group to update stats
    getGroupParentById(groupId).then((parent) => {
      if (parent) setParentGroup(parent);
    });
  };

  const handleAddSubGroup = () => {
    setIsAddSubGroupModalOpen(true);
  };

  const handleAddSubGroupSuccess = () => {
    // Navigate to edit-members page after creating new sub-groups
    router.push(`/group-management/${groupId}/edit-members`);
  };

  const handleGenerateSubGroup = () => {
    setIsGenerateModalOpen(true);
  };

  const handleGenerateSuccess = () => {
    fetchSubGroupsData();
    // Refresh parent group to update stats
    getGroupParentById(groupId).then((parent) => {
      if (parent) setParentGroup(parent);
    });
  };

  const handleEditMembers = () => {
    router.push(`/group-management/${groupId}/edit-members`);
  };

  const handleExportExcel = () => {
    if (!parentGroup || subGroups.length === 0) {
      toast.error("Tidak ada data sub-kelompok untuk diexport");
      return;
    }

    try {
      exportSubGroupsToExcel(subGroups, parentGroup.name, parentGroup.orPeriod);
      toast.success("File Excel berhasil diunduh");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      toast.error("Gagal mengexport data ke Excel");
    }
  };

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          {/* Back Button & Breadcrumb */}
          <div className="flex items-center gap-2 mb-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push("/group-management")}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Manajemen Kelompok
            </span>
          </div>

          {/* Title */}
          {isParentLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">
                {parentGroup?.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {parentGroup?.description ||
                  `Kelola sub-kelompok untuk ${parentGroup?.name}`}
              </p>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            className="shadow-sm"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button
            variant="outline"
            onClick={handleEditMembers}
            className="shadow-sm"
          >
            <UserCog className="mr-2 h-4 w-4" />
            Edit Anggota
          </Button>
          <Button onClick={handleAddSubGroup} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Sub-Kelompok
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="space-y-4">
        <SubGroupFilterBar filters={filters} onFilterChange={setFilters} />

        {/* Sub-Group Grid */}
        <SubGroupList
          subGroups={subGroups}
          isLoading={isLoading}
          onViewDetail={handleViewDetail}
          onDelete={handleDelete}
          onGenerateSubGroup={handleGenerateSubGroup}
          onSetLeader={handleSetLeader}
        />
      </div>

      {/* Generate Sub-Group Modal */}
      {parentGroup && (
        <GenerateSubGroupModal
          open={isGenerateModalOpen}
          onOpenChange={setIsGenerateModalOpen}
          parentGroupId={groupId}
          orPeriod={parentGroup.orPeriod}
          onSuccess={handleGenerateSuccess}
          totalCaang={totalCaang}
        />
      )}

      {/* Add Sub-Group Modal */}
      {parentGroup && (
        <AddSubGroupModal
          open={isAddSubGroupModalOpen}
          onOpenChange={setIsAddSubGroupModalOpen}
          parentGroupId={groupId}
          orPeriod={parentGroup.orPeriod}
          existingSubGroupCount={subGroups.length}
          onSuccess={handleAddSubGroupSuccess}
        />
      )}

      {/* Sub-Group Detail Modal */}
      <SubGroupDetailModal
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
        subGroup={selectedSubGroup}
      />

      {/* Delete Sub-Group Modal */}
      <DeleteSubGroupModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        subGroup={selectedSubGroup}
        onSuccess={handleDeleteSuccess}
      />

      {/* Set Leader Modal */}
      <SetSubGroupLeaderModal
        open={isSetLeaderModalOpen}
        onOpenChange={setIsSetLeaderModalOpen}
        subGroup={selectedSubGroup}
        onSuccess={handleSetLeaderSuccess}
      />
    </div>
  );
}
