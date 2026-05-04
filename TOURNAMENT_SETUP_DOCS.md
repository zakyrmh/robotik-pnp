# Tournament Setup - Dokumentasi

## File Structure

### Server Actions
- **`app/actions/tournament.action.ts`** - Semua operasi database untuk teams dan groups
  - `addTeam()` - Tambah tim baru
  - `editTeam()` - Edit nama tim
  - `deleteTeam()` - Hapus tim
  - `getTeams()` - Fetch teams dengan pagination
  - `addGroup()` - Tambah grup dengan auto-naming
  - `deleteGroup()` - Hapus grup beserta teams di dalamnya
  - `getGroups()` - Fetch groups dengan teams
  - `assignTeamToGroup()` - Assign tim ke grup
  - `removeTeamFromGroup()` - Remove tim dari grup

### Components
- **`components/tournament/teams-input-form.tsx`** - Form input untuk tambah tim
- **`components/tournament/teams-list-table.tsx`** - Tabel tim dengan infinite scroll, edit, dan delete
- **`components/tournament/assign-team-to-group-dialog.tsx`** - Modal dialog untuk assign tim ke grup
- **`components/tournament/groups-manager.tsx`** - Manager untuk CRUD groups dan assign teams
- **`components/tournament/setup-tournament-tabs.tsx`** - Main component dengan 2 tab (Teams & Groups)

### Pages
- **`app/(private)/tournament/setup/page.tsx`** - Main page dengan Suspense dan error handling

## Fitur Utama

### Tab 1: Input Tim
- **Form (sebelah kiri)**: Input nama tim dan tombol tambah
- **Tabel (sebelah kanan)**: Daftar tim dengan:
  - Infinite scroll (20 items per page)
  - Tombol edit untuk ubah nama tim
  - Tombol delete untuk hapus tim
  - Indikasi status jika tim sudah di-assign ke grup

### Tab 2: Grup
- **Tambah Grup**: Auto-naming (Group A, B, C, dll)
- **Delete Grup**: Dengan confirm dialog, teams akan di-unassign
- **Assign Teams**: Modal dialog untuk memasukkan tim ke grup
- **Remove Teams**: Tombol untuk mengeluarkan tim dari grup
- **Business Rule**: 1 tim hanya boleh di 1 grup

## Business Rules Implementation

✅ 1 Tim hanya boleh masuk 1 group
- Validasi di `assignTeamToGroup()` - cek jika team sudah punya `group_id`
- UI menampilkan indikasi jika tim sudah di-assign

✅ Confirm dialog untuk delete group
- Alert dialog sebelum delete
- Teams di-unassign secara otomatis saat delete group

✅ Infinite scroll pada tabel tim
- Observer pattern dengan Intersection Observer API
- Load 20 items per batch

✅ Error handling & loading state
- Loading skeleton saat data fetch
- Toast notifications untuk feedback user
- Server-side validation dengan Zod

## Database Schema (sudah dibuat)

```sql
-- Groups
create table groups (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

-- Teams
create table teams (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  group_id uuid references groups(id) on delete cascade
);

-- Matches
create table matches (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references groups(id) on delete cascade,
  team_a_id uuid references teams(id),
  team_b_id uuid references teams(id),
  score_a int default 0,
  score_b int default 0,
  status text default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now())
);
```

## Usage

Akses halaman setup tournament di:
```
/private/tournament/setup
```

## Component Architecture

```
page.tsx (Suspense + Skeleton)
  ↓
SetupTournamentTabs (Tabs container)
  ├── Tab 1: Input Tim
  │   ├── TeamsInputForm (left)
  │   └── TeamsListTable (right, infinite scroll)
  │
  └── Tab 2: Grup
      └── GroupsManager
          ├── Groups list
          ├── AssignTeamToGroupDialog (modal)
          └── Delete confirmations
```

## Key Features

✨ **UI/UX**
- Responsive layout (mobile-friendly)
- Loading states dengan skeleton
- Smooth animations dengan Framer Motion
- Toast notifications untuk feedback

🔒 **Security**
- Server actions dengan auth check
- Input validation dengan Zod
- Error handling untuk all edge cases

⚡ **Performance**
- Infinite scroll (lazy loading)
- Parallel data fetching
- Optimistic UI updates

🎨 **Styling**
- TailwindCSS 4 + Shadcn UI components
- Dark mode support
- Consistent design language
