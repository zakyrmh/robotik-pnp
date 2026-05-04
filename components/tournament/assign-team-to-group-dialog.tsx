'use client'

/**
 * AssignTeamToGroupDialog — Modal untuk assign tim ke group
 */

import { useEffect, useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import {
  assignTeamToGroup,
  getTeams,
  type TeamData,
  type GroupData,
} from '@/app/actions/tournament.action'

interface AssignTeamToGroupDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  groups: GroupData[]
  onAssignSuccess?: () => void
}

export function AssignTeamToGroupDialog({
  open,
  onOpenChange,
  groups,
  onAssignSuccess,
}: AssignTeamToGroupDialogProps) {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('')
  const [unassignedTeams, setUnassignedTeams] = useState<TeamData[]>([])
  const [selectedTeamId, setSelectedTeamId] = useState<string>('')
  const [isLoadingTeams, setIsLoadingTeams] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    let isCurrent = true

    const loadUnassignedTeams = async () => {
      setSelectedGroupId('')
      setSelectedTeamId('')

      if (!open) {
        setUnassignedTeams([])
        return
      }

      setIsLoadingTeams(true)
      const result = await getTeams({ limit: 500, offset: 0 })

      if (!isCurrent) return

      if (result.error) {
        toast.error(result.error)
        setUnassignedTeams([])
        setIsLoadingTeams(false)
        return
      }

      setUnassignedTeams(
        (result.data?.teams ?? []).filter((team) => !team.group_id),
      )
      setIsLoadingTeams(false)
    }

    loadUnassignedTeams()

    return () => {
      isCurrent = false
    }
  }, [open])

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen)
  }

  const handleAssign = () => {
    if (!selectedGroupId || !selectedTeamId) {
      toast.error('Pilih grup dan tim terlebih dahulu')
      return
    }

    startTransition(async () => {
      const result = await assignTeamToGroup({
        teamId: selectedTeamId,
        groupId: selectedGroupId,
      })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Tim berhasil ditambahkan ke grup')
      setSelectedGroupId('')
      setSelectedTeamId('')
      onAssignSuccess?.()
      onOpenChange(false)
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambahkan Tim ke Grup</DialogTitle>
          <DialogDescription>
            Pilih tim dan grup untuk memasukkan tim ke dalam grup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select Group */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Grup</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih grup..." />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Select Team */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Pilih Tim</label>
            <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
              <SelectTrigger>
                <SelectValue placeholder="Pilih tim..." />
              </SelectTrigger>
              <SelectContent>
                {isLoadingTeams ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Memuat daftar tim...
                  </div>
                ) : unassignedTeams.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    Semua tim sudah di-assign ke grup
                  </div>
                ) : (
                  unassignedTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Batalkan
          </Button>
          <Button
            onClick={handleAssign}
            disabled={
              isPending || isLoadingTeams || !selectedGroupId || !selectedTeamId
            }
          >
            {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
            Tambahkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
