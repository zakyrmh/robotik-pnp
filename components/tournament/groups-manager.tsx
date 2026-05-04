'use client'

/**
 * GroupsManager — Manager untuk mengelola groups
 */

import { useEffect, useState, useTransition } from 'react'
import { Plus, Trash2, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
  addGroup,
  deleteGroup,
  getGroups,
  removeTeamFromGroup,
  type GroupData,
} from '@/app/actions/tournament.action'
import { AssignTeamToGroupDialog } from './assign-team-to-group-dialog'

interface GroupsManagerProps {
  refreshTrigger?: number
}

export function GroupsManager({ refreshTrigger }: GroupsManagerProps) {
  const [groups, setGroups] = useState<GroupData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isPending, startTransition] = useTransition()

  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
  const [isDeletePending, setIsDeletePending] = useState(false)

  const [removingTeamId, setRemovingTeamId] = useState<string | null>(null)
  const [isRemovePending, setIsRemovePending] = useState(false)

  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false)

  // Load groups
  const loadGroups = async () => {
    setIsLoading(true)
    const result = await getGroups({ limit: 50, offset: 0 })

    if (result.error) {
      toast.error(result.error)
      setIsLoading(false)
      return
    }

    setGroups(result.data?.groups ?? [])
    setIsLoading(false)
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGroups()
  }, [refreshTrigger])

  // Add group
  const handleAddGroup = () => {
    startTransition(async () => {
      const result = await addGroup({})

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Grup berhasil ditambahkan')
      setGroups((prev) => [...prev, result.data!])
    })
  }

  // Delete group
  const handleDeleteConfirm = async () => {
    if (!deletingGroupId) return

    setIsDeletePending(true)
    const result = await deleteGroup({ groupId: deletingGroupId })

    if (result.error) {
      toast.error(result.error)
      setIsDeletePending(false)
      return
    }

    toast.success('Grup berhasil dihapus')
    setGroups((prev) => prev.filter((g) => g.id !== deletingGroupId))
    setDeletingGroupId(null)
    setIsDeletePending(false)
  }

  // Remove team from group
  const handleRemoveTeam = async (teamId: string) => {
    setRemovingTeamId(teamId)
    setIsRemovePending(true)

    const result = await removeTeamFromGroup({ teamId })

    if (result.error) {
      toast.error(result.error)
      setIsRemovePending(false)
      return
    }

    toast.success('Tim berhasil dikeluarkan dari grup')
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        teams: g.teams.filter((t) => t.id !== teamId),
      })),
    )
    setRemovingTeamId(null)
    setIsRemovePending(false)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-2 rounded-lg border p-4">
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Add group button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAddGroup}
          disabled={isPending}
          size="sm"
        >
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          <Plus className="mr-2 size-4" />
          Tambah Grup
        </Button>
      </div>

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-muted-foreground">
          <p>Belum ada grup. Silakan tambahkan grup terlebih dahulu.</p>
        </div>
      ) : (
        <div className="space-y-2 rounded-lg border">
          {groups.map((group, groupIdx) => (
            <div key={group.id}>
              <div className="p-4">
                {/* Group header */}
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-semibold">{group.name}</h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDeletingGroupId(group.id)}
                    disabled={isDeletePending}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>

                {/* Teams in group */}
                {group.teams.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    Belum ada tim di grup ini
                  </p>
                ) : (
                  <div className="space-y-2">
                    {group.teams.map((team) => (
                      <div
                        key={team.id}
                        className="flex items-center justify-between rounded-md bg-muted px-3 py-2"
                      >
                        <span className="text-sm">{team.name}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveTeam(team.id)}
                          disabled={isRemovePending && removingTeamId === team.id}
                        >
                          {isRemovePending && removingTeamId === team.id && (
                            <Loader2 className="size-4 animate-spin" />
                          )}
                          {(!isRemovePending || removingTeamId !== team.id) && (
                            <X className="size-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {groupIdx < groups.length - 1 && <Separator />}
            </div>
          ))}
        </div>
      )}

      {/* Assign team dialog */}
      <AssignTeamToGroupDialog
        open={isAssignDialogOpen}
        onOpenChange={setIsAssignDialogOpen}
        groups={groups}
        onAssignSuccess={loadGroups}
      />

      {/* Assign button */}
      {groups.length > 0 && (
        <div className="flex justify-end">
          <Button
            onClick={() => setIsAssignDialogOpen(true)}
            variant="secondary"
            size="sm"
          >
            <Plus className="mr-2 size-4" />
            Tambahkan Tim ke Grup
          </Button>
        </div>
      )}

      {/* Delete group alert dialog */}
      <AlertDialog open={!!deletingGroupId} onOpenChange={() => setDeletingGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Grup?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus grup ini? Tim di dalam grup akan dikeluarkan. Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeletePending}>
              Batalkan
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeletePending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeletePending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
