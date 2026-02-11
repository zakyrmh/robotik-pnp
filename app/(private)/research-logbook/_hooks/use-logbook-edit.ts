import { useState, useEffect, useCallback } from "react";
import { doc, onSnapshot, DocumentReference } from "firebase/firestore";
import { db } from "@/lib/firebase/config";
import { ResearchLogbook, LogbookStatus } from "@/schemas/research-logbook";
import { UpdateLogbookData } from "@/lib/firebase/services/logbook-service";

interface UseLogbookEditProps {
  logbookId: string;
  initialData?: ResearchLogbook | null;
}

interface UseLogbookEditReturn {
  serverData: ResearchLogbook | null;
  hasConflict: boolean;
  isSubmitting: boolean;
  setIsSubmitting: (value: boolean) => void;
  resolveConflict: () => void;
  getUpdatePayload: (
    currentValues: UpdateLogbookData,
    dirtyFields: Record<string, boolean | undefined>,
  ) => UpdateLogbookData;
  isLoading: boolean;
}

export function useLogbookEdit({
  logbookId,
  initialData,
}: UseLogbookEditProps): UseLogbookEditReturn {
  const [serverData, setServerData] = useState<ResearchLogbook | null>(
    initialData || null,
  );
  const [hasConflict, setHasConflict] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedAt, setLoadedAt] = useState<Date>(new Date());
  const [isLoading, setIsLoading] = useState(false);

  // Initialize loadedAt on mount or when initialData changes
  useEffect(() => {
    if (initialData) {
      // Use the updatedAt from initial data as the baseline
      // If initialData.updatedAt is a Date object, use it directly.
      // If it's a Timestamp (from generic firebase fetch not using our converter), convert it.
      // Our services return Date objects usually.
      setLoadedAt(
        initialData.updatedAt instanceof Date
          ? initialData.updatedAt
          : new Date(),
      );
    } else {
      setLoadedAt(new Date());
    }
  }, [initialData]);

  // Realtime listener for conflict detection
  useEffect(() => {
    if (!logbookId) return;

    // Helper to convert doc data to ResearchLogbook (simplified version of service converter)
    // We need this because onSnapshot returns raw data
    const unsubscribe = onSnapshot(
      doc(db, "research_logbooks", logbookId),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          const updatedAt = data.updatedAt?.toDate() || new Date();

          // Construct server data object safely
          // We cast strictly necessary fields or use a proper converter if imported
          // importing docToLogbook from service might be tricky due to exports
          // For now, we mainly care about updatedAt for conflict detection
          // But to support "Refresh", we need full object.
          // Ideally we should export docToLogbook from service.
          // For this hook, let's assume we can reconstruct or just pass raw data
          // and let the component handle re-initialization if needed.

          // Let's do a basic conversion relative to what we need for the form
          const newData = {
            id: docSnap.id,
            ...data,
            activityDate: data.activityDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: updatedAt,
            deletedAt: data.deletedAt?.toDate(),
            // Ensure arrays are initialized
            collaboratorIds: data.collaboratorIds || [],
            attachments: data.attachments || [],
            comments: data.comments || [],
          } as ResearchLogbook;

          setServerData(newData);

          // Check for conflicts
          // If server's updatedAt is newer than our loadedAt + small buffer
          // (buffer to avoid self-trigger on our own updates if we don't update loadedAt fast enough)
          // But usually we update loadedAt after successful submit.
          if (updatedAt.getTime() > loadedAt.getTime() + 1000) {
            // Only trigger conflict if we are not currently submitting
            if (!isSubmitting) {
              setHasConflict(true);
            }
          }
        }
      },
      (error) => {
        console.error("Error listening to logbook updates:", error);
      },
    );

    return () => unsubscribe();
  }, [logbookId, loadedAt, isSubmitting]);

  const resolveConflict = useCallback(() => {
    if (serverData) {
      setLoadedAt(new Date()); // Update baseline to now (or server's updatedAt)
      setHasConflict(false);
    }
  }, [serverData]);

  const getUpdatePayload = useCallback(
    (
      currentValues: UpdateLogbookData,
      dirtyFields: Record<string, boolean | undefined>,
    ): UpdateLogbookData => {
      const payload: UpdateLogbookData = {};

      // Only include dirty fields
      (Object.keys(dirtyFields) as (keyof UpdateLogbookData)[]).forEach(
        (key) => {
          if (dirtyFields[key] && currentValues[key] !== undefined) {
            // @ts-ignore - difficult to type dynamic assignment perfectly with strict union types
            payload[key] = currentValues[key];
          }
        },
      );

      // Always include status if it's passed (often managed separately from dirty form state)
      if (currentValues.status) {
        payload.status = currentValues.status;
      }

      // Collaborative arrays/complex objects might always need syncing if changed
      // But dirtyFields usually handles nested logical checks if using hook form properly.
      // For collaboratorIds array, hook form marks 'collaboratorIds' as dirty if any item changes.
      if (dirtyFields.collaboratorIds && currentValues.collaboratorIds) {
        payload.collaboratorIds = currentValues.collaboratorIds;
      }

      return payload;
    },
    [],
  );

  return {
    serverData,
    hasConflict,
    isSubmitting,
    setIsSubmitting,
    resolveConflict,
    getUpdatePayload,
    isLoading,
  };
}
