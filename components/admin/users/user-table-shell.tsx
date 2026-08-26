"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  UserManagementItem,
  UserManagementQueryResult,
} from "@/lib/types/user-management";
import { UserTableToolbar } from "./user-table-toolbar";
import { UserTable } from "./user-table";
import { UserTablePagination } from "./user-table-pagination";
import { UserEditModal } from "./modals/user-edit-modal";
import { UserDetailModal } from "./modals/user-detail-modal";
import { UserDeleteDialog } from "./modals/user-delete-dialog";
import { UserRestoreDialog } from "./modals/user-restore-dialog";
import { resetUserOnboardingAction } from "@/lib/actions/admin-users";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  UserGroupIcon,
  SecurityCheckIcon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";

interface UserTableShellProps {
  initialData: UserManagementQueryResult;
  studyPrograms: Array<{ id: string; name: string; degree: string }>;
  currentUserId: string;
}

export function UserTableShell({
  initialData,
  studyPrograms,
  currentUserId,
}: UserTableShellProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // State Modals
  const [selectedUserForEdit, setSelectedUserForEdit] =
    useState<UserManagementItem | null>(null);
  const [selectedUserForDetail, setSelectedUserForDetail] =
    useState<UserManagementItem | null>(null);
  const [selectedUserForDelete, setSelectedUserForDelete] =
    useState<UserManagementItem | null>(null);
  const [selectedUserForRestore, setSelectedUserForRestore] =
    useState<UserManagementItem | null>(null);

  const search = searchParams.get("search") || "";
  const role = searchParams.get("role") || "";
  const status = searchParams.get("status") || "all";

  // URL State Updater Helper
  const updateUrl = (params: Record<string, string | number | null>) => {
    const current = new URLSearchParams(Array.from(searchParams.entries()));

    Object.entries(params).forEach(([key, val]) => {
      if (
        val === null ||
        val === "" ||
        (key === "status" && val === "all") ||
        (key === "page" && val === 1)
      ) {
        current.delete(key);
      } else {
        current.set(key, String(val));
      }
    });

    const searchStr = current.toString();
    const query = searchStr ? `?${searchStr}` : "";

    startTransition(() => {
      router.push(`/manajemen-akun${query}`);
    });
  };

  const handleSearchChange = (val: string) => {
    updateUrl({ search: val, page: 1 });
  };

  const handleRoleChange = (val: string) => {
    updateUrl({ role: val, page: 1 });
  };

  const handleStatusChange = (val: string) => {
    updateUrl({ status: val, page: 1 });
  };

  const handleResetFilters = () => {
    startTransition(() => {
      router.push("/manajemen-akun");
    });
  };

  const handlePageChange = (newPage: number) => {
    updateUrl({ page: newPage });
  };

  const handlePerPageChange = (newPerPage: number) => {
    updateUrl({ perPage: newPerPage, page: 1 });
  };

  const handleResetOnboarding = (user: UserManagementItem) => {
    if (
      !confirm(
        `Apakah Anda yakin ingin mereset status onboarding pengguna ${user.fullName || user.email}?`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      try {
        const res = await resetUserOnboardingAction(user.id);
        if (res.success) {
          toast.success(res.message);
          router.refresh();
        } else {
          toast.error("Gagal mereset status onboarding.");
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        toast.error(msg);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header - Minimalist Soft Style */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-primary-soft text-primary border border-primary/20 w-fit">
              <HugeiconsIcon icon={SecurityCheckIcon} size={14} />
              <span>Hak Akses Super Admin</span>
            </div>
            <h1 className="font-display text-xl sm:text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2.5">
              <HugeiconsIcon
                icon={UserGroupIcon}
                size={24}
                className="text-primary"
              />
              <span>Manajemen Akun &amp; Role</span>
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
              Pusat kendali autentikasi, peran sistem (RBAC), hak akses, dan
              pengarsipan akun pengguna sesuai standar kepatuhan UU PDP &amp;
              keamanan organisasi.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-muted/60 dark:bg-muted/30 px-3.5 py-2 rounded-xl border border-border self-start md:self-auto text-xs text-muted-foreground">
            <HugeiconsIcon
              icon={SparklesIcon}
              size={16}
              className="text-accent-strong shrink-0"
            />
            <span>
              Total:{" "}
              <strong className="text-foreground font-semibold">
                {initialData.totalCount}
              </strong>{" "}
              Pengguna
            </span>
          </div>
        </div>
      </div>

      {/* Main Table Shell Container */}
      <div className="rounded-2xl border border-border shadow-xs overflow-hidden bg-card text-card-foreground">
        <UserTableToolbar
          search={search}
          role={role}
          status={status}
          onSearchChange={handleSearchChange}
          onRoleChange={handleRoleChange}
          onStatusChange={handleStatusChange}
          onReset={handleResetFilters}
          totalCount={initialData.totalCount}
        />

        <UserTable
          users={initialData.data}
          currentUserId={currentUserId}
          onEdit={(u) => setSelectedUserForEdit(u)}
          onDetail={(u) => setSelectedUserForDetail(u)}
          onDelete={(u) => setSelectedUserForDelete(u)}
          onRestore={(u) => setSelectedUserForRestore(u)}
          onResetOnboarding={handleResetOnboarding}
        />

        <UserTablePagination
          page={initialData.page}
          perPage={initialData.perPage}
          totalCount={initialData.totalCount}
          totalPages={initialData.totalPages}
          onPageChange={handlePageChange}
          onPerPageChange={handlePerPageChange}
        />
      </div>

      {/* Modals & Dialogs */}
      <UserEditModal
        isOpen={Boolean(selectedUserForEdit)}
        onClose={() => setSelectedUserForEdit(null)}
        user={selectedUserForEdit}
        studyPrograms={studyPrograms}
        currentUserId={currentUserId}
      />

      <UserDetailModal
        isOpen={Boolean(selectedUserForDetail)}
        onClose={() => setSelectedUserForDetail(null)}
        user={selectedUserForDetail}
      />

      <UserDeleteDialog
        isOpen={Boolean(selectedUserForDelete)}
        onClose={() => setSelectedUserForDelete(null)}
        user={selectedUserForDelete}
        currentUserId={currentUserId}
      />

      <UserRestoreDialog
        isOpen={Boolean(selectedUserForRestore)}
        onClose={() => setSelectedUserForRestore(null)}
        user={selectedUserForRestore}
      />
    </div>
  );
}
