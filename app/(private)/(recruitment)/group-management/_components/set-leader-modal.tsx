"use client";

import { useState, useEffect } from "react";
import { Loader2, Crown, Users } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

import {
  getSubGroupsByParent,
  updateGroupParentLeader,
} from "@/lib/firebase/services/group-service";
import { GroupParent, GroupMember } from "@/schemas/groups";

interface SetLeaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  group: GroupParent | null;
  onSuccess: () => void;
}

export function SetLeaderModal({
  open,
  onOpenChange,
  group,
  onSuccess,
}: SetLeaderModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [allMembers, setAllMembers] = useState<
    (GroupMember & { subGroupName: string })[]
  >([]);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  // Fetch all members from sub-groups
  useEffect(() => {
    const fetchMembers = async () => {
      if (!group || !open) return;

      setIsLoading(true);
      try {
        const subGroups = await getSubGroupsByParent(group.id);

        // Collect all members from all sub-groups
        const members: (GroupMember & { subGroupName: string })[] = [];
        subGroups.forEach((sg) => {
          sg.members.forEach((m) => {
            members.push({ ...m, subGroupName: sg.name });
          });
        });

        // Sort by name
        members.sort((a, b) => a.fullName.localeCompare(b.fullName));

        setAllMembers(members);

        // Pre-select current leader if exists
        if (group.leaderId) {
          setSelectedMemberId(group.leaderId);
        } else {
          setSelectedMemberId("");
        }
      } catch (error) {
        console.error("Error fetching members:", error);
        toast.error("Gagal memuat daftar anggota");
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();
  }, [group, open]);

  const handleSave = async () => {
    if (!group || !selectedMemberId) {
      toast.error("Pilih anggota terlebih dahulu");
      return;
    }

    setIsSaving(true);
    try {
      const selectedMember = allMembers.find(
        (m) => m.userId === selectedMemberId
      );
      await updateGroupParentLeader(group.id, selectedMemberId);
      toast.success(
        `${
          selectedMember?.fullName || "Anggota"
        } ditetapkan sebagai ketua kelompok`
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error setting leader:", error);
      toast.error("Gagal menetapkan ketua kelompok");
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  if (!group) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Set Ketua Kelompok
          </DialogTitle>
          <DialogDescription>
            Pilih salah satu anggota untuk dijadikan ketua dari{" "}
            <span className="font-medium text-foreground">{group.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : allMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Belum ada anggota dalam kelompok ini.
                <br />
                Tambahkan anggota terlebih dahulu melalui sub-kelompok.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Pilih Ketua Kelompok</Label>
              <Select
                value={selectedMemberId}
                onValueChange={setSelectedMemberId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih anggota..." />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                  {allMembers.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs bg-slate-200 dark:bg-slate-700">
                            {getInitials(member.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                          <span className="text-sm">{member.fullName}</span>
                          <span className="text-xs text-muted-foreground">
                            {member.nim} • {member.subGroupName}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Preview selected member */}
              {selectedMemberId && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                  {(() => {
                    const selected = allMembers.find(
                      (m) => m.userId === selectedMemberId
                    );
                    if (!selected) return null;
                    return (
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10">
                          <AvatarFallback className="bg-amber-200 text-amber-800 dark:bg-amber-800 dark:text-amber-200">
                            {getInitials(selected.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            {selected.fullName}
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {selected.nim} • {selected.subGroupName}
                          </p>
                        </div>
                        <Crown className="h-5 w-5 text-amber-500 ml-auto" />
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || !selectedMemberId || allMembers.length === 0}
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
