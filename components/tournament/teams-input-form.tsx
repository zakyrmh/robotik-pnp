'use client'

/**
 * TeamsInputForm — Form untuk menambah tim baru
 */

import { useState, useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { addTeam } from '@/app/actions/tournament.action'

interface TeamsInputFormProps {
  onTeamAdded?: () => void
}

export function TeamsInputForm({ onTeamAdded }: TeamsInputFormProps) {
  const [name, setName] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (!name.trim()) {
      toast.error('Nama tim tidak boleh kosong')
      return
    }

    startTransition(async () => {
      const result = await addTeam({ name: name.trim() })

      if (result.error) {
        toast.error(result.error)
        return
      }

      toast.success('Tim berhasil ditambahkan')
      setName('')
      onTeamAdded?.()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="team-name">Nama Tim</Label>
        <Input
          id="team-name"
          placeholder="Masukkan nama tim..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          autoFocus
        />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
        Tambah Tim
      </Button>
    </form>
  )
}
