import { cn } from '../../lib/utils'
import type { LucideIcon } from 'lucide-react'
import { TRANSFER_REQUEST_STATUS } from '../../lib/constants'
import type { TransferRequestStatus } from '../../lib/api'

export interface StatusMapEntry {
  label:   string
  icon:    LucideIcon
  badgeCls: string
  isBusy?: boolean
}

interface StatusBadgeProps {
  status:    string
  statusMap: Record<string, StatusMapEntry>
  size?:     'sm' | 'md'
  className?: string
}

export function StatusBadge({ status, statusMap, size = 'sm', className }: StatusBadgeProps) {
  const cfg  = statusMap[status] ?? { label: status, icon: statusMap[Object.keys(statusMap)[0]]?.icon, badgeCls: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-900/30 dark:text-gray-400 dark:border-gray-700' }
  const Icon = cfg.icon
  return (
    <span className={cn(
      'inline-flex items-center gap-1 rounded-full border font-medium',
      size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm',
      cfg.badgeCls,
      className,
    )}>
      <Icon size={size === 'sm' ? 11 : 13} className={cfg.isBusy ? 'animate-spin' : undefined} />
      {cfg.label}
    </span>
  )
}

// ── Convenience wrapper for TransferRequest status ────────────────────────────

interface TransferRequestBadgeProps {
  status:     TransferRequestStatus
  size?:      'sm' | 'md'
  className?: string
}

export function TransferRequestBadge({ status, size, className }: TransferRequestBadgeProps) {
  return (
    <StatusBadge
      status={status}
      statusMap={TRANSFER_REQUEST_STATUS}
      size={size}
      className={className}
    />
  )
}
