"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import {
    ArrowLeft,
    Save,
    Loader2,
    AlertCircle,
    GripVertical,
    Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { getGroupParentById, getSubGroupsByParent, updateSubGroupsMembersBatch } from "@/lib/firebase/groups";
import { SubGroup } from "@/types/groups";

export default function EditGroupMembersPage() {
    const router = useRouter();
    const params = useParams();
    const groupParentId = params.id as string;

    const [subGroups, setSubGroups] = useState<SubGroup[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

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

    const onDragEnd = (result: DropResult) => {
        const { source, destination } = result;

        if (!destination) {
            return;
        }

        // If dropped in the same place
        if (
            source.droppableId === destination.droppableId &&
            source.index === destination.index
        ) {
            return;
        }

        const sourceSubGroupIndex = subGroups.findIndex(sg => sg.id === source.droppableId);
        const destSubGroupIndex = subGroups.findIndex(sg => sg.id === destination.droppableId);

        if (sourceSubGroupIndex === -1 || destSubGroupIndex === -1) return;

        const newSubGroups = [...subGroups];
        const sourceSubGroup = { ...newSubGroups[sourceSubGroupIndex] };
        const destSubGroup = { ...newSubGroups[destSubGroupIndex] };

        // Moving within the same list
        if (source.droppableId === destination.droppableId) {
            const newMembers = Array.from(sourceSubGroup.members);
            const [removed] = newMembers.splice(source.index, 1);
            newMembers.splice(destination.index, 0, removed);

            sourceSubGroup.members = newMembers;
            newSubGroups[sourceSubGroupIndex] = sourceSubGroup;
        } else {
            // Moving between lists
            const sourceMembers = Array.from(sourceSubGroup.members);
            const destMembers = Array.from(destSubGroup.members);

            const [removed] = sourceMembers.splice(source.index, 1);

            // Check if the moved member was the leader of the source group
            if (sourceSubGroup.leaderId === removed.userId) {
                // We set it to undefined/null. Since the type is string | undefined,
                // we'll rely on the save function to handle undefined/null as delete.
                delete sourceSubGroup.leaderId;
            }

            destMembers.splice(destination.index, 0, removed);

            sourceSubGroup.members = sourceMembers;
            destSubGroup.members = destMembers;

            newSubGroups[sourceSubGroupIndex] = sourceSubGroup;
            newSubGroups[destSubGroupIndex] = destSubGroup;
        }

        setSubGroups(newSubGroups);
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!hasChanges) return;

        setSaving(true);
        try {
            const updates = subGroups.map(sg => ({
                subGroupId: sg.id,
                members: sg.members,
                // If leaderId is missing (undefined) but was present before, we should signify deletion.
                // However, here we just pass what we have.
                // To be safe, if we know we removed it, we should ideally pass null.
                // But since we can't easily track "was present", let's assume we pass what is in the object.
                // The backend function updateSubGroupsMembersBatch needs to handle how to interpret 'undefined'.
                // Currently it says: `if (update.leaderId !== undefined)`.
                // If I delete the property, it is undefined. So it won't update leaderId field?
                // Wait, if I delete property, `update.leaderId` is undefined. The backend checks `!== undefined`.
                // So it won't touch leaderId. That means the old leaderId REMAINS in Firestore. This is WRONG.

                // I need to explicitly pass null if it's missing but should be cleared.
                // Or I should pass the current state of leaderId.
                // If leaderId is NOT in the object, how do I know if I should clear it?
                // I should probably ensure that for every group update, we send the leaderId state.

                leaderId: sg.leaderId || null
            }));

            await updateSubGroupsMembersBatch(updates);

            toast.success("Perubahan berhasil disimpan");
            setHasChanges(false);
            // Optional: reload data to ensure sync, but local state should be fine
        } catch (error) {
            console.error("Error saving changes:", error);
            toast.error("Gagal menyimpan perubahan");
        } finally {
            setSaving(false);
        }
    };

    if (!mounted) return null; // Avoid hydration mismatch

    return (
        <div className="min-h-screen p-6">
            {/* Header */}
            <div className="max-w-[1600px] mx-auto mb-6 flex items-center justify-between sticky top-0 z-10 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        onClick={() => router.push(`/group-management/${groupParentId}`)}
                        size="sm"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                            Edit Anggota Kelompok
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Drag and drop anggota untuk memindahkan antar sub-kelompok
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {hasChanges && (
                        <span className="text-sm text-amber-600 font-medium animate-pulse">
                            Ada perubahan yang belum disimpan
                        </span>
                    )}
                    <Button
                        onClick={handleSave}
                        disabled={!hasChanges || saving}
                        className="min-w-[120px]"
                    >
                        {saving ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Menyimpan...
                            </>
                        ) : (
                            <>
                                <Save className="w-4 h-4 mr-2" />
                                Simpan Perubahan
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                </div>
            ) : (
                <div className="max-w-[1600px] mx-auto overflow-x-auto pb-6">
                    <DragDropContext onDragEnd={onDragEnd}>
                        <div className="flex gap-6 min-w-max pb-4">
                            {subGroups.map((subGroup) => (
                                <div key={subGroup.id} className="w-[350px] flex-shrink-0 flex flex-col">
                                    <div className="mb-3 flex items-center justify-between bg-white dark:bg-gray-800 p-3 rounded-lg border shadow-sm">
                                        <div>
                                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                                                {subGroup.name}
                                            </h3>
                                            <p className="text-xs text-gray-500">
                                                {subGroup.members.length} Anggota
                                            </p>
                                        </div>
                                        {subGroup.members.some(m => m.isLowAttendance) && (
                                            <div className="text-red-500" title="Ada anggota dengan attendance rendah">
                                                <AlertCircle className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>

                                    <Droppable droppableId={subGroup.id}>
                                        {(provided, snapshot) => (
                                            <div
                                                ref={provided.innerRef}
                                                {...provided.droppableProps}
                                                className={`flex-1 min-h-[500px] rounded-xl p-2 transition-colors ${snapshot.isDraggingOver
                                                    ? "bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 border-dashed"
                                                    : "bg-gray-100/50 dark:bg-gray-800/50 border-2 border-transparent"
                                                    }`}
                                            >
                                                <div className="space-y-2">
                                                    {subGroup.members.map((member, index) => (
                                                        <Draggable
                                                            key={member.userId}
                                                            draggableId={member.userId}
                                                            index={index}
                                                        >
                                                            {(provided, snapshot) => (
                                                                <div
                                                                    ref={provided.innerRef}
                                                                    {...provided.draggableProps}
                                                                    {...provided.dragHandleProps}
                                                                    className={`p-3 rounded-lg border shadow-sm select-none transition-all ${snapshot.isDragging
                                                                        ? "bg-white dark:bg-gray-800 shadow-xl scale-105 rotate-2 z-50 ring-2 ring-blue-500"
                                                                        : "bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700"
                                                                        } ${member.isLowAttendance
                                                                            ? "border-l-4 border-l-red-500"
                                                                            : "border-l-4 border-l-green-500"
                                                                        }`}
                                                                >
                                                                    <div className="flex items-start gap-3">
                                                                        <GripVertical className="w-4 h-4 text-gray-400 mt-1 flex-shrink-0" />
                                                                        <div className="flex-1 min-w-0">
                                                                            <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                                                {member.fullName}
                                                                            </p>
                                                                            <p className="text-xs text-gray-500 truncate">
                                                                                {member.nim}
                                                                            </p>
                                                                            <div className="flex items-center gap-2 mt-1">
                                                                                <Badge
                                                                                    variant="secondary"
                                                                                    className={`text-[10px] px-1 h-5 ${member.isLowAttendance
                                                                                        ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                                                                        : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                                        }`}
                                                                                >
                                                                                    {member.attendancePercentage.toFixed(0)}% Att.
                                                                                </Badge>
                                                                                {subGroup.leaderId === member.userId && (
                                                                                    <Badge variant="outline" className="text-[10px] px-1 h-5 border-yellow-500 text-yellow-600">
                                                                                        Ketua
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    ))}
                                                    {provided.placeholder}
                                                </div>

                                                {subGroup.members.length === 0 && !snapshot.isDraggingOver && (
                                                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 min-h-[100px]">
                                                        <Users className="w-8 h-8 mb-2 opacity-50" />
                                                        <p className="text-sm text-center">Kosong</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Droppable>
                                </div>
                            ))}
                        </div>
                    </DragDropContext>
                </div>
            )}
        </div>
    );
}
