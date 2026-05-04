'use client'

/**
 * SetupTournamentTabs — Main component untuk setup tournament dengan 2 tab
 */

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { TeamsInputForm } from './teams-input-form'
import { TeamsListTable } from './teams-list-table'
import { GroupsManager } from './groups-manager'

export function SetupTournamentTabs() {
  const [teamRefreshTrigger, setTeamRefreshTrigger] = useState(0)
  const [groupRefreshTrigger] = useState(0)

  const handleTeamAdded = () => {
    setTeamRefreshTrigger((prev) => prev + 1)
  }

  return (
    <Tabs defaultValue="teams" className="w-full">
      <TabsList className="w-full">
        <TabsTrigger value="teams" className="flex-1">
          Input Tim
        </TabsTrigger>
        <TabsTrigger value="groups" className="flex-1">
          Grup
        </TabsTrigger>
      </TabsList>

      {/* TAB: Input Tim */}
      <TabsContent value="teams" className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Input Tim</h2>
          <p className="text-sm text-muted-foreground">
            Tambahkan dan kelola daftar tim yang akan mengikuti turnamen
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left: Form input */}
          <div className="rounded-lg border p-4 lg:col-span-1">
            <h3 className="mb-4 font-medium">Tambah Tim Baru</h3>
            <TeamsInputForm onTeamAdded={handleTeamAdded} />
          </div>

          {/* Right: Teams list */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border p-4">
              <h3 className="mb-4 font-medium">Daftar Tim</h3>
              <TeamsListTable refreshTrigger={teamRefreshTrigger} />
            </div>
          </div>
        </div>
      </TabsContent>

      {/* TAB: Grup */}
      <TabsContent value="groups" className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Manajemen Grup</h2>
          <p className="text-sm text-muted-foreground">
            Buat dan kelola grup untuk membagi tim dalam turnamen. Setiap tim hanya boleh berada dalam 1 grup.
          </p>
        </div>

        <div className="rounded-lg border p-4">
          <GroupsManager refreshTrigger={groupRefreshTrigger} />
        </div>
      </TabsContent>
    </Tabs>
  )
}
