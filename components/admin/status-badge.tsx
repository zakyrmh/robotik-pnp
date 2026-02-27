/**
 * StatusBadge — Badge visual untuk menampilkan status akun user
 *
 * Setiap status memiliki warna berbeda:
 * - active  : hijau (aktif)
 * - inactive: abu-abu (nonaktif)
 * - banned  : merah (diblokir)
 * - deleted : merah gelap (dihapus)
 */

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

/** Mapping status ke label dan style */
const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  active: {
    label: 'Aktif',
    className:
      'bg-emerald-500/15 text-emerald-700 border-emerald-500/25 dark:text-emerald-400',
  },
  inactive: {
    label: 'Nonaktif',
    className:
      'bg-zinc-500/15 text-zinc-700 border-zinc-500/25 dark:text-zinc-400',
  },
  banned: {
    label: 'Diblokir',
    className:
      'bg-red-500/15 text-red-700 border-red-500/25 dark:text-red-400',
  },
  deleted: {
    label: 'Dihapus',
    className:
      'bg-red-800/15 text-red-900 border-red-800/25 dark:text-red-500',
  },
}

const DEFAULT_CONFIG = {
  label: 'Unknown',
  className: 'bg-muted text-muted-foreground border-border',
}

interface StatusBadgeProps {
  /** Status user dari database */
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG

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
