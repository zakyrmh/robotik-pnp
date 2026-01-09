"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  ReactNode,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AlertTriangle } from "lucide-react";

// =========================================================
// TYPES
// =========================================================

interface UnsavedChangesContextType {
  hasUnsavedChanges: boolean;
  setHasUnsavedChanges: (value: boolean) => void;
  confirmNavigation: (callback: () => void) => void;
  blockNavigation: boolean;
}

// =========================================================
// CONTEXT
// =========================================================

const UnsavedChangesContext = createContext<UnsavedChangesContextType | null>(
  null
);

// =========================================================
// PROVIDER
// =========================================================

interface UnsavedChangesProviderProps {
  children: ReactNode;
}

export function UnsavedChangesProvider({
  children,
}: UnsavedChangesProviderProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const pendingCallbackRef = useRef<(() => void) | null>(null);

  // Confirm navigation with unsaved changes check
  const confirmNavigation = useCallback(
    (callback: () => void) => {
      if (hasUnsavedChanges) {
        pendingCallbackRef.current = callback;
        setShowDialog(true);
      } else {
        callback();
      }
    },
    [hasUnsavedChanges]
  );

  // Handle confirm leave
  const handleConfirmLeave = () => {
    if (pendingCallbackRef.current) {
      pendingCallbackRef.current();
      pendingCallbackRef.current = null;
    }
    setHasUnsavedChanges(false);
    setShowDialog(false);
  };

  // Handle cancel leave
  const handleCancelLeave = () => {
    pendingCallbackRef.current = null;
    setShowDialog(false);
  };

  return (
    <UnsavedChangesContext.Provider
      value={{
        hasUnsavedChanges,
        setHasUnsavedChanges,
        confirmNavigation,
        blockNavigation: hasUnsavedChanges,
      }}
    >
      {children}

      {/* Global Unsaved Changes Dialog */}
      <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Perubahan Belum Disimpan
            </AlertDialogTitle>
            <AlertDialogDescription>
              Anda memiliki perubahan yang belum disimpan. Jika Anda
              meninggalkan halaman ini, perubahan akan hilang. Apakah Anda yakin
              ingin melanjutkan?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelLeave}>
              Kembali
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmLeave}
              className="bg-red-600 hover:bg-red-700"
            >
              Tinggalkan Tanpa Simpan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </UnsavedChangesContext.Provider>
  );
}

// =========================================================
// HOOK
// =========================================================

export function useUnsavedChanges() {
  const context = useContext(UnsavedChangesContext);
  if (!context) {
    throw new Error(
      "useUnsavedChanges must be used within UnsavedChangesProvider"
    );
  }
  return context;
}
