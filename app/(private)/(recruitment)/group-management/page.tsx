"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import {
  getGroupParents,
  getGroupOrPeriods,
  GroupFilters,
} from "@/lib/firebase/services/group-service";
import { GroupParent } from "@/schemas/groups";

import { GroupList } from "./_components/group-list";
import { GroupFilterBar, FilterState } from "./_components/group-filters";
import { GroupFormModal } from "./_components/group-form-modal";
import { DeleteGroupModal } from "./_components/delete-group-modal";

export default function GroupManagementPage() {
  const router = useRouter();

  const [groups, setGroups] = useState<GroupParent[]>([]);
  const [orPeriods, setOrPeriods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<GroupParent | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>({
    query: "",
    orPeriod: "all",
    isActive: "all",
  });

  // Fetch OR Periods on mount
  useEffect(() => {
    const fetchPeriods = async () => {
      try {
        const periods = await getGroupOrPeriods();
        setOrPeriods(periods);
      } catch (error) {
        console.error("Error fetching periods:", error);
      }
    };
    fetchPeriods();
  }, []);

  // Fetch Groups when filters change
  const fetchGroupsData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Prepare backend filters
      const backendFilters: GroupFilters = {
        orPeriod: filters.orPeriod,
        isActive: filters.isActive,
      };

      const data = await getGroupParents(backendFilters);

      // Apply search query locally
      let filteredData = data;
      if (filters.query) {
        const lowerQuery = filters.query.toLowerCase();
        filteredData = data.filter(
          (g) =>
            g.name.toLowerCase().includes(lowerQuery) ||
            (g.description || "").toLowerCase().includes(lowerQuery)
        );
      }

      setGroups(filteredData);
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Gagal memuat daftar kelompok");
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchGroupsData();
  }, [fetchGroupsData]);

  // Handlers
  const handleEdit = (group: GroupParent) => {
    setSelectedGroup(group);
    setIsModalOpen(true);
  };

  const handleDelete = (group: GroupParent) => {
    setSelectedGroup(group);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSuccess = () => {
    fetchGroupsData();
  };

  const handleCreate = () => {
    setSelectedGroup(null); // Reset for create mode
    setIsModalOpen(true);
  };

  const handleViewSubGroups = (group: GroupParent) => {
    // Navigate to sub-groups page
    router.push(`/group-management/${group.id}`);
  };

  const handleModalSuccess = () => {
    fetchGroupsData();
    // Refresh periods if it was a new group (might have new period)
    getGroupOrPeriods().then(setOrPeriods);
  };

  return (
    <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">
            Manajemen Kelompok
          </h1>
          <p className="text-sm text-muted-foreground">
            Kelola kelompok dan sub-kelompok untuk peserta rekrutmen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/group-management/trash")}
            className="shadow-sm"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Trash
          </Button>
          <Button onClick={handleCreate} className="shadow-sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Kelompok
          </Button>
        </div>
      </div>

      <Separator />

      {/* Filters and Actions */}
      <div className="space-y-4">
        <GroupFilterBar
          filters={filters}
          onFilterChange={setFilters}
          orPeriods={orPeriods}
        />

        {/* Group Grid */}
        <GroupList
          groups={groups}
          isLoading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onViewSubGroups={handleViewSubGroups}
        />
      </div>

      {/* Group Form Modal */}
      <GroupFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        group={selectedGroup}
        onSuccess={handleModalSuccess}
      />

      {/* Delete Group Modal */}
      <DeleteGroupModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        group={selectedGroup}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
