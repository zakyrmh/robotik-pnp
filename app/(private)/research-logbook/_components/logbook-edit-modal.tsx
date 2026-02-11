"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";

import { ResearchLogbook } from "@/schemas/research-logbook";
import { LogbookEditForm } from "./logbook-edit-form";

// =========================================================
// COMPONENT PROPS
// =========================================================

interface LogbookEditModalProps {
  logbook: ResearchLogbook | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  currentUserId?: string;
  currentUserName?: string;
}

// =========================================================
// MAIN COMPONENT
// =========================================================

export function LogbookEditModal({
  logbook,
  open,
  onOpenChange,
  onSuccess,
  currentUserId,
  currentUserName,
}: LogbookEditModalProps) {
  // If no logbook is selected, don't render content or render empty state
  // But usually modal shouldn't be open without logbook
  if (!logbook) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-4 border-b shrink-0 bg-background z-10">
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Edit Logbook Riset
          </DialogTitle>
          <DialogDescription>
            Perbarui informasi logbook riset Anda. Pastikan semua informasi
            sudah benar sebelum menyimpan.
          </DialogDescription>
        </DialogHeader>

        {/* Form Container */}
        <div className="flex-1 overflow-hidden">
          <LogbookEditForm
            logbook={logbook}
            onSuccess={() => {
              onOpenChange(false);
              onSuccess?.();
            }}
            onCancel={() => onOpenChange(false)}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
