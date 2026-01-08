"use client";

import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Save,
  Loader2,
  GripVertical,
  Crown,
  UserX,
} from "lucide-react";
import { toast } from "sonner";
import { useRouter, useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  getGroupParentById,
  getSubGroupsByParent,
  updateSubGroupMembers,
  getUnassignedCaang,
  UnassignedCaang,
} from "@/lib/firebase/services/group-service";
import { GroupParent, GroupMember } from "@/schemas/groups";

// Special ID for unassigned pool
const UNASSIGNED_ID = "__unassigned__";

// Local state for drag and drop
interface DraggableMember extends GroupMember {
  subGroupId: string;
}

interface SubGroupState {
  id: string;
  name: string;
  leaderId?: string | null;
  members: GroupMember[];
}

export default function EditMembersPage() {
  const router = useRouter();
  const params = useParams();
  const groupId = params.groupId as string;

  const [parentGroup, setParentGroup] = useState<GroupParent | null>(null);
  const [subGroupsState, setSubGroupsState] = useState<SubGroupState[]>([]);
  const [originalState, setOriginalState] = useState<SubGroupState[]>([]);
  const [unassignedMembers, setUnassignedMembers] = useState<GroupMember[]>([]);
  const [originalUnassigned, setOriginalUnassigned] = useState<GroupMember[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Drag state
  const [draggedMember, setDraggedMember] = useState<DraggableMember | null>(
    null
  );
  const [dragOverSubGroup, setDragOverSubGroup] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const parent = await getGroupParentById(groupId);
        if (!parent) {
          toast.error("Kelompok tidak ditemukan");
          router.push("/group-management");
          return;
        }
        setParentGroup(parent);

        // Fetch sub-groups
        const subGroups = await getSubGroupsByParent(groupId);

        // Sort by name (natural sort for "Kelompok 1", "Kelompok 2", etc.)
        const sortedSubGroups = subGroups.sort((a, b) => {
          const numA = parseInt(a.name.match(/\d+/)?.[0] || "0");
          const numB = parseInt(b.name.match(/\d+/)?.[0] || "0");
          return numA - numB;
        });

        const state = sortedSubGroups.map((sg) => ({
          id: sg.id,
          name: sg.name,
          leaderId: sg.leaderId,
          members: sg.members,
        }));
        setSubGroupsState(state);
        setOriginalState(JSON.parse(JSON.stringify(state)));

        // Fetch unassigned caang
        const unassigned = await getUnassignedCaang(groupId, parent.orPeriod);
        const unassignedAsMembers: GroupMember[] = unassigned.map(
          (u: UnassignedCaang) => ({
            userId: u.userId,
            fullName: u.fullName,
            nim: u.nim,
            attendancePercentage: u.attendancePercentage,
            totalActivities: u.totalActivities,
            attendedActivities: u.attendedActivities,
            isLowAttendance: u.isLowAttendance,
          })
        );
        setUnassignedMembers(unassignedAsMembers);
        setOriginalUnassigned(JSON.parse(JSON.stringify(unassignedAsMembers)));
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Gagal memuat data");
        router.push(`/group-management/${groupId}`);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [groupId, router]);

  // Check for changes
  useEffect(() => {
    const currentSubGroupsJson = JSON.stringify(subGroupsState);
    const originalSubGroupsJson = JSON.stringify(originalState);
    const currentUnassignedJson = JSON.stringify(unassignedMembers);
    const originalUnassignedJson = JSON.stringify(originalUnassigned);
    setHasChanges(
      currentSubGroupsJson !== originalSubGroupsJson ||
        currentUnassignedJson !== originalUnassignedJson
    );
  }, [subGroupsState, originalState, unassignedMembers, originalUnassigned]);

  // Drag handlers
  const handleDragStart = (
    e: React.DragEvent,
    member: GroupMember,
    subGroupId: string
  ) => {
    setDraggedMember({ ...member, subGroupId });
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", member.userId);
  };

  const handleDragOver = (e: React.DragEvent, subGroupId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverSubGroup(subGroupId);
  };

  const handleDragLeave = () => {
    setDragOverSubGroup(null);
  };

  const handleDrop = (e: React.DragEvent, targetSubGroupId: string) => {
    e.preventDefault();
    setDragOverSubGroup(null);

    if (!draggedMember) return;
    if (draggedMember.subGroupId === targetSubGroupId) return;

    const memberToAdd: GroupMember = {
      userId: draggedMember.userId,
      fullName: draggedMember.fullName,
      nim: draggedMember.nim,
      attendancePercentage: draggedMember.attendancePercentage,
      totalActivities: draggedMember.totalActivities,
      attendedActivities: draggedMember.attendedActivities,
      isLowAttendance: draggedMember.isLowAttendance,
    };

    // Handle drag from unassigned
    if (draggedMember.subGroupId === UNASSIGNED_ID) {
      // Remove from unassigned
      setUnassignedMembers((prev) =>
        prev.filter((m) => m.userId !== draggedMember.userId)
      );

      // Add to target sub-group
      if (targetSubGroupId !== UNASSIGNED_ID) {
        setSubGroupsState((prev) =>
          prev.map((sg) => {
            if (sg.id === targetSubGroupId) {
              return { ...sg, members: [...sg.members, memberToAdd] };
            }
            return sg;
          })
        );
      }
    } else {
      // Handle drag from sub-group
      // Remove from source sub-group
      setSubGroupsState((prev) =>
        prev.map((sg) => {
          if (sg.id === draggedMember.subGroupId) {
            return {
              ...sg,
              members: sg.members.filter(
                (m) => m.userId !== draggedMember.userId
              ),
              leaderId:
                sg.leaderId === draggedMember.userId ? undefined : sg.leaderId,
            };
          }
          return sg;
        })
      );

      // Add to target
      if (targetSubGroupId === UNASSIGNED_ID) {
        // Move to unassigned
        setUnassignedMembers((prev) => [...prev, memberToAdd]);
      } else {
        // Move to another sub-group
        setSubGroupsState((prev) =>
          prev.map((sg) => {
            if (sg.id === targetSubGroupId) {
              return { ...sg, members: [...sg.members, memberToAdd] };
            }
            return sg;
          })
        );
      }
    }

    setDraggedMember(null);
  };

  const handleDragEnd = () => {
    setDraggedMember(null);
    setDragOverSubGroup(null);
  };

  // Set leader
  const handleSetLeader = (subGroupId: string, userId: string) => {
    if (subGroupId === UNASSIGNED_ID) return; // Can't set leader for unassigned

    setSubGroupsState((prev) =>
      prev.map((sg) => {
        if (sg.id === subGroupId) {
          return { ...sg, leaderId: userId };
        }
        return sg;
      })
    );
  };

  // Save changes
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare updates for each sub-group (only actual sub-groups, not unassigned)
      const updates = subGroupsState.map((sg) => ({
        subGroupId: sg.id,
        memberIds: sg.members.map((m) => m.userId),
        members: sg.members,
        leaderId: sg.leaderId,
      }));

      await updateSubGroupMembers(updates);

      toast.success("Perubahan berhasil disimpan");
      setOriginalState(JSON.parse(JSON.stringify(subGroupsState)));
      setOriginalUnassigned(JSON.parse(JSON.stringify(unassignedMembers)));
      setHasChanges(false);
    } catch (error) {
      console.error("Error saving changes:", error);
      toast.error("Gagal menyimpan perubahan");
    } finally {
      setIsSaving(false);
    }
  };

  // Get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  // Render member card
  const renderMemberCard = (
    member: GroupMember,
    subGroupId: string,
    isLeader: boolean = false
  ) => {
    const isDragging = draggedMember?.userId === member.userId;
    const isUnassigned = subGroupId === UNASSIGNED_ID;

    return (
      <div
        key={member.userId}
        draggable
        onDragStart={(e) => handleDragStart(e, member, subGroupId)}
        onDragEnd={handleDragEnd}
        onClick={() =>
          !isUnassigned && handleSetLeader(subGroupId, member.userId)
        }
        className={`flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all ${
          isDragging ? "opacity-50 scale-95" : "hover:bg-muted/50"
        } ${
          isLeader
            ? "bg-amber-50 border border-amber-200 dark:bg-amber-900/20 dark:border-amber-700"
            : isUnassigned
            ? "bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700"
            : "bg-background border border-transparent hover:border-border"
        }`}
        title={
          isUnassigned
            ? "Drag ke kelompok untuk menetapkan"
            : isLeader
            ? "Ketua kelompok"
            : "Klik untuk menjadikan ketua"
        }
      >
        {/* Drag Handle */}
        <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />

        {/* Avatar */}
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarFallback
            className={`text-xs ${
              isLeader
                ? "bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200"
                : isUnassigned
                ? "bg-slate-300 text-slate-700 dark:bg-slate-600 dark:text-slate-200"
                : "bg-slate-200 dark:bg-slate-700"
            }`}
          >
            {getInitials(member.fullName)}
          </AvatarFallback>
        </Avatar>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <p
              className={`text-sm font-medium truncate ${
                isLeader ? "text-amber-800 dark:text-amber-200" : ""
              }`}
            >
              {member.fullName}
            </p>
            {isLeader && <Crown className="h-3 w-3 text-amber-500 shrink-0" />}
          </div>
          <p className="text-xs text-muted-foreground truncate">{member.nim}</p>
        </div>

        {/* Attendance Badge */}
        <Badge
          variant="secondary"
          className={`text-xs shrink-0 ${
            member.isLowAttendance
              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
              : member.attendancePercentage >= 65
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
          } border-0`}
        >
          {member.attendancePercentage}%
        </Badge>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full space-y-6 pt-6 pb-10">
        <div className="flex items-center justify-between px-1">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Separator />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-[400px]" />
          ))}
        </div>
      </div>
    );
  }

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
              onClick={() => router.push(`/group-management/${groupId}`)}
              className="h-8 w-8"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              {parentGroup?.name}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight">Edit Anggota</h1>
          <p className="text-sm text-muted-foreground">
            Drag & drop anggota untuk memindahkan ke sub-kelompok lain. Klik
            untuk menjadikan ketua.
          </p>
        </div>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="shadow-sm"
        >
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {hasChanges ? "Simpan Perubahan" : "Tidak Ada Perubahan"}
        </Button>
      </div>

      <Separator />

      {/* Grid Container */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-auto pb-4">
        {/* Unassigned Column - Always First */}
        <div
          className={`rounded-xl border-2 border-dashed shadow-sm transition-all ${
            dragOverSubGroup === UNASSIGNED_ID
              ? "border-orange-400 bg-orange-50/50 dark:bg-orange-950/30"
              : "border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-900/30"
          }`}
          onDragOver={(e) => handleDragOver(e, UNASSIGNED_ID)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, UNASSIGNED_ID)}
        >
          {/* Header */}
          <div className="p-4 border-b border-dashed border-slate-300 dark:border-slate-600 bg-slate-100/50 dark:bg-slate-800/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserX className="h-4 w-4 text-slate-500" />
                <h3 className="font-semibold text-slate-700 dark:text-slate-300">
                  Tanpa Kelompok
                </h3>
              </div>
              <Badge
                variant="secondary"
                className="text-xs bg-slate-200 dark:bg-slate-700"
              >
                {unassignedMembers.length} caang
              </Badge>
            </div>
          </div>

          {/* Unassigned Members List */}
          <div className="p-2 min-h-[300px] max-h-[500px] overflow-y-auto">
            {unassignedMembers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Semua caang sudah memiliki kelompok
              </p>
            ) : (
              <div className="space-y-1">
                {unassignedMembers.map((member) =>
                  renderMemberCard(member, UNASSIGNED_ID, false)
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sub-Groups */}
        {subGroupsState.map((subGroup) => (
          <div
            key={subGroup.id}
            className={`rounded-xl border bg-card shadow-sm transition-all ${
              dragOverSubGroup === subGroup.id
                ? "border-primary border-2 bg-primary/5"
                : "border-border"
            }`}
            onDragOver={(e) => handleDragOver(e, subGroup.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, subGroup.id)}
          >
            {/* Sub-Group Header */}
            <div className="p-4 border-b bg-muted/30">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">{subGroup.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {subGroup.members.length} anggota
                </Badge>
              </div>
            </div>

            {/* Members List */}
            <div className="p-2 min-h-[300px] max-h-[500px] overflow-y-auto">
              {subGroup.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Drop anggota di sini
                </p>
              ) : (
                <div className="space-y-1">
                  {subGroup.members.map((member) =>
                    renderMemberCard(
                      member,
                      subGroup.id,
                      member.userId === subGroup.leaderId
                    )
                  )}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
