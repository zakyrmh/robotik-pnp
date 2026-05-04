'use client'

/**
 * TeamsListTable — Tabel tim dengan infinite scroll, edit, dan delete
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Edit2, Trash2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import {
  deleteTeam,
  editTeam,
  getTeams,
  type TeamData,
} from '@/app/actions/tournament.action'

interface TeamsListTableProps {
  refreshTrigger?: number
}

const ITEMS_PER_PAGE = 20

export function TeamsListTable({ refreshTrigger }: TeamsListTableProps) {
  const [teams, setTeams] = useState<TeamData[]>([])
  const [, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [offset, setOffset] = useState(0)

  const [editingTeam, setEditingTeam] = useState<TeamData | null>(null)
  const [editName, setEditName] = useState('')
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isEditPending, setIsEditPending] = useState(false)

  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null)
  const [isDeletePending, setIsDeletePending] = useState(false)

  const observerTarget = useRef<HTMLDivElement>(null)

  // Load teams
  const loadTeams = useCallback(
    async (currentOffset: number) => {
      setIsLoading(true)
      const result = await getTeams({
        limit: ITEMS_PER_PAGE,
        offset: currentOffset,
      })

      if (result.error) {
        toast.error(result.error)
        setIsLoading(false)
        return
      }

      const newTeams = result.data?.teams ?? []
      const newTotal = result.data?.total ?? 0

      if (currentOffset === 0) {
        setTeams(newTeams)
      } else {
        setTeams((prev) => [...prev, ...newTeams])
      }

      setTotal(newTotal)
      setHasMore(currentOffset + ITEMS_PER_PAGE < newTotal)
      setIsLoading(false)
    },
    [],
  )

  // Initial load
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadTeams(0)
    setOffset(0)
  }, [loadTeams, refreshTrigger])

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !isLoading) {
          const newOffset = offset + ITEMS_PER_PAGE
          setOffset(newOffset)
          loadTeams(newOffset)
        }
      },
      { threshold: 0.1 },
    )

    observer.observe(observerTarget.current)
    return () => observer.disconnect()
  }, [offset, hasMore, isLoading, loadTeams])

  // Handle edit
  const handleEditClick = (team: TeamData) => {
    setEditingTeam(team)
    setEditName(team.name)
    setIsEditDialogOpen(true)
  }

  const handleEditSave = async () => {
    if (!editingTeam || !editName.trim()) {
      toast.error('Nama tim tidak boleh kosong')
      return
    }

    setIsEditPending(true)
    const result = await editTeam({
      teamId: editingTeam.id,
      name: editName.trim(),
    })

    if (result.error) {
      toast.error(result.error)
      setIsEditPending(false)
      return
    }

    toast.success('Tim berhasil diubah')
    setTeams((prev) =>
      prev.map((t) =>
        t.id === editingTeam.id ? { ...t, name: editName.trim() } : t,
      ),
    )
    setIsEditDialogOpen(false)
    setEditingTeam(null)
    setIsEditPending(false)
  }

  // Handle delete
  const handleDeleteConfirm = async () => {
    if (!deletingTeamId) return

    setIsDeletePending(true)
    const result = await deleteTeam({ teamId: deletingTeamId })

    if (result.error) {
      toast.error(result.error)
      setIsDeletePending(false)
      return
    }

    toast.success('Tim berhasil dihapus')
    setTeams((prev) => prev.filter((t) => t.id !== deletingTeamId))
    setTotal((prev) => prev - 1)
    setDeletingTeamId(null)
    setIsDeletePending(false)
  }

  return (
    <div className="space-y-4">
      {/* Teams list */}
      <div className="space-y-2 rounded-lg border">
        {teams.length === 0 && !isLoading ? (
          <div className="p-8 text-center text-muted-foreground">
            <p>Belum ada tim yang ditambahkan</p>
          </div>
        ) : (
          <>
            {teams.map((team, idx) => (
              <div key={team.id}>
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex-1 space-y-1">
                    <p className="font-medium">{team.name}</p>
                    {team.group_id && (
                      <p className="text-sm text-muted-foreground">
                        Sudah di-assign ke grup
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditClick(team)}
                      disabled={isDeletePending}
                    >
                      <Edit2 className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTeamId(team.id)}
                      disabled={isDeletePending}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
                {idx < teams.length - 1 && <Separator />}
              </div>
            ))}
          </>
        )}
      </div>

      {/* Loading skeleton for infinite scroll */}
      {isLoading && offset > 0 && (
        <div className="space-y-2 rounded-lg border p-4">
          <Skeleton className="h-6 w-full" />
          <Skeleton className="h-6 w-3/4" />
        </div>
      )}

      {/* Observer target for infinite scroll */}
      <div ref={observerTarget} className="py-4 text-center">
        {hasMore && !isLoading && offset > 0 && (
          <p className="text-sm text-muted-foreground">Scroll untuk load lebih banyak...</p>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tim</DialogTitle>
            <DialogDescription>
              Ubah nama tim yang sudah terdaftar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-team-name">Nama Tim</Label>
              <Input
                id="edit-team-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                disabled={isEditPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={isEditPending}
            >
              Batalkan
            </Button>
            <Button onClick={handleEditSave} disabled={isEditPending}>
              {isEditPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Alert Dialog */}
      <AlertDialog open={!!deletingTeamId} onOpenChange={() => setDeletingTeamId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Tim?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda yakin ingin menghapus tim ini? Tindakan ini tidak dapat dibatalkan.
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
