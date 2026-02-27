/**
 * RoleBadge — Badge visual untuk menampilkan role user
 *
 * Setiap role memiliki warna dan label yang berbeda
 * agar mudah dibedakan secara visual dalam tabel.
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Mapping nama role ke label tampilan dan style warna */
const ROLE_CONFIG: Record<string, { label: string; className: string }> = {
  super_admin: {
    label: 'Super Admin',
    className:
      'bg-amber-500/15 text-amber-700 border-amber-500/25 dark:text-amber-400',
  },
  admin: {
    label: 'Admin',
    className:
      'bg-blue-500/15 text-blue-700 border-blue-500/25 dark:text-blue-400',
  },
  pengurus: {
    label: 'Pengurus',
    className:
      'bg-violet-500/15 text-violet-700 border-violet-500/25 dark:text-violet-400',
  },
  anggota: {
    label: 'Anggota',
    className:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  },
  calon_anggota: {
    label: 'Caang',
    className:
      'bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400',
  },
}

/** Fallback untuk role yang tidak dikenal */
const DEFAULT_ROLE_CONFIG = {
  label: 'Unknown',
  className:
    'bg-muted text-muted-foreground border-border',
}

interface RoleBadgeProps {
  /** Nama role dari database (contoh: 'super_admin', 'caang') */
  role: string
  /** Kelas CSS tambahan (opsional) */
  className?: string
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const config = ROLE_CONFIG[role] ?? DEFAULT_ROLE_CONFIG

  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[11px] font-medium px-2 py-0.5',
        config.className,
        className
      )}
    >
      {config.label}
    </Badge>
  )
}
