"use client";

import { useState } from "react";
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
import { Badge } from "@/components/ui/badge";

import { updateSubGroupLeader } from "@/lib/firebase/services/group-service";
import { SubGroup } from "@/schemas/groups";

interface SetSubGroupLeaderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subGroup: SubGroup | null;
  onSuccess: () => void;
}

export function SetSubGroupLeaderModal({
  open,
  onOpenChange,
  subGroup,
  onSuccess,
}: SetSubGroupLeaderModalProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string>("");

  // Reset selected when subGroup changes or modal opens
  // Using a simpler approach than useEffect for derived state if possible,
  // but useEffect is safer for syncing with props changes in Dialogs.
  // We'll update state when the dialog opens essentially.

  if (open && subGroup && !selectedMemberId && subGroup.leaderId) {
    setSelectedMemberId(subGroup.leaderId);
  }

  const handleSave = async () => {
    if (!subGroup || !selectedMemberId) {
      toast.error("Pilih anggota terlebih dahulu");
      return;
    }

    setIsSaving(true);
    try {
      const selectedMember = subGroup.members.find(
        (m) => m.userId === selectedMemberId
      );
      await updateSubGroupLeader(subGroup.id, selectedMemberId);
      toast.success(
        `${selectedMember?.fullName || "Anggota"} ditetapkan sebagai ketua ${
          subGroup.name
        }`
      );
      onSuccess();
      onOpenChange(false);
      setSelectedMemberId(""); // Reset
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

  if (!subGroup) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        onOpenChange(val);
        if (!val) setSelectedMemberId(""); // Reset on close
      }}
    >
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-amber-500" />
            Set Ketua Kelompok
          </DialogTitle>
          <DialogDescription>
            Pilih salah satu anggota untuk dijadikan ketua dari{" "}
            <span className="font-medium text-foreground">{subGroup.name}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          {subGroup.members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">
                Belum ada anggota dalam sub-kelompok ini.
                <br />
                Tambahkan anggota terlebih dahulu melalui Edit Anggota.
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
                  {subGroup.members.map((member) => (
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
                            {member.nim} • {member.attendancePercentage}%
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
                    const selected = subGroup.members.find(
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
                        <div className="flex-1">
                          <p className="font-medium text-amber-800 dark:text-amber-200">
                            {selected.fullName}
                          </p>
                          <p className="text-sm text-amber-700 dark:text-amber-300">
                            {selected.nim}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="secondary"
                            className={`text-xs border-0 ${
                              selected.isLowAttendance
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {selected.attendancePercentage}%
                          </Badge>
                          <Crown className="h-5 w-5 text-amber-500" />
                        </div>
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
            disabled={
              isSaving || !selectedMemberId || subGroup.members.length === 0
            }
          >
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
