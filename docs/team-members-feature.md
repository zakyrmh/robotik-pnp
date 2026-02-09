# Team Members Feature Implementation

## Overview

Fitur ini menampilkan daftar rekan kerja sesama divisi di halaman Research Logbook. Setiap anggota tim ditampilkan dengan informasi lengkap termasuk foto, pangkat (posisi manajemen), dan role teknis mereka.

## Features

- ✅ Menampilkan daftar anggota tim berdasarkan KRI team assignment user
- ✅ Menampilkan foto profil dengan fallback inisial nama
- ✅ Menampilkan pangkat: Ketua Tim, Wakil Ketua, Sekretaris, Bendahara, Anggota
- ✅ Menampilkan role teknis: Elektrikal, Mekanikal, Programmer
- ✅ Badge dengan warna berbeda untuk setiap pangkat dan role
- ✅ Sorting otomatis berdasarkan hierarki pangkat (ketua dulu, dst)
- ✅ Loading skeleton animation
- ✅ Responsive design
- ✅ Empty state handling

## Technical Stack

### Service Layer

**File:** `lib/firebase/services/team-member-service.ts`

Functions:

- `getTeamMembers(team: KriTeam)`: Mengambil daftar anggota tim dari Firestore
- `getManagementPositionLabel()`: Mendapatkan label untuk posisi manajemen
- `getTechnicalRoleLabel()`: Mendapatkan label untuk role teknis
- `getManagementPositionColor()`: Mendapatkan warna badge untuk posisi
- `getTechnicalRoleColor()`: Mendapatkan warna badge untuk role

### Component Layer

**File:** `app/(private)/research-logbook/_components/team-members-card.tsx`

Component: `TeamMembersCard`

- Props: `team` (KriTeam), `className` (optional)
- State: `members`, `isLoading`
- Features: Avatar, badges, skeleton loading, empty state

### Page Integration

**File:** `app/(private)/research-logbook/page.tsx`

Location: Di bawah StatsCards, di atas Filters section

## Data Flow

1. User login → Dashboard context menyimpan user assignments
2. Research Logbook page mengidentifikasi user's active KRI team
3. TeamMembersCard component memanggil `getTeamMembers(team)`
4. Service query Firestore collection `users_new` dengan filter:
   - `roles.isKRIMember == true`
   - Client-side filter: `assignments.competitions.team == userTeam && isActive == true`
5. Data di-sort berdasarkan management position hierarchy
6. Component render list dengan avatar, badges, dan informasi

## Firestore Query

```typescript
const usersRef = collection(db, "users_new");
const q = query(usersRef, where("roles.isKRIMember", "==", true));
const querySnapshot = await getDocs(q);
```

Client-side filtering dilakukan untuk:

- Memfilter berdasarkan team assignment
- Memfilter hanya yang `isActive == true`
- Sorting berdasarkan management position priority

## UI Components Used

- Card, CardContent, CardHeader, CardTitle, CardDescription
- Badge (variant: outline)
- Avatar, AvatarImage, AvatarFallback
- Skeleton (untuk loading state)

## Color Scheme

### Management Position Colors

- Chairman: Purple
- Vice Chairman: Blue
- Secretary: Emerald
- Treasurer: Amber
- Member: Slate

### Technical Role Colors

- Mechanic: Orange
- Programmer: Blue
- Electronics: Cyan

## Icons Used

- Users: untuk card header dan empty state
- Crown: untuk chairman
- Shield: untuk vice chairman
- UserCog: untuk secretary & treasurer
- Wrench: untuk technical roles

## Future Improvements

- [ ] Clickable member cards untuk melihat detail profil
- [ ] Filter berdasarkan role teknis
- [ ] Search functionality
- [ ] Export list ke PDF/Excel
- [ ] Contact info (WhatsApp button)
- [ ] Member status indicator (online/offline)
